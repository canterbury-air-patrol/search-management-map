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

  /** Override to supply leaflet-realtime options on top of the base
   *  ({ interval, color, onEachFeature, getFeatureId }). Typical extras
   *  are updateFeature, pointToLayer, or a feature-specific
   *  getFeatureId. */
  protected featureOptions(): L.RealtimeOptions {
    return {}
  }

  realtime(): L.Realtime {
    return L.realtime(
      { url: this.getUrl(), type: 'json' },
      {
        interval: this.interval,
        color: this.color,
        onEachFeature: this.createPopup,
        getFeatureId: (feature: { properties: { pk: number } }) => feature.properties.pk,
        ...this.featureOptions()
      }
    )
  }
}

export { SMMRealtime }
