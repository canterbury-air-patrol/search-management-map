import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { SMMRealtime } from '../smmmap'

class SMMPOI extends SMMRealtime {
  getUrl () {
    return `/mission/${this.missionId}/data/pois/current/`
  }

  createPopup (poi, layer) {
    const POILabel = poi.properties.label
    const poiID = poi.properties.pk
    const coords = poi.geometry.coordinates

    const popupContent = document.createElement('div')

    const data = [
      ['POI', POILabel],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
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

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this

      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Move',
          onclick: function () { L.POIAdder(self.map, self.missionId, self.csrftoken, L.latLng(coords[1], coords[0]), poiID, POILabel) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/pois/${poiID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'point', poiID) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Calculate TDV',
          onclick: function () { L.MarineVectors(self.map, self.missionId, self.csrftoken, POILabel, L.latLng(coords[1], coords[0]), poiID) },
          'btn-class': 'btn-light'
        }
      ]))
    }

    layer.bindPopup(popupContent)
  }
}

export { SMMPOI }
