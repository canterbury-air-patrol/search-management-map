import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { SMMTopBar } from '../../menu/topbar'

class MissionAssetStatusForm extends React.Component {
  constructor (props) {
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

  componentDidMount () {
    $.ajaxSetup({ timeout: 2500 })
    this.updateStatusValues()
    this.timer = setInterval(() => this.updateStatusValues(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  updateStatusValuesResponse (data) {
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

  async updateStatusValues () {
    await $.getJSON('/mission/asset/status/values/', this.updateStatusValuesResponse)
  }

  updateSelectedStateValue (event) {
    const target = event.target
    const value = target.value

    this.setState({ selectedValueId: value })
  }

  updateNotes (event) {
    const target = event.target
    const value = target.value

    this.setState({ notesText: value })
  }

  resetForm () {
    this.setState({
      selectedValueId: null,
      notesText: ''
    })
  }

  setStatus () {
    $.post(`/mission/${this.props.mission}/assets/${this.props.asset}/status/`, {
      value_id: this.state.selectedValueId,
      notes: this.state.notesText,
      csrfmiddlewaretoken: this.props.csrftoken
    }, this.resetForm)
  }

  render () {
    const statusValues = this.state.statusValues.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))
    return (
      <Table>
        <thead>
        <tr>
          <td>Mission Status:</td>
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
          <td colSpan={3}><Button onClick={this.setStatus}>Set Status</Button></td>
        </tr>
      </thead>
      </Table>
    )
  }
}
MissionAssetStatusForm.propTypes = {
  asset: PropTypes.number.isRequired,
  mission: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

class MissionAssetStatus extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      statusData: {}
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
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

  updateDataResponse (data) {
    this.setState(function () {
      return {
        statusData: data.status
      }
    })
  }

  async updateData () {
    await $.getJSON(`/mission/${this.props.mission}/assets/${this.props.asset}/status/`, this.updateDataResponse)
  }

  render () {
    return (
      <div>
        <Table>
          <thead>
            <tr>
              <td>Mission Status</td>
              <td>{this.state.statusData.status}</td>
            </tr>
            <tr>
              <td>Description</td>
              <td>{this.state.statusData.status_description}</td>
            </tr>
            <tr>
              <td>Since</td>
              <td>{this.state.statusData.since}</td>
            </tr>
            <tr>
              <td>Notes</td>
              <td>{this.state.statusData.notes}</td>
            </tr>
          </thead>
        </Table>
        <MissionAssetStatusForm asset={this.props.asset} mission={this.props.mission} csrftoken={this.props.csrftoken} />
      </div>
    )
  }
}
MissionAssetStatus.propTypes = {
  asset: PropTypes.number.isRequired,
  mission: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

function createMissionAssetStatus (elementId, asset, mission) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(<><SMMTopBar /><MissionAssetStatus asset={asset} mission={mission} csrftoken={csrftoken}/></>)
}

export { MissionAssetStatus }

globalThis.createMissionAssetStatus = createMissionAssetStatus
