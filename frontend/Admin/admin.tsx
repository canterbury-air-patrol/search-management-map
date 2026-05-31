import { MissionId } from '../mission/MissionId'
import L from 'leaflet'
import * as ReactDOM from 'react-dom/client'

import { AdminMenuDialog } from './AdminMenuDialog'
import { AssetCommandDialog } from './AssetCommandDialog'

interface SMMAdminOptions extends L.ControlOptions {
  missionId: MissionId
}

function openAssetCommand(map: L.Map, missionId: MissionId) {
  const container = document.createElement('div')
  const dialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  const close = () => {
    root.unmount()
    dialog.destroy()
  }
  root.render(<AssetCommandDialog map={map} missionId={missionId} onClose={close} />)
}

class SMMAdminControl extends L.Control {
  options!: SMMAdminOptions
  private map?: L.Map
  private adminDialog?: L.Control.Dialog

  constructor(options: SMMAdminOptions) {
    super({ position: 'bottomleft', ...options })
  }

  private onCommand = () => {
    if (this.map) openAssetCommand(this.map, this.options.missionId)
  }

  private onClick = () => {
    if (!this.map) return
    const container = document.createElement('div')
    this.adminDialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(this.map).hideClose()
    const root = ReactDOM.createRoot(container)
    const close = () => {
      root.unmount()
      this.adminDialog?.destroy()
      this.adminDialog = undefined
    }
    root.render(<AdminMenuDialog onCommand={this.onCommand} onClose={close} />)
  }

  onAdd(map: L.Map): HTMLElement {
    const container = L.DomUtil.create('div', 'SMMAdmin-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Admin'

    const adminImg = L.DomUtil.create('img', 'SMMAdmin-marker', link)
    adminImg.src = '/static/icons/administration.png'
    adminImg.alt = 'Admin'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick)

    return container
  }

  onRemove(): void {}
}

L.control.smmadmin = function (opts: SMMAdminOptions) {
  return new SMMAdminControl(opts)
}
