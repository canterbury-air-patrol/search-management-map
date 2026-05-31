import L from 'leaflet'

import { VectorAdderDialog } from '../components/VectorAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

function PolygonAdder(map, missionId, currentPoints, replaces, label) {
  renderInLeafletDialog(map, (onClose) => (
    <VectorAdderDialog type="polygon" map={map} missionId={missionId} initialPoints={currentPoints} replaces={replaces} initialLabel={label} onClose={onClose} />
  ))
}

const PolygonAdderControl = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    PolygonAdder(this.map, this.options.missionId, [this.map.getCenter()], -1, '')
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'PolygonAdder-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add Area'

    const markerImg = L.DomUtil.create('img', 'Polygon-img', link)

    markerImg.src = '/static/icons/draw-polygon.png'
    markerImg.alt = 'Add Area'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

function polygonadder(opts) {
  return new PolygonAdderControl(opts)
}

export { PolygonAdder, polygonadder }
