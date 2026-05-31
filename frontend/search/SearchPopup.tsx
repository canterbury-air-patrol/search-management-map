import { formatLocalDateTime } from '../format'
import React from 'react'
import { SMMSearchObjectDetailsData } from './types'
import { PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  search: SMMSearchObjectDetailsData
  missionId: number | string
  status: string
  onDelete: () => void
  onQueueDialog: () => void
}

export function SearchPopup({ search, missionId, status, onDelete, onQueueDialog }: Props) {
  const rows = [
    { css: 'type', label: 'Search Type', value: search.search_type },
    { css: 'status', label: 'Status', value: status },
    { css: 'sweep-width', label: 'Sweep Width', value: `${search.sweep_width}m` },
    { css: 'asset-type', label: 'Asset Type', value: search.created_for }
  ]
  if (search.completed_by) {
    rows.push({ css: 'completed', label: 'Completed By', value: search.completed_by })
  } else if (search.inprogress_by) {
    rows.push({ css: 'inprogress', label: 'Inprogress By', value: search.inprogress_by })
  }
  if (search.inprogress_at) {
    rows.push({ css: 'inprogress', label: 'Search Started', value: formatLocalDateTime(search.inprogress_at) })
  }
  if (search.completed_at) {
    rows.push({ css: 'completed', label: 'Search Completed', value: formatLocalDateTime(search.completed_at) })
  }

  const buttons: ButtonItem[] = []
  if (missionId !== 'current' && missionId !== 'all') {
    if (!search.inprogress_at) {
      buttons.push({ label: 'Delete', btnClass: 'btn-danger', onclick: onDelete })
    }
    if (!search.queued_at && !search.inprogress_at) {
      buttons.push({ label: 'Queue', btnClass: 'btn-light', onclick: onQueueDialog })
    }
    buttons.push({ label: 'Details', btnClass: 'btn-light', href: `/search/${search.pk}/` })
  }

  return (
    <div>
      <dl className="search-data row">
        {rows.map(({ css, label, value }) => (
          <React.Fragment key={label}>
            <dt className={`search-${css}-label col-sm-6`}>{label}</dt>
            <dd className={`search-${css}-value col-sm-6`}>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
