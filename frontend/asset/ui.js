import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

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
          <tr key="response_type">
            <td>Response:</td>
            <td>{this.props.lastCommand.response.type}</td>
          </tr>
        )
        responseData.push(
          <tr key="response_at">
            <td>At:</td>
            <td>{new Date(this.props.lastCommand.response.set).toLocaleString()}</td>
          </tr>
        )
        responseData.push(
          <tr key="response_by">
            <td>By:</td>
            <td>{this.props.lastCommand.response.by}</td>
          </tr>
        )
        responseData.push(
          <tr>
            <td>Message:</td>
            <td>{this.props.lastCommand.response.message}</td>
          </tr>
        )
      } else {
        responseData.push(
          <tr key="response_form_type">
            <td>Type:</td>
            <td>
              <select onChange={this.updateSelectedType} defaultValue={this.state.type}>
                <option value="Accepted">Accept</option>
                <option value="More Info">More Info</option>
                <option value="Unable">Unable</option>
              </select>
            </td>
          </tr>
        )
        responseData.push(
          <tr key="response_form_message">
            <td colSpan={2}>
              <textarea onChange={this.updateMessage}></textarea>
            </td>
          </tr>
        )
        responseData.push(
          <tr>
            <td colSpan={2}>
              <Button onClick={this.submitResponse}>Respond</Button>
            </td>
          </tr>
        )
      }
    }
    return (
      <Table responsive>
        <thead>
          <tr>
            <td>Issued:</td>
            <td>{this.props.lastCommand.issued === undefined ? '' : new Date(this.props.lastCommand.issued).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Instruction Type:</td>
            <td>{this.props.lastCommand.action_txt}</td>
          </tr>
          <tr>
            <td>Reason/Details:</td>
            <td>{this.props.lastCommand.reason}</td>
          </tr>
          <tr>
            <td>{this.props.lastCommand.latitude ? degreesToDM(this.props.lastCommand.latitude, true) : ''}</td>
            <td>{this.props.lastCommand.longitude ? degreesToDM(this.props.lastCommand.longitude, false) : ''}</td>
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

class AssetDetails extends React.Component {
  currentSearchRow(details) {
    if (Number.isInteger(details.current_search_id)) {
      return (
        <tr key="current_search">
          <td>Current Search</td>
          <td>
            ({details.current_search_id})
            <ButtonGroup>
              <Button href={`/search/${details.current_search_id}/`}>Details</Button>
              <Button
                onClick={function () {
                  $.get(`/search/${details.current_search_id}/finished/?asset_id=${details.asset_id}`)
                }}
              >
                Mark as Completed
              </Button>
            </ButtonGroup>
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
        </tr>
      )
    }
  }

  queuedSearchRow(details) {
    if (Number.isInteger(details.queued_search_id)) {
      const buttons = [
        <Button key="details" href={`/search/${details.queued_search_id}/`}>
          Details
        </Button>
      ]
      if (!Number.isInteger(details.current_search_id)) {
        buttons.push(
          <Button
            key="begin"
            onClick={function () {
              $.get(`/search/${details.queued_search_id}/begin/?asset_id=${details.asset_id}`)
            }}
          >
            Begin Search
          </Button>
        )
      }
      return (
        <tr key="queued_search">
          <td>Queued Search</td>
          <td>
            ({details.queued_search_id})<ButtonGroup>{buttons}</ButtonGroup>
          </td>
        </tr>
      )
    } else {
      return (
        <tr key="queued_search">
          <td>Queued Search</td>
          <td>
            <b>None</b>
          </td>
        </tr>
      )
    }
  }

  render() {
    const details = this.props.details
    const rows = [
      <tr key="asset_name">
        <td>Asset</td>
        <td>{details.name}</td>
      </tr>,
      <tr key="asset_type">
        <td>Type</td>
        <td>{details.asset_type}</td>
      </tr>,
      <tr key="asset_owner">
        <td>Owner</td>
        <td>{details.owner}</td>
      </tr>
    ]
    if (details.status) {
      rows.push(
        <tr key="status_name">
          <td>Status:</td>
          <td>{details.status.status}</td>
        </tr>
      )
      rows.push(
        <tr key="status_since">
          <td>Since:</td>
          <td>{details.status.since === undefined ? '' : new Date(details.status.since).toLocaleString()}</td>
        </tr>
      )
      rows.push(
        <tr key="status_notes">
          <td>Status Notes:</td>
          <td>{details.status.notes}</td>
        </tr>
      )
    }

    if (Number.isInteger(details.mission_id)) {
      rows.push(
        <tr key="current_mission">
          <td>Current Mission</td>
          <td>
            {details.mission_name} <Button href={`/mission/${details.mission_id}/details/`}>Details</Button>
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
AssetDetails.propTypes = {
  details: PropTypes.object.isRequired
}

class AssetStatusSet extends React.Component {
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
    this.timer = null
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
    const statusValues = this.state.statusValues.map((v) => (
      <option key={v.id} value={v.id}>
        {v.name}
      </option>
    ))
    return (
      <Table responsive>
        <thead>
          <tr>
            <td>Status:</td>
            <td>Notes:</td>
          </tr>
          <tr>
            <td>
              <select onChange={this.updateSelectedStateValue} defaultValue={this.state.selectedValueId}>
                {statusValues}
              </select>
            </td>
            <td colSpan={2}>
              <textarea onChange={this.updateNotes} value={this.state.notesText}></textarea>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <Button onClick={this.setStatus}>Set Status</Button>
            </td>
          </tr>
        </thead>
      </Table>
    )
  }
}
AssetStatusSet.propTypes = {
  asset: PropTypes.string.isRequired,
  csrftoken: PropTypes.string.isRequired
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
    this.timer = null
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
        <AssetDetails details={this.state.details} />
        <AssetCommandView lastCommand={this.state.lastCommand} asset={this.props.asset} csrftoken={this.props.csrftoken} />
        {missionStatus}
        <AssetTrackAs asset={this.props.asset} />
        <AssetStatusSet asset={this.props.asset} csrftoken={this.props.csrftoken} />
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

export { AssetCommandView, AssetDetails, AssetUI }
