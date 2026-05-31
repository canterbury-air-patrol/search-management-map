import '../page-shell'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON } from '../ajax'

import { SMMTopBar } from '../menu/topbar'

import { AssetData } from './types'

interface AssetListRowProps {
  asset: AssetData
  showButtons: boolean
}

class AssetListRow extends React.Component<AssetListRowProps, never> {
  render() {
    const { asset } = this.props
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

interface AssetListProps {
  assets: AssetData[]
}

class AssetList extends React.Component<AssetListProps, never> {
  render() {
    const assetRows = this.props.assets.map((asset) => <AssetListRow key={asset.id} showButtons={true} asset={asset} />)
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

interface AssetListPageState {
  knownAssets: AssetData[]
}

class AssetListPage extends React.Component<object, AssetListPageState> {
  timer?: number

  constructor(props: object) {
    super(props)

    this.state = {
      knownAssets: []
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
    const data = await smmGetJSON<{ assets: AssetData[] }>('/assets/', {})
    this.setState({ knownAssets: data.assets })
  }

  render() {
    return (
      <div>
        <AssetList assets={this.state.knownAssets} />
      </div>
    )
  }
}

function createAssetList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(
    <>
      <SMMTopBar />
      <AssetListPage />
    </>
  )
}

window.createAssetList = createAssetList
