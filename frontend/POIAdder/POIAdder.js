import $ from 'jquery'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

L.POIAdder = function (map, missionId, csrftoken, pos, replaces, label) {
  const marker = L.marker(pos, {
    draggable: true,
    autoPan: true
  }).addTo(map)
  const RAND_NUM = Math.floor(Math.random() * 16536)
  const contents = [
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
    `<textarea autofocus id="poi-dialog-label-${RAND_NUM}" rows=2>${label}</textarea></div>`,
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Lat</span></div>',
    `<input type="text" id="poi-dialog-lat-${RAND_NUM}" /></div>`,
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Long</span></div>',
    `<input type="text" id="poi-dialog-lon-${RAND_NUM}" /></div>`,
    `<div class="btn-group"><button class="btn btn-primary" id="poi-dialog-create-${RAND_NUM}">Create</button>`,
    `<button class="btn btn-danger" id="poi-dialog-cancel-${RAND_NUM}">Cancel</button></div>`
  ].join('')
  const markerDialog = L.control.dialog({ initOpen: false }).setContent(contents).addTo(map).hideClose()
  if (replaces !== -1) {
    $(`#poi-dialog-lat-${RAND_NUM}`).val(degreesToDM(pos.lat, true))
    $(`#poi-dialog-lon-${RAND_NUM}`).val(degreesToDM(pos.lng, false))
    $(`#poi-dialog-create-${RAND_NUM}`).html('Update')
    markerDialog.open()
  }
  $(`#poi-dialog-create-${RAND_NUM}`).on('click', function () {
    const data = {
      lat: DMToDegrees($(`#poi-dialog-lat-${RAND_NUM}`).val()),
      lon: DMToDegrees($(`#poi-dialog-lon-${RAND_NUM}`).val()),
      label: $(`#poi-dialog-label-${RAND_NUM}`).val(),
      csrfmiddlewaretoken: csrftoken
    }
    if (replaces === -1) {
      $.post(`/mission/${missionId}/data/pois/create/`, data)
    } else {
      $.post(`/mission/${missionId}/data/pois/${replaces}/replace/`, data)
    }
    map.removeLayer(marker)
    markerDialog.destroy()
  })
  $(`#poi-dialog-cancel-${RAND_NUM}`).on('click', function () {
    map.removeLayer(marker)
    markerDialog.destroy()
  })
  map.on('dialog:opened', function () {
    const markerCoords = marker.getLatLng()
    $(`#poi-dialog-lat-${RAND_NUM}`).val(degreesToDM(markerCoords.lat, true))
    $(`#poi-dialog-lon-${RAND_NUM}`).val(degreesToDM(markerCoords.lng, false))
  })
  marker.on('dragend', function () {
    markerDialog.open()
  })
}

L.Control.POIAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'POIAdder-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add POI'

    const markerImg = L.DomUtil.create('img', 'POIAdder-marker', link)

    markerImg.src = markerIcon
    markerImg.alt = 'Add POI'

    L.DomEvent.disableClickPropagation(link)

    const self = this

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', function () {
      L.POIAdder(map, self.options.missionId, self.options.csrftoken, map.getCenter(), -1, '')
    })

    return container
  },

  onRemove: function () {}
})

L.control.poiadder = function (opts) {
  return new L.Control.POIAdder(opts)
}
