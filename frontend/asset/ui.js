import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMTopBar } from '../menu/topbar'
import { MissionAssetStatus } from '../mission/asset/status'

class AssetTrackAs extends React.Component {
  constructor(props) {
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

  positionUpdate(position) {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    const altitude = position.coords.altitude
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
      $.get(`/data/assets/${this.props.asset}/position/add/`, data)
    }
  }

  positionErrorHandler(error) {
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
            <td colSpan="3">
              <Button onClick={this.state.tracking ? this.disableTracking : this.enableTracking}>{this.state.tracking ? 'Disable Tracking' : 'Enable Tracking'}</Button>
            </td>
          </tr>
          <tr>
            <td colSpan="3">{this.errorMsg}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
AssetTrackAs.propTypes = {
  asset: PropTypes.string.isRequired
}

class AssetCommandView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      message: '',
      type: 'Accepted'
    }

    this.updateSelectedType = this.updateSelectedType.bind(this)
    this.updateMessage = this.updateMessage.bind(this)
    this.submitResponse = this.submitResponse.bind(this)
  }

  updateSelectedType(event) {
    const target = event.target
    const value = target.value

    this.setState({ type: value })
  }

  updateMessage(event) {
    const target = event.target
    const value = target.value

    this.setState({ message: value })
  }

  submitResponse() {
    $.post(`/assets/${this.props.asset}/command/`, {
      command_id: this.props.lastCommand.id,
      message: this.state.message,
      type: this.state.type,
      csrfmiddlewaretoken: this.props.csrftoken
    })
  }

  render() {
    const responseData = []
    if (this.props.lastCommand.response !== undefined) {
      if (this.props.lastCommand.response.set !== null) {
        responseData.push(
          <tr key="response">
            <td>
              <i>{this.props.lastCommand.response.type}</i>
            </td>
            <td>At: {new Date(this.props.lastCommand.response.set).toLocaleString()}</td>
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
    if (this.props.lastCommand.latitude || this.props.lastCommand.longitude) {
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
              <b>{this.props.lastCommand.action_txt}</b>
            </td>
            <td>Issued: {this.props.lastCommand.issued === undefined ? '' : new Date(this.props.lastCommand.issued).toLocaleString()}</td>
            <td>By: {this.props.lastCommand.issued_by}</td>
          </tr>
          {gotoRow}
          <tr>
            <td>Message:</td>
            <td colSpan={2}>{this.props.lastCommand.reason}</td>
          </tr>
          {responseData}
        </thead>
      </Table>
    )
  }
}
AssetCommandView.propTypes = {
  lastCommand: PropTypes.object.isRequired,
  asset: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

class AssetMissionDetails extends React.Component {
  currentSearchRow(details) {
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
                $.get(`/search/${details.current_search_id}/finished/?asset_id=${details.asset_id}`)
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

  queuedSearchRow(details) {
    const data = [<td key="title">Queued Search</td>, <td key="id">{details.queued_search_id}</td>]
    if (Number.isInteger(details.queued_search_id)) {
      data.push(
        <td key="details">
          <Button href={`/search/${details.queued_search_id}/`}>Details</Button>
        </td>
      )
      if (!Number.isInteger(details.current_search_id)) {
        data.push(
          <td key="begin">
            <Button
              onClick={function () {
                $.get(`/search/${details.queued_search_id}/begin/?asset_id=${details.asset_id}`)
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
    const details = this.props.details
    const rows = []

    if (Number.isInteger(details.mission_id)) {
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
AssetMissionDetails.propTypes = {
  details: PropTypes.object.isRequired
}

class AssetStatus extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      statusValues: [],
      selectedValueId: null,
      notes: ''
    }

    this.updateStatusValuesResponse = this.updateStatusValuesResponse.bind(this)
    this.updateSelectedStateValue = this.updateSelectedStateValue.bind(this)
    this.updateNotes = this.updateNotes.bind(this)
    this.resetForm = this.resetForm.bind(this)
    this.setStatus = this.setStatus.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateStatusValues()
    this.timer = setInterval(() => this.updateStatusValues(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateStatusValuesResponse(data) {
    this.setState(function (oldState) {
      const newState = {
        statusValues: data.values
      }
      if (oldState.selectedValueId === null && data.values.length > 0) {
        newState.selectedValueId = data.values[0].id
      }
      return newState
    })
  }

  async updateStatusValues() {
    await $.get('/assets/status/values/', this.updateStatusValuesResponse)
  }

  updateSelectedStateValue(event) {
    const target = event.target
    const value = target.value

    this.setState({ selectedValueId: value })
  }

  updateNotes(event) {
    const target = event.target
    const value = target.value

    this.setState({ notesText: value })
  }

  resetForm() {
    this.setState({
      selectedValueId: null,
      notesText: ''
    })
  }

  setStatus() {
    $.post(
      `/assets/${this.props.asset}/status/`,
      {
        value_id: this.state.selectedValueId,
        notes: this.state.notesText,
        csrfmiddlewaretoken: this.props.csrftoken
      },
      this.resetForm
    )
  }

  render() {
    const details = this.props.details

    const rows = []
    if (details.status) {
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
              <textarea onChange={this.updateNotes} value={this.state.notesText}></textarea>
            </td>
          </tr>
          <tr></tr>
        </thead>
      </Table>
    )
  }
}
AssetStatus.propTypes = {
  asset: PropTypes.string.isRequired,
  csrftoken: PropTypes.string.isRequired,
  details: PropTypes.object.isRequired
}

class AssetUI extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      lastCommand: {},
      details: {
        name: props.asset
      }
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  currentCommand(data) {
    this.setState({
      lastCommand: data
    })
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

  updateDataResponse(data) {
    this.setState({
      details: data
    })
    if ('last_command' in data) {
      this.currentCommand(data.last_command)
    }
  }

  async updateData() {
    await $.getJSON(`/assets/${this.props.asset}/`, this.updateDataResponse)
  }

  render() {
    let missionStatus
    if (Number.isInteger(this.state.details.mission_id)) {
      missionStatus = <MissionAssetStatus mission={this.state.details.mission_id} asset={this.props.asset} csrftoken={this.props.csrftoken} />
    }
    return (
      <div>
        <div style={{ fontWeight: 'bold', textAlign: 'center' }} className="bg-info">
          {this.state.details.name}
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
AssetUI.propTypes = {
  asset: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createAssetUI(elementId, assetId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMTopBar />
      <AssetUI asset={assetId} csrftoken={csrftoken} />
    </>
  )
}

globalThis.createAssetUI = createAssetUI

export { AssetCommandView, AssetMissionDetails, AssetUI }
