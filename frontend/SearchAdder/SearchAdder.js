import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { SearchAdderDialog } from './SearchAdderDialog'

L.SearchAdder = function (map, objectType, objectID) {
  const container = document.createElement('div')
  const dialog = L.control.dialog({}).setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  root.render(
    <SearchAdderDialog
      map={map}
      objectType={objectType}
      objectID={objectID}
      onClose={() => {
        root.unmount()
        dialog.destroy()
      }}
    />
  )
}
