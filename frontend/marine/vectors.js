import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMMarineVector extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/sar/marine/vectors/current/`
  }

  createPopup(tdv, layer) {
    const tdvID = tdv.properties.pk

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'row'
    popupContent.appendChild(dl)

    const dt = document.createElement('dt')
    dt.className = 'image-label col-sm-2'
    dt.textContent = 'Total Drift Vector'
    dl.appendChild(dt)

    const dd = document.createElement('dd')
    dd.className = 'image-name col-sm-10'
    dd.textContent = tdvID
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      popupContent.appendChild(
        this.createButtonGroup([
          {
            label: 'Delete',
            onclick: function () {
              $.get(`/sar/marine/vectors/${tdvID}/delete/`)
            },
            'btn-class': 'btn-danger'
          }
        ])
      )
    }

    layer.bindPopup(popupContent)
  }
}

export { SMMMarineVector }
