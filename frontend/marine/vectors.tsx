import { SMMRealtime } from '../smmmap'
import { TotalDriftVectorData } from './types'
import { smmGet } from '../ajax'

class SMMMarineVector extends SMMRealtime {
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/sar/marine/vectors/current/`
  }

  createPopup(tdv: { properties: TotalDriftVectorData }, layer: L.Layer) {
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
    dd.textContent = tdvID.toString()
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      popupContent.appendChild(
        this.createButtonGroup([
          {
            label: 'Delete',
            onclick: function () {
              smmGet(`/sar/marine/vectors/${tdvID}/delete/`)
            },
            btnClass: 'btn-danger'
          }
        ])
      )
    }

    layer.bindPopup(popupContent)
  }
}

export { SMMMarineVector }
