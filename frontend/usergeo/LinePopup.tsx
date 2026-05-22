import React from 'react'
import { PopupDataList, PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  label: string
  pk: number
  missionId: number | string
  onEdit: () => void
  onDelete: () => void
  onCreateSearch: () => void
}

export function LinePopup({ label, pk, missionId, onEdit, onDelete, onCreateSearch }: Props) {
  const items = [{ label: 'Line', value: label }]
  const buttons: ButtonItem[] =
    missionId !== 'current' && missionId !== 'all'
      ? [
          { label: 'Edit', btnClass: 'btn-light', onclick: onEdit },
          { label: 'Delete', btnClass: 'btn-danger', onclick: onDelete },
          { label: 'Create Search', btnClass: 'btn-light', onclick: onCreateSearch },
          { label: 'Details', btnClass: 'btn-light', href: `/data/usergeo/${pk}/` }
        ]
      : []
  return (
    <div>
      <PopupDataList items={items} dlClass="line row" />
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
