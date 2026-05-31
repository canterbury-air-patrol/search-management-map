import L from 'leaflet'
import * as ReactDOM from 'react-dom/client'

import { AdminMenuDialog } from './AdminMenuDialog'
import { AssetCommandDialog } from './AssetCommandDialog'

L.SMMAdmin = {}

L.SMMAdmin.AssetCommand = function (map, missionId) {
  const container = document.createElement('div')
  const dialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  const close = () => {
    root.unmount()
    dialog.destroy()
  }
  root.render(<AssetCommandDialog map={map} missionId={missionId} onClose={close} />)
}

L.Control.SMMAdmin = L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onCommand: function () {
    L.SMMAdmin.AssetCommand(this.map, this.options.missionId)
  },

  onClick: function () {
    const container = document.createElement('div')
    this.AdminDialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(this.map).hideClose()
    const root = ReactDOM.createRoot(container)
    const close = () => {
      root.unmount()
      this.AdminDialog.destroy()
      this.AdminDialog = undefined
    }
    root.render(<AdminMenuDialog onCommand={this.onCommand.bind(this)} onClose={close} />)
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'SMMAdmin-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Admin'

    const adminImg = L.DomUtil.create('img', 'SMMAdmin-marker', link)

    adminImg.src = '/static/icons/administration.png'
    adminImg.alt = 'Admin'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

L.control.smmadmin = function (opts) {
  return new L.Control.SMMAdmin(opts)
}
