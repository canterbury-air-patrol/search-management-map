import { formatLocalDateTime } from '../format'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGet, smmGetJSON, smmPost } from '../ajax'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMTopBar } from '../menu/topbar'
import { MissionAssetStatus } from '../mission/asset/status'

import { AssetCommandData, AssetFullStatusData, AssetMissionData, AssetStatusValueData } from './types'

interface AssetTrackAsProps {
  asset: number
}

interface AssetTrackAsState {
  latitude: number
  longitude: number
  altitude: number | null
  tracking: boolean
  errorMsg: string
}

class AssetTrackAs extends React.Component<AssetTrackAsProps, AssetTrackAsState> {
  watchID?: number

  constructor(props: AssetTrackAsProps) {
    super(props)

    this.state = {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      tracking: false,
      errorMsg: ''
    }

    this.enableTracking = this.enableTracking.bind(this)
    this.disableTracking = this.disableTracking.bind(this)
    this.positionUpdate = this.positionUpdate.bind(this)
    this.positionErrorHandler = this.positionErrorHandler.bind(this)
  }

  positionUpdate(position: GeolocationPosition) {
    if (this.watchID === undefined) {
      return
    }

    const { latitude, longitude, altitude } = position.coords
    const newHeading = position.coords.heading

    this.setState({
      latitude,
      longitude,
      altitude
    })

    smmGet(`/data/assets/${this.props.asset}/position/add/`, {
      lat: latitude,
      lon: longitude,
      alt: altitude,
      heading: newHeading
    })
  }

  positionErrorHandler(error: GeolocationPositionError) {
    let errorMsg
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMsg = 'No permission given to access location'
        break
      case error.POSITION_UNAVAILABLE:
        errorMsg = 'Unable to get the current position'
        break
      case error.TIMEOUT:
        errorMsg = 'Timed out getting position'
        break
      default:
        errorMsg = `Unknown error: ${error.code}`
        break
    }
    this.setState({ errorMsg })
  }

  enableTracking() {
    if (!navigator.geolocation) {
      this.setState({ errorMsg: 'Geolocation is not supported by this browser' })
      return
    }
    const options = {
      timeout: 15000,
      maximumAge: 1000,
      enableHighAccuracy: true
    }
    this.watchID = navigator.geolocation.watchPosition(this.positionUpdate, this.positionErrorHandler, options)
    this.setState({ tracking: true, errorMsg: '' })
  }

  disableTracking() {
    if (this.watchID !== undefined) {
      navigator.geolocation.clearWatch(this.watchID)
      this.watchID = undefined
    }
    this.setState({ tracking: false })
  }

  render() {
    return (
      <Table responsive>
        <thead>
          <tr>
            <td>Latitude</td>
            <td>Longitude</td>
            <td>Altitude</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{degreesToDM(this.state.latitude, 'lat')}</td>
            <td>{degreesToDM(this.state.longitude, 'lon')}</td>
            <td>{this.state.altitude}</td>
          </tr>
          <tr>
            <td colSpan={3}>
              <Button onClick={this.state.tracking ? this.disableTracking : this.enableTracking}>{this.state.tracking ? 'Disable Tracking' : 'Enable Tracking'}</Button>
            </td>
          </tr>
          {this.state.errorMsg && (
            <tr>
              <td colSpan={3}>{this.state.errorMsg}</td>
            </tr>
          )}
        </tbody>
      </Table>
    )
  }
}

interface AssetCommandViewProps {
  asset: number
  lastCommand?: AssetCommandData
}

interface AssetCommandViewState {
  message: string
  type: string
}

class AssetCommandView extends React.Component<AssetCommandViewProps, AssetCommandViewState> {
  constructor(props: AssetCommandViewProps) {
    super(props)

    this.state = {
      message: '',
      type: 'Accepted'
    }

    this.updateSelectedType = this.updateSelectedType.bind(this)
    this.updateMessage = this.updateMessage.bind(this)
    this.submitResponse = this.submitResponse.bind(this)
  }

