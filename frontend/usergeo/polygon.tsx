import L from 'leaflet'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmDelete } from '../ajax'

import { SMMRealtime } from '../smmmap'
import { SMMUserGeoLabelData, SMMUserGeoPolygonGeoJSON } from './types'
import { PolygonPopup } from './PolygonPopup'

class SMMPolygon {
  parent: SMMPolygons
  coords: [number, number][][]
  data: SMMUserGeoLabelData
  constructor(parent: SMMPolygons, polygon: SMMUserGeoPolygonGeoJSON) {
    this.parent = parent
    this.data = polygon.properties
    this.coords = polygon.geometry.coordinates
    this.editCallback = this.editCallback.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
  }

  editCallback() {
    L.PolygonAdder(
      this.parent.map,
      this.parent.missionId,
      this.coords[0].map((x) => L.latLng(x[1], x[0])),
      this.data.pk,
      this.data.label
    )
  }

  deleteCallback() {
    smmDelete(`/data/usergeo/${this.data.pk}/`)
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, 'polygon', this.data.pk)
  }

  createPopup(layer: L.Layer) {
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    root.render(
      <PolygonPopup
        label={this.data.label}
        pk={this.data.pk}
        missionId={this.parent.missionId}
        onEdit={this.editCallback}
        onDelete={this.deleteCallback}
        onCreateSearch={this.createSearchCallback}
      />
    )
    layer.bindPopup(container, { minWidth: 200 })
    layer.on('remove', () => root.unmount())
  }
}

class SMMPolygons extends SMMRealtime {
  polygonObjects: { [key: number]: SMMPolygon }
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.polygonObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/userpolygons/current/`
  }

  getObject(pk: number, polygon: SMMUserGeoPolygonGeoJSON) {
    if (!(pk in this.polygonObjects)) {
      const polygonObject = new SMMPolygon(this, polygon)
      this.polygonObjects[pk] = polygonObject
    }
    return this.polygonObjects[pk]
  }

  createPopup(polygon: SMMUserGeoPolygonGeoJSON, layer: L.Layer) {
    this.getObject(polygon.properties.pk, polygon).createPopup(layer)
  }
}

export { SMMPolygons }
