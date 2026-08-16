import React from 'react'

import { MissionId, isSpecificMission } from '../mission/MissionId'
import { formatLocalDateTime } from '../format'
import { SMMSearchObjectDetailsData } from './types'
import { PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  search: SMMSearchObjectDetailsData
  missionId: MissionId
  status: string
  onDelete: () => void
  onQueueDialog: () => void
  onUnqueue: () => void
  onAbandon: () => void
}

export function SearchPopup({ search, missionId, status, onDelete, onQueueDialog, onUnqueue, onAbandon }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: 'Search Type', value: search.search_type },
    { label: 'Status', value: status },
    { label: 'Sweep Width', value: `${search.sweep_width}m` },
    { label: 'Asset Type', value: search.created_for }
  ]
  if (search.completed_by) {
    rows.push({ label: 'Completed By', value: search.completed_by })
  } else if (search.inprogress_by) {
    rows.push({ label: 'Inprogress By', value: search.inprogress_by })
  }
  if (search.inprogress_at) {
    rows.push({ label: 'Search Started', value: formatLocalDateTime(search.inprogress_at) })
  }
  if (search.completed_at) {
    rows.push({ label: 'Search Completed', value: formatLocalDateTime(search.completed_at) })
  }

  const buttons: ButtonItem[] = []
  if (isSpecificMission(missionId)) {
    if (!search.inprogress_at) {
      buttons.push({ label: 'Delete', btnClass: 'btn-danger', onclick: onDelete })
    }
    if (!search.queued_at && !search.inprogress_at) {
      buttons.push({ label: 'Queue', btnClass: 'btn-light', onclick: onQueueDialog })
    }
    if (search.queued_at && !search.inprogress_at) {
      buttons.push({ label: 'Unqueue', btnClass: 'btn-light', onclick: onUnqueue })
    }
    if (search.inprogress_at && !search.completed_at) {
      buttons.push({ label: 'Abandon Search', btnClass: 'btn-warning', onclick: onAbandon })
    }
    buttons.push({ label: 'Details', btnClass: 'btn-light', href: `/search/${search.pk}/` })
  }

  return (
    <div>
      <dl className="row">
        {rows.map(({ label, value }) => (
          <React.Fragment key={label}>
            <dt className="col-sm-6">{label}</dt>
            <dd className="col-sm-6">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
