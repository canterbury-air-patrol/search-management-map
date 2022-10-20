import L from 'leaflet'
import 'leaflet-realtime'

class SMMRealtime {
  constructor (map, missionId, interval, color) {
    this.map = map
    this.missionId = missionId
    this.interval = interval
    this.color = color
  }

  realtime () {
    const self = this
    return L.realtime({
      url: this.getUrl(),
      type: 'json'
    }, {
      interval: this.interval,
      color: this.color,
      onEachFeature: function (feature, layer) { self.createPopup(feature, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    })
  }

  createButtonGroup (data) {
    const btngroup = document.createElement('div')
    btngroup.className = 'btn-group'

    for (const d in data) {
      const btnData = data[d]
      const btn = document.createElement('button')
      btn.className = `btn ${btnData['btn-class']}`
      btn.onclick = btnData.onclick
      btn.textContent = btnData.label
      btngroup.appendChild(btn)
    }

    return btngroup
  }
}

export { SMMRealtime }
