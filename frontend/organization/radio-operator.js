import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { AssetCommandView, AssetMissionDetails, AssetUI } from '../asset/ui'
import { MissionAssetStatus } from '../mission/asset/status'
import { SMMOrganizationTopBar } from '../menu/topbar'

class RadioOperatorAsset extends AssetUI {
  render() {
    let missionStatus
    if (Number.isInteger(this.state.details.mission_id)) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} csrftoken={this.props.csrftoken} />
    }
    return (
      <>
        <thead>
          <tr>
            <td colSpan={2} align="center" style={{ fontWeight: 'bold' }} className="bg-info">
              {this.state.details.name} ({this.state.details.asset_type})
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
RadioOperatorAsset.propTypes = {
  asset: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

class OrganizationRadioOperatorPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      organizationAssets: []
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
        organizationAssets: data.assets
      }
    })
  }

  async updateData() {
    await $.getJSON(`/organization/${this.props.organizationId}/`, this.updateDataResponse)
  }

  render() {
    const assets = []
    for (const assetId in this.state.organizationAssets) {
      const asset = this.state.organizationAssets[assetId]
      assets.push(<RadioOperatorAsset key={asset.id} asset={asset.asset.id} csrftoken={this.props.csrftoken} />)
    }
    return <Table responsive>{assets}</Table>
  }
}
OrganizationRadioOperatorPage.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createRadioOperator(elementId, organizationId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMOrganizationTopBar organizationId={organizationId} showRadioOperator={true} />
      <OrganizationRadioOperatorPage organizationId={organizationId} csrftoken={csrftoken} />
    </>
  )
}

globalThis.createRadioOperator = createRadioOperator
