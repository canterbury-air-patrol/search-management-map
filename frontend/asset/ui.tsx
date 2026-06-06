import '../page-shell'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button } from 'react-bootstrap'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { MissionAssetStatus } from '../mission/asset/status'
import { usePolling } from '../hooks/usePolling'

import { AssetCommandData, AssetFullStatusData, AssetMissionData, AssetStatusValueData } from './types'

interface AssetTrackAsProps {
  asset: number
}

function AssetTrackAs({ asset }: AssetTrackAsProps) {
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [altitude, setAltitude] = useState<number | null>(0)
  const [tracking, setTracking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const watchID = useRef<number | undefined>(undefined)

  function positionUpdate(position: GeolocationPosition) {
    if (watchID.current === undefined) return

    const coords = position.coords
    setLatitude(coords.latitude)
    setLongitude(coords.longitude)
    setAltitude(coords.altitude)

    smmPost(`/data/assets/${asset}/position/add/`, {
      lat: coords.latitude,
      lon: coords.longitude,
      alt: coords.altitude,
      heading: coords.heading
    })
  }

  function positionErrorHandler(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErrorMsg('No permission given to access location')
        break
      case error.POSITION_UNAVAILABLE:
        setErrorMsg('Unable to get the current position')
        break
      case error.TIMEOUT:
        setErrorMsg('Timed out getting position')
        break
      default:
        setErrorMsg(`Unknown error: ${error.code}`)
    }
  }

  function enableTracking() {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by this browser')
      return
    }
    watchID.current = navigator.geolocation.watchPosition(positionUpdate, positionErrorHandler, {
      timeout: 15000,
      maximumAge: 1000,
      enableHighAccuracy: true
    })
    setTracking(true)
    setErrorMsg('')
  }

  function disableTracking() {
    if (watchID.current !== undefined) {
      navigator.geolocation.clearWatch(watchID.current)
      watchID.current = undefined
    }
    setTracking(false)
  }

  useEffect(() => {
    return () => {
      if (watchID.current !== undefined) {
        navigator.geolocation.clearWatch(watchID.current)
        watchID.current = undefined
      }
    }
  }, [])

  return (
    <Table responsive>
      <thead>
        <tr>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Altitude</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{degreesToDM(latitude, 'lat')}</td>
          <td>{degreesToDM(longitude, 'lon')}</td>
          <td>{altitude}</td>
        </tr>
        <tr>
          <td colSpan={3}>
            <Button onClick={tracking ? disableTracking : enableTracking}>{tracking ? 'Disable Tracking' : 'Enable Tracking'}</Button>
          </td>
        </tr>
        {errorMsg && (
          <tr>
            <td colSpan={3}>{errorMsg}</td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}

interface AssetCommandViewProps {
  asset: number
  lastCommand?: AssetCommandData
}

function AssetCommandView({ asset, lastCommand }: AssetCommandViewProps) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState('Accepted')

  function submitResponse() {
    if (lastCommand !== undefined) {
      smmPost(`/assets/${asset}/command/`, {
        command_id: lastCommand.id,
        message,
        type
      })
    }
  }

  const responseData = []
  const response = lastCommand?.response
  if (response) {
    if (response.set != null) {
      responseData.push(
        <tr key="response">
          <td>
            <i>{response.type}</i>
          </td>
          <td>At: {formatLocalDateTime(response.set)}</td>
          <td>By: {response.by}</td>
        </tr>
      )
      responseData.push(
        <tr key="message">
          <td>Message:</td>
          <td colSpan={2}>{response.message}</td>
        </tr>
      )
    } else {
      responseData.push(
        <tr key="response_form">
          <td>
            Response:
            <br />
            <select onChange={(e) => setType(e.target.value)} value={type}>
              <option value="Accepted">Accept</option>
              <option value="More Info">More Info</option>
              <option value="Unable">Unable</option>
            </select>
          </td>
          <td>
            Message:
            <br /> <input type="text" onChange={(e) => setMessage(e.target.value)}></input>
          </td>
          <td>
            <Button onClick={submitResponse}>Respond</Button>
          </td>
        </tr>
      )
    }
  }

  const gotoRow = []
  if (lastCommand?.latitude || lastCommand?.longitude) {
    gotoRow.push(
      <tr key="goto_pos">
        <td>
          <b>{lastCommand.latitude ? degreesToDM(lastCommand.latitude, 'lat') : ''}</b>
        </td>
        <td>
          <b>{lastCommand.longitude ? degreesToDM(lastCommand.longitude, 'lon') : ''}</b>
        </td>
        <td></td>
      </tr>
    )
  }

  return (
    <Table responsive>
      <tbody>
        <tr>
          <td>
            <b>{lastCommand?.action_txt}</b>
          </td>
          <td>Issued: {formatLocalDateTime(lastCommand?.issued)}</td>
          <td>By: {lastCommand?.issued_by}</td>
        </tr>
        {gotoRow}
        <tr>
          <td>Message:</td>
          <td colSpan={2}>{lastCommand?.reason}</td>
        </tr>
        {responseData}
      </tbody>
    </Table>
  )
}

interface AssetMissionDetailsProps {
  details?: AssetFullStatusData
  /** Called after the user begins or finishes a search so the parent
   *  refetches asset state without waiting for the next 10s poll. */
  onAction?: () => void
}

function CurrentSearchRow({ details, onAction }: { details: AssetFullStatusData; onAction?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function markComplete() {
    setBusy(true)
    setError(null)
    try {
      await smmPost(`/search/${details.current_search_id}/finished/`, { asset_id: details.asset_id })
      onAction?.()
    } catch (e) {
      console.error('Failed to mark search as completed:', e)
      setError('Failed - try again')
    } finally {
      setBusy(false)
    }
  }

  if (Number.isInteger(details.current_search_id)) {
    return (
      <tr key="current_search">
        <td>Current Search</td>
        <td>({details.current_search_id})</td>
        <td>
          <Button href={`/search/${details.current_search_id}/`}>Details</Button>
        </td>
        <td>
          <Button onClick={markComplete} disabled={busy}>
            Mark as Completed
          </Button>
          {error && <span className="text-danger ms-2">{error}</span>}
        </td>
      </tr>
    )
  }
  return (
    <tr key="current_search">
      <td>Current Search</td>
      <td>
        <b>None</b>
      </td>
      <td></td>
      <td></td>
    </tr>
  )
}

function QueuedSearchRow({ details, onAction }: { details: AssetFullStatusData; onAction?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function begin() {
    setBusy(true)
    setError(null)
    try {
      await smmPost(`/search/${details.queued_search_id}/begin/`, { asset_id: details.asset_id })
      onAction?.()
    } catch (e) {
      console.error('Failed to begin search:', e)
      setError('Failed - try again')
    } finally {
      setBusy(false)
    }
  }

  const data = [<td key="title">Queued Search</td>, <td key="id">{details.queued_search_id}</td>]
  if (details.queued_search_id) {
    data.push(
      <td key="details">
        <Button href={`/search/${details.queued_search_id}/`}>Details</Button>
      </td>
    )
    if (!Number.isInteger(details.current_search_id)) {
      data.push(
        <td key="begin">
          <Button onClick={begin} disabled={busy}>
            Begin Search
          </Button>
          {error && <span className="text-danger ms-2">{error}</span>}
        </td>
      )
    } else {
      data.push(<td key="no_begin"></td>)
    }
    return <tr key={`queued_search_${details.queued_search_id}`}>{data}</tr>
  }
  return (
    <tr key="queued_search_none">
      <td>Queued Search</td>
      <td>
        <b>None</b>
      </td>
      <td></td>
      <td></td>
    </tr>
  )
}

function AssetMissionDetails({ details, onAction }: AssetMissionDetailsProps) {
  const rows = []

  if (details?.mission_id) {
    rows.push(
      <tr key="current_mission">
        <td>Current Mission</td>
        <td>{details.mission_name}</td>
        <td>
          <Button href={`/mission/${details.mission_id}/details/`}>Details</Button>
        </td>
        <td>
          <Button href={`/mission/${details.mission_id}/map/`}>Map</Button>
        </td>
      </tr>
    )
    rows.push(<CurrentSearchRow key="current_search" details={details} onAction={onAction} />)
    rows.push(<QueuedSearchRow key="queued_search" details={details} onAction={onAction} />)
  } else {
    rows.push(
      <tr key="current_mission">
        <td>Current Mission</td>
        <td>
          <b>None</b>
        </td>
        <td></td>
        <td></td>
      </tr>
    )
  }

  return (
    <Table responsive>
      <tbody>{rows}</tbody>
    </Table>
  )
}

interface AssetStatusProps {
  asset: number
  details?: AssetFullStatusData
}

function AssetStatus({ asset, details }: AssetStatusProps) {
  const [statusValues, setStatusValues] = useState<AssetStatusValueData[]>([])
  const [selectedValueId, setSelectedValueId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')

  usePolling(async () => {
    const data = await smmGetJSON<{ values: AssetStatusValueData[] }>('/assets/status/values/', {})
    setStatusValues(data.values)
    setSelectedValueId((prev) => prev ?? data.values[0]?.id)
  }, 10000)

  async function setStatus() {
    await smmPost(`/assets/${asset}/status/`, {
      value_id: selectedValueId,
      notes
    })
    setNotes('')
  }

  const rows = []
  if (details?.status) {
    rows.push(
      <tr key="status_name">
        <td>Status:</td>
        <td>{details.status.status}</td>
        <td>Since:</td>
        <td>{formatLocalDateTime(details.status.since)}</td>
      </tr>
    )
    rows.push(
      <tr key="status_notes">
        <td>Status Notes:</td>
        <td colSpan={3}>{details.status.notes}</td>
      </tr>
    )
  }
  return (
    <Table responsive>
      <tbody>
        {rows}
        <tr>
          <td>Status:</td>
          <td>
            <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedValueId(Number(e.target.value))} value={selectedValueId ?? ''}>
              {statusValues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <Button onClick={setStatus}>Set Status</Button>
          </td>
        </tr>
        <tr>
          <td>Notes:</td>
          <td colSpan={2}>
            <textarea onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} value={notes}></textarea>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

interface AssetUIProps {
  asset: number
}

/** Polls /assets/<id>/ + /assets/<id>/mission/ every 10s and returns the
 *  merged state plus the most-recent last_command. The returned refetch
 *  callback re-runs the same fetch immediately - useful after an action
 *  (begin/finish a search, set status, ...) so the UI doesn't wait up to
 *  10s for the next poll. Used by AssetUI and RadioOperatorAsset. */
export function useAssetData(asset: number) {
  const [details, setDetails] = useState<AssetFullStatusData | undefined>(undefined)
  const [lastCommand, setLastCommand] = useState<AssetCommandData | undefined>(undefined)

  const refetch = useCallback(async () => {
    const [assetData, missionData] = await Promise.all([
      smmGetJSON(`/assets/${asset}/`) as Promise<AssetFullStatusData>,
      (smmGetJSON(`/assets/${asset}/mission/`) as Promise<AssetMissionData>).catch(() => ({}) as AssetMissionData)
    ])
    const merged: AssetFullStatusData = { ...assetData, ...missionData }
    setDetails(merged)
    if (merged.last_command) {
      setLastCommand(merged.last_command)
    }
  }, [asset])

  usePolling(refetch, 10000)

  return { details, lastCommand, refetch }
}

function AssetUI({ asset }: AssetUIProps) {
  const { details, lastCommand, refetch } = useAssetData(asset)

  let missionStatus
  if (details?.mission_id !== undefined) {
    missionStatus = <MissionAssetStatus mission={details.mission_id} asset={asset} />
  }

  return (
    <div>
      <div style={{ fontWeight: 'bold', textAlign: 'center' }} className="bg-info">
        {details?.name}
      </div>
      <AssetMissionDetails details={details} onAction={refetch} />
      <AssetCommandView lastCommand={lastCommand} asset={asset} />
      {missionStatus}
      <AssetTrackAs asset={asset} />
      <AssetStatus asset={asset} details={details} />
    </div>
  )
}

function createAssetUI(elementId: string, assetId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMTopBar />
      <AssetUI asset={assetId} />
    </>
  )
}

window.createAssetUI = createAssetUI

export { AssetCommandView, AssetMissionDetails, AssetUI }
