import { formatLocalDateTime } from '../format'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON, smmPost } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { OrganizationData } from './types'

interface OrganizationListRowProps {
  organization: OrganizationData
  showButtons: boolean
}

class OrganizationListRow extends React.Component<OrganizationListRowProps, never> {
  render() {
    const { organization } = this.props
    const dataFields = []
    dataFields.push(<td key="name">{organization.name}</td>)
    dataFields.push(<td key="created">{formatLocalDateTime(organization.created)}</td>)
    dataFields.push(<td key="creator">{organization.creator}</td>)
    dataFields.push(<td key="role">{organization.role}</td>)

    if (this.props.showButtons) {
      const buttons = []
      buttons.push(
        <Button key="details" href={`/organization/${organization.id}/`}>
          Details
        </Button>
      )
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
}

interface OrganizationListProps {
  organizations: OrganizationData[]
  showButtons: boolean
}

class OrganizationList extends React.Component<OrganizationListProps, never> {
  render() {
    const organizationRows = this.props.organizations.map((organization) => (
      <OrganizationListRow key={organization.id} organization={organization} showButtons={this.props.showButtons} />
    ))
    return (
      <Table responsive>
        <thead>
          <tr key="heading">
            <th colSpan={4} align="center">
              Current Organizations
            </th>
          </tr>
          <tr key="labels">
            <th>Organization Name</th>
            <th>Created</th>
            <th>By</th>
            <th>My Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{organizationRows}</tbody>
      </Table>
    )
  }
}

interface OrganizationAddState {
  organizationName: string
}

class OrganizationAdd extends React.Component<object, OrganizationAddState> {
  constructor(props: object) {
    super(props)

    this.state = {
      organizationName: ''
    }

    this.updateOrganizationName = this.updateOrganizationName.bind(this)
    this.createOrganization = this.createOrganization.bind(this)
  }

  updateOrganizationName(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target

    this.setState({ organizationName: value })
  }

  async createOrganization() {
    try {
      await smmPost('/organization/', { name: this.state.organizationName })
      this.setState({ organizationName: '' })
    } catch (e) {
      console.error('Failed to create organization:', e)
    }
  }

  render() {
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
              <input type="text" onChange={this.updateOrganizationName} value={this.state.organizationName}></input>
            </td>
            <td>
              <Button onClick={this.createOrganization}>Create</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    )
  }
}

interface OrganizationListPageState {
  knownOrganizations: OrganizationData[]
}

class OrganizationListPage extends React.Component<object, OrganizationListPageState> {
  timer?: number
  constructor(props: object) {
    super(props)

    this.state = {
      knownOrganizations: []
    }
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  async updateData() {
    try {
      const data = await smmGetJSON<{ organizations: OrganizationData[] }>('/organization/', {})
      this.setState({ knownOrganizations: data.organizations })
    } catch (e) {
      console.error('Failed to fetch organizations:', e)
    }
  }

  render() {
    return (
      <div>
        <OrganizationList organizations={this.state.knownOrganizations} showButtons={true} />
        <OrganizationAdd />
      </div>
    )
  }
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
