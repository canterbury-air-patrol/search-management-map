import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGet } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { MissionData } from './types'

interface MissionListRowProps {
  mission: MissionData
  showClosed: boolean
  showButtons: boolean
}

class MissionListRow extends React.Component<MissionListRowProps, never> {
  render() {
    const { mission } = this.props
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

interface ActiveMissionListProps {
  missions: MissionData[]
}

class ActiveMissionList extends React.Component<ActiveMissionListProps, never> {
  render() {
    const missionRows = this.props.missions.map((mission) => <MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={false} />)
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

interface CompletedMissionListProps {
  missions: MissionData[]
}

class CompletedMissionList extends React.Component<CompletedMissionListProps, never> {
  render() {
    const missionRows = this.props.missions.map((mission) => <MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={true} />)
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

interface MissionListPageState {
  knownActiveMissions: MissionData[]
  knownCompletedMissions: MissionData[]
}

class MissionListPage extends React.Component<object, MissionListPageState> {
  timer?: number

  constructor(props: object) {
    super(props)

    this.state = {
      knownActiveMissions: [],
      knownCompletedMissions: []
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { missions: MissionData[] }) {
    this.updateMissions(data.missions)
  }

  async updateData() {
    await smmGet('/mission/list/', {}, this.updateDataResponse)
  }

  updateMissions(missions: MissionData[]) {
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

function createMissionList(elementId: string) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)
  div.render(
    <>
      <SMMTopBar />
      <MissionListPage />
    </>
  )
}

export { MissionListRow, MissionListPage }

// @ts-expect-error: globalThis doesn't have a definition
globalThis.createMissionList = createMissionList
