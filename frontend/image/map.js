import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

import { SMMRealtime } from '../smmmap'

class SMMImage extends SMMRealtime {
  constructor (map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  realtime () {
    return L.realtime({
      url: this.getUrl(),
      type: 'json'
    }, {
      interval: this.interval,
      color: this.color,
      onEachFeature: this.createPopup,
      getFeatureId: function (feature) { return feature.properties.pk },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: '/static/icons/image-x-generic.png',
            iconSize: [24, 24]
          })
        })
      }
    })
  }

  createPopup (image, layer) {
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
      ['Long', degreesToDM(coords[0])]
    ]

    for (const d in data) {
      const dt = document.createElement('dt')
      dt.className = 'image-label col-sm-2'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'image-name col-sm-10'
      dd.textContent = data[d][1]
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
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Deprioritize',
            onclick: function () { $.get(`/image/${imageID}/priority/unset/`) },
            'btn-class': 'btn-light'
          }
        ]))
      } else {
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Prioritize',
            onclick: function () { $.get(`/image/${imageID}/priority/set/`) },
            'btn-class': 'btn-light'
          }
        ]))
      }
    }

    layer.bindPopup(popupContent)
  }
}

class SMMImageAll extends SMMImage {
  constructor (map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl () {
    return `/mission/${this.missionId}/image/list/all/`
  }
}

class SMMImageImportant extends SMMImage {
  constructor (map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)
    this.getUrl = this.getUrl.bind(this)
  }

  getUrl () {
    return `/mission/${this.missionId}/image/list/important/`
  }
}

export { SMMImageAll, SMMImageImportant }
