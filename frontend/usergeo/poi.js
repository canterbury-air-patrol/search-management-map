import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { SMMRealtime } from '../smmmap'

class SMMPOI {
  constructor(parent, poi) {
    this.parent = parent
    this.coords = poi.geometry.coordinates
    this.POILabel = poi.properties.label
    this.poiID = poi.properties.pk
    this.editCallback = this.editCallback.bind(this)
    this.setXHR = this.setXHR.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
    this.calculateTDVCallback = this.calculateTDVCallback.bind(this)
  }

  editCallback() {
    L.POIAdder(this.parent.map, this.parent.missionId, this.parent.csrftoken, L.latLng(this.coords[1], this.coords[0]), this.poiID, this.POILabel)
  }

  setXHR(xhr) {
    xhr.setRequestHeader('X-CSRFToken', this.parent.csrftoken)
  }

  deleteCallback() {
    $.ajax({
      url: `/data/usergeo/${this.poiID}/`,
      type: 'DELETE',
      beforeSend: this.setXHR
    })
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, this.parent.csrftoken, 'point', this.poiID)
  }

  calculateTDVCallback() {
    L.MarineVectors(this.parent.map, this.parent.missionId, this.parent.csrftoken, this.POILabel, L.latLng(this.coords[1], this.coords[0]), this.poiID)
  }

  createPopup(layer) {
    const popupContent = document.createElement('div')

    const data = [
      ['POI', this.POILabel],
      ['Lat', degreesToDM(this.coords[1], true)],
      ['Long', degreesToDM(this.coords[0])]
    ]

    for (const d in data) {
      const dl = document.createElement('dl')
      dl.className = 'poi row'

      const dt = document.createElement('dt')
      dt.className = 'asset-label col-sm-2'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'asset-name col-sm-10'
      dd.textContent = data[d][1]
      dl.appendChild(dd)

      popupContent.appendChild(dl)
    }

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      popupContent.appendChild(
        this.parent.createButtonGroup([
          {
            label: 'Move',
            onclick: this.editCallback,
            'btn-class': 'btn-light'
          },
          {
            label: 'Delete',
            onclick: this.deleteCallback,
            'btn-class': 'btn-danger'
          },
          {
            label: 'Create Search',
            onclick: this.createSearchCallback,
            'btn-class': 'btn-light'
          },
          {
            label: 'Calculate TDV',
            onclick: this.calculateTDVCallback,
            'btn-class': 'btn-light'
          },
          {
            label: 'Details',
            href: `/data/usergeo/${this.poiID}/`,
            'btn-class': 'btn-light'
          }
        ])
      )
    }

    layer.bindPopup(popupContent)
  }
}

class SMMPOIs extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)
    this.poiObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/pois/current/`
  }

  getObject(pk, poi) {
    if (!(pk in this.poiObjects)) {
      const poiObject = new SMMPOI(this, poi)
      this.poiObjects[pk] = poiObject
    }
    return this.poiObjects[pk]
  }

  createPopup(poi, layer) {
    this.getObject(poi.properties.pk, poi).createPopup(layer)
  }
}

export { SMMPOIs }
