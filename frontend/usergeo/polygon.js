import L from 'leaflet'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMPolygon {
  constructor(parent, polygon) {
    this.parent = parent
    this.PolyLabel = polygon.properties.label
    this.PolyID = polygon.properties.pk
    this.coords = polygon.geometry.coordinates
    this.editCallback = this.editCallback.bind(this)
    this.setXHR = this.setXHR.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
  }

  editCallback() {
    L.PolygonAdder(
      this.parent.map,
      this.parent.missionId,
      this.parent.csrftoken,
      this.coords[0].map((x) => L.latLng(x[1], x[0])),
      this.PolyID,
      this.PolyLabel
    )
  }

  setXHR(xhr) {
    xhr.setRequestHeader('X-CSRFToken', this.parent.csrftoken)
  }

  deleteCallback() {
    $.ajax({
      url: `/data/usergeo/${this.PolyID}/`,
      type: 'DELETE',
      beforeSend: this.setXHR
    })
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, this.parent.csrftoken, 'polygon', this.PolyID)
  }

  createPopup(layer) {
    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'polygon row'
    popupContent.appendChild(dl)
    const dt = document.createElement('dt')
    dt.className = 'polygon-label col-sm-3'
    dt.textContent = 'Polygon'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'polygon-name col-sm-9'
    dd.textContent = this.PolyLabel
    dl.appendChild(dd)

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      popupContent.appendChild(
        this.parent.createButtonGroup([
          {
            label: 'Edit',
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
            label: 'Details',
            href: `/data/usergeo/${this.PolyID}/`,
            'btn-class': 'btn-light'
          }
        ])
      )
    }

    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

class SMMPolygons extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)
    this.polygonObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/userpolygons/current/`
  }

  getObject(pk, polygon) {
    if (!(pk in this.polygonObjects)) {
      const polygonObject = new SMMPolygon(this, polygon)
      this.polygonObjects[pk] = polygonObject
    }
    return this.polygonObjects[pk]
  }

  createPopup(polygon, layer) {
    this.getObject(polygon.properties.pk, polygon).createPopup(layer)
  }
}

export { SMMPolygons }
