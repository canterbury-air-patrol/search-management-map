import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMMissionTopBar } from '../menu/topbar'

class MissionDetails extends React.Component {
  render() {
    const { mission } = this.props
    return (
      <Table>
        <tbody>
          <tr>
            <td>Name</td>
            <td>{mission.name}</td>
          </tr>
          <tr>
            <td>Started</td>
            <td>{new Date(mission.started).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Creator</td>
            <td>{mission.creator}</td>
          </tr>
          <tr>
            <td>Description</td>
            <td>{mission.description}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
MissionDetails.propTypes = {
  mission: Object
}

class MissionDetailsOrganizationsRow extends React.Component {
  constructor(props) {
    super(props)

    this.disableOrgAdd = this.disableOrgAdd.bind(this)
    this.enableOrgAdd = this.enableOrgAdd.bind(this)
    this.disableUserAdd = this.disableUserAdd.bind(this)
    this.enableUserAdd = this.enableUserAdd.bind(this)
  }

  disableOrgAdd() {
    $.post(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_organization: false, csrfmiddlewaretoken: this.props.csrftoken })
  }

  enableOrgAdd() {
    $.post(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_organization: true, csrfmiddlewaretoken: this.props.csrftoken })
  }

  disableUserAdd() {
    $.post(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_user: false, csrfmiddlewaretoken: this.props.csrftoken })
  }

  enableUserAdd() {
    $.post(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_user: true, csrfmiddlewaretoken: this.props.csrftoken })
  }

  render() {
    const { missionOrg } = this.props
    const button_group = []
    if (this.props.showButtons) {
      const buttons = []
      if (missionOrg.permissions.add_organization) {
        buttons.push(
          <Button key="btnAddOrgDisable" onClick={this.disableOrgAdd} variant="danger">
            Disable Adding Organizations
          </Button>
        )
      } else {
        buttons.push(
          <Button key="btnAddOrgEnable" onClick={this.enableOrgAdd}>
            Enable Adding Organizations
          </Button>
        )
      }
      if (missionOrg.permissions.add_user) {
        buttons.push(
          <Button key="btnAddUserDisable" onClick={this.disableUserAdd} variant="danger">
            Disable Adding Users
          </Button>
        )
      } else {
        buttons.push(
          <Button key="btnAddUserEnable" onClick={this.enableUserAdd}>
            Enable Adding Users
          </Button>
        )
      }
      button_group.push(<ButtonGroup key="btnActions">{buttons}</ButtonGroup>)
    }
    return (
      <tr>
        <td>{missionOrg.organization.name}</td>
        <td>{button_group}</td>
      </tr>
    )
  }
}
MissionDetailsOrganizationsRow.propTypes = {
  missionOrg: Object,
  showButtons: Boolean,
  mission: Number,
  csrftoken: String
}

class MissionDetailsOrganizationsList extends React.Component {
  render() {
    const org_list = []
    for (const orgIdx in this.props.missionOrganizations) {
      const missionOrg = this.props.missionOrganizations[orgIdx]
      org_list.push(
        <MissionDetailsOrganizationsRow
          key={missionOrg.organization.id}
          mission={this.props.mission}
          missionOrg={missionOrg}
          showButtons={this.props.isAdmin}
          csrftoken={this.props.csrftoken}
        />
      )
    }
    return (
      <Table>
        <thead>
          <tr>
            <td>Organization</td>
            <td>Options</td>
          </tr>
        </thead>
        <tbody>{org_list}</tbody>
      </Table>
    )
  }
}
MissionDetailsOrganizationsList.propTypes = {
  missionOrganizations: Array,
  isAdmin: Boolean,
  mission: Number,
  csrftoken: String
}

class MissionDetailsOrganizationAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedOrg: undefined,
      orgs: []
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.updateSelectedOrg = this.updateSelectedOrg.bind(this)
    this.add = this.add.bind(this)
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
    this.setState({ orgs: data.organizations })
  }

  async updateData() {
    await $.getJSON(`/mission/${this.props.mission}/organizations/?not_included=True`, this.updateDataResponse)
  }

  updateSelectedOrg(event) {
    const { value } = event.target
    this.setState({ selectedOrg: value })
  }

  add() {
    if (this.state.selectedOrg) {
      $.post(`/mission/${this.props.mission}/organizations/`, { organization: this.state.selectedOrg })
    }
  }

  render() {
    const org_list = []
    for (let orgIdx in this.state.orgs) {
      const org = this.state.orgs[orgIdx]
      org_list.push(
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      )
    }
    return (
      <form>
        <Table>
          <tbody>
            <tr>
              <td>Organization:</td>
              <td>
                <select onChange={this.updateSelectedOrg} value={this.state.selectedOrg}>
                  {org_list}
                </select>
              </td>
              <td>
                <Button onClick={this.add}>Add</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    )
  }
}
MissionDetailsOrganizationAdd.propTypes = {
  mission: Number,
  csrftoken: String
}

