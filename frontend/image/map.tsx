import L from 'leaflet'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { SMMRealtime } from '../smmmap'
import { SMMImageGeoJSON } from './types'
import { smmGet } from '../ajax'
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
        onPrioritize={() => smmGet(`/image/${imageID}/priority/set/`)}
        onDeprioritize={() => smmGet(`/image/${imageID}/priority/unset/`)}
      />
    )
    layer.bindPopup(container)
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
