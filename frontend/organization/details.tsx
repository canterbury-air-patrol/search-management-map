import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON, smmPost, smmDelete } from '../ajax'

import { OrganizationListRow } from './list'
import { SMMOrganizationTopBar } from '../menu/topbar'
import { OrganizationAssetData, OrganizationData, OrganizationMemberData } from './types'
import { AssetData } from '../asset/types'

interface OrganizationMemberRowProps {
  organizationId: number
  organization_member: OrganizationMemberData
  showButtons: boolean
}

interface OrganizationMemberRowState {
  selectedRole?: string
}

class OrganizationMemberRow extends React.Component<OrganizationMemberRowProps, OrganizationMemberRowState> {
  constructor(props: OrganizationMemberRowProps) {
    super(props)
    this.delete = this.delete.bind(this)
    this.updateSelectedRole = this.updateSelectedRole.bind(this)
    this.saveChanges = this.saveChanges.bind(this)
  }

  async delete() {
    const organizationMember = this.props.organization_member
    await smmDelete(`/organization/${this.props.organizationId}/user/${organizationMember.user}/`)
  }

  updateSelectedRole(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target

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
    const { user } = this.props.organization_member
    smmPost(`/organization/${this.props.organizationId}/user/${user}/`, { role: this.state.selectedRole })
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

interface OrganizationAssetRowProps {
  organizationId: number
  organization_asset: OrganizationAssetData
  showButtons: boolean
}

class OrganizationAssetRow extends React.Component<OrganizationAssetRowProps, never> {
  constructor(props: OrganizationAssetRowProps) {
    super(props)
    this.delete = this.delete.bind(this)
  }

  async delete() {
    const { organization_asset } = this.props
    await smmDelete(`/organization/${this.props.organizationId}/assets/${organization_asset.asset.id}/`)
  }

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

interface OrganizationMemberListProps {
  organizationId: number
  organization_members?: OrganizationMemberData[]
  showButtons: boolean
}

class OrganizationMemberList extends React.Component<OrganizationMemberListProps, never> {
  render() {
    const organizationMemberRows = this.props.organization_members?.map((organizationMember) => (
      <OrganizationMemberRow key={organizationMember.id} organizationId={this.props.organizationId} organization_member={organizationMember} showButtons={this.props.showButtons} />
    ))
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

interface OrganizationMemberAddProps {
  organizationId: number
}

interface OrganizationMemberAddState {
  userList: { id: number; username: string }[]
  userId?: number
}

class OrganizationMemberAdd extends React.Component<OrganizationMemberAddProps, OrganizationMemberAddState> {
  timer?: number
  constructor(props: OrganizationMemberAddProps) {
    super(props)

    this.state = {
      userList: [],
      userId: undefined
    }

    this.updateSelectedUser = this.updateSelectedUser.bind(this)
    this.addOrganizationMember = this.addOrganizationMember.bind(this)
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
    const data = await smmGetJSON<{ users: { id: number; username: string }[] }>(`/organization/${this.props.organizationId}/users/notmember/`, {})
    this.setState((oldState) => ({
      userList: data.users,
      ...(oldState.userId === null && data.users.length > 0 ? { userId: data.users[0].id } : {})
    }))
  }

  updateSelectedUser(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(event.target.value)

    this.setState({ userId: value })
  }

  async addOrganizationMember() {
    const user = this.state.userList.find((user) => user.id === this.state.userId)
    if (!user) return
    await smmPost(`/organization/${this.props.organizationId}/user/${user.username}/`, {})
    this.setState({ userId: undefined })
  }

  render() {
    const possibleMembers = this.state.userList.map((user) => (
      <option key={user.id} value={user.id}>
        {user.username}
      </option>
    ))
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

interface OrganizationAssetListProps {
  organizationId: number
  organization_assets?: OrganizationAssetData[]
}

class OrganizationAssetList extends React.Component<OrganizationAssetListProps, never> {
  render() {
    const organizationAssetRows = this.props.organization_assets?.map((organizationAsset) => (
      <OrganizationAssetRow key={organizationAsset.id} organizationId={this.props.organizationId} organization_asset={organizationAsset} showButtons />
    ))
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

interface OrganizationAssetAddProps {
  organizationId: number
}

interface OrganizationAssetAddState {
  assetList: AssetData[]
  assetId?: number
}

class OrganizationAssetAdd extends React.Component<OrganizationAssetAddProps, OrganizationAssetAddState> {
  timer?: number

  constructor(props: OrganizationAssetAddProps) {
    super(props)

    this.state = {
      assetList: [],
      assetId: undefined
    }

    this.updateSelectedAsset = this.updateSelectedAsset.bind(this)
    this.addOrganizationAsset = this.addOrganizationAsset.bind(this)
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
    const data = await smmGetJSON<{ assets: AssetData[] }>('/assets/', {})
    this.setState((oldState) => ({
      assetList: data.assets,
      ...(oldState.assetId === null && data.assets.length > 0 ? { assetId: data.assets[0].id } : {})
    }))
  }

  updateSelectedAsset(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target

    this.setState({ assetId: Number(value) })
  }

  async addOrganizationAsset() {
    await smmPost(`/organization/${this.props.organizationId}/assets/${this.state.assetId}/`, {})
    this.setState({ assetId: undefined })
  }

  render() {
    const possibleAssets = this.state.assetList.map((asset) => (
      <option key={asset.id} value={asset.id}>
        {asset.name}
      </option>
    ))
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

interface OrganizationDetailsPageProps {
  organizationId: number
  updateRadioOperator: (show: boolean) => void
}

interface OrganizationDetailsPageState {
  organizationDetails: OrganizationData
}

class OrganizationDetailsPage extends React.Component<OrganizationDetailsPageProps, OrganizationDetailsPageState> {
  timer?: number

  constructor(props: OrganizationDetailsPageProps) {
    super(props)

    this.state = {
      organizationDetails: {
        id: this.props.organizationId,
        name: '',
        created: '',
        creator: '',
        role: ''
      }
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
    const data = await smmGetJSON<OrganizationData>(`/organization/${this.props.organizationId}/`, {})
    this.setState({ organizationDetails: data })
    if (this.props.updateRadioOperator) {
      this.props.updateRadioOperator(data.role === 'Admin' || data.role === 'Radio Operator')
    }
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
        showButtons={this.state.organizationDetails.role === 'Admin'}
      />
    )
    if (this.state.organizationDetails.role === 'Admin') {
      organizationSections.push(<OrganizationMemberAdd key="org_add_member" organizationId={this.props.organizationId} />)
    }
    organizationSections.push(<OrganizationAssetList key="org_assets" organizationId={this.props.organizationId} organization_assets={this.state.organizationDetails.assets} />)
    organizationSections.push(<OrganizationAssetAdd key="org_asset_add" organizationId={this.props.organizationId} />)

    return <div>{organizationSections}</div>
  }
}

interface OrganizationPageProps {
  organizationId: number
}

interface OrganizationPageState {
  isRadioOperator: boolean
}

class OrganizationPage extends React.Component<OrganizationPageProps, OrganizationPageState> {
  constructor(props: OrganizationPageProps) {
    super(props)
    this.updateRadioOperator = this.updateRadioOperator.bind(this)

    this.state = {
      isRadioOperator: false
    }
  }

  updateRadioOperator(radioOperator: boolean) {
    this.setState({
      isRadioOperator: radioOperator
    })
  }

  render() {
    return (
      <>
        <SMMOrganizationTopBar organizationId={this.props.organizationId} showRadioOperator={this.state.isRadioOperator} />
        <OrganizationDetailsPage organizationId={this.props.organizationId} updateRadioOperator={this.updateRadioOperator} />
      </>
    )
  }
}

function createOrganizationDetails(elementId: string, organizationId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(<OrganizationPage organizationId={organizationId} />)
}

// @ts-expect-error: globalThis has not definition
globalThis.createOrganizationDetails = createOrganizationDetails
