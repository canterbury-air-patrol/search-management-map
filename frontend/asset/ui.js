import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMTopBar } from '../menu/topbar'

class AssetTrackAs extends React.Component {
  constructor (props) {
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

  positionUpdate (position) {
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

  positionErrorHandler (error) {
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

  enableTracking () {
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

  disableTracking () {
    navigator.geolocation.clearWatch(this.watchID)
    this.setState(function () {
      return {
        tracking: false
      }
    })
  }

  render () {
    return (
      <Table>
        <thead>
          <tr>
            <td>Latitude</td>
            <td>Longitude</td>
            <td>Altitude</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{ degreesToDM(this.state.latitude, true) }</td>
            <td>{ degreesToDM(this.state.longitude, false) }</td>
            <td>{ this.state.altitude }</td>
          </tr>
          <tr>
            <td colSpan='3'><Button onClick={ this.state.tracking ? this.disableTracking : this.enableTracking}>{ this.state.tracking ? 'Disable Tracking' : 'Enable Tracking' }</Button></td>
          </tr>
          <tr>
            <td colSpan='3'>{ this.errorMsg }</td>
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
  render () {
    return (
      <Table>
        <thead>
          <tr>
            <td>Issued:</td>
            <td>{this.props.lastCommand.issued === undefined ? '' : (new Date(this.props.lastCommand.issued)).toLocaleString()}</td>
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
        </thead>
      </Table>
    )
  }
}
AssetCommandView.propTypes = {
  lastCommand: PropTypes.object.isRequired
}

class AssetDetails extends React.Component {
  currentSearchRow (details) {
    if (Number.isInteger(details.current_search_id)) {
      return (
        <tr key='current_search'>
          <td>Current Search</td>
          <td>
            ({details.current_search_id})
            <ButtonGroup>
              <Button href={`/mission/${details.mission_id}/search/${details.current_search_id}/details/`}>Details</Button>
              <Button onClick={function () { $.get(`/search/${details.current_search_id}/finished/?asset_id=${details.asset_id}`) }}>Mark as Completed</Button>
            </ButtonGroup>
          </td>
        </tr>
      )
    } else {
      return (
        <tr key='current_search'>
          <td>Current Search</td>
          <td><b>None</b></td>
        </tr>
      )
    }
  }

  queuedSearchRow (details) {
    if (Number.isInteger(details.queued_search_id)) {
      const buttons = [(
        <Button key='details' href={`/mission/${details.mission_id}/search/${details.queued_search_id}/details/`}>Details</Button>)]
      if (!(Number.isInteger(details.current_search_id))) {
        buttons.push((
          <Button key='begin' onClick={function () { $.get(`/search/${details.queued_search_id}/begin/?asset_id=${details.asset_id}`) }}>Begin Search</Button>
        ))
      }
      return (
        <tr key='queued_search'>
          <td>Queued Search</td>
          <td>
            ({details.queued_search_id})
            <ButtonGroup>
              {buttons}
            </ButtonGroup>
          </td>
        </tr>
      )
    } else {
      return (
        <tr key='queued_search'>
          <td>Queued Search</td>
          <td><b>None</b></td>
        </tr>
      )
    }
  }

  render () {
    const details = this.props.details
    const rows = [
      (<tr key='asset_name'>
        <td>Asset</td>
        <td>{details.name}</td>
      </tr>),
      (<tr key='asset_type'>
        <td>Type</td>
        <td>{details.asset_type}</td>
      </tr>),
      (<tr key='asset_owner'>
        <td>Owner</td>
        <td>{details.owner}</td>
      </tr>)
    ]
    if (Number.isInteger(details.mission_id)) {
      rows.push((
          <tr key='current_mission'>
            <td>Current Mission</td>
            <td>{details.mission_name} <Button href={`/mission/${details.mission_id}/details/`}>Details</Button></td>
          </tr>
      ))
      rows.push(this.currentSearchRow(details))
      rows.push(this.queuedSearchRow(details))
    } else {
      rows.push((
        <tr key='current_mission'>
          <td>Current Mission</td>
          <td><b>None</b></td>
        </tr>
      ))
    }

    return (
      <Table>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}
AssetDetails.propTypes = {
  details: PropTypes.object.isRequired
}

class AssetUI extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      lastCommand: {},
      details: {
        name: props.asset
      }
    }

    this.currentCommand = this.currentCommand.bind(this)
  }

  currentCommand (data) {
    this.setState({
      lastCommand: data
    })
  }

  componentDidMount () {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get(`/assets/${this.props.asset}/details/`, function (data) {
      self.setState({
        details: data
      })
      if ('last_command' in data) {
        self.currentCommand(data.last_command)
      }
    })
  }

  render () {
    return (
      <div>
        <AssetDetails
          details={this.state.details} />
        <AssetCommandView
          lastCommand={this.state.lastCommand} />
        <AssetTrackAs
          asset={this.props.asset} />
      </div>
    )
  }
}
AssetUI.propTypes = {
  asset: PropTypes.string.isRequired
}

function createAssetUI (elementId, assetName) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<><SMMTopBar /><AssetUI asset={assetName} /></>)
}

globalThis.createAssetUI = createAssetUI

export { AssetCommandView, AssetDetails, AssetUI }
