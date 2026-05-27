import L from 'leaflet'
import React from 'react'

import { SMMUserGeoPolygonGeoJSON } from './types'
import { PolygonPopup } from './PolygonPopup'
import { SMMUserGeoLayer, SMMUserGeoCollection } from './base'

class SMMPolygon extends SMMUserGeoLayer {
  coords: [number, number][][]

  constructor(map: L.Map, missionId: number | string, polygon: SMMUserGeoPolygonGeoJSON) {
    super(map, missionId, polygon.properties)
    this.coords = polygon.geometry.coordinates
  }

  editCallback() {
    L.PolygonAdder(
      this.map,
      this.missionId,
      this.coords[0].map((x) => L.latLng(x[1], x[0])),
      this.data.pk,
      this.data.label
    )
  }

  createSearchCallback() {
    L.SearchAdder(this.map, 'polygon', this.data.pk)
  }

  getPopupOptions(): L.PopupOptions {
    return { minWidth: 200 }
  }

  renderPopup() {
    return (
      <PolygonPopup
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

class SMMPolygons extends SMMUserGeoCollection<SMMUserGeoPolygonGeoJSON, SMMPolygon> {
  getUrl() {
    return `/mission/${this.missionId}/data/userpolygons/current/`
  }

  createObject(polygon: SMMUserGeoPolygonGeoJSON) {
    return new SMMPolygon(this.map, this.missionId, polygon)
  }
}

export { SMMPolygons }
