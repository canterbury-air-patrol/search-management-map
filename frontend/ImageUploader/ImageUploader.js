import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { ImageUploaderDialog } from './ImageUploaderDialog'

L.Control.ImageUploader = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    const container = document.createElement('div')
    this.imageUploadDialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(this.map).hideClose()
    const root = ReactDOM.createRoot(container)
    root.render(
      <ImageUploaderDialog
        map={this.map}
        missionId={this.options.missionId}
        onClose={() => {
          root.unmount()
          this.imageUploadDialog.destroy()
        }}
      />
    )
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
