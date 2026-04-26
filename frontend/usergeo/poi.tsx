import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { smmDelete } from '../ajax'

import { SMMRealtime } from '../smmmap'

import { MarineVectorsLeaflet } from '../marine/leaflet'
import { SMMUserGeoLabelData, SMMUserGeoPOIGeoJSON } from './types'

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
    const popupContent = document.createElement('div')

    const data = [
      ['POI', this.data.label],
      ['Lat', degreesToDM(this.coords[1], true)],
      ['Long', degreesToDM(this.coords[0], false)]
    ]

    for (const d of data) {
      const dl = document.createElement('dl')
      dl.className = 'poi row'

      const dt = document.createElement('dt')
      dt.className = 'asset-label col-sm-2'
      dt.textContent = d[0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'asset-name col-sm-10'
      dd.textContent = d[1]
      dl.appendChild(dd)

      popupContent.appendChild(dl)
    }

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      popupContent.appendChild(
        this.parent.createButtonGroup([
          {
            label: 'Move',
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
            label: 'Calculate TDV',
            onclick: this.calculateTDVCallback,
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

    layer.bindPopup(popupContent)
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
