import React from 'react'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { PopupDataList } from '../popup'

interface Props {
  userName: string
  coords?: [number, number]
  alt?: number
}

export function UserPopup({ userName, coords, alt }: Props) {
  if (!coords) {
    return <div>{userName}</div>
  }
  const items = [
    { label: 'User', value: userName },
    { label: 'Lat', value: degreesToDM(coords[1], 'lat') },
    { label: 'Long', value: degreesToDM(coords[0], 'lon') }
  ]
  if (alt) {
    items.push({ label: 'Altitude', value: alt.toString() })
  }
  return <PopupDataList items={items} dlClass="row" />
}
