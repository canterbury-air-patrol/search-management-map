import $ from 'jquery'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import L, { LatLng, Util } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet-realtime'
import '@canterbury-air-patrol/leaflet-dialog'
import '@canterbury-air-patrol/leaflet-dialog/Leaflet.Dialog.css'
import 'leaflet.locatecontrol'
import Cookies from 'universal-cookie'

import './Admin/admin.js'
import './POIAdder/POIAdder.js'
import './PolygonAdder/PolygonAdder.js'
import './LineAdder/LineAdder.js'
import './ImageUploader/ImageUploader.js'
import './SearchAdder/SearchAdder.js'
import './MarineVectors/MarineVectors.js'

import { SMMSearchesComplete, SMMSearchesInprogress, SMMSearchesNotStarted } from './search/map.js'
import { SMMPOIs } from './usergeo/poi.js'
import { SMMPolygons } from './usergeo/polygon.js'
import { SMMLines } from './usergeo/line.js'
import { SMMImageAll, SMMImageImportant } from './image/map.js'
import { SMMMarineVector } from './marine/vectors.js'
import { SMMAssets } from './asset/map.js'
import { SMMMissionTopBar } from './menu/topbar.js'
import { SMMUserPositions } from './user/map.js'

class SMMMap {
  constructor(mapElem, missionId, csrftoken) {
    this.map = L.map(mapElem)
    this.layerControl = L.control.layers({}, {})
    this.layerControlMaps = L.control.layers({}, {})
    this.layerControlAssets = L.control.layers({}, {})
    this.layerControlUsers = L.control.layers({}, {})
    this.missionId = missionId
    this.csrftoken = csrftoken
    this.overlayAdd = this.overlayAdd.bind(this)
    this.overlayAddAsset = this.overlayAddAsset.bind(this)
    this.overlayAddUser = this.overlayAddUser.bind(this)
    this.mapLayersCallback = this.mapLayersCallback.bind(this)
    this.layerStateChanged = this.layerStateChanged.bind(this)
    this.setupMap()
  }

  layerStateChanged(e) {
    const layer = this.layerControlMaps._getLayer(Util.stamp(e.target))
    const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000, sameSite: 'strict' })
    cookieJar.set(`layer_${layer.name}_on_map`, e.type === 'add')
  }

  mapLayersCallback(data) {
    let baseSelected = false
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
        this.layerControlMaps.addBaseLayer(tileLayer, layer.name)
        if (!baseSelected) {
          tileLayer.addTo(this.map)
          baseSelected = true
        }
      } else {
        this.layerControlMaps.addOverlay(tileLayer, layer.name)
        const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000, sameSite: 'strict' })
        const layerEnabled = cookieJar.get(`layer_${layer.name}_on_map`)
        if (layerEnabled === true) {
          tileLayer.addTo(this.map)
        }
        tileLayer.on('add remove', this.layerStateChanged)
      }
    }
  }

  setupMap() {
    L.Icon.Default.prototype.options.iconUrl = markerIcon
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
    L.Icon.Default.prototype.options.shadowUrl = markerIconShadow

    $.get('/map/tile/layers/', this.mapLayersCallback)

    this.layerControl.addTo(this.map)
    this.layerControlMaps.addTo(this.map)
    this.layerControlAssets.addTo(this.map)
    this.layerControlUsers.addTo(this.map)

    this.map.setView(new LatLng(0, 0), 16)

    this.map.locate({ setView: true, maxZoom: 16 })

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      L.control.poiadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.polygonadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.lineadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control
        .locate({
          setView: 'untilPan',
          keepCurrentZoomLevel: true,
          locateOptions: { enableHighAccuracy: true }
        })
        .addTo(this.map)
      L.control.imageuploader({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
    }
    L.control.smmadmin({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)

    const assetUpdateFreq = 3 * 1000
    const userUpdateFreq = 3 * 1000
    const userDataUpdateFreq = 10 * 1000
    const searchIncompleteUpdateFreq = 30 * 1000
    const searchCompleteUpdateFreq = 60 * 1000
    const imageAllUpdateFreq = 60 * 1000
    const marineDataUpdateFreq = 60 * 1000

    // Default leaflet path color
    const defaultColor = '#3388ff'

    this.assets = new SMMAssets(this.map, this.csrftoken, this.missionId, assetUpdateFreq, 'red', this.overlayAddAsset)
    this.overlayAdd('Assets', this.assets.realtime().addTo(this.map))

    this.users = new SMMUserPositions(this.map, this.csrftoken, this.missionId, userUpdateFreq, 'red', this.overlayAddUser)
    this.overlayAdd('Users', this.users.realtime().addTo(this.map))

    this.POIs = new SMMPOIs(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('POIs', this.POIs.realtime().addTo(this.map))

    this.polygons = new SMMPolygons(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Polygons', this.polygons.realtime().addTo(this.map))

    this.lines = new SMMLines(this.map, this.csrftoken, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Lines', this.lines.realtime().addTo(this.map))

    this.notStartedSearches = new SMMSearchesNotStarted(this.map, this.csrftoken, this.missionId, searchIncompleteUpdateFreq, 'orange')
    this.inprogressSearches = new SMMSearchesInprogress(this.map, this.csrftoken, this.missionId, searchIncompleteUpdateFreq, 'orange')
    this.completeSearches = new SMMSearchesComplete(this.map, this.csrftoken, this.missionId, searchCompleteUpdateFreq, defaultColor)

    this.overlayAdd('Pending Searches', this.notStartedSearches.realtime().addTo(this.map))
    this.overlayAdd('Inprogress Searches', this.inprogressSearches.realtime().addTo(this.map))
    this.overlayAdd('Completed Searches', this.completeSearches.realtime())

    this.allImages = new SMMImageAll(this.map, this.csrftoken, this.missionId, imageAllUpdateFreq, defaultColor)
    this.importantImages = new SMMImageImportant(this.map, this.csrftoken, this.missionId, imageAllUpdateFreq, defaultColor)

    this.overlayAdd('Images (all)', this.allImages.realtime())
    this.overlayAdd('Images (prioritized', this.importantImages.realtime().addTo(this.map))

    this.marineVectors = new SMMMarineVector(this.map, this.csrftoken, this.missionId, marineDataUpdateFreq, 'black')
    this.overlayAdd('Marine - Total Drift Vectors', this.marineVectors.realtime())
  }

  overlayAdd(name, layer) {
    this.layerControl.addOverlay(layer, name)
  }

  overlayAddAsset(name, layer) {
    this.layerControlAssets.addOverlay(layer, name)
  }

  overlayAddUser(name, layer) {
    this.layerControlUsers.addOverlay(layer, name)
  }
}

function mapInit() {
  const wrapperEl = document.createElement('div')
  wrapperEl.setAttribute('style', 'width:100%;height:100%;display:flex;flex-flow:column;')
  document.body.appendChild(wrapperEl)

  const missionId = encodeURIComponent($('#missionId').val())

  if (missionId !== 'all' && missionId !== 'current') {
    const menuEl = document.createElement('div')
    menuEl.setAttribute('style', 'flex: 0 1 auto;')
    wrapperEl.appendChild(menuEl)
    const div = ReactDOM.createRoot(menuEl)
    div.render(<SMMMissionTopBar missionId={missionId} />)
  }

  const mapEl = document.createElement('div')
  mapEl.setAttribute('style', 'flex: 1 1 auto;')
  wrapperEl.appendChild(mapEl)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()

  return new SMMMap(mapEl, missionId, csrftoken)
}

mapInit()
