import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { smmGet, smmGetJSON, smmPost } from '../ajax'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMTopBar } from '../menu/topbar'
import { MissionAssetStatus } from '../mission/asset/status'

import { AssetCommandData, AssetFullStatusData, AssetStatusValueData } from './types'

interface AssetTrackAsProps {
  asset: number
}

interface AssetTrackAsState {
  latitude: number
  longitude: number
  altitude: number | null
  tracking: boolean
}

class AssetTrackAs extends React.Component<AssetTrackAsProps, AssetTrackAsState> {
  watchID: number
  errorMsg: string

  constructor(props: AssetTrackAsProps) {
    super(props)

    this.state = {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      tracking: false
    }

    this.watchID = 0
    this.errorMsg = ''

    this.enableTracking = this.enableTracking.bind(this)
    this.disableTracking = this.disableTracking.bind(this)
    this.positionUpdate = this.positionUpdate.bind(this)
    this.positionErrorHandler = this.positionErrorHandler.bind(this)
  }

  positionUpdate(position: GeolocationPosition) {
    const { latitude, longitude, altitude } = position.coords
    const newHeading = position.coords.heading

    const data = {
      lat: latitude,
      lon: longitude,
      alt: altitude,
      heading: newHeading
    }

    this.setState({
      latitude,
      longitude,
      altitude
    })

    if (this.state.tracking) {
      smmGet(`/data/assets/${this.props.asset}/position/add/`, data)
    }
  }

  positionErrorHandler(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.errorMsg = 'No permision given to access location'
        break
      case error.POSITION_UNAVAILABLE:
        this.errorMsg = 'Unable to get the current position'
        break
      case error.TIMEOUT:
        this.errorMsg = 'Timed out getting position'
        break
      default:
        this.errorMsg = `Unknown error: ${error.code}`
        break
    }
  }

  enableTracking() {
    if (navigator.geolocation) {
      const options = {
        timeout: 60000,
        enableHighAccuracy: true
      }
      this.watchID = navigator.geolocation.watchPosition(this.positionUpdate, this.positionErrorHandler, options)
    }

    this.setState(function () {
      return {
        tracking: true
      }
    })
  }

  disableTracking() {
    navigator.geolocation.clearWatch(this.watchID)
    this.setState(function () {
      return {
        tracking: false
      }
    })
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
            <td>{degreesToDM(this.state.latitude, true)}</td>
            <td>{degreesToDM(this.state.longitude, false)}</td>
            <td>{this.state.altitude}</td>
          </tr>
          <tr>
            <td colSpan={3}>
              <Button onClick={this.state.tracking ? this.disableTracking : this.enableTracking}>{this.state.tracking ? 'Disable Tracking' : 'Enable Tracking'}</Button>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>{this.errorMsg}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}

interface AssetCommandViewProps {
  asset: number
  lastCommand?: AssetCommandData
  csrftoken: string
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
    if (this.props.lastCommand?.response !== undefined) {
      if (this.props.lastCommand.response.set !== null) {
        responseData.push(
          <tr key="response">
            <td>
              <i>{this.props.lastCommand.response.type}</i>
            </td>
            <td>At: {this.props.lastCommand.response.set !== undefined ? new Date(this.props.lastCommand.response.set).toLocaleString() : ''}</td>
            <td>By: {this.props.lastCommand.response.by}</td>
          </tr>
        )
        responseData.push(
          <tr key="message">
            <td>Message:</td>
            <td colSpan={2}>{this.props.lastCommand.response.message}</td>
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
            <b>{this.props.lastCommand.latitude ? degreesToDM(this.props.lastCommand.latitude, true) : ''}</b>
          </td>
          <td>
            <b>{this.props.lastCommand.longitude ? degreesToDM(this.props.lastCommand.longitude, false) : ''}</b>
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
            <td>Issued: {this.props.lastCommand?.issued === undefined ? '' : new Date(this.props.lastCommand.issued).toLocaleString()}</td>
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
  csrftoken: string
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

    this.updateStatusValuesResponse = this.updateStatusValuesResponse.bind(this)
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

  updateStatusValuesResponse(data: { values: AssetStatusValueData[] }) {
    this.setState(function (oldState) {
      const newState: AssetStatusState = {
        statusValues: data.values
      }
      if (oldState.selectedValueId === null && data.values.length > 0) {
        newState.selectedValueId = data.values[0].id
      }
      return newState
    })
  }

  async updateStatusValues() {
    await smmGet('/assets/status/values/', {}, this.updateStatusValuesResponse)
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

  setStatus() {
    smmPost(
      `/assets/${this.props.asset}/status/`,
      {
        value_id: this.state.selectedValueId,
        notes: this.state.notes
      },
      this.resetForm
    )
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
          <td>{details.status.since === undefined ? '' : new Date(details.status.since).toLocaleString()}</td>
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
  csrftoken: string
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
    await smmGetJSON(`/assets/${this.props.asset}/`, {}, this.updateDataResponse)
  }

  render() {
    let missionStatus
    if (this.state.details?.mission_id !== undefined) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} csrftoken={this.props.csrftoken} />
    }
    return (
      <div>
        <div style={{ fontWeight: 'bold', textAlign: 'center' }} className="bg-info">
          {this.state.details?.name}
        </div>
        <AssetMissionDetails details={this.state.details} />
        <AssetCommandView lastCommand={this.state.lastCommand} asset={this.props.asset} csrftoken={this.props.csrftoken} />
        {missionStatus}
        <AssetTrackAs asset={this.props.asset} />
        <AssetStatus asset={this.props.asset} csrftoken={this.props.csrftoken} details={this.state.details} />
      </div>
    )
  }
}

function createAssetUI(elementId: string, assetId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMTopBar />
      <AssetUI asset={assetId} csrftoken={csrftoken as string} />
    </>
  )
}

// @ts-expect-error: globalThis doesn't have a define
globalThis.createAssetUI = createAssetUI

export { AssetCommandView, AssetMissionDetails, AssetUI }
