import React from 'react'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { POIAdderDialog } from './POIAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

function POIAdder(map, missionId, pos, replaces, label) {
  renderInLeafletDialog(map, (onClose) => <POIAdderDialog map={map} missionId={missionId} initialPos={pos} replaces={replaces} initialLabel={label} onClose={onClose} />, {
    initOpen: true
  })
}

const POIAdderControl = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    POIAdder(this.map, this.options.missionId, this.map.getCenter(), -1, '')
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'POIAdder-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add POI'

    const markerImg = L.DomUtil.create('img', 'POIAdder-marker', link)

    markerImg.src = markerIcon
    markerImg.alt = 'Add POI'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

function poiadder(opts) {
  return new POIAdderControl(opts)
}

export { POIAdder, poiadder }
