import '../page-shell'
import { ChangeEvent, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost, smmPatch, smmDelete } from '../ajax'
import { SMMMissionTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'

import { MissionAssetRecord, MissionData, MissionDetailsData, MissionExternalReferenceData, MissionOrganizationData, MissionUserData } from './types'
import { OrganizationData } from '../organization/types'
import { AssetData } from '../asset/types'

function MissionDetails({ mission }: { mission: MissionData }) {
  return (
    <Table>
      <tbody>
        <tr>
          <td>Name</td>
          <td>{mission.name}</td>
        </tr>
        <tr>
          <td>Started</td>
          <td>{formatLocalDateTime(mission.started)}</td>
        </tr>
        <tr>
          <td>Creator</td>
          <td>{mission.creator}</td>
        </tr>
        <tr>
          <td>Description</td>
          <td>{mission.description}</td>
        </tr>
        {mission.closed && (
          <tr>
            <td>Closed</td>
            <td>{formatLocalDateTime(mission.closed)}</td>
          </tr>
        )}
        {mission.closed_by && (
          <tr>
            <td>Closed By</td>
            <td>{mission.closed_by}</td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}

type ExtRefField = 'name' | 'code' | 'url' | 'notes'

interface MissionDetailsExternalReferencesRowProps {
  ExternalReference: MissionExternalReferenceData
}

function MissionDetailsExternalReferencesRow({ ExternalReference: extRef }: MissionDetailsExternalReferencesRowProps) {
  const [editFields, setEditFields] = useState<Partial<Record<ExtRefField, boolean>>>({})
  const [values, setValues] = useState({
    name: extRef.name,
    code: extRef.code,
    url: extRef.url,
    notes: extRef.notes
  })

  function toggleEdit(field: ExtRefField) {
    setEditFields((prev) => ({ ...prev, [field]: true }))
  }

  function handleChange(field: ExtRefField, event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function resetEditing() {
    setEditFields({})
    setValues({
      name: extRef.name,
      code: extRef.code,
      url: extRef.url,
      notes: extRef.notes
    })
  }

  function update() {
    smmPost(`/mission/${extRef.mission}/externalreferences/${extRef.id}/`, values)
  }

  function deleteRow() {
    smmDelete(`/mission/${extRef.mission}/externalreferences/${extRef.id}/`)
  }

  function renderField(field: ExtRefField, displayValue?: string) {
    return editFields[field] ? (
      <input type="text" value={values[field] ?? ''} onChange={(e) => handleChange(field, e)} />
    ) : (
      <span onClick={() => toggleEdit(field)}>{displayValue}</span>
    )
  }

  const editing = Object.keys(editFields).length > 0
  const buttons = editing
    ? [
        <Button onClick={update} key="update">
          Update
        </Button>,
        <Button onClick={resetEditing} key="cancel" variant="danger">
          Cancel
        </Button>
      ]
    : [
        <Button onClick={deleteRow} key="delete" variant="danger">
          Delete
        </Button>
      ]

  return (
    <tr>
      <td>{renderField('name', extRef.name)}</td>
      <td>{renderField('code', extRef.code)}</td>
      <td>{renderField('url', extRef.url)}</td>
      <td>{renderField('notes', extRef.notes)}</td>
      <td>
        <ButtonGroup>{buttons}</ButtonGroup>
      </td>
    </tr>
  )
}

interface MissionDetailsExternalReferenceAddProps {
  mission: number
}

function MissionDetailsExternalReferenceAdd({ mission }: MissionDetailsExternalReferenceAddProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')

  function add() {
    if (!name) return
    smmPost(`/mission/${mission}/externalreferences/`, { name, code, url, notes }, () => {
      setName('')
      setCode('')
      setUrl('')
      setNotes('')
    })
  }

  return (
    <tr>
      <td>
        <input type="text" name="name" onChange={(e) => setName(e.target.value)} value={name} />
      </td>
      <td>
        <input type="text" name="code" onChange={(e) => setCode(e.target.value)} value={code} />
      </td>
      <td>
        <input type="text" name="url" onChange={(e) => setUrl(e.target.value)} value={url} />
      </td>
      <td>
        <input type="text" name="notes" onChange={(e) => setNotes(e.target.value)} value={notes} />
      </td>
      <td>
        <Button onClick={add}>Add</Button>
      </td>
    </tr>
  )
}

interface MissionDetailsExternalReferencesListProps {
  ExternalReferences: Array<MissionExternalReferenceData>
  mission: number
}

function MissionDetailsExternalReferencesList({ ExternalReferences, mission }: MissionDetailsExternalReferencesListProps) {
  return (
    <Table>
      <thead>
        <tr>
          <td>Name</td>
          <td>Code</td>
          <td>URL</td>
          <td>Notes</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        {ExternalReferences.map((extRef) => (
          <MissionDetailsExternalReferencesRow key={extRef.id} ExternalReference={extRef} />
        ))}
        <MissionDetailsExternalReferenceAdd mission={mission} />
      </tbody>
    </Table>
  )
}

interface MissionDetailsOrganizationsRowProps {
  mission: number
  missionOrg: MissionOrganizationData
  showButtons: boolean
}

function MissionDetailsOrganizationsRow({ mission, missionOrg, showButtons }: MissionDetailsOrganizationsRowProps) {
  const orgId = missionOrg.organization.id
  function postFlag(payload: Record<string, boolean>) {
    smmPost(`/mission/${mission}/organizations/${orgId}/`, payload)
  }

  let buttonGroup
  if (showButtons) {
    const buttons = []
    if (missionOrg.permissions.add_organization) {
      buttons.push(
        <Button key="btnAddOrgDisable" onClick={() => postFlag({ add_organization: false })} variant="danger">
          Disable Adding Organizations
        </Button>
      )
    } else {
      buttons.push(
        <Button key="btnAddOrgEnable" onClick={() => postFlag({ add_organization: true })}>
          Enable Adding Organizations
        </Button>
      )
    }
    if (missionOrg.permissions.add_user) {
      buttons.push(
        <Button key="btnAddUserDisable" onClick={() => postFlag({ add_user: false })} variant="danger">
          Disable Adding Users
        </Button>
      )
    } else {
      buttons.push(
        <Button key="btnAddUserEnable" onClick={() => postFlag({ add_user: true })}>
          Enable Adding Users
        </Button>
      )
    }
    buttonGroup = <ButtonGroup key="btnActions">{buttons}</ButtonGroup>
  }

  return (
    <tr>
      <td>{missionOrg.organization.name}</td>
      <td>{buttonGroup}</td>
    </tr>
  )
}

interface MissionDetailsOrganizationsListProps {
  missionOrganizations: Array<MissionOrganizationData>
  mission: number
  isAdmin: boolean
}

function MissionDetailsOrganizationsList({ missionOrganizations, mission, isAdmin }: MissionDetailsOrganizationsListProps) {
  return (
    <Table>
      <thead>
        <tr>
          <td>Organization</td>
          <td>Options</td>
        </tr>
      </thead>
      <tbody>
        {missionOrganizations.map((missionOrg) => (
          <MissionDetailsOrganizationsRow key={missionOrg.organization.id} mission={mission} missionOrg={missionOrg} showButtons={isAdmin} />
        ))}
      </tbody>
    </Table>
  )
}

function MissionDetailsOrganizationAdd({ mission }: { mission: number }) {
  const [orgs, setOrgs] = useState<OrganizationData[]>([])
  const [selectedOrg, setSelectedOrg] = useState<number | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ organizations: OrganizationData[] }>(`/mission/${mission}/organizations/?not_included=True`, {})
    setOrgs(data.organizations)
    setSelectedOrg((prev) => (prev === undefined && data.organizations.length > 0 ? data.organizations[0].id : prev))
  }, 10000)

  function add() {
    if (selectedOrg) {
      smmPost(`/mission/${mission}/organizations/`, { organization: selectedOrg })
    }
  }

  return (
    <form>
      <Table>
        <tbody>
          <tr>
            <td>Organization:</td>
            <td>
              <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedOrg(Number(e.target.value))} value={selectedOrg}>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <Button onClick={add}>Add</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </form>
  )
}

interface MissionDetailsUserRowProps {
  mission: number
  missionUser: MissionUserData
  showButtons: boolean
}

function MissionDetailsUserRow({ mission, missionUser, showButtons }: MissionDetailsUserRowProps) {
  const userId = missionUser.user_id
  function patch(payload: Record<string, boolean>) {
    smmPatch(`/mission/${mission}/users/${userId}/`, payload)
  }

  let buttonGroup
  if (showButtons) {
    const buttons = []
    if (missionUser.permissions.admin) {
      buttons.push(
        <Button key="btnAdminDisable" variant="danger" onClick={() => patch({ admin: false })}>
          Remove Admin
        </Button>
      )
    } else {
      buttons.push(
        <Button key="btnAdminEnable" onClick={() => patch({ admin: true })}>
          Make Admin
        </Button>
      )
    }
    if (missionUser.permissions.add_organization) {
      buttons.push(
        <Button key="btnAddOrgDisable" variant="danger" onClick={() => patch({ add_organization: false })}>
          Disable Adding Organizations
        </Button>
      )
    } else {
      buttons.push(
        <Button key="btnAddOrgEnable" onClick={() => patch({ add_organization: true })}>
          Enable Adding Organizations
        </Button>
      )
    }
    if (missionUser.permissions.add_user) {
      buttons.push(
        <Button key="btnAddUserDisable" variant="danger" onClick={() => patch({ add_user: false })}>
          Disable Adding Users
        </Button>
      )
    } else {
      buttons.push(
        <Button key="btnAddUserEnable" onClick={() => patch({ add_user: true })}>
          Enable Adding Users
        </Button>
      )
    }
    buttonGroup = <ButtonGroup key="btnActions">{buttons}</ButtonGroup>
  }

  return (
    <tr>
      <td>{missionUser.user}</td>
      <td>{buttonGroup}</td>
    </tr>
  )
}

interface MissionDetailsUsersListProps {
  missionUsers: Array<MissionUserData>
  isAdmin: boolean
  me: string
  mission: number
}

function MissionDetailsUsersList({ missionUsers, isAdmin, me, mission }: MissionDetailsUsersListProps) {
  return (
    <Table>
      <thead>
        <tr>
          <td>User</td>
          <td>Options</td>
        </tr>
      </thead>
      <tbody>
        {missionUsers.map((missionUser) => (
          <MissionDetailsUserRow key={missionUser.id} mission={mission} missionUser={missionUser} showButtons={isAdmin && me !== missionUser.user} />
        ))}
      </tbody>
    </Table>
  )
}

function MissionDetailsUserAdd({ mission }: { mission: number }) {
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [selectedUser, setSelectedUser] = useState<number | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ users: Array<{ id: number; username: string }> }>(`/mission/${mission}/users/?not_included=True`, {})
    setUsers(data.users)
    setSelectedUser((prev) => (prev === undefined && data.users.length > 0 ? data.users[0].id : prev))
  }, 10000)

  function add() {
    if (selectedUser) {
      smmPost(`/mission/${mission}/users/`, { user: selectedUser })
    }
  }

  return (
    <form>
      <Table>
        <tbody>
          <tr>
            <td>User:</td>
            <td>
              <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedUser(Number(e.target.value))} value={selectedUser}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <Button onClick={add}>Add</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </form>
  )
}

