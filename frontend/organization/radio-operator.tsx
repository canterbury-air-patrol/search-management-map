import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { smmGetJSON } from '../ajax'

import { AssetCommandView, AssetMissionDetails, AssetUI } from '../asset/ui'
import { MissionAssetStatus } from '../mission/asset/status'
import { SMMOrganizationTopBar } from '../menu/topbar'
import { OrganizationAssetData } from './types'

class RadioOperatorAsset extends AssetUI {
  render() {
    let missionStatus
    if (this.state.details && this.state.details.mission_id) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} csrftoken={this.props.csrftoken} />
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
              <AssetCommandView asset={this.props.asset} lastCommand={this.state.lastCommand} csrftoken={this.props.csrftoken} />
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
  csrftoken: string
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

  updateDataResponse(data: { assets: OrganizationAssetData[] }) {
    this.setState(function () {
      return {
        organizationAssets: data.assets
      }
    })
  }

  async updateData() {
    await smmGetJSON(`/organization/${this.props.organizationId}/`, {}, this.updateDataResponse)
  }

  render() {
    const assets = this.state.organizationAssets.map((asset) => <RadioOperatorAsset key={asset.id} asset={asset.asset.id} csrftoken={this.props.csrftoken} />)
    return <Table responsive>{assets}</Table>
  }
}

function createRadioOperator(elementId: string, organizationId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={true} />
      <OrganizationRadioOperatorPage organizationId={organizationId} csrftoken={csrftoken as string} />
    </>
  )
}

// @ts-expect-error: globalThis has no definition
globalThis.createRadioOperator = createRadioOperator
