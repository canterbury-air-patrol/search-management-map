import '../page-shell'
import { Table } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON } from '../ajax'

import { AssetCommandView, AssetMissionDetails, AssetUI } from '../asset/ui'
import { MissionAssetStatus } from '../mission/asset/status'
import { SMMOrganizationTopBar } from '../menu/topbar'
import { OrganizationAssetData } from './types'

class RadioOperatorAsset extends AssetUI {
  render() {
    let missionStatus
    if (this.state.details && this.state.details.mission_id) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} />
    }
    return (
      <>
        <thead>
          <tr>
            <td colSpan={2} align="center" style={{ fontWeight: 'bold' }} className="bg-info">
              {this.state.details?.name} ({this.state.details?.asset_type})
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <AssetMissionDetails details={this.state.details} />
            </td>
            <td>
              <AssetCommandView asset={this.props.asset} lastCommand={this.state.lastCommand} />
              {missionStatus}
            </td>
          </tr>
        </tbody>
      </>
    )
  }
}

interface OrganizationRadioOperatorPageProps {
  organizationId: number
}

interface OrganizationRadioOperatorPageState {
  organizationAssets: OrganizationAssetData[]
}

class OrganizationRadioOperatorPage extends React.Component<OrganizationRadioOperatorPageProps, OrganizationRadioOperatorPageState> {
  timer?: number
  constructor(props: OrganizationRadioOperatorPageProps) {
    super(props)

    this.state = {
      organizationAssets: []
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
    const data = await smmGetJSON<{ assets: OrganizationAssetData[] }>(`/organization/${this.props.organizationId}/`, {})
    this.setState({ organizationAssets: data.assets })
  }

  render() {
    const assets = this.state.organizationAssets.map((asset) => <RadioOperatorAsset key={asset.id} asset={asset.asset.id} />)
    return <Table responsive>{assets}</Table>
  }
}

function createRadioOperator(elementId: string, organizationId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={true} />
      <OrganizationRadioOperatorPage organizationId={organizationId} />
    </>
  )
}

window.createRadioOperator = createRadioOperator
