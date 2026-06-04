import '../page-shell'
import { useState, ChangeEvent } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { Loading, LoadFailed } from '../components/Loading'
import { OrganizationData } from './types'

interface OrganizationListRowProps {
  organization: OrganizationData
  showButtons: boolean
}

function OrganizationListRow({ organization, showButtons }: OrganizationListRowProps) {
  const dataFields = [
    <td key="name">{organization.name}</td>,
    <td key="created">{formatLocalDateTime(organization.created)}</td>,
    <td key="creator">{organization.creator}</td>,
    <td key="role">{organization.role}</td>
  ]

  if (showButtons) {
    const buttons = [
      <Button key="details" href={`/organization/${organization.id}/`}>
        Details
      </Button>
    ]
    if (organization.role === 'Radio Operator' || organization.role === 'Admin') {
      buttons.push(
        <Button key="radio-operator" href={`/organization/${organization.id}/radio/operator/`}>
          Radio Operator
        </Button>
      )
    }
    dataFields.push(
      <td key="buttons">
        <ButtonGroup key="buttons">{buttons}</ButtonGroup>
      </td>
    )
  }

  return <tr key={organization.id}>{dataFields}</tr>
}

interface OrganizationListProps {
  organizations: OrganizationData[]
  showButtons: boolean
}

function OrganizationList({ organizations, showButtons }: OrganizationListProps) {
  return (
    <Table responsive>
      <thead>
        <tr key="heading">
          <th colSpan={5} align="center">
            Current Organizations
          </th>
        </tr>
        <tr key="labels">
          <th>Organization Name</th>
          <th>Created</th>
          <th>By</th>
          <th>My Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {organizations.map((organization) => (
          <OrganizationListRow key={organization.id} organization={organization} showButtons={showButtons} />
        ))}
      </tbody>
    </Table>
  )
}

function OrganizationAdd() {
  const [organizationName, setOrganizationName] = useState('')

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setOrganizationName(event.target.value)
  }

  async function createOrganization() {
    try {
      await smmPost('/organization/', { name: organizationName })
      setOrganizationName('')
    } catch (e) {
      console.error('Failed to create organization:', e)
    }
  }

  return (
    <Table responsive>
      <thead>
        <tr>
          <td>Name</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input type="text" onChange={handleChange} value={organizationName}></input>
          </td>
          <td>
            <Button onClick={createOrganization}>Create</Button>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

function OrganizationListPage() {
  const [organizations, setOrganizations] = useState<OrganizationData[] | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)

  usePolling(async () => {
    try {
      const data = await smmGetJSON<{ organizations: OrganizationData[] }>('/organization/', {})
      setOrganizations(data.organizations)
      setLoadFailed(false)
    } catch (e) {
      console.error('Failed to fetch organizations:', e)
      setLoadFailed(true)
    }
  }, 10000)

  if (organizations === undefined) {
    return loadFailed ? <LoadFailed /> : <Loading />
  }

  return (
    <div>
      <OrganizationList organizations={organizations} showButtons={true} />
      <OrganizationAdd />
    </div>
  )
}

function createOrganizationList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMTopBar />
      <OrganizationListPage />
    </>
  )
}

export { OrganizationListRow }

window.createOrganizationList = createOrganizationList
