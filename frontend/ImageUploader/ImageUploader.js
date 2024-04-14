import $ from 'jquery'
import L from 'leaflet'

import { MappedMarker } from '../smmleaflet'

L.Control.ImageUploader = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onCancel: function () {
    this.map.removeLayer(this.mappedMarker.getMarker())
    this.imageUploadDialog.destroy()
  },

  onSubmit: function () {
    $('#image_upload_form').submit()
    this.map.removeLayer(this.mappedMarker.getMarker())
    this.imageUploadDialog.destroy()
  },

  onClick: function () {
    const contents = [
      `<form method="post" enctype="multipart/form-data" id="image_upload_form" action="/mission/${this.options.missionId}/image/upload/">`,
      `<input name="csrfmiddlewaretoken" type="hidden" value="${this.options.csrftoken}" />`,
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
    this.imageUploadDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.map).hideClose()
    this.mappedMarker = new MappedMarker($('#image_upload_lat'), $('#image_upload_long'), this.map.getCenter())
    this.mappedMarker.getMarker().addTo(this.map)

    $('#image_cancel').on('click', this.onCancel.bind(this))
    $('#image_upload').on('click', this.onSubmit.bind(this))
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'ImageUploader-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Image Uploader'
    const imageImg = L.DomUtil.create('img', 'ImageUploader-marker', link)
    imageImg.src = '/static/icons/image-x-generic.png'
    imageImg.alt = 'Image Uploader'
    this.map = map
    L.DomEvent.disableClickPropagation(link)
    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))
    return container
  },

  onRemove: function () {}
})

L.control.imageuploader = function (opts) {
  return new L.Control.ImageUploader(opts)
}
