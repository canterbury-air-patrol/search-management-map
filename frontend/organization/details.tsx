import '../page-shell'
import { ChangeEvent, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost, smmDelete } from '../ajax'
import { OrganizationListRow } from './list'
import { SMMOrganizationTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { OrganizationAssetData, OrganizationData, OrganizationMemberData } from './types'
import { AssetData } from '../asset/types'

const ROLE_NAME_TO_CODE: Record<string, string> = {
  Member: 'M',
  'Radio Operator': 'R',
  Admin: 'A',
  'Asset Bridge/Recorder': 'b'
}

interface OrganizationMemberRowProps {
  organizationId: number
  member: OrganizationMemberData
  showButtons: boolean
}

function OrganizationMemberRow({ organizationId, member, showButtons }: OrganizationMemberRowProps) {
  const [selectedRole, setSelectedRole] = useState(ROLE_NAME_TO_CODE[member.role] ?? 'M')

  async function deleteRow() {
    await smmDelete(`/organization/${organizationId}/user/${member.user}/`)
  }

  function saveChanges() {
    smmPost(`/organization/${organizationId}/user/${member.user}/`, { role: selectedRole })
  }

  const dataFields = [<td key="name">{member.user}</td>, <td key="created">{formatLocalDateTime(member.added)}</td>, <td key="creator">{member.added_by}</td>]

  if (showButtons) {
    dataFields.push(
      <td key="buttons">
        <ButtonGroup key="buttons">
          <select value={selectedRole} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}>
            <option value="M">Member</option>
            <option value="R">Radio Operator</option>
            <option value="A">Admin</option>
            <option value="b">Asset Bridge/Recorder</option>
          </select>
          <Button key="save" onClick={saveChanges}>
            Save
          </Button>
          <Button key="delete" className="btn-danger" onClick={deleteRow}>
            Delete
          </Button>
        </ButtonGroup>
      </td>
    )
  }

  return <tr key={member.id}>{dataFields}</tr>
}

interface OrganizationAssetRowProps {
  organizationId: number
  asset: OrganizationAssetData
  showButtons: boolean
}

function OrganizationAssetRow({ organizationId, asset, showButtons }: OrganizationAssetRowProps) {
  async function deleteRow() {
    await smmDelete(`/organization/${organizationId}/assets/${asset.asset.id}/`)
  }

  const dataFields = [
    <td key="name">{asset.asset.name}</td>,
    <td key="status">{asset.asset.status}</td>,
    <td key="created">{formatLocalDateTime(asset.added)}</td>,
    <td key="creator">{asset.added_by}</td>
  ]

  if (showButtons) {
    dataFields.push(
      <td key="buttons">
        <ButtonGroup key="buttons">
          <Button key="delete" className="btn-danger" onClick={deleteRow}>
            Delete
          </Button>
        </ButtonGroup>
      </td>
    )
  }

  return <tr key={asset.id}>{dataFields}</tr>
}

interface OrganizationMemberListProps {
  organizationId: number
  members?: OrganizationMemberData[]
  showButtons: boolean
}

function OrganizationMemberList({ organizationId, members, showButtons }: OrganizationMemberListProps) {
  return (
    <Table responsive>
      <thead>
        <tr key="heading">
          <th colSpan={4} align="center">
            Members
          </th>
        </tr>
        <tr key="labels">
          <th>Member</th>
          <th>Added</th>
          <th>By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {members?.map((member) => (
          <OrganizationMemberRow key={member.id} organizationId={organizationId} member={member} showButtons={showButtons} />
        ))}
      </tbody>
    </Table>
  )
}