class MissionDetailsUserRow extends React.Component {
  constructor(props) {
    super(props)

    this.removeAdmin = this.removeAdmin.bind(this)
    this.makeAdmin = this.makeAdmin.bind(this)
    this.disableOrgAdd = this.disableOrgAdd.bind(this)
    this.enableOrgAdd = this.enableOrgAdd.bind(this)
    this.disableUserAdd = this.disableUserAdd.bind(this)
    this.enableUserAdd = this.enableUserAdd.bind(this)
  }

  removeAdmin() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { admin: false, csrfmiddlewaretoken: this.props.csrftoken })
  }

  makeAdmin() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { admin: true, csrfmiddlewaretoken: this.props.csrftoken })
  }

  disableOrgAdd() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_organization: false, csrfmiddlewaretoken: this.props.csrftoken })
  }

  enableOrgAdd() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_organization: true, csrfmiddlewaretoken: this.props.csrftoken })
  }

  disableUserAdd() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_user: false, csrfmiddlewaretoken: this.props.csrftoken })
  }

  enableUserAdd() {
    $.post(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_user: true, csrfmiddlewaretoken: this.props.csrftoken })
  }

  render() {
    const { missionUser } = this.props
    const button_group = []
    if (this.props.showButtons) {
      const buttons = []
      if (missionUser.permissions.admin) {
        buttons.push(
          <Button key="btnAdminDisable" variant="danger" onClick={this.removeAdmin}>
            Remove Admin
          </Button>
        )
      } else {
        buttons.push(
          <Button key="btnAdminEnable" onClick={this.makeAdmin}>
            Make Admin
          </Button>
        )
      }
      if (missionUser.permissions.add_organization) {
        buttons.push(
          <Button key="btnAddOrgDisable" variant="danger" onClick={this.disableOrgAdd}>
            Disable Adding Organizations
          </Button>
        )
      } else {
        buttons.push(
          <Button key="btnAddOrgEnable" onClick={this.enableOrgAdd}>
            Enable Adding Organizations
          </Button>
        )
      }
      if (missionUser.permissions.add_user) {
        buttons.push(
          <Button key="btnAddUserDisable" variant="danger" onClick={this.disableUserAdd}>
            Disable Adding Users
          </Button>
        )
      } else {
        buttons.push(
          <Button key="btnAddUserEnable" onClick={this.enableUserAdd}>
            Enable Adding Users
          </Button>
        )
      }
      button_group.push(<ButtonGroup key="btnActions">{buttons}</ButtonGroup>)
    }
    return (
      <tr>
        <td>{missionUser.user}</td>
        <td>{button_group}</td>
      </tr>
    )
  }
}
MissionDetailsUserRow.propTypes = {
  missionUser: Object,
  showButtons: Boolean,
  mission: Number,
  csrftoken: String
}

class MissionDetailsUsersList extends React.Component {
  render() {
    const user_list = []
    for (const userIdx in this.props.missionUsers) {
      const missionUser = this.props.missionUsers[userIdx]
      const showButtons = this.props.isAdmin && this.props.me !== missionUser.user
      user_list.push(
        <MissionDetailsUserRow key={missionUser.id} mission={this.props.mission} missionUser={missionUser} showButtons={showButtons} csrftoken={this.props.csrftoken} />
      )
    }

    return (
      <Table>
        <thead>
          <tr>
            <td>User</td>
            <td>Options</td>
          </tr>
        </thead>
        <tbody>{user_list}</tbody>
      </Table>
    )
  }
}
MissionDetailsUsersList.propTypes = {
  missionUsers: Array,
  me: String,
  isAdmin: Boolean,
  mission: Number,
  csrftoken: String
}

class MissionDetailsUserAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedUser: undefined,
      orgs: []
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.updateSelectedUser = this.updateSelectedUser.bind(this)
    this.add = this.add.bind(this)
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
    this.setState({ users: data.users })
  }

  async updateData() {
    await $.getJSON(`/mission/${this.props.mission}/users/?not_included=True`, this.updateDataResponse)
  }

  updateSelectedUser(event) {
    const { value } = event.target
    this.setState({ selectedUser: value })
  }

  add() {
    if (this.state.selectedUser) {
      $.post(`/mission/${this.props.mission}/users/`, { user: this.state.selectedUser })
    }
  }

  render() {
    const user_list = []
    for (let userIdx in this.state.users) {
      const user = this.state.users[userIdx]
      user_list.push(
        <option key={user.id} value={user.id}>
          {user.username}
        </option>
      )
    }
    return (
      <form>
        <Table>
          <tbody>
            <tr>
              <td>User:</td>
              <td>
                <select onChange={this.updateSelectedUser} value={this.state.selectedUser}>
                  {user_list}
                </select>
              </td>
              <td>
                <Button onClick={this.add}>Add</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    )
  }
}
MissionDetailsUserAdd.propTypes = {
  mission: Number,
  csrftoken: String
}

