import '../page-shell'
import { ChangeEvent, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button } from 'react-bootstrap'
import DateTimePicker from 'react-datetime-picker'
import 'react-datetime-picker/dist/DateTimePicker.css'

import { formatLocalDateTime } from '../format'
import { smmGetJSON, smmPost } from '../ajax'
import { MissionHeader } from './header'
import { SMMMissionTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { MissionData } from './types'

interface MissionTimeLineEntryAddProps {
  missionId: number
}

function MissionTimeLineEntryAdd({ missionId }: MissionTimeLineEntryAddProps) {
  const [timeNow, setTimeNow] = useState(true)
  const [specificDateTime, setSpecificDateTime] = useState<Date>(() => new Date())
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')

  function submit() {
    const timestamp = timeNow ? new Date() : specificDateTime
    smmPost(`/mission/${missionId}/timeline/`, {
      timestamp: timestamp.toISOString(),
      message,
      url
    })
    setTimeNow(true)
    setSpecificDateTime(new Date())
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
            Now: <input type="checkbox" checked={timeNow} onChange={(e: ChangeEvent<HTMLInputElement>) => setTimeNow(e.target.checked)} />{' '}
            {!timeNow && (
              <DateTimePicker
                onChange={(value) => {
                  if (value instanceof Date) setSpecificDateTime(value)
                }}
                value={specificDateTime}
                format="y-MM-dd HH:mm:ss"
              />
            )}
          </td>
          <td>
            <input type="text" value={message} onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} />
          </td>
          <td>
            <input type="text" value={url} onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} />
          </td>
          <td>
            <Button onClick={submit}>Add</Button>
          </td>
        </tr>
      </tbody>
    </Table>
  )
}

interface TimeLineEntry {
  id: number
  timestamp: string
  creator: string
  event_type: string
  message: string
  url: string
}

function MissionTimelineEntry({ timelineEntry }: { timelineEntry: TimeLineEntry }) {
  return (
    <tr>
      <td>{formatLocalDateTime(timelineEntry.timestamp)}</td>
      <td>{timelineEntry.creator}</td>
      <td>{timelineEntry.event_type}</td>
      <td>{timelineEntry.message}</td>
      <td>{timelineEntry.url}</td>
    </tr>
  )
}

interface MissionTimeLineProps {
  missionId: number
}

export function MissionTimeLine({ missionId }: MissionTimeLineProps) {
  const [timelineEntries, setTimelineEntries] = useState<TimeLineEntry[]>([])
  const [missionData, setMissionData] = useState<MissionData | undefined>(undefined)

  usePolling(async () => {
    const data = await smmGetJSON<{ timeline: TimeLineEntry[]; mission: MissionData }>(`/mission/${missionId}/timeline/`, {})
    setTimelineEntries(data.timeline)
    setMissionData(data.mission)
  }, 10000)

  return (
    <div>
      {missionData && <MissionHeader key="missionHeader" mission={missionData} />}
      {missionData && !missionData.closed && <MissionTimeLineEntryAdd missionId={missionId} />}
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
        <tbody>
          {timelineEntries.map((entry) => (
            <MissionTimelineEntry key={entry.id} timelineEntry={entry} />
          ))}
        </tbody>
      </Table>
    </div>
  )
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
