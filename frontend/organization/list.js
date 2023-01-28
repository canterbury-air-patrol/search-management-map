import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

class OrganizationListRow extends React.Component {
  render () {
    const organization = this.props.organization
    const dataFields = []
    dataFields.push((<td key='name'>{organization.name}</td>))
    dataFields.push((<td key='created'>{(new Date(organization.created)).toLocaleString()}</td>))
    dataFields.push((<td key='creator'>{organization.creator}</td>))
    dataFields.push((<td key='role'>{organization.role}</td>))

    if (this.props.showButtons) {
      const buttons = []
      buttons.push((<Button key='details' href={ `/organization/${organization.id}/` }>Details</Button>))
      if (organization.role === 'Admin') {
        buttons.push((<Button key='delete' className='btn-danger' onClick={this.delete_organization}>Delete</Button>))
      }
      dataFields.push((<td key='buttons'><ButtonGroup key='buttons'>{buttons}</ButtonGroup></td>))
    }

    return ((
      <tr key={organization.id}>
        {dataFields}
      </tr>))
  }
}
OrganizationListRow.propTypes = {
  organization: PropTypes.object.isRequired,
  showButtons: PropTypes.bool
}

class OrganizationList extends React.Component {
  render () {
    const organizationRows = []
    for (const organizationIdx in this.props.organizations) {
      const organization = this.props.organizations[organizationIdx]
      organizationRows.push((
        <OrganizationListRow
          key={organization.id}
          organization={organization}
          showButtons />
      ))
    }
    return (
      <Table>
        <thead>
          <tr key='heading'>
            <th colSpan={4} align='center'>Current Organizations</th>
          </tr>
          <tr key='labels'>
            <th>Organization Name</th>
            <th>Created</th>
            <th>By</th>
            <th>My Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          { organizationRows }
        </tbody>
      </Table>)
  }
}
OrganizationList.propTypes = {
  organizations: PropTypes.array.isRequired
}

class OrganizationAdd extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      organizationName: ''
    }

    this.updateOrganizationName = this.updateOrganizationName.bind(this)
    this.createOrganization = this.createOrganization.bind(this)
  }

  updateOrganizationName (event) {
    const target = event.target
    const value = target.value

    this.setState({ organizationName: value })
  }

  createOrganization () {
    const self = this
    $.post('/organization/create/', { name: this.state.organizationName, csrfmiddlewaretoken: this.props.csrftoken }, function () {
      self.setState({ organizationName: '' })
    })
  }

  render () {
    return (
      <Table>
        <thead>
          <tr>
            <td>Name</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><input type="text" onChange={this.updateOrganizationName} value={this.state.organizationName}></input></td>
            <td><Button onClick={this.createOrganization}>Create</Button></td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
OrganizationAdd.propTypes = {
  csrftoken: PropTypes.string.isRequired
}

class OrganizationListPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      knownOrganizations: []
    }
  }

  componentDidMount () {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get('/organization/list/all/', function (data) {
      self.setState(function () {
        return {
          knownOrganizations: data.organizations
        }
      })
    })
  }

  render () {
    return (
      <div>
        <OrganizationList
          organizations={this.state.knownOrganizations}
          showButtons={true} />
        <OrganizationAdd csrftoken={this.props.csrftoken} />
      </div>
    )
  }
}
OrganizationListPage.propTypes = {
  csrftoken: PropTypes.string.isRequired
}

function createOrganizationList (elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(<OrganizationListPage csrftoken={csrftoken} />)
}

globalThis.createOrganizationList = createOrganizationList
