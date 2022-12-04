import L from 'leaflet'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMPolygon extends SMMRealtime {
  getUrl () {
    return `/mission/${this.missionId}/data/userpolygons/current/`
  }

  createPopup (poly, layer) {
    const PolyLabel = poly.properties.label
    const PolyID = poly.properties.pk
    const coords = poly.geometry.coordinates

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
    dd.textContent = PolyLabel
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Edit',
          onclick: function () {
            const points = []
            for (const i in coords[0]) {
              points.push(L.latLng(coords[0][i][1], coords[0][i][0]))
            }
            L.PolygonAdder(self.map, self.missionId, self.csrftoken, points, PolyID, PolyLabel).create()
          },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/userpolygons/${PolyID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'polygon', PolyID) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Details',
          href: `/mission/${self.missionId}/data/userpolygons/${PolyID}/details/`,
          'btn-class': 'btn-light'
        }
      ]))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

export { SMMPolygon }