  updateSelectedType(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target

    this.setState({ type: value })
  }

  updateMessage(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target

    this.setState({ message: value })
  }

  submitResponse() {
    if (this.props.lastCommand !== undefined) {
      smmPost(`/assets/${this.props.asset}/command/`, {
        command_id: this.props.lastCommand.id,
        message: this.state.message,
        type: this.state.type
      })
    }
  }

  render() {
    const responseData = []
    const response = this.props.lastCommand?.response
    if (response) {
      if (response.set) {
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
              <select onChange={this.updateSelectedType} defaultValue={this.state.type}>
                <option value="Accepted">Accept</option>
                <option value="More Info">More Info</option>
                <option value="Unable">Unable</option>
              </select>
            </td>
            <td>
              Message:
              <br /> <input type="text" onChange={this.updateMessage}></input>
            </td>
            <td>
              <Button onClick={this.submitResponse}>Respond</Button>
            </td>
          </tr>
        )
      }
    }
    const gotoRow = []
    if (this.props.lastCommand?.latitude || this.props.lastCommand?.longitude) {
      gotoRow.push(
        <tr key="goto_pos">
          <td>
            <b>{this.props.lastCommand.latitude ? degreesToDM(this.props.lastCommand.latitude, 'lat') : ''}</b>
          </td>
          <td>
            <b>{this.props.lastCommand.longitude ? degreesToDM(this.props.lastCommand.longitude, 'lon') : ''}</b>
          </td>
          <td></td>
        </tr>
      )
    }

    return (
      <Table responsive>
        <thead>
          <tr>
            <td>
              <b>{this.props.lastCommand?.action_txt}</b>
            </td>
            <td>Issued: {formatLocalDateTime(this.props.lastCommand?.issued)}</td>
            <td>By: {this.props.lastCommand?.issued_by}</td>
          </tr>
          {gotoRow}
          <tr>
            <td>Message:</td>
            <td colSpan={2}>{this.props.lastCommand?.reason}</td>
          </tr>
          {responseData}
        </thead>
      </Table>
    )
  }
}

interface AssetMissionDetailsProps {
  details?: AssetFullStatusData
}

