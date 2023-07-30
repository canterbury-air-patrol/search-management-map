import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { MissionHeader } from './header'
import { SMMMissionTopBar } from '../menu/topbar'

class MissionTimelineEntry extends React.Component {
  render () {
    const entry = this.props.timelineEntry
    return (
      <tr>
        <td>{(new Date(entry.timestamp)).toLocaleString()}</td>
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

class MissionTimelineButtons extends React.Component {
  render () {
    const buttons = []
    if (!this.props.missionClosed) {
      buttons.push((<Button key='addEntry' href={`/mission/${this.props.missionId}/timeline/add/`}>Add Entry</Button>))
    }
    return (
      <ButtonGroup>
        {buttons}
      </ButtonGroup>
    )
  }
}
MissionTimelineButtons.propTypes = {
  missionId: PropTypes.number.isRequired,
  missionClosed: PropTypes.bool.isRequired
}

export class MissionTimeLine extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      timelineEntries: [],
      missionData: null,
      missionClosed: false
    }
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
    await $.get(`/mission/${this.props.missionId}/timeline/json/`, function (data) {
      self.updateTimeline(data.timeline)
      self.updateMission(data.mission)
      if (!self.state.missionClosed && data.mission.closed !== null) {
        self.setMissionClosed()
      }
    })
  }

  updateTimeline (timelineEntries) {
    this.setState(function () {
      return {
        timelineEntries
      }
    })
  }

  updateMission (missionData) {
    this.setState(function () {
      return {
        missionData
      }
    })
  }

  setMissionClosed () {
    this.setState(function () {
      return {
        missionClosed: true
      }
    })
  }

  render () {
    const timelineEntries = []
    for (const timelineIdx in this.state.timelineEntries) {
      const timelineEntry = this.state.timelineEntries[timelineIdx]
      timelineEntries.push((<MissionTimelineEntry key={timelineEntry.id} timelineEntry={timelineEntry}></MissionTimelineEntry>))
    }

    let missionData = null
    if (this.state.missionData !== null) {
      missionData = (<MissionHeader key='missionHeader' mission={this.state.missionData} />)
    }

    return (
      <div>
        { missionData }
        <MissionTimelineButtons missionId={this.props.missionId} missionClosed={this.state.missionClosed} />
        <Table responsive>
          <thead>
            <tr>
              <td key='heading' colSpan={5} align='center'>Timeline</td>
            </tr>
            <tr key='labels'>
              <td>At</td>
              <td>User</td>
              <td>Action</td>
              <td>Message</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            { timelineEntries }
          </tbody>
        </Table>
      </div>
    )
  }
}
MissionTimeLine.propTypes = {
  missionId: PropTypes.number.isRequired
}

export function createMissionTimeline (elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<><SMMMissionTopBar missionId={missionId}/><MissionTimeLine missionId={missionId} /></>)
}

globalThis.createMissionTimeline = createMissionTimeline
