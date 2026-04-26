import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { smmGetJSON, smmPost } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { OrganizationData } from './types'

interface OrganizationListRowProps {
  organization: OrganizationData
  showButtons: boolean
}

class OrganizationListRow extends React.Component<OrganizationListRowProps, never> {
  constructor(props: OrganizationListRowProps) {
    super(props)

    this.delete_organization = this.delete_organization.bind(this)
  }

  delete_organization() {}

  render() {
    const { organization } = this.props
    const dataFields = []
    dataFields.push(<td key="name">{organization.name}</td>)
    dataFields.push(<td key="created">{new Date(organization.created).toLocaleString()}</td>)
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
      if (organization.role === 'Admin') {
        buttons.push(
          <Button key="delete" className="btn-danger" onClick={this.delete_organization}>
            Delete
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

interface OrganizationAddProps {
  csrftoken: string
}

interface OrganizationAddState {
  organizationName: string
}

class OrganizationAdd extends React.Component<OrganizationAddProps, OrganizationAddState> {
  constructor(props: OrganizationAddProps) {
    super(props)

    this.state = {
      organizationName: ''
    }

    this.updateOrganizationName = this.updateOrganizationName.bind(this)
    this.createOrganization = this.createOrganization.bind(this)
    this.createOrgCallback = this.createOrgCallback.bind(this)
  }

  updateOrganizationName(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target

    this.setState({ organizationName: value })
  }

  createOrgCallback() {
    this.setState({ organizationName: '' })
  }

  createOrganization() {
    smmPost('/organization/', { name: this.state.organizationName, csrfmiddlewaretoken: this.props.csrftoken }, this.createOrgCallback)
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

interface OrganizationListPageProps {
  csrftoken: string
}

interface OrganizationListPageState {
  knownOrganizations: OrganizationData[]
}

class OrganizationListPage extends React.Component<OrganizationListPageProps, OrganizationListPageState> {
  timer?: number
  constructor(props: OrganizationListPageProps) {
    super(props)

    this.state = {
      knownOrganizations: []
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { organizations: OrganizationData[] }) {
    this.setState(function () {
      return {
        knownOrganizations: data.organizations
      }
    })
  }

  async updateData() {
    await smmGetJSON('/organization/', {}, this.updateDataResponse)
  }

  render() {
    return (
      <div>
        <OrganizationList organizations={this.state.knownOrganizations} showButtons={true} />
        <OrganizationAdd csrftoken={this.props.csrftoken} />
      </div>
    )
  }
}

function createOrganizationList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMTopBar />
      <OrganizationListPage csrftoken={csrftoken as string} />
    </>
  )
}

export { OrganizationListRow }

// @ts-expect-error: globalThis is not defined
globalThis.createOrganizationList = createOrganizationList
