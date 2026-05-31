import L from 'leaflet'

import { SearchAdderDialog } from './SearchAdderDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'

type ObjectType = 'point' | 'line' | 'polygon'

function SearchAdder(map: L.Map, objectType: ObjectType, objectID: number) {
  renderInLeafletDialog(map, (onClose) => <SearchAdderDialog map={map} objectType={objectType} objectID={objectID} onClose={onClose} />)
}

export { SearchAdder }
