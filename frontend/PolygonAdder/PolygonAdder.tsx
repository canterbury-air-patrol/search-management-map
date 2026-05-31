import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { VectorAdderDialog } from '../components/VectorAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { createIconControl } from '../components/iconControl'

interface PolygonAdderControlOptions {
  missionId: MissionId
}

function PolygonAdder(map: L.Map, missionId: MissionId, currentPoints: L.LatLng[], replaces: number, label: string) {
  renderInLeafletDialog(map, (onClose) => (
    <VectorAdderDialog type="polygon" map={map} missionId={missionId} initialPoints={currentPoints} replaces={replaces} initialLabel={label} onClose={onClose} />
  ))
}

function polygonadder(opts: PolygonAdderControlOptions): L.Control {
  return createIconControl({
    iconUrl: '/static/icons/draw-polygon.png',
    title: 'Add Area',
    cssPrefix: 'PolygonAdder',
    onClick: (map) => PolygonAdder(map, opts.missionId, [map.getCenter()], -1, '')
  })
}

export { PolygonAdder, polygonadder }
