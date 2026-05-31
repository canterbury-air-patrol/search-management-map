import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { PopupDataList } from '../popup'

interface Props {
  assetName: string
  coords: [number, number]
  alt?: number
  heading?: number
  fix?: string
  status?: { status: string; notes: string }
}

export function AssetPopup({ assetName, coords, alt, heading, fix, status }: Props) {
  const items = [
    { label: 'Asset', value: assetName },
    { label: 'Lat', value: degreesToDM(coords[1], 'lat') },
    { label: 'Long', value: degreesToDM(coords[0], 'lon') }
  ]
  if (alt) {
    items.push({ label: 'Altitude', value: alt.toString() })
  }
  if (heading) {
    items.push({ label: 'Heading', value: heading.toString() })
  }
  if (fix) {
    items.push({ label: 'Fix', value: fix })
  }
  if (status) {
    items.push({ label: 'Status', value: status.status })
    if (status.notes !== '') {
      items.push({ label: 'Status Notes', value: status.notes })
    }
  }
  return <PopupDataList items={items} dlClass="row" />
}