function OrganizationMemberAdd({ organizationId }: { organizationId: number }) {
  const [userList, setUserList] = useState<{ id: number; username: string }[]>([])
  const [userId, setUserId] = useState<number | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ users: { id: number; username: string }[] }>(`/organization/${organizationId}/users/notmember/`, {})
    setUserList(data.users)
    setUserId((prev) => (prev === undefined && data.users.length > 0 ? data.users[0].id : prev))
  }, 10000)

  async function addOrganizationMember() {
    const user = userList.find((u) => u.id === userId)
    if (!user) return
    await smmPost(`/organization/${organizationId}/user/${user.username}/`, {})
    setUserId(undefined)
  }

  return (
    <Table responsive>
      <thead>
        <tr>
          <td>Member</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <select value={userId ?? ''} onChange={(e: ChangeEvent<HTMLSelectElement>) => setUserId(Number(e.target.value))}>
              {userList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </td>
          <td>
            <Button onClick={addOrganizationMember}>Add</Button>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

interface OrganizationAssetListProps {
  organizationId: number
  assets?: OrganizationAssetData[]
}

function OrganizationAssetList({ organizationId, assets }: OrganizationAssetListProps) {
  return (
    <Table responsive>
      <thead>
        <tr key="heading">
          <th colSpan={5} align="center">
            Assets
          </th>
        </tr>
        <tr key="labels">
          <th>Asset Name</th>
          <th>Status</th>
          <th>Added</th>
          <th>By</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {assets?.map((asset) => (
          <OrganizationAssetRow key={asset.id} organizationId={organizationId} asset={asset} showButtons />
        ))}
      </tbody>
    </Table>
  )
}

export function OrganizationAssetAdd({ organizationId }: { organizationId: number }) {
  const [assetList, setAssetList] = useState<AssetData[]>([])
  const [assetId, setAssetId] = useState<number | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ assets: AssetData[] }>('/assets/', {})
    setAssetList(data.assets)
    setAssetId((prev) => (prev === undefined && data.assets.length > 0 ? data.assets[0].id : prev))
  }, 10000)

  async function addOrganizationAsset() {
    if (assetId === undefined) return
    await smmPost(`/organization/${organizationId}/assets/${assetId}/`, {})
    setAssetId(undefined)
  }

  return (
    <Table responsive>
      <thead>
        <tr>
          <td>Asset</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <select value={assetId ?? ''} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAssetId(Number(e.target.value))}>
              {assetList.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <Button onClick={addOrganizationAsset}>Add</Button>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

interface OrganizationDetailsPageProps {
  organizationId: number
  updateRadioOperator: (show: boolean) => void
}

function OrganizationDetailsPage({ organizationId, updateRadioOperator }: OrganizationDetailsPageProps) {
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationData>({
    id: organizationId,
    name: '',
    created: '',
    creator: '',
    role: ''
  })

  usePolling(async () => {
    const data = await smmGetJSON<OrganizationData>(`/organization/${organizationId}/`, {})
    setOrganizationDetails(data)
    updateRadioOperator(data.role === 'Admin' || data.role === 'Radio Operator')
  }, 10000)

  const sections = [
    <Table responsive key="details">
      <thead>
        <tr>
          <th>Organization Name</th>
          <th>Created</th>
          <th>Creator</th>
          <th>Your Role</th>
        </tr>
      </thead>
      <tbody>
        <OrganizationListRow organization={organizationDetails} showButtons={false} />
      </tbody>
    </Table>,
    <OrganizationMemberList key="org_members" organizationId={organizationId} members={organizationDetails.members} showButtons={organizationDetails.role === 'Admin'} />
  ]

  if (organizationDetails.role === 'Admin') {
    sections.push(<OrganizationMemberAdd key="org_add_member" organizationId={organizationId} />)
  }
  sections.push(<OrganizationAssetList key="org_assets" organizationId={organizationId} assets={organizationDetails.assets} />)
  sections.push(<OrganizationAssetAdd key="org_asset_add" organizationId={organizationId} />)

  return <div>{sections}</div>
}

function OrganizationPage({ organizationId }: { organizationId: number }) {
  const [isRadioOperator, setIsRadioOperator] = useState(false)

  return (
    <>
      <SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={isRadioOperator} />
      <OrganizationDetailsPage organizationId={organizationId} updateRadioOperator={setIsRadioOperator} />
    </>
  )
}

function createOrganizationDetails(elementId: string, organizationId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(<OrganizationPage organizationId={organizationId} />)
}

window.createOrganizationDetails = createOrganizationDetails