class AssetMissionDetails extends React.Component<AssetMissionDetailsProps, never> {
  currentSearchRow(details: AssetFullStatusData) {
    if (Number.isInteger(details.current_search_id)) {
      return (
        <tr key="current_search">
          <td>Current Search</td>
          <td>({details.current_search_id})</td>
          <td>
            <Button href={`/search/${details.current_search_id}/`}>Details</Button>
          </td>
          <td>
            <Button
              onClick={function () {
                smmGet(`/search/${details.current_search_id}/finished/?asset_id=${details.asset_id}`)
              }}
            >
              Mark as Completed
            </Button>
          </td>
        </tr>
      )
    } else {
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
  }

  queuedSearchRow(details?: AssetFullStatusData) {
    const data = [<td key="title">Queued Search</td>, <td key="id">{details?.queued_search_id}</td>]
    if (details?.queued_search_id) {
      data.push(
        <td key="details">
          <Button href={`/search/${details.queued_search_id}/`}>Details</Button>
        </td>
      )
      if (details.current_search_id === undefined) {
        data.push(
          <td key="begin">
            <Button
              onClick={function () {
                smmGet(`/search/${details.queued_search_id}/begin/?asset_id=${details.asset_id}`)
              }}
            >
              Begin Search
            </Button>
          </td>
        )
      } else {
        data.push(<td key="no_begin"></td>)
      }
      return <tr key={`queued_search_${details.queued_search_id}`}>{data}</tr>
    } else {
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
  }

  render() {
    const { details } = this.props
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
      rows.push(this.currentSearchRow(details))
      rows.push(this.queuedSearchRow(details))
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
}

interface AssetStatusProps {
  asset: number
  details?: AssetFullStatusData
}

interface AssetStatusState {
  statusValues: AssetStatusValueData[]
  selectedValueId?: number
  notes?: string
}

class AssetStatus extends React.Component<AssetStatusProps, AssetStatusState> {
  timer?: number

  constructor(props: AssetStatusProps) {
    super(props)

    this.state = {
      statusValues: [],
      selectedValueId: undefined,
      notes: ''
    }

    this.updateSelectedStateValue = this.updateSelectedStateValue.bind(this)
    this.updateNotes = this.updateNotes.bind(this)
    this.resetForm = this.resetForm.bind(this)
    this.setStatus = this.setStatus.bind(this)
  }

  componentDidMount() {
    this.updateStatusValues()
    this.timer = setInterval(() => this.updateStatusValues(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  async updateStatusValues() {
    const data = await smmGetJSON<{ values: AssetStatusValueData[] }>('/assets/status/values/', {})
    this.setState((oldState) => ({
      statusValues: data.values,
      ...(oldState.selectedValueId === undefined && data.values.length > 0 ? { selectedValueId: data.values[0].id } : {})
    }))
  }

  updateSelectedStateValue(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target

    this.setState({ selectedValueId: Number(value) })
  }

  updateNotes(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const { value } = event.target

    this.setState({ notes: value })
  }

  resetForm() {
    this.setState({
      selectedValueId: undefined,
      notes: ''
    })
  }

  async setStatus() {
    await smmPost(`/assets/${this.props.asset}/status/`, {
      value_id: this.state.selectedValueId,
      notes: this.state.notes
    })
    this.resetForm()
  }

  render() {
    const details = this.props.details

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
    const statusValues = this.state.statusValues.map((v) => (
      <option key={v.id} value={v.id}>
        {v.name}
      </option>
    ))
    return (
      <Table responsive>
        <thead>
          {rows}
          <tr>
            <td>Status:</td>
            <td>
              <select onChange={this.updateSelectedStateValue} defaultValue={this.state.selectedValueId}>
                {statusValues}
              </select>
            </td>
            <td>
              <Button onClick={this.setStatus}>Set Status</Button>
            </td>
          </tr>
          <tr>
            <td>Notes:</td>
            <td colSpan={2}>
              <textarea onChange={this.updateNotes} value={this.state.notes}></textarea>
            </td>
          </tr>
          <tr></tr>
        </thead>
      </Table>
    )
  }
}

interface AssetUIProps {
  asset: number
}

interface AssetUIState {
  lastCommand?: AssetCommandData
  details?: AssetFullStatusData
}

class AssetUI extends React.Component<AssetUIProps, AssetUIState> {
  timer?: number
  constructor(props: AssetUIProps) {
    super(props)

    this.state = {
      lastCommand: undefined,
      details: undefined
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  currentCommand(data: AssetCommandData) {
    this.setState({
      lastCommand: data
    })
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: AssetFullStatusData) {
    this.setState({
      details: data
    })
    if (data.last_command) {
      this.currentCommand(data.last_command)
    }
  }

  async updateData() {
    const [assetData, missionData] = await Promise.all([
      smmGetJSON(`/assets/${this.props.asset}/`) as Promise<AssetFullStatusData>,
      (smmGetJSON(`/assets/${this.props.asset}/mission/`) as Promise<AssetMissionData>).catch(() => ({}) as AssetMissionData)
    ])
    this.updateDataResponse({ ...assetData, ...missionData })
  }

  render() {
    let missionStatus
    if (this.state.details?.mission_id !== undefined) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} />
    }
    return (
      <div>
        <div style={{ fontWeight: 'bold', textAlign: 'center' }} className="bg-info">
          {this.state.details?.name}
        </div>
        <AssetMissionDetails details={this.state.details} />
        <AssetCommandView lastCommand={this.state.lastCommand} asset={this.props.asset} />
        {missionStatus}
        <AssetTrackAs asset={this.props.asset} />
        <AssetStatus asset={this.props.asset} details={this.state.details} />
      </div>
    )
  }
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
