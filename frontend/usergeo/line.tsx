import L from 'leaflet'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { SMMRealtime } from '../smmmap'
import { SMMUserGeoLabelData, SMMUserGeoLineGeoJSON } from './types'
import { smmDelete } from '../ajax'
import { LinePopup } from './LinePopup'

class SMMLine {
  parent: SMMLines
  coords: [number, number][]
  data: SMMUserGeoLabelData
  constructor(parent: SMMLines, line: SMMUserGeoLineGeoJSON) {
    this.parent = parent
    this.coords = line.geometry.coordinates
    this.data = line.properties
    this.editCallback = this.editCallback.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
  }

  editCallback() {
    L.LineAdder(
      this.parent.map,
      this.parent.missionId,
      this.coords.map((x) => L.latLng(x[1], x[0])),
      this.data.pk,
      this.data.label
    )
  }

  deleteCallback() {
    smmDelete(`/data/usergeo/${this.data.pk}/`)
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, 'line', this.data.pk)
  }

  createPopup(layer: L.Layer) {
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    root.render(
      <LinePopup
        label={this.data.label}
        pk={this.data.pk}
        missionId={this.parent.missionId}
        onEdit={this.editCallback}
        onDelete={this.deleteCallback}
        onCreateSearch={this.createSearchCallback}
      />
    )
    layer.bindPopup(container, { minWidth: 200 })
  }
}

class SMMLines extends SMMRealtime {
  lineObjects: { [key: number]: SMMLine }
  constructor(map: L.Map, missionId: number | string, interval: number, color: hex) {
    super(map, missionId, interval, color)
    this.lineObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/userlines/current/`
  }

  getObject(pk: number, line: SMMUserGeoLineGeoJSON) {
    if (!(pk in this.lineObjects)) {
      const lineObject = new SMMLine(this, line)
      this.lineObjects[pk] = lineObject
    }
    return this.lineObjects[pk]
  }

  createPopup(line: SMMUserGeoLineGeoJSON, layer: L.Layer) {
    this.getObject(line.properties.pk, line).createPopup(layer)
  }
}

export { SMMLines }
