import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'

class SMMAsset {
  constructor (missionId, assetName, color) {
    this.missionId = missionId
    this.assetName = assetName
    this.color = color
    this.lastUpdate = null
    this.path = []
    this.updating = false
    this.polyline = L.polyline([], { color: this.color })
  }

  overlay () {
    return this.polyline
  }

  update () {
    if (this.updating) { return }
    this.updating = true

    let assetUrl = `/mission/${this.missionId}/data/assets/${this.assetName}/position/history/?oldest=last`
    if (this.lastUpdate != null) {
      assetUrl = `${assetUrl}&from=${this.lastUpdate}`
    }

    const self = this
    $.ajax({
      type: 'GET',
      url: assetUrl,
      success: function (route) {
        for (const f in route.features) {
          const lon = route.features[f].geometry.coordinates[0]
          const lat = route.features[f].geometry.coordinates[1]
          self.path.push(L.latLng(lat, lon))
          self.lastUpdate = route.features[f].properties.created_at
        }
        self.polyline.setLatLngs(self.path)
        self.updating = false
      },
      error: function () {
        self.updating = false
      }
    })
  }
}

class SMMAssets extends SMMRealtime {
  constructor (map, csrftoken, missionId, interval, color, overlayAdd) {
    super(map, csrftoken, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.assetObjects = {}
  }

  getUrl () {
    return `/mission/${this.missionId}/data/assets/positions/latest/`
  }

  realtime () {
    const self = this
    return L.realtime({
      url: this.getUrl(),
      type: 'json'
    }, {
      interval: this.interval,
      onEachFeature: function (asset, layer) { self.createPopup(asset, layer) },
      updateFeature: function (asset, oldLayer) { self.assetUpdate(asset, oldLayer) },
      getFeatureId: function (feature) { return feature.properties.asset }
    })
  }

  createAsset (assetName) {
    if (!(assetName in this.assetObjects)) {
      /* Create an overlay for this object */
      const assetObject = new SMMAsset(this.missionId, assetName, this.color)
      this.assetObjects[assetName] = assetObject
      this.overlayAdd(assetName, assetObject.overlay())
    }
    return this.assetObjects[assetName]
  }

  createPopup (asset, layer) {
    const assetName = asset.properties.asset

    this.createAsset(assetName)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextElement(assetName))

    layer.bindPopup(popupContent)
  }

  assetPathUpdate (assetName) {
    this.createAsset(assetName).update()
  }

  assetUpdate (asset, oldLayer) {
    const assetName = asset.properties.asset
    this.assetPathUpdate(assetName)

    if (!oldLayer) { return }

    const coords = asset.geometry.coordinates

    const popupContent = document.createElement('div')
    const data = [
      ['Asset', assetName],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    const alt = asset.properties.alt
    const heading = asset.properties.heading
    const fix = asset.properties.fix

    if (alt) {
      data.append(['Altitude', alt])
    }
    if (heading) {
      data.append(['Heading', heading])
    }
    if (fix) {
      data.append(['Fix', fix])
    }

    for (const d in data) {
      popupContent.appendChild(document.createElement('<dl class="row"><dt class="asset-label col-sm-3">' + d[0] + '</dt><dd class="asset-name col-sm-9">' + d[1] + '</dd>'))
    }

    oldLayer.bindPopup(popupContent, { minWidth: 200 })

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }
}

export { SMMAssets }
