import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { AssetCommandView, AssetDetails, AssetUI } from '../asset/ui'
import { SMMOrganizationTopBar } from '../menu/topbar'

class RadioOperatorAsset extends AssetUI {
  render () {
    return (
      <>
      <thead>
        <tr>
          <td colSpan={2} align='center' style={ { fontWeight: 'bold' } } className='bg-info'>{this.state.details.name}</td>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td>
        <AssetDetails
          details={this.state.details} />
        </td>
        <td>
        <AssetCommandView
          lastCommand={this.state.lastCommand} />
        </td>
      </tr>
      </tbody>
      </>
    )
  }
}

class OrganizationRadioOperatorPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      organizationAssets: []
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
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

  updateDataResponse (data) {
    this.setState(function () {
      return {
        organizationAssets: data.assets
      }
    })
  }

  async updateData () {
    await $.getJSON(`/organization/${this.props.organizationId}/`, this.updateDataResponse)
  }

  render () {
    const assets = []
    for (const assetId in this.state.organizationAssets) {
      const asset = this.state.organizationAssets[assetId]
      assets.push((<RadioOperatorAsset key={asset.id} asset={asset.asset.id} />))
    }
    return (
      <Table responsive>
        { assets }
      </Table>)
  }
}
OrganizationRadioOperatorPage.propTypes = {
  organizationId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createRadioOperator (elementId, organizationId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(<><SMMOrganizationTopBar organizationId={organizationId} /><OrganizationRadioOperatorPage organizationId={organizationId} csrftoken={csrftoken} /></>)
}

globalThis.createRadioOperator = createRadioOperator