class MissionDetailsAssetRow extends React.Component {
  render() {
    const { missionAsset } = this.props
    const buttons = []
    let status
    let added
    let removed

    if (missionAsset.status && missionAsset.status.since) {
      status = (
        <>
          {missionAsset.status.name}
          <br />
          <small>{new Date(missionAsset.status.since).toLocaleString()}</small>
        </>
      )
    }
    if (missionAsset.added) {
      added = new Date(missionAsset.added).toLocaleString()
    }
    if (missionAsset.removed) {
      removed = new Date(missionAsset.removed).toLocaleString()
    } else {
      buttons.push(
        <Button key="btnRemove" variant="danger">
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
}
MissionDetailsAssetRow.propTypes = {
  missionAsset: Object
}

class MissionDetailsAssetList extends React.Component {
  render() {
    const asset_list = []

    for (const assetIdx in this.props.missionAssets) {
      const missionAsset = this.props.missionAssets[assetIdx]
      asset_list.push(<MissionDetailsAssetRow key={missionAsset.id} missionAsset={missionAsset} />)
    }

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
        <tbody>{asset_list}</tbody>
      </Table>
    )
  }
}
MissionDetailsAssetList.propTypes = {
  missionAssets: Array,
  mission: Number,
  csrftoken: String
}

class MissionDetailsAssetAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedAsset: undefined,
      assets: []
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.updateSelectedAsset = this.updateSelectedAsset.bind(this)
    this.add = this.add.bind(this)
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
        assets: data.assets
      }
      if (oldState.selectedAsset === undefined && data.assets.length > 0) {
        newState.selectedAsset = data.assets[0].id
      }
      return newState
    })
  }

  async updateData() {
    await $.getJSON(`/mission/${this.props.mission}/assets/?not_included=True`, this.updateDataResponse)
  }

  updateSelectedAsset(event) {
    const { value } = event.target
    this.setState({ selectedAsset: value })
  }

  add() {
    if (this.state.selectedAsset) {
      $.post(`/mission/${this.props.mission}/assets/`, { asset: this.state.selectedAsset, csrfmiddlewaretoken: this.props.csrftoken })
    }
  }

  render() {
    const asset_list = []
    for (let assetIdx in this.state.assets) {
      const asset = this.state.assets[assetIdx]
      asset_list.push(
        <option key={asset.id} value={asset.id}>
          {asset.name}
        </option>
      )
    }
    return (
      <form>
        <Table>
          <tbody>
            <tr>
              <td>Asset:</td>
              <td>
                <select onChange={this.updateSelectedAsset} value={this.state.selectedAsset}>
                  {asset_list}
                </select>
              </td>
              <td>
                <Button onClick={this.add}>Add</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    )
  }
}
MissionDetailsAssetAdd.propTypes = {
  mission: Number,
  csrftoken: String
}

class MissionDetailPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      missionDetails: undefined
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
    this.setState({ missionDetails: data })
  }

  async updateData() {
    await $.getJSON(`/mission/${this.props.missionId}/details/`, this.updateDataResponse)
  }

  render() {
    if (this.state.missionDetails === undefined) {
      return <>Loading ...</>
    } else {
      let orgAdd
      let userAdd
      const assetAdd = <MissionDetailsAssetAdd mission={this.props.missionId} csrftoken={this.props.csrftoken} />
      if (this.state.missionDetails.can_add_organizations) {
        orgAdd = <MissionDetailsOrganizationAdd mission={this.props.missionId} csrftoken={this.props.csrftoken} />
      }
      if (this.state.missionDetails.can_add_users) {
        userAdd = <MissionDetailsUserAdd mission={this.props.missionId} csrftoken={this.props.csrftoken} />
      }
      return (
        <>
          <MissionDetails mission={this.state.missionDetails.mission} />
          <MissionDetailsOrganizationsList
            mission={this.props.missionId}
            missionOrganizations={this.state.missionDetails.mission_organizations}
            isAdmin={this.state.missionDetails.admin}
            csrftoken={this.props.csrftoken}
          />
          {orgAdd}
          <MissionDetailsUsersList
            mission={this.props.missionId}
            me={this.state.missionDetails.me}
            missionUsers={this.state.missionDetails.mission_users}
            isAdmin={this.state.missionDetails.admin}
            csrftoken={this.props.csrftoken}
          />
          {userAdd}
          <MissionDetailsAssetList mission={this.props.missionId} missionAssets={this.state.missionDetails.mission_assets} csrftoken={this.props.csrftoken} />
          {assetAdd}
        </>
      )
    }
  }
}
MissionDetailPage.propTypes = {
  missionId: Number,
  csrftoken: String
}

function createMissionDetails(elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MissionDetailPage missionId={missionId} csrftoken={csrftoken} />
    </>
  )
}

export { MissionDetailPage }

globalThis.createMissionDetails = createMissionDetails
