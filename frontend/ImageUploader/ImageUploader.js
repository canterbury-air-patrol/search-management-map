import $ from 'jquery'
import L from 'leaflet'

import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

L.Control.ImageUploader = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'ImageUploader-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Image Uploader'
    const imageImg = L.DomUtil.create('img', 'ImageUploader-marker', link)
    imageImg.src = '/static/icons/image-x-generic.png'
    imageImg.alt = 'Image Uploader'
    const self = this
    L.DomEvent.disableClickPropagation(link)
    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', function () {
      const contents = [
        `<form method="post" enctype="multipart/form-data" id="image_upload_form" action="/mission/${self.options.missionId}/image/upload/">`,
        `<input name="csrfmiddlewaretoken" type="hidden" value="${self.options.csrftoken}" />`,
        '<table>',
        '<tr>',
        '<td>File:</td>',
        '<td><input name="file" type="file" accept="image/*" /></td>',
        '<tr>',
        '<tr>',
        '<td>Description:</td>',
        '<td><input name="description" type="text" /></td>',
        '<tr>',
        '<td>Latitude</td>',
        '<td>Longitude</td>',
        '</tr>',
        '<tr>',
        '<td><input name="latitude" id="image_upload_lat" type="text" /></td>',
        '<td><input name="longitude" id="image_upload_long" type="text" /></td>',
        '</tr>',
        '</table>',
        '</form>',
        '<div class="btn-class" role="group">',
        '<button class="btn btn-primary" id="image_upload">Upload</button>',
        '<button class="btn btn-danger" id="image_cancel">Cancel</button>',
        '</div>'
      ].join('')
      const imageUploadDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()
      const imagePoint = L.marker(map.getCenter(), { draggable: true, autoPan: true }).addTo(map)
      function updateTxtLatLng () {
        const markerCoords = imagePoint.getLatLng()
        $('#image_upload_lat').val(degreesToDM(markerCoords.lat, true))
        $('#image_upload_long').val(degreesToDM(markerCoords.lng, false))
      }
      updateTxtLatLng()
      imagePoint.on('dragend', updateTxtLatLng)
      function updateLatLng () {
        const latLng = L.latLng(DMToDegrees($('#image_upload_lat').val()), DMToDegrees($('#image_upload_long').val()))
        imagePoint.setLatLng(latLng)
      }
      $('#image_upload_lat').on('change keydown paste input', updateLatLng)
      $('#image_upload_long').on('change keydown paste input', updateLatLng)
      $('#image_cancel').on('click', function () {
        map.removeLayer(imagePoint)
        imageUploadDialog.destroy()
      })
      $('#image_upload').on('click', function () {
        // Update the lat/long and then submit the form
        const coords = imagePoint.getLatLng()
        $('#image_upload_lat').val(coords.lat)
        $('#image_upload_long').val(coords.lng)
        $('#image_upload_form').submit()
        map.removeLayer(imagePoint)
        imageUploadDialog.destroy()
      })
    })
    return container
  },

  onRemove: function () {}
})

L.control.imageuploader = function (opts) {
  return new L.Control.ImageUploader(opts)
}
