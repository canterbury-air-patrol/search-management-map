import '../../page-shell'
import { ChangeEvent, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button } from 'react-bootstrap'

import { formatLocalDateTime } from '../../format'
import { smmGetJSON, smmPost } from '../../ajax'
import { SMMTopBar } from '../../menu/topbar'
import { usePolling } from '../../hooks/usePolling'

interface MissionAssetStatusValue {
  id: number
  name: string
}

interface MissionAssetStatusData {
  status: string
  status_description: string
  notes: string
  since: string
}

interface MissionAssetStatusFormProps {
  asset: number
  mission: number
}

function MissionAssetStatusForm({ asset, mission }: MissionAssetStatusFormProps) {
  const [statusValues, setStatusValues] = useState<MissionAssetStatusValue[]>([])
  const [selectedValueId, setSelectedValueId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')

  usePolling(async () => {
    const data = await smmGetJSON<{ values: MissionAssetStatusValue[] }>('/mission/asset/status/values/', {})
    setStatusValues(data.values)
    setSelectedValueId((prev) => (prev === undefined && data.values.length > 0 ? data.values[0].id : prev))
  }, 10000)

  async function setStatus() {
    await smmPost(`/mission/${mission}/assets/${asset}/status/`, {
      value_id: selectedValueId,
      notes
    })
    setSelectedValueId(undefined)
    setNotes('')
  }

  return (
    <tr>
      <td>
        <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedValueId(Number(e.target.value))} value={selectedValueId ?? ''}>
          {statusValues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </td>
      <td></td>
      <td>
        <textarea onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} value={notes}></textarea>
      </td>
      <td>
        <Button onClick={setStatus}>Set Status</Button>
      </td>
    </tr>
  )
}

interface MissionAssetStatusProps {
  asset: number
  mission: number
}

function MissionAssetStatus({ asset, mission }: MissionAssetStatusProps) {
  const [statusData, setStatusData] = useState<MissionAssetStatusData | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ status: MissionAssetStatusData }>(`/mission/${mission}/assets/${asset}/status/`, {})
    setStatusData(data.status)
  }, 10000)

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th scope="col">Mission Status</th>
            <th scope="col">Description</th>
            <th scope="col">Notes</th>
            <th scope="col">Since</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{statusData?.status}</td>
            <td>{statusData?.status_description}</td>
            <td>{statusData?.notes}</td>
            <td>{formatLocalDateTime(statusData?.since)}</td>
          </tr>
          <MissionAssetStatusForm asset={asset} mission={mission} />
        </tbody>
      </Table>
    </div>
  )
}

function createMissionAssetStatus(elementId: string, asset: number, mission: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMTopBar />
      <MissionAssetStatus asset={asset} mission={mission} />
    </>
  )
}

export { MissionAssetStatus }

window.createMissionAssetStatus = createMissionAssetStatus