function MissionDetailsAssetRow({ missionAsset }: { missionAsset: MissionAssetRecord }) {
  function remove() {
    smmDelete(`/mission/${missionAsset.mission}/assets/${missionAsset.asset.id}/`)
  }

  const buttons = []
  let status
  let added
  let removed

  if (missionAsset.status && missionAsset.status.since) {
    status = (
      <>
        {missionAsset.status.name}
        <br />
        <small>{formatLocalDateTime(missionAsset.status.since)}</small>
      </>
    )
  }
  if (missionAsset.added) {
    added = formatLocalDateTime(missionAsset.added)
  }
  if (missionAsset.removed) {
    removed = formatLocalDateTime(missionAsset.removed)
  } else {
    buttons.push(
      <Button key="btnRemove" variant="danger" onClick={remove}>
        Remove
      </Button>
    )
  }
  return (
    <tr>
      <td>{missionAsset.asset.name}</td>
      <td>{missionAsset.asset.type_name}</td>
      <td>{status}</td>
      <td>{added}</td>
      <td>{removed}</td>
      <td>{buttons}</td>
    </tr>
  )
}

function MissionDetailsAssetList({ missionAssets }: { missionAssets: Array<MissionAssetRecord> }) {
  return (
    <Table>
      <thead>
        <tr>
          <td>Asset</td>
          <td>Asset Type</td>
          <td>Status</td>
          <td>Added</td>
          <td>Removed</td>
          <td>Options</td>
        </tr>
      </thead>
      <tbody>
        {missionAssets.map((missionAsset) => (
          <MissionDetailsAssetRow key={missionAsset.id} missionAsset={missionAsset} />
        ))}
      </tbody>
    </Table>
  )
}

