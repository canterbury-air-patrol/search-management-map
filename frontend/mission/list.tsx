import '../page-shell'
import { useCallback, useMemo, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, ButtonGroup } from 'react-bootstrap'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost } from '../ajax'
import { SMMTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { Loading, LoadFailed } from '../components/Loading'
import { MissionData } from './types'

interface MissionListRowProps {
  mission: MissionData
  showClosed: boolean
  showButtons: boolean
  onChanged?: () => void
}

function MissionListRow({ mission, showClosed, showButtons, onChanged }: MissionListRowProps) {
  const dataFields = [<td key="name">{mission.name}</td>, <td key="opened">{formatLocalDateTime(mission.started)}</td>, <td key="creator">{mission.creator}</td>]

  if (showClosed) {
    dataFields.push(<td key="closed">{formatLocalDateTime(mission.closed)}</td>)
    dataFields.push(<td key="closer">{mission.closed_by}</td>)
  }

  if (showButtons) {
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
      const closeMission = () => {
        smmPost(`/mission/${mission.id}/close/`, {}, () => onChanged?.())
      }
      buttons.push(
        <Button key="close" className="btn-danger" onClick={closeMission}>
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

function ActiveMissionList({ missions, onChanged }: { missions: MissionData[]; onChanged: () => void }) {
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
      <tbody>
        {missions.map((mission) => (
          <MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={false} onChanged={onChanged} />
        ))}
      </tbody>
    </Table>
  )
}

function GeneralMissionButtons() {
  return (
    <div>
      <Button href="/mission/new/">Start New Mission</Button>&nbsp;
      <Button href="/mission/current/map/">All Current Missions Map</Button>&nbsp;
      <Button href="/mission/all/map/">All Missions Map</Button>&nbsp;
    </div>
  )
}

function CompletedMissionList({ missions }: { missions: MissionData[] }) {
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
      <tbody>
        {missions.map((mission) => (
          <MissionListRow key={mission.id} mission={mission} showButtons={true} showClosed={true} />
        ))}
      </tbody>
    </Table>
  )
}

function MissionListPage() {
  const [missions, setMissions] = useState<MissionData[] | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await smmGetJSON<{ missions: MissionData[] }>('/mission/list/', {})
      setMissions(data.missions)
      setLoadFailed(false)
    } catch (e) {
      console.error('Failed to fetch missions:', e)
      setLoadFailed(true)
    }
  }, [])

  usePolling(refresh, 10000)

  const { active, closed } = useMemo(
    () => ({
      active: missions?.filter((m) => !m.closed) ?? [],
      closed: missions?.filter((m) => m.closed) ?? []
    }),
    [missions]
  )

  if (missions === undefined) {
    return loadFailed ? <LoadFailed /> : <Loading />
  }

  return (
    <div>
      <ActiveMissionList missions={active} onChanged={refresh} />
      <GeneralMissionButtons />
      <CompletedMissionList missions={closed} />
    </div>
  )
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

window.createMissionList = createMissionList
