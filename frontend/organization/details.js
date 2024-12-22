import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { OrganizationListRow } from './list'
import { SMMOrganizationTopBar } from '../menu/topbar'

class OrganizationMemberRow extends React.Component {
  constructor(props) {
    super(props)
    this.delete = this.delete.bind(this)
    this.updateSelectedRole = this.updateSelectedRole.bind(this)
    this.saveChanges = this.saveChanges.bind(this)
    this.setXHR = this.setXHR.bind(this)
  }

  setXHR(xhr) {
    xhr.setRequestHeader('X-CSRFToken', this.props.csrftoken)
  }

  delete() {
    const organizationMember = this.props.organization_member
    $.ajax({
      url: `/organization/${this.props.organizationId}/user/${organizationMember.user}/`,
      type: 'DELETE',
      beforeSend: this.setXHR
    })
  }

  updateSelectedRole(event) {
    const target = event.target
    const value = target.value

    this.setState({ selectedRole: value })
  }

  renderButtons() {
    const currentRole = this.props.organization_member.role
    return (
      <select onChange={this.updateSelectedRole}>
        <option value="M" selected={currentRole === 'Member'}>
          Member
        </option>
        <option value="R" selected={currentRole === 'Radio Operator'}>
          Radio Operator
        </option>
        <option value="A" selected={currentRole === 'Admin'}>
          Admin
        </option>
        <option value="b" selected={currentRole === 'Asset Bridge/Recorder'}>
          Asset Bridge/Recorder
        </option>
      </select>
    )
  }

  saveChanges() {
    const user = this.props.organization_member.user
    $.post(`/organization/${this.props.organizationId}/user/${user}/`, { csrfmiddlewaretoken: this.props.csrftoken, role: this.state.selectedRole }, function () {})
  }

  render() {
    const organizationMember = this.props.organization_member
    const dataFields = []
    dataFields.push(<td key="name">{organizationMember.user}</td>)
    dataFields.push(<td key="created">{new Date(organizationMember.added).toLocaleString()}</td>)
    dataFields.push(<td key="creator">{organizationMember.added_by}</td>)

    if (this.props.showButtons) {
      const buttons = []
      buttons.push(this.renderButtons())
      buttons.push(
        <Button key="save" onClick={this.saveChanges}>
          Save
        </Button>
      )
      buttons.push(
        <Button key="delete" className="btn-danger" onClick={this.delete}>
          Delete
        </Button>
      )
      dataFields.push(
        <td key="buttons">
          <ButtonGroup key="buttons">{buttons}</ButtonGroup>
        </td>
      )
    }

    return <tr key={organizationMember.id}>{dataFields}</tr>
  }
}
OrganizationMemberRow.propTypes = {
  organization_member: PropTypes.object.isRequired,
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string,
  showButtons: PropTypes.bool
}

class OrganizationAssetRow extends React.Component {
  render() {
    const organizationAsset = this.props.organization_asset
    const dataFields = []
    dataFields.push(<td key="name">{organizationAsset.asset.name}</td>)
    dataFields.push(<td key="status">{organizationAsset.asset.status}</td>)
    dataFields.push(<td key="created">{new Date(organizationAsset.added).toLocaleString()}</td>)
    dataFields.push(<td key="creator">{organizationAsset.added_by}</td>)

    if (this.props.showButtons) {
      const buttons = []
      buttons.push(
        <Button key="delete" className="btn-danger" onClick={this.delete}>
          Delete
        </Button>
      )
      dataFields.push(
        <td key="buttons">
          <ButtonGroup key="buttons">{buttons}</ButtonGroup>
        </td>
      )
    }

    return <tr key={organizationAsset.id}>{dataFields}</tr>
  }
}
OrganizationAssetRow.propTypes = {
  organization_asset: PropTypes.object.isRequired,
  showButtons: PropTypes.bool
}

class OrganizationMemberList extends React.Component {
  render() {
    const organizationMemberRows = []
    for (const organizationMemberIdx in this.props.organization_members) {
      const organizationMember = this.props.organization_members[organizationMemberIdx]
      organizationMemberRows.push(
        <OrganizationMemberRow
          key={organizationMember.id}
          organizationId={this.props.organizationId}
          organization_member={organizationMember}
          csrftoken={this.props.csrftoken}
          showButtons={this.props.showButtons}
        />
      )
    }
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
        <tbody>{organizationMemberRows}</tbody>
      </Table>
    )
  }
}
OrganizationMemberList.propTypes = {
  organization_members: PropTypes.array.isRequired,
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string,
  showButtons: PropTypes.bool
}

class OrganizationMemberAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      userList: [],
      userId: null
    }

    this.updateSelectedUser = this.updateSelectedUser.bind(this)
    this.addOrganizationMember = this.addOrganizationMember.bind(this)
    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.addOrgMemberCallback = this.addOrgMemberCallback.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data) {
    this.setState(function (oldState) {
      const newState = {
        userList: data.users
      }
      if (oldState.userId === null && data.users.length > 0) {
        newState.userId = data.users[0].id
      }
      return newState
    })
  }

  async updateData() {
    await $.getJSON(`/organization/${this.props.organizationId}/users/notmember/`, this.updateDataResponse)
  }

  updateSelectedUser(event) {
    const target = event.target
    const value = Number(target.value)

    this.setState({ userId: value })
  }

  addOrgMemberCallback() {
    this.setState({ memberId: null })
  }

  addOrganizationMember() {
    const user = this.state.userList.find((user) => user.id === this.state.userId)
    $.post(`/organization/${this.props.organizationId}/user/${user.username}/`, { csrfmiddlewaretoken: this.props.csrftoken }, this.addOrgMemberCallback)
  }

  render() {
    const possibleMembers = []
    for (const userIdx in this.state.userList) {
      const user = this.state.userList[userIdx]
      possibleMembers.push(
        <option key={user.id} value={user.id}>
          {user.username}
        </option>
      )
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
              <select onChange={this.updateSelectedUser}>{possibleMembers}</select>
            </td>
            <td>
              <Button onClick={this.addOrganizationMember}>Add</Button>
            </td>
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
  render() {
    const organizationAssetRows = []
    for (const organizationAssetIdx in this.props.organization_assets) {
      const organizationAsset = this.props.organization_assets[organizationAssetIdx]
      organizationAssetRows.push(<OrganizationAssetRow key={organizationAsset.id} organization_asset={organizationAsset} showButtons />)
    }
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
        <tbody>{organizationAssetRows}</tbody>
      </Table>
    )
  }
}
OrganizationAssetList.propTypes = {
  organization_assets: PropTypes.array.isRequired
}

class OrganizationAssetAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      assetList: [],
      assetId: null
    }

    this.updateSelectedAsset = this.updateSelectedAsset.bind(this)
    this.addOrganizationAsset = this.addOrganizationAsset.bind(this)
    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.addOrgAssetCallback = this.addOrgAssetCallback.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data) {
    this.setState(function (oldState) {
      const newState = {
        assetList: data.assets
      }
      if (oldState.assetId === null && data.assets.length > 0) {
        newState.assetId = data.assets[0].id
      }
      return newState
    })
  }

  async updateData() {
    await $.getJSON('/assets/', this.updateDataResponse)
  }

  updateSelectedAsset(event) {
    const target = event.target
    const value = target.value

    this.setState({ assetId: value })
  }

  addOrgAssetCallback() {
    this.setState({ assetId: null })
  }

  addOrganizationAsset() {
    $.post(`/organization/${this.props.organizationId}/assets/${this.state.assetId}/`, { csrfmiddlewaretoken: this.props.csrftoken }, this.addOrgAssetCallback)
  }

  render() {
    const possibleAssets = []
    for (const assetIdx in this.state.assetList) {
      const asset = this.state.assetList[assetIdx]
      possibleAssets.push(
        <option key={asset.id} value={asset.id}>
          {asset.name}
        </option>
      )
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
              <select onChange={this.updateSelectedAsset}>{possibleAssets}</select>
            </td>
            <td>
              <Button onClick={this.addOrganizationAsset}>Add</Button>
            </td>
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
  constructor(props) {
    super(props)

    this.state = {
      organizationDetails: {
        members: [],
        assets: []
      }
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data) {
    this.setState(function () {
      return {
        organizationDetails: data
      }
    })
    if (this.props.updateRadioOperator) {
      this.props.updateRadioOperator(data.role === 'Admin' || data.role == 'Radio Operator')
    }
  }

  async updateData() {
    await $.getJSON(`/organization/${this.props.organizationId}/`, this.updateDataResponse)
  }

  render() {
    const organizationSections = [
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
          <OrganizationListRow organization={this.state.organizationDetails} showButtons={false} />
        </tbody>
      </Table>
    ]
    organizationSections.push(
      <OrganizationMemberList
        key="org_members"
        organizationId={this.props.organizationId}
        organization_members={this.state.organizationDetails.members}
        csrftoken={this.props.csrftoken}
        showButtons={this.state.organizationDetails.role === 'Admin'}
      />
    )
    if (this.state.organizationDetails.role === 'Admin') {
      organizationSections.push(<OrganizationMemberAdd key="org_add_member" organizationId={this.props.organizationId} csrftoken={this.props.csrftoken} />)
    }
    organizationSections.push(<OrganizationAssetList key="org_assets" organization_assets={this.state.organizationDetails.assets} showButtons={true} />)
    organizationSections.push(<OrganizationAssetAdd key="org_asset_add" organizationId={this.props.organizationId} csrftoken={this.props.csrftoken} />)

    return <div>{organizationSections}</div>
  }
}
OrganizationDetailsPage.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired,
  updateRadioOperator: PropTypes.func
}

class OrganizationPage extends React.Component {
  constructor(props) {
    super(props)
    this.updateRadioOperator = this.updateRadioOperator.bind(this)

    this.state = {
      isRadioOperator: false
    }
  }

  updateRadioOperator(radioOperator) {
    this.setState({
      isRadioOperator: radioOperator
    })
  }

  render() {
    return (
      <>
        <SMMOrganizationTopBar organizationId={this.props.organizationId} showRadioOperator={this.state.isRadioOperator} />
        <OrganizationDetailsPage organizationId={this.props.organizationId} csrftoken={this.props.csrftoken} updateRadioOperator={this.updateRadioOperator} />
      </>
    )
  }
}
OrganizationPage.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createOrganizationDetails(elementId, organizationId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(<OrganizationPage organizationId={organizationId} csrftoken={csrftoken} />)
}

globalThis.createOrganizationDetails = createOrganizationDetails
