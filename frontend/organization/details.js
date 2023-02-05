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
          showButtons={this.props.showButtons} />
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
  organization_members: PropTypes.array.isRequired,
  showButtons: PropTypes.bool
}

class OrganizationMemberAdd extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      userList: [],
      userId: null
    }

    this.updateSelectedUser = this.updateSelectedUser.bind(this)
    this.addOrganizationMember = this.addOrganizationMember.bind(this)
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
    await $.getJSON(`/organization/${this.props.organizationId}/users/notmember/`, function (data) {
      self.setState(function (oldState) {
        const newState = {
          userList: data.users
        }
        if (oldState.userId === null && data.users.length > 0) {
          newState.userId = data.users[0].id
        }
        return newState
      })
    })
  }

  updateSelectedUser (event) {
    const target = event.target
    const value = target.value

    this.setState({ memberId: value })
  }

  addOrganizationMember () {
    const self = this
    $.post(`/organization/${this.props.organizationId}/user/${this.state.userId}/`, { csrfmiddlewaretoken: this.props.csrftoken }, function () {
      self.setState({ memberId: null })
    })
  }

  render () {
    const possibleMembers = []
    for (const userIdx in this.state.userList) {
      const user = this.state.userList[userIdx]
      possibleMembers.push((<option key={user.id} value={user.id}>{user.username}</option>))
    }
    return (
      <Table>
        <thead>
          <tr>
            <td>Member</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><select onChange={this.updateSelectedUser}>{possibleMembers}</select></td>
            <td><Button onClick={this.addOrganizationMember}>Add</Button></td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
OrganizationMemberAdd.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
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

class OrganizationAssetAdd extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      assetList: [],
      assetId: null
    }

    this.updateSelectedAsset = this.updateSelectedAsset.bind(this)
    this.addOrganizationAsset = this.addOrganizationAsset.bind(this)
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
    await $.getJSON('/assets/mine/json/', function (data) {
      self.setState(function (oldState) {
        const newState = {
          assetList: data.assets
        }
        if (oldState.assetId === null && data.assets.length > 0) {
          newState.assetId = data.assets[0].id
        }
        return newState
      })
    })
  }

  updateSelectedAsset (event) {
    const target = event.target
    const value = target.value

    this.setState({ assetId: value })
  }

  addOrganizationAsset () {
    const self = this
    $.post(`/organization/${this.props.organizationId}/assets/${this.state.assetId}/`, { csrfmiddlewaretoken: this.props.csrftoken }, function () {
      self.setState({ assetId: null })
    })
  }

  render () {
    const possibleAssets = []
    for (const assetIdx in this.state.assetList) {
      const asset = this.state.assetList[assetIdx]
      possibleAssets.push((<option key={asset.id} value={asset.id}>{asset.name}</option>))
    }
    return (
      <Table>
        <thead>
          <tr>
            <td>Asset</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><select onChange={this.updateSelectedAsset}>{possibleAssets}</select></td>
            <td><Button onClick={this.addOrganizationAsset}>Add</Button></td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
OrganizationAssetAdd.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
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
    const organizationSections = [(
      <Table key='details'>
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
    )]
    organizationSections.push((
      <OrganizationMemberList key='org_members'
          organization_members={this.state.organizationDetails.members}
          showButtons={this.state.organizationDetails.role === 'Admin'} />
    ))
    if (this.state.organizationDetails.role === 'Admin') {
      organizationSections.push((
        <OrganizationMemberAdd key='org_add_member'
          organizationId={this.props.organizationId}
          csrftoken={this.props.csrftoken} />
      ))
    }
    organizationSections.push((
      <OrganizationAssetList key='org_assets'
        organization_assets={this.state.organizationDetails.assets}
        showButtons={true} />
    ))
    organizationSections.push((
      <OrganizationAssetAdd key='org_asset_add'
        organizationId={this.props.organizationId}
        csrftoken={this.props.csrftoken} />
    ))

    return (
      <div>
        { organizationSections }
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
