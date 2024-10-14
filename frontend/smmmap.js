import L from 'leaflet'
import 'leaflet-realtime'

class SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    this.map = map
    this.csrftoken = csrftoken
    this.missionId = missionId
    this.interval = interval
    this.color = color
  }

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
        getFeatureId: function (feature) {
          return feature.properties.pk
        }
      }
    )
  }

  createButtonGroup(data) {
    const btngroup = document.createElement('div')
    btngroup.className = 'btn-group'

    for (const d in data) {
      const btnData = data[d]
      const btn = document.createElement('button')
      btn.className = `btn ${btnData['btn-class']}`
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