function MissionDetailsAssetAdd({ mission }: { mission: number }) {
  const [assets, setAssets] = useState<AssetData[]>([])
  const [selectedAsset, setSelectedAsset] = useState<number | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ assets: AssetData[] }>(`/mission/${mission}/assets/?not_included=True`, {})
    setAssets(data.assets)
    setSelectedAsset((prev) => (prev === undefined && data.assets.length > 0 ? data.assets[0].id : prev))
  }, 10000)

  function add() {
    if (selectedAsset) {
      smmPost(`/mission/${mission}/assets/`, { asset: selectedAsset })
    }
  }

  return (
    <form>
      <Table>
        <tbody>
          <tr>
            <td>Asset:</td>
            <td>
              <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAsset(Number(e.target.value))} value={selectedAsset}>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <Button onClick={add}>Add</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </form>
  )
}

function MissionDetailPage({ missionId }: { missionId: number }) {
  const [missionDetails, setMissionDetails] = useState<MissionDetailsData | undefined>(undefined)

  usePolling(async () => {
    await smmGetJSON(`/mission/${missionId}/details/`, {}, setMissionDetails)
  }, 10000)

  if (missionDetails === undefined) {
    return <>Loading ...</>
  }

  return (
    <>
      <MissionDetails mission={missionDetails.mission} />
      <MissionDetailsExternalReferencesList mission={missionId} ExternalReferences={missionDetails.external_references} />
      <MissionDetailsOrganizationsList mission={missionId} missionOrganizations={missionDetails.mission_organizations} isAdmin={missionDetails.admin} />
      {missionDetails.can_add_organizations && <MissionDetailsOrganizationAdd mission={missionId} />}
      <MissionDetailsUsersList mission={missionId} me={missionDetails.me} missionUsers={missionDetails.mission_users} isAdmin={missionDetails.admin} />
      {missionDetails.can_add_users && <MissionDetailsUserAdd mission={missionId} />}
      <MissionDetailsAssetList missionAssets={missionDetails.mission_assets} />
      <MissionDetailsAssetAdd mission={missionId} />
    </>
  )
}

function createMissionDetails(elementId: string, missionId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MissionDetailPage missionId={missionId} />
    </>
  )
}

export { MissionDetailPage }

window.createMissionDetails = createMissionDetails
