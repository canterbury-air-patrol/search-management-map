import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'
import { SMMTopBar } from '../menu/topbar'

class MissionListRow extends React.Component {
  render() {
    const mission = this.props.mission
    const dataFields = []
    dataFields.push(<td key="name">{mission.name}</td>)
    dataFields.push(<td key="opened">{new Date(mission.started).toLocaleString()}</td>)
    dataFields.push(<td key="creator">{mission.creator}</td>)

    if (this.props.showClosed) {
      dataFields.push(<td key="closed">{mission.closed ? new Date(mission.closed).toLocaleString() : ''}</td>)
      dataFields.push(<td key="closer">{mission.closed_by}</td>)
    }

    if (this.props.showButtons) {
      const buttons = [
        <Button key="map" href={`/mission/${mission.id}/map/`}>
          Map
        </Button>,
        <Button key="details" href={`/mission/${mission.id}/details/`}>
          Details
        </Button>,
        <Button key="timeline" href={`/mission/${mission.id}/timeline/`}>
          Timeline
        </Button>
      ]
      if (!mission.closed && mission.admin) {
        buttons.push(
          <Button key="close" className="btn-danger" href={`/mission/${mission.id}/close/`}>
            Close
          </Button>
        )
      }
      dataFields.push(
        <td key="buttons">
          <ButtonGroup>{buttons}</ButtonGroup>
        </td>
      )
    }
    return <tr key={mission.id}>{dataFields}</tr>
  }
}
MissionListRow.propTypes = {
  mission: PropTypes.object.isRequired,
  showButtons: PropTypes.bool.isRequired,
  showClosed: PropTypes.bool.isRequired
}

class ActiveMissionList extends React.Component {
  render() {
    const missionRows = []
    for (const missionIdx in this.props.missions) {
      const mission = this.props.missions[missionIdx]
      missionRows.push(<MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={false} />)
    }
    return (
      <Table responsive>
        <thead>
          <tr key="heading">
            <th colSpan={4} align="center">
              Active Missions
            </th>
          </tr>
          <tr key="labels">
            <th>Mission Name</th>
            <th>Started</th>
            <th>By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{missionRows}</tbody>
      </Table>
    )
  }
}
ActiveMissionList.propTypes = {
  missions: PropTypes.array.isRequired
}

class GeneralMissionButtons extends React.Component {
  render() {
    return (
      <div>
        <Button href="/mission/new/">Start New Mission</Button>&nbsp;
        <Button href="/mission/current/map/">All Current Missions Map</Button>&nbsp;
        <Button href="/mission/all/map/">All Missions Map</Button>&nbsp;
      </div>
    )
  }
}

class CompletedMissionList extends React.Component {
  render() {
    const missionRows = []
    for (const missionIdx in this.props.missions) {
      const mission = this.props.missions[missionIdx]
      missionRows.push(<MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={true} />)
    }
    return (
      <Table responsive>
        <thead>
          <tr key="heading">
            <th colSpan={6} align="center">
              Completed Missions
            </th>
          </tr>
          <tr key="labels">
            <th>Mission Name</th>
            <th>Started</th>
            <th>By</th>
            <th>Closed</th>
            <th>By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{missionRows}</tbody>
      </Table>
    )
  }
}
CompletedMissionList.propTypes = {
  missions: PropTypes.array.isRequired
}

class MissionListPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      knownActiveMissions: [],
      knownCompletedMissions: []
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
    this.updateMissions(data.missions)
  }

  async updateData() {
    await $.get('/mission/list/', this.updateDataResponse)
  }

  updateMissions(missions) {
    const activeMissions = missions.filter((mission) => !mission.closed)
    const completeMissions = missions.filter((mission) => mission.closed)
    this.setState(function () {
      return {
        knownActiveMissions: activeMissions,
        knownCompletedMissions: completeMissions
      }
    })
  }

  render() {
    return (
      <div>
        <ActiveMissionList missions={this.state.knownActiveMissions} />
        <GeneralMissionButtons />
        <CompletedMissionList missions={this.state.knownCompletedMissions} />
      </div>
    )
  }
}

function createMissionList(elementId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(
    <>
      <SMMTopBar />
      <MissionListPage />
    </>
  )
}

export { MissionListRow, MissionListPage }

globalThis.createMissionList = createMissionList
