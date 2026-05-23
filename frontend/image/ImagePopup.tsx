import React from 'react'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { PopupDataList, PopupButtonGroup } from '../popup'

interface Props {
  description: string
  pk: number
  coords: [number, number]
  priority: boolean
  missionId: number | string
  onPrioritize: () => void
  onDeprioritize: () => void
}

export function ImagePopup({ description, pk, coords, priority, missionId, onPrioritize, onDeprioritize }: Props) {
  const items = [
    { label: 'Image', value: description },
    { label: 'Lat', value: degreesToDM(coords[1], 'lat') },
    { label: 'Long', value: degreesToDM(coords[0], 'lon') }
  ]
  const buttons =
    missionId !== 'current' && missionId !== 'all'
      ? [priority ? { label: 'Deprioritize', btnClass: 'btn-light', onclick: onDeprioritize } : { label: 'Prioritize', btnClass: 'btn-light', onclick: onPrioritize }]
      : []
  return (
    <div>
      <PopupDataList items={items} dlClass="row" />
      <div style={{ width: '128px' }}>
        <a href={`/image/${pk}/full/`}>
          <img src={`/image/${pk}/thumbnail/`} />
        </a>
      </div>
      {buttons.length > 0 && <PopupButtonGroup buttons={buttons} />}
    </div>
  )
}
