import L from 'leaflet'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMLine {
  constructor(parent, line) {
    this.parent = parent
    this.coords = line.geometry.coordinates
    this.LineLabel = line.properties.label
    this.LineID = line.properties.pk
    this.setXHR = this.setXHR.bind(this)
    this.editCallback = this.editCallback.bind(this)
    this.deleteCallback = this.deleteCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
  }

  editCallback() {
    L.LineAdder(
      this.parent.map,
      this.parent.missionId,
      this.parent.csrftoken,
      this.coords.map((x) => L.latLng(x[1], x[0])),
      this.LineID,
      this.LineLabel
    )
  }

  setXHR(xhr) {
    xhr.setRequestHeader('X-CSRFToken', this.parent.csrftoken)
  }

  deleteCallback() {
    $.ajax({
      url: `/data/usergeo/${this.LineID}/`,
      type: 'DELETE',
      beforeSend: this.setXHR
    })
  }

  createSearchCallback() {
    L.SearchAdder(this.parent.map, this.parent.csrftoken, 'line', this.LineID)
  }

  createPopup(layer) {
    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'line row'
    const dt = document.createElement('dt')
    dt.className = 'line-label col-sm-3'
    dt.textContent = 'Line'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'line-name col-sm-9'
    dd.textContent = this.LineLabel
    dl.appendChild(dd)
    popupContent.appendChild(dl)

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
            href: `/data/usergeo/${this.LineID}/`,
            'btn-class': 'btn-light'
          }
        ])
      )
    }

    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

class SMMLines extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)
    this.lineObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/userlines/current/`
  }

  getObject(pk, line) {
    if (!(pk in this.lineObjects)) {
      const lineObject = new SMMLine(this, line)
      this.lineObjects[pk] = lineObject
    }
    return this.lineObjects[pk]
  }

  createPopup(line, layer) {
    this.getObject(line.properties.pk, line).createPopup(layer)
  }
}

export { SMMLines }
