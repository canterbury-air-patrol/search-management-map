import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { OrganizationListRow } from './list'

class OrganizationMemberRow extends React.Component {
  render () {
    const organizationMember = this.props.organization_member
    const dataFields = []
    dataFields.push((<td key='name'>{organizationMember.user}</td>))
    dataFields.push((<td key='created'>{(new Date(organizationMember.added)).toLocaleString()}</td>))
    dataFields.push((<td key='creator'>{organizationMember.added_by}</td>))

    if (this.props.showButtons) {
      const buttons = []
      buttons.push((<Button key='delete' className='btn-danger' onClick={this.delete}>Delete</Button>))
      dataFields.push((<td key='buttons'><ButtonGroup key='buttons'>{buttons}</ButtonGroup></td>))
    }

    return ((
      <tr key={organizationMember.id}>
        {dataFields}
      </tr>))
  }
}
OrganizationMemberRow.propTypes = {
  organization_member: PropTypes.object.isRequired,
  showButtons: PropTypes.bool
}

class OrganizationAssetRow extends React.Component {
  render () {
    const organizationAsset = this.props.organization_asset
    const dataFields = []
    dataFields.push((<td key='name'>{organizationAsset.asset.name}</td>))
    dataFields.push((<td key='created'>{(new Date(organizationAsset.added)).toLocaleString()}</td>))
    dataFields.push((<td key='creator'>{organizationAsset.added_by}</td>))

    if (this.props.showButtons) {
      const buttons = []
      buttons.push((<Button key='delete' className='btn-danger' onClick={this.delete}>Delete</Button>))
      dataFields.push((<td key='buttons'><ButtonGroup key='buttons'>{buttons}</ButtonGroup></td>))
    }

    return ((
      <tr key={organizationAsset.id}>
        {dataFields}
      </tr>))
  }
}
OrganizationAssetRow.propTypes = {
  organization_asset: PropTypes.object.isRequired,
  showButtons: PropTypes.bool
}

class OrganizationMemberList extends React.Component {
  render () {
    const organizationMemberRows = []
    for (const organizationMemberIdx in this.props.organization_members) {
      const organizationMember = this.props.organization_members[organizationMemberIdx]
      organizationMemberRows.push((
        <OrganizationMemberRow
          key={organizationMember.id}
          organization_member={organizationMember}
          showButtons />
      ))
    }
    return (
      <Table>
        <thead>
          <tr key='heading'>
            <th colSpan={4} align='center'>Members</th>
          </tr>
          <tr key='labels'>
            <th>Member</th>
            <th>Added</th>
            <th>By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          { organizationMemberRows }
        </tbody>
      </Table>)
  }
}
OrganizationMemberList.propTypes = {
  organization_members: PropTypes.array.isRequired
}

class OrganizationAssetList extends React.Component {
  render () {
    const organizationAssetRows = []
    for (const organizationAssetIdx in this.props.organization_assets) {
      const organizationAsset = this.props.organization_assets[organizationAssetIdx]
      organizationAssetRows.push((
        <OrganizationAssetRow
          key={organizationAsset.id}
          organization_asset={organizationAsset}
          showButtons />
      ))
    }
    return (
      <Table>
        <thead>
          <tr key='heading'>
            <th colSpan={4} align='center'>Assets</th>
          </tr>
          <tr key='labels'>
            <th>Asset Name</th>
            <th>Added</th>
            <th>By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          { organizationAssetRows }
        </tbody>
      </Table>)
  }
}
OrganizationAssetList.propTypes = {
  organization_assets: PropTypes.array.isRequired
}

class OrganizationDetailsPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      organizationDetails: {
        members: [],
        assets: []
      }
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
    await $.getJSON(`/organization/${this.props.organizationId}/`, function (data) {
      self.setState(function () {
        return {
          organizationDetails: data
        }
      })
    })
  }

  render () {
    return (
      <div>
        <Table>
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Created</th>
              <th>Creator</th>
              <th>Your Role</th>
            </tr>
          </thead>
          <tbody>
            <OrganizationListRow
              organization={this.state.organizationDetails}
              showButtons={false} />
          </tbody>
        </Table>
        <OrganizationMemberList
          organization_members={this.state.organizationDetails.members}
          showButtons={true} />
        <OrganizationAssetList
          organization_assets={this.state.organizationDetails.assets}
          showButtons={true} />
      </div>
    )
  }
}
OrganizationDetailsPage.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createOrganizationDetails (elementId, organizationId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(<OrganizationDetailsPage organizationId={organizationId} csrftoken={csrftoken} />)
}

globalThis.createOrganizationDetails = createOrganizationDetails
