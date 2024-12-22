import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMTopBar } from '../menu/topbar'

class AssetListRow extends React.Component {
  render() {
    const asset = this.props.asset
    const dataFields = []
    dataFields.push(<td key="name">{asset.name}</td>)
    dataFields.push(<td key="type">{asset.type_name}</td>)
    dataFields.push(<td key="owner">{asset.owner}</td>)
    dataFields.push(<td key="status">{asset.status}</td>)

    if (this.props.showButtons) {
      const buttons = [
        <Button key="interface" href={`/assets/${asset.id}/`}>
          Interface
        </Button>
      ]
      dataFields.push(
        <td key="buttons">
          <ButtonGroup>{buttons}</ButtonGroup>
        </td>
      )
    }
    return <tr key={asset.id}>{dataFields}</tr>
  }
}
AssetListRow.propTypes = {
  asset: PropTypes.object.isRequired,
  showButtons: PropTypes.bool.isRequired
}

class AssetList extends React.Component {
  render() {
    const assetRows = []
    for (const assetIdx in this.props.assets) {
      const asset = this.props.assets[assetIdx]
      assetRows.push(<AssetListRow key={asset.id} showButtons={true} asset={asset} />)
    }
    return (
      <Table responsive>
        <thead>
          <tr key="heading">
            <th colSpan={5} align="center">
              My Assets
            </th>
          </tr>
          <tr key="labels">
            <th>Asset Name</th>
            <th>Asset Type</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{assetRows}</tbody>
      </Table>
    )
  }
}
AssetList.propTypes = {
  assets: PropTypes.array.isRequired
}

class AssetListPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      knownAssets: []
    }

    this.updateAssets = this.updateAssets.bind(this)
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

  async updateData() {
    await $.getJSON('/assets/', this.updateAssets)
  }

  updateAssets(data) {
    this.setState(function () {
      return {
        knownAssets: data.assets
      }
    })
  }

  render() {
    return (
      <div>
        <AssetList assets={this.state.knownAssets} />
      </div>
    )
  }
}

function createAssetList(elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(
    <>
      <SMMTopBar />
      <AssetListPage />
    </>
  )
}

globalThis.createAssetList = createAssetList
