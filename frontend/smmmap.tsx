import { MissionId } from './mission/MissionId'
import L from 'leaflet'
import 'leaflet-realtime'

abstract class SMMRealtime {
  map: L.Map
  missionId: MissionId
  interval: number
  color: string

  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    this.map = map
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
}

export { SMMRealtime }
