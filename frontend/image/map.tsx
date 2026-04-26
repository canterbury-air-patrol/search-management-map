import L from 'leaflet'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { SMMRealtime } from '../smmmap'
import { SMMImageGeoJSON } from './types'
import { smmGet } from '../ajax'

abstract class SMMImage extends SMMRealtime {
  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string) {
    super(map, csrftoken, missionId, interval, color)

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
    const ImageDesc = image.properties.description
    const imageID = image.properties.pk
    const coords = image.geometry.coordinates

    const popupContent = document.createElement('div')

    const dl = document.createElement('dl')
    dl.className = 'row'
    popupContent.appendChild(dl)

    const data = [
      ['Image', ImageDesc],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0], false)]
    ]

    for (const d of data) {
      const dt = document.createElement('dt')
      dt.className = 'image-label col-sm-2'
      dt.textContent = d[0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'image-name col-sm-10'
      dd.textContent = d[1]
      dl.appendChild(dd)
    }

    const div = document.createElement('div')
    div.style = 'width: 128px'
    popupContent.appendChild(div)
    const a = document.createElement('a')
    a.href = `/image/${imageID}/full/`
    div.appendChild(a)
    const img = document.createElement('img')
    img.src = `/image/${imageID}/thumbnail/`
    a.appendChild(img)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      if (image.properties.priority) {
        popupContent.appendChild(
          this.createButtonGroup([
            {
              label: 'Deprioritize',
              onclick: function () {
                smmGet(`/image/${imageID}/priority/unset/`)
              },
              btnClass: 'btn-light'
            }
          ])
        )
      } else {
        popupContent.appendChild(
          this.createButtonGroup([
            {
              label: 'Prioritize',
              onclick: function () {
                smmGet(`/image/${imageID}/priority/set/`)
              },
              btnClass: 'btn-light'
            }
          ])
        )
      }
    }

    layer.bindPopup(popupContent)
  }
}

class SMMImageAll extends SMMImage {
  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string) {
    super(map, csrftoken, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/all/`
  }
}

class SMMImageImportant extends SMMImage {
  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string) {
    super(map, csrftoken, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/image/list/important/`
  }
}

export { SMMImageAll, SMMImageImportant }
