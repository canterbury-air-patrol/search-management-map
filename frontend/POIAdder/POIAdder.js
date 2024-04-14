import $ from 'jquery'

import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { MappedMarker } from '../smmleaflet'

L.POIAdder = function (map, missionId, csrftoken, pos, replaces, label) {
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
  const markerDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()

  const mappedMarker = new MappedMarker($(`#poi-dialog-lat-${RAND_NUM}`), $(`#poi-dialog-lon-${RAND_NUM}`), pos)
  mappedMarker.getMarker().addTo(map)

  function createOrReplace () {
    const marker = mappedMarker.getMarker()
    const latLng = marker.getLatLng()

    const data = {
      lat: latLng.lat,
      lon: latLng.lng,
      label: $(`#poi-dialog-label-${RAND_NUM}`).val(),
      csrfmiddlewaretoken: csrftoken
    }
    if (replaces === -1) {
      $.post(`/mission/${missionId}/data/pois/create/`, data)
    } else {
      $.post(`/data/pois/${replaces}/replace/`, data)
    }
    map.removeLayer(marker)
    markerDialog.destroy()
  }

  $(`#poi-dialog-create-${RAND_NUM}`).on('click', createOrReplace)
  $(`#poi-dialog-cancel-${RAND_NUM}`).on('click', function () {
    map.removeLayer(mappedMarker.getMarker())
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
    L.POIAdder(this.map, this.options.missionId, this.options.csrftoken, this.map.getCenter(), -1, '')
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
