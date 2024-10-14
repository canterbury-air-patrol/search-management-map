import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import DateTimePicker from 'react-datetime-picker'
import 'react-datetime-picker/dist/DateTimePicker.css'

import { MissionHeader } from './header'
import { SMMMissionTopBar } from '../menu/topbar'

class MissionTimeLineEntryAdd extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      timeNow: true,
      specificDateTime: new Date(),
      message: '',
      url: ''
    }

    this.changeNow = this.changeNow.bind(this)
    this.changeDateTime = this.changeDateTime.bind(this)
    this.changeMessage = this.changeMessage.bind(this)
    this.changeUrl = this.changeUrl.bind(this)
    this.submit = this.submit.bind(this)
  }

  changeNow(event) {
    const target = event.target

    this.setState({
      timeNow: target.checked
    })
  }

  changeDateTime(value) {
    this.setState({
      specificDateTime: value
    })
  }

  changeMessage(event) {
    const target = event.target
    this.setState({
      message: target.value
    })
  }

  changeUrl(event) {
    const target = event.target
    this.setState({
      url: target.value
    })
  }

  submit() {
    let timestamp = this.state.specificDateTime
    if (this.state.timeNow) {
      timestamp = new Date()
    }
    $.post(`/mission/${this.props.missionId}/timeline/`, {
      csrfmiddlewaretoken: this.props.csrftoken,
      timestamp: timestamp.toISOString(),
      message: this.state.message,
      url: this.state.url
    })
    this.setState({
      timeNow: true,
      specificDateTime: new Date()
    })
  }

  render() {
    let datePicker = null
    if (this.state.timeNow === false) {
      datePicker = <DateTimePicker onChange={this.changeDateTime} value={this.state.specificDateTime} format="y-MM-dd HH:mm:ss" />
    }
    return (
      <Table>
        <thead>
          <tr>
            <td>Date/Time:</td>
            <td>Entry:</td>
            <td>URL:</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Now: <input type="checkbox" checked={this.state.timeNow} onChange={this.changeNow} /> {datePicker}
            </td>
            <td>
              <input type="text" value={this.state.message} onChange={this.changeMessage} />
            </td>
            <td>
              <input type="text" value={this.state.url} onChange={this.changeUrl} />
            </td>
            <td>
              <Button onClick={this.submit}>Add</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    )
  }
}
MissionTimeLineEntryAdd.propTypes = {
  missionId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

class MissionTimelineEntry extends React.Component {
  render() {
    const entry = this.props.timelineEntry
    return (
      <tr>
        <td>{new Date(entry.timestamp).toLocaleString()}</td>
        <td>{entry.creator}</td>
        <td>{entry.event_type}</td>
        <td>{entry.message}</td>
        <td>{entry.url}</td>
      </tr>
    )
  }
}
MissionTimelineEntry.propTypes = {
  timelineEntry: PropTypes.object.isRequired
}

export class MissionTimeLine extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      timelineEntries: [],
      missionData: null,
      missionClosed: false
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
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
    this.updateTimeline(data.timeline)
    this.updateMission(data.mission)
    if (!this.state.missionClosed && data.mission.closed !== null) {
      this.setMissionClosed()
    }
  }

  async updateData() {
    await $.getJSON(`/mission/${this.props.missionId}/timeline/`, this.updateDataResponse)
  }

  updateTimeline(timelineEntries) {
    this.setState(function () {
      return {
        timelineEntries
      }
    })
  }

  updateMission(missionData) {
    this.setState(function () {
      return {
        missionData
      }
    })
  }

  setMissionClosed() {
    this.setState(function () {
      return {
        missionClosed: true
      }
    })
  }

  render() {
    const timelineEntries = []
    for (const timelineIdx in this.state.timelineEntries) {
      const timelineEntry = this.state.timelineEntries[timelineIdx]
      timelineEntries.push(<MissionTimelineEntry key={timelineEntry.id} timelineEntry={timelineEntry}></MissionTimelineEntry>)
    }

    let missionData = null
    let timelineAdd = null
    if (this.state.missionData !== null) {
      missionData = <MissionHeader key="missionHeader" mission={this.state.missionData} />
      if (this.state.missionClosed !== null) {
        timelineAdd = <MissionTimeLineEntryAdd missionId={this.props.missionId} csrftoken={this.props.csrftoken} />
      }
    }

    return (
      <div>
        {missionData}
        {timelineAdd}
        <Table responsive>
          <thead>
            <tr>
              <td key="heading" colSpan={5} align="center">
                Timeline
              </td>
            </tr>
            <tr key="labels">
              <td>At</td>
              <td>User</td>
              <td>Action</td>
              <td>Message</td>
              <td></td>
            </tr>
          </thead>
          <tbody>{timelineEntries}</tbody>
        </Table>
      </div>
    )
  }
}
MissionTimeLine.propTypes = {
  missionId: PropTypes.number.isRequired,
  csrftoken: PropTypes.string.isRequired
}

export function createMissionTimeline(elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MissionTimeLine missionId={missionId} csrftoken={csrftoken} />
    </>
  )
}

globalThis.createMissionTimeline = createMissionTimeline
