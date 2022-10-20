import L from 'leaflet'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMLine extends SMMRealtime {
  getUrl () {
    return `/mission/${this.missionId}/data/userlines/current/`
  }

  createPopup (line, layer) {
    const LineLabel = line.properties.label
    const LineID = line.properties.pk
    const coords = line.geometry.coordinates

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'line row'
    const dt = document.createElement('dt')
    dt.className = 'line-label col-sm-3'
    dt.textContent = 'Line'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'line-name col-sm-9'
    dd.textContent = LineLabel
    dl.appendChild(dd)
    popupContent.appendChild(dl)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Edit',
          onclick: function () { L.LineAdder(self.map, self.missionId, self.csrftoken, coords.map(x => L.latLng(x[1], x[0])), LineID, LineLabel) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/userlines/${LineID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'line', LineID) },
          'btn-class': 'btn-light'
        }
      ]))
    }

    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

export { SMMLine }
