import L from 'leaflet'

import { VectorAdderDialog } from '../components/VectorAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { createIconControl } from '../components/iconControl'

interface LineAdderControlOptions {
  missionId: number | string
}

function LineAdder(map: L.Map, missionId: number | string, currentPoints: L.LatLng[], replaces: number, label: string) {
  renderInLeafletDialog(map, (onClose) => (
    <VectorAdderDialog type="line" map={map} missionId={missionId} initialPoints={currentPoints} replaces={replaces} initialLabel={label} onClose={onClose} />
  ))
}

function lineadder(opts: LineAdderControlOptions): L.Control {
  return createIconControl({
    iconUrl: '/static/icons/draw-line.png',
    title: 'Add Line',
    cssPrefix: 'LineAdder',
    onClick: (map) => LineAdder(map, opts.missionId, [map.getCenter()], -1, '')
  })
}

export { LineAdder, lineadder }
