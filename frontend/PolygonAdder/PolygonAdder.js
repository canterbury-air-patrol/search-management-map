import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { PolygonAdderDialog } from './PolygonAdderDialog'

L.PolygonAdder = function (map, missionId, currentPoints, replaces, label) {
  const container = document.createElement('div')
  const dialog = L.control.dialog().setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  root.render(
    <PolygonAdderDialog
      map={map}
      missionId={missionId}
      initialPoints={currentPoints}
      replaces={replaces}
      initialLabel={label}
      onClose={() => {
        root.unmount()
        dialog.destroy()
      }}
    />
  )
}

L.Control.PolygonAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    L.PolygonAdder(this.map, this.options.missionId, [this.map.getCenter()], -1, '')
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

L.control.polygonadder = function (opts) {
  return new L.Control.PolygonAdder(opts)
}
