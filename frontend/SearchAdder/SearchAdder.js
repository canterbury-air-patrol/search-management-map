import React from 'react'

import { SearchAdderDialog } from './SearchAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

function SearchAdder(map, objectType, objectID) {
  renderInLeafletDialog(map, (onClose) => <SearchAdderDialog map={map} objectType={objectType} objectID={objectID} onClose={onClose} />)
}

export { SearchAdder }
