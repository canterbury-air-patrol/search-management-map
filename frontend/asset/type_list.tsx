import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMTopBar } from '../menu/topbar'

import { AssetTypeData } from './types'

interface AssetTypeListRowProps {
  assetType: AssetTypeData
}

class AssetTypeListRow extends React.Component<AssetTypeListRowProps, never> {
  render() {
    const { assetType } = this.props
    const dataFields = []
    dataFields.push(<td key="type">{assetType.name}</td>)

    return <tr key={assetType.id}>{dataFields}</tr>
  }
}

interface AssetTypeListProps {
  assetTypes: AssetTypeData[]
}

class AssetTypeList extends React.Component<AssetTypeListProps, never> {
  render() {
    const assetTypeRows = []
    for (const assetIdx in this.props.assetTypes) {
      const assetType = this.props.assetTypes[assetIdx]
      assetTypeRows.push(<AssetTypeListRow key={assetType.id} assetType={assetType} />)
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

interface AssetTypeListPageState {
  knownAssetTypes: AssetTypeData[]
}

class AssetTypeListPage extends React.Component<object, AssetTypeListPageState> {
  timer?: number

  constructor(props: object) {
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

  updateAssetTypes(data: { asset_types: AssetTypeData[] }) {
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

function createAssetTypeList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(
    <>
      <SMMTopBar />
      <AssetTypeListPage />
    </>
  )
}

// @ts-expect-error: globalThis doesn't have a define
globalThis.createAssetTypeList = createAssetTypeList
