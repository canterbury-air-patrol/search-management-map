import L from 'leaflet'

import { LineAdder } from '../LineAdder/LineAdder.js'
import { SearchAdder } from '../SearchAdder/SearchAdder.js'
import { SMMUserGeoLineGeoJSON } from './types'
import { LinePopup } from './LinePopup'
import { SMMUserGeoLayer, SMMUserGeoCollection } from './base'

class SMMLine extends SMMUserGeoLayer {
  coords: [number, number][]

  constructor(map: L.Map, missionId: number | string, line: SMMUserGeoLineGeoJSON) {
    super(map, missionId, line.properties)
    this.coords = line.geometry.coordinates
  }

  editCallback() {
    LineAdder(
      this.map,
      this.missionId,
      this.coords.map((x) => L.latLng(x[1], x[0])),
      this.data.pk,
      this.data.label
    )
  }

  createSearchCallback() {
    SearchAdder(this.map, 'line', this.data.pk)
  }

  getPopupOptions(): L.PopupOptions {
    return { minWidth: 200 }
  }

  renderPopup() {
    return (
      <LinePopup
        label={this.data.label}
        pk={this.data.pk}
        missionId={this.missionId}
        onEdit={this.editCallback}
        onDelete={this.deleteCallback}
        onCreateSearch={this.createSearchCallback}
      />
    )
  }
}

class SMMLines extends SMMUserGeoCollection<SMMUserGeoLineGeoJSON, SMMLine> {
  getUrl() {
    return `/mission/${this.missionId}/data/userlines/current/`
  }

  createObject(line: SMMUserGeoLineGeoJSON) {
    return new SMMLine(this.map, this.missionId, line)
  }
}

export { SMMLines }
