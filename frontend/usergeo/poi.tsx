import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmDelete } from '../ajax'

import { SMMRealtime } from '../smmmap'

import { MarineVectorsLeaflet } from '../marine/leaflet'
import { SMMUserGeoLabelData, SMMUserGeoPOIGeoJSON } from './types'
import { POIPopup } from './POIPopup'

class SMMPOI {
  parent: SMMPOIs
  coords: [number, number]
  data: SMMUserGeoLabelData
  constructor(parent: SMMPOIs, poi: SMMUserGeoPOIGeoJSON) {
    this.parent = parent
    this.coords = poi.geometry.coordinates
    this.data = poi.properties
    this.editCallback = this.editCallback.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
    this.calculateTDVCallback = this.calculateTDVCallback.bind(this)
  }

  editCallback() {
    L.POIAdder(this.parent.map, this.parent.missionId, L.latLng(this.coords[1], this.coords[0]), this.data.pk, this.data.label)
  }

  deleteCallback() {
    smmDelete(`/data/usergeo/${this.data.pk}/`)
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, 'point', this.data.pk)
  }

  calculateTDVCallback() {
    MarineVectorsLeaflet(this.parent.map, this.parent.missionId, this.data.label, L.latLng(this.coords[1], this.coords[0]), this.data.pk)
  }

  createPopup(layer: L.Layer) {
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    root.render(
      <POIPopup
        label={this.data.label}
        coords={this.coords}
        pk={this.data.pk}
        missionId={this.parent.missionId}
        onEdit={this.editCallback}
        onDelete={this.deleteCallback}
        onCreateSearch={this.createSearchCallback}
        onCalculateTDV={this.calculateTDVCallback}
      />
    )
    layer.bindPopup(container)
    layer.on('remove', () => root.unmount())
  }
}

class SMMPOIs extends SMMRealtime {
  poiObjects: { [key: string]: SMMPOI }
  constructor(map: L.Map, missionId: string | number, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.poiObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/pois/current/`
  }

  getObject(pk: number, poi: SMMUserGeoPOIGeoJSON) {
    if (!(pk in this.poiObjects)) {
      const poiObject = new SMMPOI(this, poi)
      this.poiObjects[pk] = poiObject
    }
    return this.poiObjects[pk]
  }

  createPopup(poi: SMMUserGeoPOIGeoJSON, layer: L.Layer) {
    this.getObject(poi.properties.pk, poi).createPopup(layer)
  }
}

export { SMMPOIs }
