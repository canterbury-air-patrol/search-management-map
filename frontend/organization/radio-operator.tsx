import '../page-shell'
import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table } from 'react-bootstrap'

import { smmGetJSON } from '../ajax'
import { AssetCommandView, AssetMissionDetails, useAssetData } from '../asset/ui'
import { MissionAssetStatus } from '../mission/asset/status'
import { SMMOrganizationTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { OrganizationAssetData } from './types'

function RadioOperatorAsset({ asset }: { asset: number }) {
  const { details, lastCommand, refetch } = useAssetData(asset)

  let missionStatus
  if (details && details.mission_id) {
    missionStatus = <MissionAssetStatus mission={details.mission_id} asset={asset} />
  }
  return (
    <>
      <thead>
        <tr>
          <td colSpan={2} align="center" style={{ fontWeight: 'bold' }} className="bg-info">
            {details?.name} ({details?.asset_type})
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <AssetMissionDetails details={details} onAction={refetch} />
          </td>
          <td>
            <AssetCommandView asset={asset} lastCommand={lastCommand} />
            {missionStatus}
          </td>
        </tr>
      </tbody>
    </>
  )
}

function OrganizationRadioOperatorPage({ organizationId }: { organizationId: number }) {
  const [assets, setAssets] = useState<OrganizationAssetData[]>([])

  usePolling(async () => {
    const data = await smmGetJSON<{ assets: OrganizationAssetData[] }>(`/organization/${organizationId}/`, {})
    setAssets(data.assets)
  }, 10000)

  return (
    <Table responsive>
      {assets.map((asset) => (
        <RadioOperatorAsset key={asset.id} asset={asset.asset.id} />
      ))}
    </Table>
  )
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
