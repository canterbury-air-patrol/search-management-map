import React from 'react'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { PopupDataList, PopupButtonGroup, ButtonItem } from '../popup'

interface Props {
  label: string
  coords: [number, number]
  pk: number
  missionId: number | string
  onEdit: () => void
  onDelete: () => void
  onCreateSearch: () => void
  onCalculateTDV: () => void
}

export function POIPopup({ label, coords, pk, missionId, onEdit, onDelete, onCreateSearch, onCalculateTDV }: Props) {
  const items = [
    { label: 'POI', value: label },
    { label: 'Lat', value: degreesToDM(coords[1], true) },
    { label: 'Long', value: degreesToDM(coords[0], false) }
  ]
  const buttons: ButtonItem[] =
    missionId !== 'current' && missionId !== 'all'
      ? [
          { label: 'Move', btnClass: 'btn-light', onclick: onEdit },
          { label: 'Delete', btnClass: 'btn-danger', onclick: onDelete },
          { label: 'Create Search', btnClass: 'btn-light', onclick: onCreateSearch },
          { label: 'Calculate TDV', btnClass: 'btn-light', onclick: onCalculateTDV },
          { label: 'Details', btnClass: 'btn-light', href: `/data/usergeo/${pk}/` }
        ]
      : []
  return (
    <div>
      <PopupDataList items={items} dlClass="poi row" />
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
