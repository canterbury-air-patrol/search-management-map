import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import { SMMUserGeoLabelData, SMMUserGeoLineGeoJSON } from './types'
import { smmDelete } from '../ajax'

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
    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'line row'
    const dt = document.createElement('dt')
    dt.className = 'line-label col-sm-3'
    dt.textContent = 'Line'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'line-name col-sm-9'
    dd.textContent = this.data.label
    dl.appendChild(dd)
    popupContent.appendChild(dl)

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      popupContent.appendChild(
        this.parent.createButtonGroup([
          {
            label: 'Edit',
            onclick: this.editCallback,
            btnClass: 'btn-light'
          },
          {
            label: 'Delete',
            onclick: this.deleteCallback,
            btnClass: 'btn-danger'
          },
          {
            label: 'Create Search',
            onclick: this.createSearchCallback,
            btnClass: 'btn-light'
          },
          {
            label: 'Details',
            href: `/data/usergeo/${this.data.pk}/`,
            btnClass: 'btn-light'
          }
        ])
      )
    }

    layer.bindPopup(popupContent, { minWidth: 200 })
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
