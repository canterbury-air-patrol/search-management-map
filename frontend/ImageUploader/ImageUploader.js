import $ from 'jquery'
import L from 'leaflet'

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
        '<div id="imageuploaderdialog"></div>',
        '<div>',
        '<button class="btn btn-primary" id="image_upload">Upload</button>',
        '<button class="btn btn-danger" id="image_cancel">Cancel</button>',
        '</div>'
      ].join('')
      const imageUploadDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()
      const imagePoint = L.marker(map.getCenter(), { draggable: true, autoPan: true }).addTo(map)
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
      $.get(`/mission/${self.options.missionId}/image/upload/`, {}, function (data) {
        $('#imageuploaderdialog').html(data)
      })
    })
    return container
  },

  onRemove: function () {}
})

L.control.imageuploader = function (opts) {
  return new L.Control.ImageUploader(opts)
}
