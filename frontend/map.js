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

    let realtime = L.realtime({
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

    realtime = L.realtime({
      url: `/mission/${this.missionId}/image/list/all/`,
      type: 'json'
    }, {
      interval: imageAllUpdateFreq,
      onEachFeature: function (image, layer) { self.imageCreate(image, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    })
    this.overlayAdd('Images (all)', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/image/list/important/`,
      type: 'json'
    }, {
      interval: imageAllUpdateFreq,
      onEachFeature: function (image, layer) { self.imageCreate(image, layer) },
      getFeatureId: function (feature) { return feature.properties.pk },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: '/static/icons/image-x-generic.png',
            iconSize: [24, 24]
          })
        })
      }
    }).addTo(this.map)
    this.overlayAdd('Images (prioritized)', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/sar/marine/vectors/current/`,
      type: 'json'
    }, {
      color: 'black',
      interval: marineDataUpdateFreq,
      onEachFeature: function (tdv, layer) { self.tdvCreate(tdv, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('Marine - Total Drift Vectors', realtime)
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

  imageCreate (image, layer) {
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
    a.href = `/mission/${this.missionId}/image/${imageID}/full/`
    div.appendChild(a)
    const img = document.createElement('img')
    img.src = `/mission/${this.missionId}/image/${imageID}/thumbnail/`
    a.appendChild(img)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      if (image.properties.priority) {
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Deprioritize',
            onclick: function () { $.get(`/mission/${self.missionId}/image/${imageID}/priority/unset/`) },
            'btn-class': 'btn-light'
          }
        ]))
      } else {
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Prioritize',
            onclick: function () { $.get(`/mission/${self.missionId}/image/${imageID}/priority/set/`) },
            'btn-class': 'btn-light'
          }
        ]))
      }
    }

    layer.bindPopup(popupContent)
  }

  tdvCreate (tdv, layer) {
    const tdvID = tdv.properties.pk

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'row'
    popupContent.appendChild(dl)

    const dt = document.createElement('dt')
    dt.className = 'image-label col-sm-2'
    dt.textContent = 'Total Drift Vector'
    dl.appendChild(dt)

    const dd = document.createElement('dd')
    dd.className = 'image-name col-sm-10'
    dd.textContent = tdvID
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/sar/marine/vectors/${tdvID}/delete/`) },
          'btn-class': 'btn-danger'
        }
      ]))
    }

    layer.bindPopup(popupContent)
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
