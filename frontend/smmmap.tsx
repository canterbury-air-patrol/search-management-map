import L from 'leaflet'
import 'leaflet-realtime'

interface SMMRealtimeButtons {
  btnClass: string
  label: string
  onclick?: () => void
  href?: string
}

abstract class SMMRealtime {
  map: L.Map
  csrftoken: string
  missionId: number | string
  interval: number
  color: string

  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string) {
    this.map = map
    this.csrftoken = csrftoken
    this.missionId = missionId
    this.interval = interval
    this.color = color
  }

  abstract getUrl(): string
  abstract createPopup(feature: { properties: object }, layer: L.Layer): void

  realtime() {
    return L.realtime(
      {
        url: this.getUrl(),
        type: 'json'
      },
      {
        interval: this.interval,
        color: this.color,
        onEachFeature: this.createPopup,
        getFeatureId: function (feature: { properties: { pk: number } }) {
          return feature.properties.pk
        }
      }
    )
  }

  createButtonGroup(data: Array<SMMRealtimeButtons>) {
    const btngroup = document.createElement('div')
    btngroup.className = 'btn-group'

    for (const btnData of data) {
      const btn = document.createElement('button')
      btn.className = `btn ${btnData['btnClass']}`
      if (btnData.onclick !== undefined) {
        btn.onclick = btnData.onclick
      }
      btn.textContent = btnData.label
      if (btnData.href !== undefined) {
        const a = document.createElement('a')
        a.href = btnData.href
        a.appendChild(btn)
        btngroup.appendChild(a)
      } else {
        btngroup.appendChild(btn)
      }
    }

    return btngroup
  }
}

export { SMMRealtime }
