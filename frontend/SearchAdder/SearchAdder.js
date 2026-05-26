import React from 'react'
import L from 'leaflet'

import { SearchAdderDialog } from './SearchAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

L.SearchAdder = function (map, objectType, objectID) {
  renderInLeafletDialog(map, (onClose) => <SearchAdderDialog map={map} objectType={objectType} objectID={objectID} onClose={onClose} />)
}
