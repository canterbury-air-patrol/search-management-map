import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

export function renderInLeafletDialog(map: L.Map, render: (onClose: () => void) => React.ReactNode, dialogOptions: object = {}): void {
  const container = document.createElement('div')
  const dialog = L.control.dialog(dialogOptions).setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  const onClose = () => {
    root.unmount()
    dialog.destroy()
  }
  root.render(render(onClose) as React.ReactElement)
}
