import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMTopBar } from '../menu/topbar'

class AssetTypeListRow extends React.Component {
  render() {
    const assetType = this.props.assetType
    const dataFields = []
    dataFields.push(<td key="type">{assetType.name}</td>)

    return <tr key={assetType.id}>{dataFields}</tr>
  }
}
AssetTypeListRow.propTypes = {
  assetType: PropTypes.object.isRequired
}

class AssetTypeList extends React.Component {
  render() {
    const assetTypeRows = []
    for (const assetIdx in this.props.assetTypes) {
      const assetType = this.props.assetTypes[assetIdx]
      assetTypeRows.push(<AssetTypeListRow key={assetType.id} showButtons={true} assetType={assetType} />)
    }
    return (
      <Table responsive>
        <thead>
          <tr key="heading">
            <th colSpan={5} align="center">
              Asset Types
            </th>
          </tr>
          <tr key="labels">
            <th>Asset Type</th>
          </tr>
        </thead>
        <tbody>{assetTypeRows}</tbody>
      </Table>
    )
  }
}
AssetTypeList.propTypes = {
  assetTypes: PropTypes.array.isRequired
}

class AssetTypeListPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      knownAssetTypes: []
    }

    this.updateAssetTypes = this.updateAssetTypes.bind(this)
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
    await $.getJSON('/assets/assettypes/', this.updateAssetTypes)
  }

  updateAssetTypes(data) {
    this.setState(function () {
      return {
        knownAssetTypes: data.asset_types
      }
    })
  }

  render() {
    return (
      <div>
        <AssetTypeList assetTypes={this.state.knownAssetTypes} />
      </div>
    )
  }
}

function createAssetTypeList(elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(
    <>
      <SMMTopBar />
      <AssetTypeListPage />
    </>
  )
}

globalThis.createAssetTypeList = createAssetTypeList
