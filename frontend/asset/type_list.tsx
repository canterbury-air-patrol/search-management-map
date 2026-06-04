import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { Loading, LoadFailed } from '../components/Loading'
import { AssetTypeData } from './types'

function AssetTypeListRow({ assetType }: { assetType: AssetTypeData }) {
  return (
    <tr key={assetType.id}>
      <td key="type">{assetType.name}</td>
    </tr>
  )
}

function AssetTypeList({ assetTypes }: { assetTypes: AssetTypeData[] }) {
  return (
    <Table responsive>
      <thead>
        <tr key="heading">
          <th align="center">Asset Types</th>
        </tr>
        <tr key="labels">
          <th>Asset Type</th>
        </tr>
      </thead>
      <tbody>
        {assetTypes.map((assetType) => (
          <AssetTypeListRow key={assetType.id} assetType={assetType} />
        ))}
      </tbody>
    </Table>
  )
}

function AssetTypeListPage() {
  const [assetTypes, setAssetTypes] = useState<AssetTypeData[] | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)

  usePolling(async () => {
    try {
      const data = await smmGetJSON<{ asset_types: AssetTypeData[] }>('/assets/assettypes/', {})
      setAssetTypes(data.asset_types)
      setLoadFailed(false)
    } catch (e) {
      console.error('Failed to fetch asset types:', e)
      setLoadFailed(true)
    }
  }, 10000)

  if (assetTypes === undefined) {
    return loadFailed ? <LoadFailed /> : <Loading />
  }

  return (
    <div>
      <AssetTypeList assetTypes={assetTypes} />
    </div>
  )
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

window.createAssetTypeList = createAssetTypeList
