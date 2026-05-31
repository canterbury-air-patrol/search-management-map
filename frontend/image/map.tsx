import L from 'leaflet'
import * as ReactDOM from 'react-dom/client'

import { SMMRealtime } from '../smmmap'
import { SMMImageGeoJSON } from './types'
import { smmPatch } from '../ajax'
import { ImagePopup } from './ImagePopup'

abstract class SMMImage extends SMMRealtime {
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
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
        getFeatureId: function (feature: SMMImageGeoJSON) {
          return feature.properties.pk
        },
        pointToLayer: function (feature: SMMImageGeoJSON, latlng: L.LatLng) {
          return L.marker(latlng, {
            icon: L.icon({
              iconUrl: '/static/icons/image-x-generic.png',
              iconSize: [24, 24]
            })
          })
        }
      }
    )
  }

  createPopup(image: SMMImageGeoJSON, layer: L.Layer) {
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    const imageID = image.properties.pk
    root.render(
      <ImagePopup
        description={image.properties.description}
        pk={imageID}
        coords={image.geometry.coordinates}
        priority={image.properties.priority}
        missionId={this.missionId}
        onPrioritize={() => smmPatch(`/image/${imageID}/priority/`, { priority: true })}
        onDeprioritize={() => smmPatch(`/image/${imageID}/priority/`, { priority: false })}
      />
    )
    layer.bindPopup(container)
    layer.once('remove', () => root.unmount())
  }
}

class SMMImageAll extends SMMImage {
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/all/`
  }
}

class SMMImageImportant extends SMMImage {
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/important/`
  }
}

export { SMMImageAll, SMMImageImportant }
