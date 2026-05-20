import $ from 'jquery'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'

L.POIAdder = function (map, missionId, pos, replaces, label) {
  const RAND_NUM = Math.floor(Math.random() * 16536)
  const contents = [
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
    `<textarea autofocus id="poi-dialog-label-${RAND_NUM}" rows=2>${label}</textarea></div>`,
    `<div id="poi-latlng-${RAND_NUM}"></div>`,
    `<div class="btn-group"><button class="btn btn-primary" id="poi-dialog-create-${RAND_NUM}">Create</button>`,
    `<button class="btn btn-danger" id="poi-dialog-cancel-${RAND_NUM}">Cancel</button></div>`
  ].join('')
  const markerDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()

  let currentPos = pos
  const latlngRoot = ReactDOM.createRoot(document.getElementById(`poi-latlng-${RAND_NUM}`))
  latlngRoot.render(
    <LatLngMarkerInput
      map={map}
      initialPos={pos}
      onChange={function (p) {
        currentPos = p
      }}
    />
  )

  function createOrReplace() {
    const data = {
      lat: currentPos.lat,
      lon: currentPos.lng,
      label: $(`#poi-dialog-label-${RAND_NUM}`).val()
    }
    if (replaces === -1) {
      smmPost(`/mission/${missionId}/data/pois/create/`, data)
    } else {
      smmPost(`/data/pois/${replaces}/replace/`, data)
    }
    latlngRoot.unmount()
    markerDialog.destroy()
  }

  $(`#poi-dialog-create-${RAND_NUM}`).on('click', createOrReplace)
  $(`#poi-dialog-cancel-${RAND_NUM}`).on('click', function () {
    latlngRoot.unmount()
    markerDialog.destroy()
  })
}

L.Control.POIAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    L.POIAdder(this.map, this.options.missionId, this.map.getCenter(), -1, '')
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

L.control.poiadder = function (opts) {
  return new L.Control.POIAdder(opts)
}
