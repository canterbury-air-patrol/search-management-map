import L from 'leaflet'
import React from 'react'

import { MarineVectorsLeaflet } from '../marine/leaflet'
import { POIAdder } from '../POIAdder/POIAdder.js'
import { SearchAdder } from '../SearchAdder/SearchAdder.js'
import { SMMUserGeoPOIGeoJSON } from './types'
import { POIPopup } from './POIPopup'
import { SMMUserGeoLayer, SMMUserGeoCollection } from './base'

class SMMPOI extends SMMUserGeoLayer {
  coords: [number, number]

  constructor(map: L.Map, missionId: number | string, poi: SMMUserGeoPOIGeoJSON) {
    super(map, missionId, poi.properties)
    this.coords = poi.geometry.coordinates
    this.calculateTDVCallback = this.calculateTDVCallback.bind(this)
  }

  editCallback() {
    POIAdder(this.map, this.missionId, L.latLng(this.coords[1], this.coords[0]), this.data.pk, this.data.label)
  }

  createSearchCallback() {
    SearchAdder(this.map, 'point', this.data.pk)
  }

  calculateTDVCallback() {
    MarineVectorsLeaflet(this.map, this.missionId, this.data.label, L.latLng(this.coords[1], this.coords[0]), this.data.pk)
  }

  renderPopup() {
    return (
      <POIPopup
        label={this.data.label}
        coords={this.coords}
        pk={this.data.pk}
        missionId={this.missionId}
        onEdit={this.editCallback}
        onDelete={this.deleteCallback}
        onCreateSearch={this.createSearchCallback}
        onCalculateTDV={this.calculateTDVCallback}
      />
    )
  }
}

class SMMPOIs extends SMMUserGeoCollection<SMMUserGeoPOIGeoJSON, SMMPOI> {
  getUrl() {
    return `/mission/${this.missionId}/data/pois/current/`
  }

  createObject(poi: SMMUserGeoPOIGeoJSON) {
    return new SMMPOI(this.map, this.missionId, poi)
  }
}

export { SMMPOIs }
