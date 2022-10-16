import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

class MissionRow extends React.Component {
  render () {
    const mission = this.props.mission
    const buttons = [
      (<Button key='map' href={`/mission/${mission.id}/map/` }>Map</Button>),
      (<Button key='details' href={`/mission/${mission.id}/details/` }>Details</Button>),
      (<Button key='timeline' href={ `/mission/${mission.id}/timeline/`}>Timeline</Button>)
    ]
    if (!mission.closed && mission.admin) {
      buttons.push((<Button key='close' className='btn-danger' href={ `/mission/${mission.id}/close/` }>Close</Button>))
    }
    return ((
      <tr key={mission.id}>
        <td>{mission.name}</td>
        <td>{(new Date(mission.started)).toLocaleString()}</td>
        <td>{mission.creator}</td>
        <td>
          <ButtonGroup>
            { buttons }
          </ButtonGroup>
        </td>
      </tr>))
  }
}
MissionRow.propTypes = {
  mission: PropTypes.object.isRequired
}

class ActiveMissionList extends React.Component {
  render () {
    const missionRows = []
    for (const missionIdx in this.props.missions) {
      const mission = this.props.missions[missionIdx]
      missionRows.push((
        <MissionRow
          key={mission.id}
          mission={mission} />
      ))
    }
    return (
      <Table>
        <thead>
          <tr key='heading'>
            <th colSpan={4} align='center'>Active Missions</th>
          </tr>
          <tr key='labels'>
            <th>Mission Name</th>
            <th>Started</th>
            <th>By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { missionRows }
        </tbody>
      </Table>)
  }
}
ActiveMissionList.propTypes = {
  missions: PropTypes.array.isRequired
}

class GeneralMissionButtons extends React.Component {
  render () {
    return (
      <div>
        <Button href='/mission/new/'>Start New Mission</Button>&nbsp;
        <Button href='/mission/current/map/'>All Current Missions Map</Button>&nbsp;
        <Button href='/mission/all/map/'>All Missions Map</Button>&nbsp;
      </div>
    )
  }
}

class CompletedMissionList extends React.Component {
  render () {
    const missionRows = []
    for (const missionIdx in this.props.missions) {
      const mission = this.props.missions[missionIdx]
      missionRows.push((
        <MissionRow
          key={mission.id}
          mission={mission} />
      ))
    }
    return (
      <Table>
        <thead>
          <tr key='heading'>
            <th colSpan={4} align='center'>Completed Missions</th>
          </tr>
          <tr key='labels'>
            <th>Mission Name</th>
            <th>Started</th>
            <th>By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          { missionRows }
        </tbody>
      </Table>)
  }
}
CompletedMissionList.propTypes = {
  missions: PropTypes.array.isRequired
}

export class MissionListPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      knownActiveMissions: [],
      knownCompletedMissions: []
    }
  }

  componentDidMount () {
    this.updateData()
    $.ajaxSetup({ timeout: 2500 })
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get('/mission/list/', function (data) {
      self.updateMissions(data.missions)
    })
  }

  updateMissions (missions) {
    const activeMissions = missions.filter(mission => !mission.closed)
    const completeMissions = missions.filter(mission => mission.closed)
    this.setState(function () {
      return {
        knownActiveMissions: activeMissions,
        knownCompletedMissions: completeMissions
      }
    })
  }

  render () {
    return (
      <div>
        <ActiveMissionList
          missions={this.state.knownActiveMissions} />
        <GeneralMissionButtons />
        <CompletedMissionList
          missions={this.state.knownCompletedMissions} />
      </div>
    )
  }
}

export function createMissionList (elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<MissionListPage />)
}

globalThis.createMissionList = createMissionList
