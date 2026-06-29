import '../page-shell'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Table, Button, Form } from 'react-bootstrap'
import DateTimePicker from 'react-datetime-picker'
import 'react-datetime-picker/dist/DateTimePicker.css'

import { formatLocalDateTime } from '../format'
import { smmDelete, smmGetJSON, smmPatch, smmPost } from '../ajax'
import { MissionHeader } from './header'
import { SMMMissionTopBar } from '../menu/topbar'
import { usePolling } from '../hooks/usePolling'
import { MissionData } from './types'

interface MissionTimeLineEntryAddProps {
  missionId: number
}

export function MissionTimeLineEntryAdd({ missionId }: MissionTimeLineEntryAddProps) {
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
  event_type_code?: string
  event_type: string
  message: string
  url: string
  can_edit?: boolean
}

type TimelineSortOrder = 'desc' | 'asc'
type TimelineQueryParams = {
  order: TimelineSortOrder
  start?: string
  end?: string
  user?: string
  action?: string
  q?: string
}

function localDateTimeToIso(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function isoToLocalDateTimeInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function setIfPresent(params: TimelineQueryParams, key: keyof Omit<TimelineQueryParams, 'order'>, value?: string) {
  if (value) params[key] = value
}

function MissionTimelineEntry({ timelineEntry, missionId, onChanged }: { timelineEntry: TimeLineEntry; missionId: number; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')

  function startEdit() {
    setTimestamp(isoToLocalDateTimeInput(timelineEntry.timestamp))
    setMessage(timelineEntry.message)
    setUrl(timelineEntry.url || '')
    setEditing(true)
  }

  function refresh() {
    void onChanged()
  }

  function cancelEdit() {
    setTimestamp(isoToLocalDateTimeInput(timelineEntry.timestamp))
    setMessage(timelineEntry.message)
    setUrl(timelineEntry.url || '')
    setEditing(false)
  }

  function saveEdit() {
    const timestampIso = localDateTimeToIso(timestamp)
    if (!timestampIso || !message.trim()) return
    smmPatch(
      `/mission/${missionId}/timeline/${timelineEntry.id}/`,
      {
        timestamp: timestampIso,
        message,
        url
      },
      () => {
        setEditing(false)
        refresh()
      }
    )
  }

  function deleteEntry() {
    smmDelete(`/mission/${missionId}/timeline/${timelineEntry.id}/`, refresh)
  }

  if (editing) {
    return (
      <tr>
        <td>
          <Form.Control type="datetime-local" value={timestamp} onChange={(event: ChangeEvent<HTMLInputElement>) => setTimestamp(event.target.value)} />
        </td>
        <td>{timelineEntry.creator}</td>
        <td>{timelineEntry.event_type}</td>
        <td>
          <Form.Control value={message} onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)} />
        </td>
        <td>
          <div className="d-flex gap-2">
            <Form.Control value={url} onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)} />
            <Button type="button" variant="primary" size="sm" onClick={saveEdit}>
              Save
            </Button>
            <Button type="button" variant="light" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{formatLocalDateTime(timelineEntry.timestamp)}</td>
      <td>{timelineEntry.creator}</td>
      <td>{timelineEntry.event_type}</td>
      <td>{timelineEntry.message}</td>
      <td>
        <div className="d-flex gap-2 align-items-center">
          <span>{timelineEntry.url}</span>
          {timelineEntry.can_edit && (
            <>
              <Button type="button" variant="light" size="sm" onClick={startEdit}>
                Edit
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={deleteEntry}>
                Delete
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

interface MissionTimeLineProps {
  missionId: number
}

export function MissionTimeLine({ missionId }: MissionTimeLineProps) {
  const [timelineEntries, setTimelineEntries] = useState<TimeLineEntry[]>([])
  const [missionData, setMissionData] = useState<MissionData | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>('desc')
  const [startFilter, setStartFilter] = useState('')
  const [endFilter, setEndFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [textFilter, setTextFilter] = useState('')
  const skipInitialRefresh = useRef(true)

  const queryParams = useMemo(() => {
    const params: TimelineQueryParams = { order: sortOrder }
    setIfPresent(params, 'start', localDateTimeToIso(startFilter))
    setIfPresent(params, 'end', localDateTimeToIso(endFilter))
    setIfPresent(params, 'user', userFilter.trim())
    setIfPresent(params, 'action', actionFilter.trim())
    setIfPresent(params, 'q', textFilter.trim())
    return params
  }, [actionFilter, endFilter, sortOrder, startFilter, textFilter, userFilter])

  const loadTimeline = useCallback(async () => {
    const data = await smmGetJSON<{ timeline: TimeLineEntry[]; mission: MissionData }>(`/mission/${missionId}/timeline/`, queryParams)
    setTimelineEntries(data.timeline)
    setMissionData(data.mission)
  }, [missionId, queryParams])

  useEffect(() => {
    if (skipInitialRefresh.current) {
      skipInitialRefresh.current = false
      return
    }
    void loadTimeline()
  }, [loadTimeline])

  usePolling(loadTimeline, 10000)

  const sortedTimelineEntries = useMemo(
    () =>
      [...timelineEntries].sort((a, b) => {
        const byTime = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        const byId = a.id - b.id
        const result = byTime || byId
        return sortOrder === 'asc' ? result : -result
      }),
    [sortOrder, timelineEntries]
  )

  function clearFilters() {
    setStartFilter('')
    setEndFilter('')
    setUserFilter('')
    setActionFilter('')
    setTextFilter('')
  }

  return (
    <div>
      {missionData && <MissionHeader key="missionHeader" mission={missionData} />}
      {missionData && !missionData.closed && <MissionTimeLineEntryAdd missionId={missionId} />}
      <Form className="mb-2" onSubmit={(event) => event.preventDefault()}>
        <div className="row g-2 align-items-end">
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineSortOrder">
            <Form.Label>Sort</Form.Label>
            <Form.Select
              aria-label="Timeline sort order"
              value={sortOrder}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setSortOrder(event.target.value as TimelineSortOrder)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineStartFilter">
            <Form.Label>From</Form.Label>
            <Form.Control type="datetime-local" value={startFilter} onChange={(event: ChangeEvent<HTMLInputElement>) => setStartFilter(event.target.value)} />
          </Form.Group>
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineEndFilter">
            <Form.Label>To</Form.Label>
            <Form.Control type="datetime-local" value={endFilter} onChange={(event: ChangeEvent<HTMLInputElement>) => setEndFilter(event.target.value)} />
          </Form.Group>
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineUserFilter">
            <Form.Label>User</Form.Label>
            <Form.Control value={userFilter} onChange={(event: ChangeEvent<HTMLInputElement>) => setUserFilter(event.target.value)} />
          </Form.Group>
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineActionFilter">
            <Form.Label>Action</Form.Label>
            <Form.Control value={actionFilter} onChange={(event: ChangeEvent<HTMLInputElement>) => setActionFilter(event.target.value)} />
          </Form.Group>
          <Form.Group className="col-sm-6 col-lg-2" controlId="timelineTextFilter">
            <Form.Label>Contains</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control value={textFilter} onChange={(event: ChangeEvent<HTMLInputElement>) => setTextFilter(event.target.value)} />
              <Button type="button" variant="light" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </Form.Group>
        </div>
      </Form>
      <Table responsive aria-label="Timeline entries">
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
          {sortedTimelineEntries.map((entry) => (
            <MissionTimelineEntry key={entry.id} timelineEntry={entry} missionId={missionId} onChanged={loadTimeline} />
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
