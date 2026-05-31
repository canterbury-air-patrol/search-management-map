import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { POIAdderDialog } from './POIAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { createIconControl } from '../components/iconControl'

interface POIAdderControlOptions {
  missionId: number | string
}

function POIAdder(map: L.Map, missionId: number | string, pos: L.LatLng, replaces: number, label: string) {
  renderInLeafletDialog(map, (onClose) => <POIAdderDialog map={map} missionId={missionId} initialPos={pos} replaces={replaces} initialLabel={label} onClose={onClose} />, {
    initOpen: true
  })
}

function poiadder(opts: POIAdderControlOptions): L.Control {
  return createIconControl({
    iconUrl: markerIcon,
    title: 'Add POI',
    cssPrefix: 'POIAdder',
    onClick: (map) => POIAdder(map, opts.missionId, map.getCenter(), -1, '')
  })
}

export { POIAdder, poiadder }
