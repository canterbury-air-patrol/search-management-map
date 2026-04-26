import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { smmGet, smmGetJSON, smmPost, smmDelete } from '../ajax'

import { SMMMissionTopBar } from '../menu/topbar'

import { MissionAssetData, MissionData, MissionDetailsData, MissionExternalReferenceData, MissionOrganizationData, MissionUserData } from './types'
import { OrganizationData } from '../organization/types'
import { AssetData } from '../asset/types'

interface MissionDetailsProps {
  mission: MissionData
}

const MissionDetails: React.FC<MissionDetailsProps> = (props) => {
  const { mission } = props

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
        {mission.closed && (
          <tr>
            <td>Closed</td>
            <td>{new Date(mission.closed).toLocaleString()}</td>
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

interface MissionDetailsExternalReferencesRowProps {
  ExternalReference: MissionExternalReferenceData
  csrftoken: string
}

interface MissionDetailsExternalReferencesRowState {
  editFields: {
    [name: string]: boolean
  }
  values: {
    name: string
    code?: string
    url?: string
    notes?: string
  }
}

class MissionDetailsExternalReferencesRow extends React.Component<MissionDetailsExternalReferencesRowProps, MissionDetailsExternalReferencesRowState> {
  constructor(props: MissionDetailsExternalReferencesRowProps) {
    super(props)

    const extRef = this.props.ExternalReference

    this.state = {
      editFields: {},
      values: {
        name: extRef.name,
        code: extRef.code,
        url: extRef.url,
        notes: extRef.notes
      }
    }

    this.toggleEdit = this.toggleEdit.bind(this)
    this.update = this.update.bind(this)
    this.resetEditing = this.resetEditing.bind(this)
    this.delete = this.delete.bind(this)
  }

  toggleEdit(field: string) {
    this.setState((prevState) => ({
      editFields: { ...prevState.editFields, [field]: true }
    }))
  }

  handleChange(field: string, event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target
    this.setState((prevState) => ({
      values: { ...prevState.values, [field]: value }
    }))
  }

  resetEditing() {
    const extRef = this.props.ExternalReference
    this.setState({
      editFields: {},
      values: {
        name: extRef.name,
        code: extRef.code,
        url: extRef.url,
        notes: extRef.notes
      }
    })
  }

  update() {
    const extRef = this.props.ExternalReference
    smmPost(`/mission/${extRef.mission}/externalreferences/${extRef.id}/`, this.state.values)
  }

  delete() {
    const extRef = this.props.ExternalReference
    smmDelete(`/mission/${extRef.mission}/externalreferences/${extRef.id}/`)
  }

  renderField(field: string, displayValue?: string) {
    return this.state.editFields[field] ? (
      <input type="text" value={this.state.values[field]} onChange={(e) => this.handleChange(field, e)} />
    ) : (
      <span onClick={() => this.toggleEdit(field)}>{displayValue}</span>
    )
  }

  render() {
    const extRef = this.props.ExternalReference
    const editing = Object.keys(this.state.editFields).length > 0
    const buttons = []
    if (editing) {
      buttons.push(
        <Button onClick={this.update} key="update">
          Update
        </Button>
      )
      buttons.push(
        <Button onClick={this.resetEditing} key="cancel" variant="danger">
          Cancel
        </Button>
      )
    } else {
      buttons.push(
        <Button onClick={this.delete} key="delete" variant="danger">
          Delete
        </Button>
      )
    }
    return (
      <tr>
        <td>{this.renderField('name', extRef.name)}</td>
        <td>{this.renderField('code', extRef.code)}</td>
        <td>{this.renderField('url', extRef.url)}</td>
        <td>{this.renderField('notes', extRef.notes)}</td>
        <td>
          <ButtonGroup>{buttons}</ButtonGroup>
        </td>
      </tr>
    )
  }
}

interface MissionDetailsExternalReferenceAddProps {
  mission: number
  csrftoken: string
}

interface MissionDetailsExternalReferenceAddState {
  [field: string]: string
}

class MissionDetailsExternalReferenceAdd extends React.Component<MissionDetailsExternalReferenceAddProps, MissionDetailsExternalReferenceAddState> {
  constructor(props: MissionDetailsExternalReferenceAddProps) {
    super(props)

    this.state = {
      name: '',
      code: '',
      url: '',
      notes: ''
    }

    this.add = this.add.bind(this)
    this.addSuccess = this.addSuccess.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  addSuccess() {
    this.setState({
      name: '',
      code: '',
      url: '',
      notes: ''
    })
  }

  add() {
    if (this.state.name) {
      smmPost(
        `/mission/${this.props.mission}/externalreferences/`,
        {
          name: this.state.name,
          code: this.state.code,
          url: this.state.url,
          notes: this.state.notes
        },
        this.addSuccess
      )
    }
  }

  render() {
    return (
      <tr>
        <td>
          <input type="text" name="name" onChange={this.handleChange} value={this.state.name} />
        </td>
        <td>
          <input type="text" name="code" onChange={this.handleChange} value={this.state.code} />
        </td>
        <td>
          <input type="text" name="url" onChange={this.handleChange} value={this.state.url} />
        </td>
        <td>
          <input type="text" name="notes" onChange={this.handleChange} value={this.state.notes} />
        </td>
        <td>
          <Button onClick={this.add}>Add</Button>
        </td>
      </tr>
    )
  }
}

interface MissionDetailsExternalReferencesListProps {
  ExternalReferences: Array<MissionExternalReferenceData>
  csrftoken: string
  mission: number
}

class MissionDetailsExternalReferencesList extends React.Component<MissionDetailsExternalReferencesListProps, never> {
  render() {
    const rows = this.props.ExternalReferences.map((extRef) => <MissionDetailsExternalReferencesRow key={extRef.id} ExternalReference={extRef} csrftoken={this.props.csrftoken} />)
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
          {rows}
          <MissionDetailsExternalReferenceAdd mission={this.props.mission} csrftoken={this.props.csrftoken} />
        </tbody>
      </Table>
    )
  }
}

interface MissionDetailsOrganizationsRowProps {
  mission: number
  missionOrg: MissionOrganizationData
  showButtons: boolean
  csrftoken: string
}

class MissionDetailsOrganizationsRow extends React.Component<MissionDetailsOrganizationsRowProps, never> {
  constructor(props: MissionDetailsOrganizationsRowProps) {
    super(props)

    this.disableOrgAdd = this.disableOrgAdd.bind(this)
    this.enableOrgAdd = this.enableOrgAdd.bind(this)
    this.disableUserAdd = this.disableUserAdd.bind(this)
    this.enableUserAdd = this.enableUserAdd.bind(this)
  }

  disableOrgAdd() {
    smmPost(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_organization: false })
  }

  enableOrgAdd() {
    smmPost(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_organization: true })
  }

  disableUserAdd() {
    smmPost(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_user: false })
  }

  enableUserAdd() {
    smmPost(`/mission/${this.props.mission}/organizations/${this.props.missionOrg.organization.id}/`, { add_user: true })
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

interface MissionDetailsOrganizationsListProps {
  missionOrganizations: Array<MissionOrganizationData>
  mission: number
  isAdmin: boolean
  csrftoken: string
}

class MissionDetailsOrganizationsList extends React.Component<MissionDetailsOrganizationsListProps, never> {
  render() {
    const org_list = this.props.missionOrganizations.map((missionOrg) => (
      <MissionDetailsOrganizationsRow
        key={missionOrg.organization.id}
        mission={this.props.mission}
        missionOrg={missionOrg}
        showButtons={this.props.isAdmin}
        csrftoken={this.props.csrftoken}
      />
    ))
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

interface MissionDetailsOrganizationAddProps {
  mission: number
  csrftoken: string
}

interface MissionDetailsOrganizationAddState {
  selectedOrg?: number
  orgs: Array<OrganizationData>
}

class MissionDetailsOrganizationAdd extends React.Component<MissionDetailsOrganizationAddProps, MissionDetailsOrganizationAddState> {
  timer?: number

  constructor(props: MissionDetailsOrganizationAddProps) {
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
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { organizations: Array<OrganizationData> }) {
    this.setState((oldState) => {
      const newState: MissionDetailsOrganizationAddState = {
        orgs: data.organizations
      }
      if (oldState.selectedOrg === undefined && data.organizations.length > 0) {
        newState.selectedOrg = data.organizations[0].id
      }
      return newState
    })
  }

  async updateData() {
    await smmGetJSON(`/mission/${this.props.mission}/organizations/?not_included=True`, {}, this.updateDataResponse)
  }

  updateSelectedOrg(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    this.setState({ selectedOrg: Number(value) })
  }

  add() {
    if (this.state.selectedOrg) {
      smmPost(`/mission/${this.props.mission}/organizations/`, { organization: this.state.selectedOrg })
    }
  }

  render() {
    const org_list = this.state.orgs.map((org) => (
      <option key={org.id} value={org.id}>
        {org.name}
      </option>
    ))
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

interface MissionDetailsUserRowProps {
  mission: number
  missionUser: MissionUserData
  csrftoken: string
  showButtons: boolean
}

class MissionDetailsUserRow extends React.Component<MissionDetailsUserRowProps, never> {
  constructor(props: MissionDetailsUserRowProps) {
    super(props)

    this.removeAdmin = this.removeAdmin.bind(this)
    this.makeAdmin = this.makeAdmin.bind(this)
    this.disableOrgAdd = this.disableOrgAdd.bind(this)
    this.enableOrgAdd = this.enableOrgAdd.bind(this)
    this.disableUserAdd = this.disableUserAdd.bind(this)
    this.enableUserAdd = this.enableUserAdd.bind(this)
  }

  removeAdmin() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { admin: false })
  }

  makeAdmin() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { admin: true })
  }

  disableOrgAdd() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_organization: false })
  }

  enableOrgAdd() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_organization: true })
  }

  disableUserAdd() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_user: false })
  }

  enableUserAdd() {
    smmPost(`/mission/${this.props.mission}/users/${this.props.missionUser.user_id}/`, { add_user: true })
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

interface MissionDetailsUsersListProps {
  missionUsers: Array<MissionUserData>
  isAdmin: boolean
  me: string
  mission: number
  csrftoken: string
}

class MissionDetailsUsersList extends React.Component<MissionDetailsUsersListProps, never> {
  render() {
    const user_list = this.props.missionUsers.map((missionUser) => (
      <MissionDetailsUserRow
        key={missionUser.id}
        mission={this.props.mission}
        missionUser={missionUser}
        showButtons={this.props.isAdmin && this.props.me !== missionUser.user}
        csrftoken={this.props.csrftoken}
      />
    ))

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

interface MissionDetailsUserAddProps {
  mission: number
  csrftoken: string
}

interface MissionDetailsUserAddState {
  selectedUser?: number
  users: Array<{ id: number; username: string }>
}

class MissionDetailsUserAdd extends React.Component<MissionDetailsUserAddProps, MissionDetailsUserAddState> {
  timer?: number

  constructor(props: MissionDetailsUserAddProps) {
    super(props)

    this.state = {
      selectedUser: undefined,
      users: []
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
    this.updateSelectedUser = this.updateSelectedUser.bind(this)
    this.add = this.add.bind(this)
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { users: Array<{ id: number; username: string }> }) {
    this.setState((oldState) => {
      const newState: MissionDetailsUserAddState = {
        users: data.users
      }
      if (oldState.selectedUser === undefined && data.users.length > 0) {
        newState.selectedUser = data.users[0].id
      }
      return newState
    })
  }

  async updateData() {
    await smmGetJSON(`/mission/${this.props.mission}/users/?not_included=True`, {}, this.updateDataResponse)
  }

  updateSelectedUser(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    this.setState({ selectedUser: Number(value) })
  }

  add() {
    if (this.state.selectedUser) {
      smmPost(`/mission/${this.props.mission}/users/`, { user: this.state.selectedUser })
    }
  }

  render() {
    const user_list = this.state.users.map((user) => (
      <option key={user.id} value={user.id}>
        {user.username}
      </option>
    ))
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

interface MissionDetailsAssetRowProps {
  missionAsset: MissionAssetData
}

class MissionDetailsAssetRow extends React.Component<MissionDetailsAssetRowProps, never> {
  constructor(props: MissionDetailsAssetRowProps) {
    super(props)

    this.remove = this.remove.bind(this)
  }

  remove() {
    smmGet(`/mission/${this.props.missionAsset.mission}/assets/${this.props.missionAsset.asset.id}/remove/`)
  }

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
        <Button key="btnRemove" variant="danger" onClick={this.remove}>
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

interface MissionDetailsAssetListProps {
  missionAssets: Array<MissionAssetData>
  csrftoken: string
}

class MissionDetailsAssetList extends React.Component<MissionDetailsAssetListProps, never> {
  render() {
    const asset_list = this.props.missionAssets.map((missionAsset) => <MissionDetailsAssetRow key={missionAsset.id} missionAsset={missionAsset} />)

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

interface MissionDetailsAssetAddProps {
  mission: number
  csrftoken: string
}

interface MissionDetailsAssetAddState {
  selectedAsset?: number
  assets: Array<AssetData>
}

class MissionDetailsAssetAdd extends React.Component<MissionDetailsAssetAddProps, MissionDetailsAssetAddState> {
  timer?: number
  constructor(props: MissionDetailsAssetAddProps) {
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
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { assets: Array<AssetData> }) {
    this.setState((oldState) => {
      const newState: MissionDetailsAssetAddState = {
        assets: data.assets
      }
      if (oldState.selectedAsset === undefined && data.assets.length > 0) {
        newState.selectedAsset = data.assets[0].id
      }
      return newState
    })
  }

  async updateData() {
    await smmGetJSON(`/mission/${this.props.mission}/assets/?not_included=True`, {}, this.updateDataResponse)
  }

  updateSelectedAsset(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target
    this.setState({ selectedAsset: Number(value) })
  }

  add() {
    if (this.state.selectedAsset) {
      smmPost(`/mission/${this.props.mission}/assets/`, { asset: this.state.selectedAsset })
    }
  }

  render() {
    const asset_list = this.state.assets.map((asset) => (
      <option key={asset.id} value={asset.id}>
        {asset.name}
      </option>
    ))
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

interface MissionDetailsPageProps {
  missionId: number
  csrftoken: string
}

interface MissionDetailsPageState {
  missionDetails?: MissionDetailsData
}

class MissionDetailPage extends React.Component<MissionDetailsPageProps, MissionDetailsPageState> {
  timer?: number

  constructor(props: MissionDetailsPageProps) {
    super(props)

    this.state = {
      missionDetails: undefined
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

  updateDataResponse(data: MissionDetailsData) {
    this.setState({ missionDetails: data })
  }

  async updateData() {
    await smmGetJSON(`/mission/${this.props.missionId}/details/`, {}, this.updateDataResponse)
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
          <MissionDetailsExternalReferencesList
            mission={this.props.missionId}
            ExternalReferences={this.state.missionDetails.external_references}
            csrftoken={this.props.csrftoken}
          />
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
          <MissionDetailsAssetList missionAssets={this.state.missionDetails.mission_assets} csrftoken={this.props.csrftoken} />
          {assetAdd}
        </>
      )
    }
  }
}

function createMissionDetails(elementId: string, missionId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MissionDetailPage missionId={missionId} csrftoken={csrftoken as string} />
    </>
  )
}

export { MissionDetailPage }

// @ts-expect-error: globalThis has no definition
globalThis.createMissionDetails = createMissionDetails
