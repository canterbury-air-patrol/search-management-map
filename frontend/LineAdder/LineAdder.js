import L from 'leaflet'

import { VectorAdderDialog } from '../components/VectorAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

function LineAdder(map, missionId, currentPoints, replaces, label) {
  renderInLeafletDialog(map, (onClose) => (
    <VectorAdderDialog type="line" map={map} missionId={missionId} initialPoints={currentPoints} replaces={replaces} initialLabel={label} onClose={onClose} />
  ))
}

const LineAdderControl = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    LineAdder(this.map, this.options.missionId, [this.map.getCenter()], -1, '')
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'LineAdder-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add Line'

    const markerImg = L.DomUtil.create('img', 'Line-img', link)

    markerImg.src = '/static/icons/draw-line.png'
    markerImg.alt = 'Add Line'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

function lineadder(opts) {
  return new LineAdderControl(opts)
}

export { LineAdder, lineadder }
