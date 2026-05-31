import { formatLocalDateTime } from '../format'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON, smmPost } from '../ajax'

import DateTimePicker from 'react-datetime-picker'
import 'react-datetime-picker/dist/DateTimePicker.css'

import { MissionHeader } from './header'
import { SMMMissionTopBar } from '../menu/topbar'
import { MissionData } from './types'

interface MissionTimeLineEntryAddProps {
  missionId: number
}

interface MissionTimeLineEntryAddState {
  timeNow: boolean
  specificDateTime: Date
  message: string
  url: string
}

class MissionTimeLineEntryAdd extends React.Component<MissionTimeLineEntryAddProps, MissionTimeLineEntryAddState> {
  constructor(props: MissionTimeLineEntryAddProps) {
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

  changeNow(event: React.ChangeEvent<HTMLInputElement>) {
    const { target } = event

    this.setState({
      timeNow: target.checked
    })
  }

  changeDateTime(value: Date | null) {
    if (value !== null) {
      this.setState({
        specificDateTime: value
      })
    }
  }

  changeMessage(event: React.ChangeEvent<HTMLInputElement>) {
    const { target } = event
    this.setState({
      message: target.value
    })
  }

  changeUrl(event: React.ChangeEvent<HTMLInputElement>) {
    const { target } = event
    this.setState({
      url: target.value
    })
  }

  submit() {
    let timestamp = this.state.specificDateTime
    if (this.state.timeNow) {
      timestamp = new Date()
    }
    smmPost(`/mission/${this.props.missionId}/timeline/`, {
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

interface TimeLineEntry {
  id: number
  timestamp: string
  creator: string
  event_type: string
  message: string
  url: string
}

interface MissionTimelineEntryProps {
  timelineEntry: TimeLineEntry
}

class MissionTimelineEntry extends React.Component<MissionTimelineEntryProps, never> {
  render() {
    const entry = this.props.timelineEntry
    return (
      <tr>
        <td>{formatLocalDateTime(entry.timestamp)}</td>
        <td>{entry.creator}</td>
        <td>{entry.event_type}</td>
        <td>{entry.message}</td>
        <td>{entry.url}</td>
      </tr>
    )
  }
}

interface MissionTimeLineProps {
  missionId: number
}

interface MissionTimelineState {
  timelineEntries: TimeLineEntry[]
  missionData?: MissionData
  missionClosed: boolean
}

export class MissionTimeLine extends React.Component<MissionTimeLineProps, MissionTimelineState> {
  timer?: number

  constructor(props: MissionTimeLineProps) {
    super(props)

    this.state = {
      timelineEntries: [],
      missionData: undefined,
      missionClosed: false
    }
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  async updateData() {
    const data = await smmGetJSON<{ timeline: TimeLineEntry[]; mission: MissionData }>(`/mission/${this.props.missionId}/timeline/`, {})
    this.updateTimeline(data.timeline)
    this.updateMission(data.mission)
    if (!this.state.missionClosed && data.mission.closed !== null) {
      this.setMissionClosed()
    }
  }

  updateTimeline(timelineEntries: TimeLineEntry[]) {
    this.setState(function () {
      return {
        timelineEntries
      }
    })
  }

  updateMission(missionData: MissionData) {
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
    const timelineEntries = this.state.timelineEntries.map((timelineEntry) => <MissionTimelineEntry key={timelineEntry.id} timelineEntry={timelineEntry}></MissionTimelineEntry>)

    let missionData = null
    let timelineAdd = null
    if (this.state.missionData !== undefined) {
      missionData = <MissionHeader key="missionHeader" mission={this.state.missionData} />
      if (!this.state.missionClosed) {
        timelineAdd = <MissionTimeLineEntryAdd missionId={this.props.missionId} />
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

export function createMissionTimeline(elementId: string, missionId: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MissionTimeLine missionId={missionId} />
    </>
  )
}

window.createMissionTimeline = createMissionTimeline
