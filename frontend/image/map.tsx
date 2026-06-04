import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import { SMMImageGeoJSON } from './types'
import { smmPatch } from '../ajax'
import { ImagePopup } from './ImagePopup'
import { mountPopup } from '../components/mountPopup'

abstract class SMMImage extends SMMRealtime {
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  protected override featureOptions() {
    return {
      pointToLayer: (_feature: SMMImageGeoJSON, latlng: L.LatLng) =>
        L.marker(latlng, {
          icon: L.icon({
            iconUrl: '/static/icons/image-x-generic.png',
            iconSize: [24, 24]
          })
        })
    }
  }

  createPopup(image: SMMImageGeoJSON, layer: L.Layer) {
    const imageID = image.properties.pk
    mountPopup(
      layer,
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
  }
}

class SMMImageAll extends SMMImage {
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/all/`
  }
}

class SMMImageImportant extends SMMImage {
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/important/`
  }
}

export { SMMImageAll, SMMImageImportant }
