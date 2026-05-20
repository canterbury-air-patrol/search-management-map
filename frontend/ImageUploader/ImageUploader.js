import $ from 'jquery'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPostBody } from '../ajax'

L.Control.ImageUploader = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onCancel: function () {
    this.latlngRoot.unmount()
    this.imageUploadDialog.destroy()
  },

  onSubmit: function () {
    const latLng = this.currentPos

    const formData = new FormData()
    formData.append('description', document.getElementById('image_upload_description').value)
    formData.append('latitude', latLng.lat)
    formData.append('longitude', latLng.lng)
    formData.append('file', document.getElementById('image_upload_file').files[0])

    smmPostBody(`/mission/${this.options.missionId}/image/upload/`, formData)

    this.latlngRoot.unmount()
    this.imageUploadDialog.destroy()
  },

  onClick: function () {
    const contents = [
      `<form method="post" enctype="multipart/form-data" id="image_upload_form" action="/mission/${this.options.missionId}/image/upload/">`,
      '<table>',
      '<tr>',
      '<td>File:</td>',
      '<td><input name="file" type="file" id="image_upload_file" accept="image/*" /></td>',
      '<tr>',
      '<tr>',
      '<td>Description:</td>',
      '<td><input name="description" id="image_upload_description" type="text" /></td>',
      '<tr>',
      '<tr>',
      '<td colspan="2"><div id="image_upload_latlng"></div></td>',
      '</tr>',
      '</table>',
      '</form>',
      '<div class="btn-class" role="group">',
      '<button class="btn btn-primary" id="image_upload">Upload</button>',
      '<button class="btn btn-danger" id="image_cancel">Cancel</button>',
      '</div>'
    ].join('')
    this.imageUploadDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.map).hideClose()

    this.currentPos = this.map.getCenter()
    this.latlngRoot = ReactDOM.createRoot(document.getElementById('image_upload_latlng'))
    this.latlngRoot.render(
      <LatLngMarkerInput
        map={this.map}
        initialPos={this.map.getCenter()}
        onChange={(p) => {
          this.currentPos = p
        }}
      />
    )

    $('#image_cancel').on('click', this.onCancel.bind(this))
    $('#image_upload').on('click', this.onSubmit.bind(this))
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'ImageUploader-container leaflet-bar'))
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
