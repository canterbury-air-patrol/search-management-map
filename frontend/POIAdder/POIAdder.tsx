import { MissionId } from '../mission/MissionId'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { POIAdderDialog } from './POIAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { createIconControl } from '../components/iconControl'

interface POIAdderControlOptions {
  missionId: MissionId
}

function POIAdder(map: L.Map, missionId: MissionId, pos: L.LatLng, replaces: number, label: string) {
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
