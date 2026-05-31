import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { AssetData } from './types'

interface AssetListRowProps {
  asset: AssetData
  showButtons: boolean
}

function AssetListRow({ asset, showButtons }: AssetListRowProps) {
  const dataFields = [<td key="name">{asset.name}</td>, <td key="type">{asset.type_name}</td>, <td key="owner">{asset.owner}</td>, <td key="status">{asset.status}</td>]
  if (showButtons) {
    dataFields.push(
      <td key="buttons">
        <ButtonGroup>
          <Button key="interface" href={`/assets/${asset.id}/`}>
            Interface
          </Button>
        </ButtonGroup>
      </td>
    )
  }
  return <tr key={asset.id}>{dataFields}</tr>
}

function AssetList({ assets }: { assets: AssetData[] }) {
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
      <tbody>
        {assets.map((asset) => (
          <AssetListRow key={asset.id} showButtons={true} asset={asset} />
        ))}
      </tbody>
    </Table>
  )
}

function AssetListPage() {
  const [assets, setAssets] = useState<AssetData[]>([])

  usePolling(async () => {
    const data = await smmGetJSON<{ assets: AssetData[] }>('/assets/', {})
    setAssets(data.assets)
  }, 10000)

  return (
    <div>
      <AssetList assets={assets} />
    </div>
  )
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
