import $ from 'jquery'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import L, { LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet-realtime'
import '@canterbury-air-patrol/leaflet-dialog'
import '@canterbury-air-patrol/leaflet-dialog/Leaflet.Dialog.css'
import 'leaflet.locatecontrol'

import './Admin/admin.js'
import './POIAdder/POIAdder.js'
import './PolygonAdder/PolygonAdder.js'
import './LineAdder/LineAdder.js'
import './ImageUploader/ImageUploader.js'
import './SearchAdder/SearchAdder.js'
import './MarineVectors/MarineVectors.js'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMSearchComplete, SMMSearchIncomplete } from './search/map.js'
import { SMMPOI } from './usergeo/poi.js'
import { SMMPolygon } from './usergeo/polygon.js'
import { SMMLine } from './usergeo/line.js'
import { SMMImageAll, SMMImageImportant } from './image/map.js'
import { SMMMarineVector } from './marine/vectors.js'

class SMMMap {
  constructor (mapElem, missionId, csrftoken) {
    this.map = L.map(mapElem)
    this.layerControl = L.control.layers({}, {})
    this.assetLines = {}
    this.missionId = missionId
    this.csrftoken = csrftoken
    this.setupMap()
  }

  setupMap () {
    L.Icon.Default.prototype.options.iconUrl = markerIcon
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
    L.Icon.Default.prototype.options.shadowUrl = markerIconShadow

    const self = this

    $.get('/map/tile/layers/', function (data) {
      let baseSelected = false
      const layersBase = {}
      const layersExtra = {}
      for (const d in data.layers) {
        const layer = data.layers[d]
        const options = {
          attribution: layer.attribution,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom
        }
        if (layer.subdomains !== '') {
          options.subdomains = layer.subdomains
        }
        const tileLayer = L.tileLayer(layer.url, options)
        if (layer.base) {
          if (!baseSelected) {
            tileLayer.addTo(self.map)
            baseSelected = true
          }
          layersBase[layer.name] = tileLayer
        } else {
          layersExtra[layer.name] = tileLayer
        }
      }
      L.control.layers(layersBase, layersExtra).addTo(self.map)
    })

    this.layerControl.addTo(this.map)

    this.map.setView(new LatLng(0, 0), 16)

    this.map.locate({ setView: true, maxZoom: 16 })

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      L.control.poiadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.polygonadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.lineadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.locate({
        setView: 'untilPan',
        keepCurrentZoomLevel: true,
        locateOptions: { enableHighAccuracy: true }
      }).addTo(this.map)
      L.control.imageuploader({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
    }
    L.control.smmadmin({}).addTo(this.map)

    const assetUpdateFreq = 3 * 1000
    const userDataUpdateFreq = 10 * 1000
    const searchIncompleteUpdateFreq = 30 * 1000
    const searchCompleteUpdateFreq = 60 * 1000
    const imageAllUpdateFreq = 60 * 1000
    const marineDataUpdateFreq = 60 * 1000

    // Default leaflet path color
    const defaultColor = '#3388ff'

    const realtime = L.realtime({
      url: `/mission/${this.missionId}/data/assets/positions/latest/`,
      type: 'json'
    }, {
      interval: assetUpdateFreq,
      onEachFeature: function (asset) { self.assetCreate(asset) },
      updateFeature: function (asset) { self.assetUpdate(asset) },
      getFeatureId: function (feature) { return feature.properties.asset }
    }).addTo(this.map)
    this.overlayAdd('Assets', realtime)

    this.POIs = new SMMPOI(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('POIs', this.POIs.realtime().addTo(this.map))

    this.polygons = new SMMPolygon(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Polygons', this.polygons.realtime().addTo(this.map))

    this.lines = new SMMLine(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Lines', this.lines.realtime().addTo(this.map))

    this.incompleteSearches = new SMMSearchIncomplete(this.map, this.csrftoken, this.missionId, searchIncompleteUpdateFreq, 'orange')
    this.completeSearches = new SMMSearchComplete(this.map, this.csrftoken, this.missionId, searchCompleteUpdateFreq, defaultColor)

    this.overlayAdd('Incomplete Searches', this.incompleteSearches.realtime().addTo(this.map))
    this.overlayAdd('Completed Searches', this.completeSearches.realtime())

    this.allImages = new SMMImageAll(this.map, this.csrftoken, this.missionId, imageAllUpdateFreq, defaultColor)
    this.importantImages = new SMMImageImportant(this.map, this.csrftoken, this.missionId, imageAllUpdateFreq, defaultColor)

    this.overlayAdd('Images (all)', this.allImages.realtime())
    this.overlayAdd('Images (prioritized', this.importantImages.realtime().addTo(this.map))

    this.marineVectors = new SMMMarineVector(this.map, this.csrftoken, this.missionId, marineDataUpdateFreq, 'black')
    this.overlayAdd('Marine - Total Drift Vectors', this.marineVectors.realtime())
  }

  overlayAdd (name, layer) {
    this.layerControl.addOverlay(layer, name)
  }

  assetPathUpdate (name) {
    if (!(name in this.assetLines)) {
      const assetTrack = L.polyline([], { color: 'red' })
      this.assetLines[name] = { track: assetTrack, updating: false, lastUpdate: null, path: [] }
      this.overlayAdd(name, assetTrack)
    }
    const assetLine = this.assetLines[name]
    if (assetLine.updating) { return }
    assetLine.updating = true

    let assetUrl = `/mission/${this.missionId}/data/assets/${name}/position/history/?oldest=last`
    if (assetLine.lastUpdate != null) {
      assetUrl = `${assetUrl}&from=${assetLine.lastUpdate}`
    }

    $.ajax({
      type: 'GET',
      url: assetUrl,
      success: function (route) {
        for (const f in route.features) {
          const lon = route.features[f].geometry.coordinates[0]
          const lat = route.features[f].geometry.coordinates[1]
          assetLine.path.push(L.latLng(lat, lon))
          assetLine.lastUpdate = route.features[f].properties.created_at
        }
        assetLine.track.setLatLngs(assetLine.path)
        assetLine.updating = false
      },
      error: function () {
        assetLine.updating = false
      }
    })
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

  assetCreate (asset) {
    const assetName = asset.properties.asset

    if (!(assetName in this.assetLines)) {
      /* Create an overlay for this object */
      const assetTrack = L.polyline([], { color: 'red' })
      this.assetLines[assetName] = { track: assetTrack, updating: false }
      this.overlayAdd(assetName, assetTrack)
    }
  }
}

function mapInit () {
  const mapEl = document.createElement('div')
  mapEl.setAttribute('style', 'width:100%;height:100%;position:inherit;')
  document.body.appendChild(mapEl)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()
  const missionId = encodeURIComponent($('#missionId').val())

  return new SMMMap(mapEl, missionId, csrftoken)
}

mapInit()
