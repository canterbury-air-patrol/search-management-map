import './page-shell'

import * as ReactDOM from 'react-dom/client'

import L, { LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './leaflet-setup'

import 'leaflet-realtime'
import '@canterbury-air-patrol/leaflet-dialog'
import '@canterbury-air-patrol/leaflet-dialog/Leaflet.Dialog.css'
import { LocateControl } from 'leaflet.locatecontrol'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import { cookieJar } from './cookies'

import './Admin/admin'
import './ImageUploader/ImageUploader.js'
import { poiadder } from './POIAdder/POIAdder.js'
import { polygonadder } from './PolygonAdder/PolygonAdder.js'
import { lineadder } from './LineAdder/LineAdder.js'

import { SMMSearchesComplete, SMMSearchesInprogress, SMMSearchesNotStarted } from './search/map.js'
import { SMMPOIs } from './usergeo/poi.js'
import { SMMPolygons } from './usergeo/polygon.js'
import { SMMLines } from './usergeo/line.js'
import { SMMImageAll, SMMImageImportant } from './image/map.js'
import { SMMMarineVector } from './marine/vectors.js'
import { SMMAssets } from './asset/map.js'
import { SMMMissionTopBar } from './menu/topbar.js'
import { SMMUserPositions } from './user/map.js'
import { smmGetJSON } from './ajax'

class SMMMap {
  map: L.Map
  layerControl: L.Control.Layers
  layerControlMaps: L.Control.Layers
  layerControlAssets: L.Control.Layers
  layerControlUsers: L.Control.Layers
  missionId: number | string
  assets?: SMMAssets
  users?: SMMUserPositions
  POIs?: SMMPOIs
  polygons?: SMMPolygons
  lines?: SMMLines
  notStartedSearches?: SMMSearchesNotStarted
  inprogressSearches?: SMMSearchesInprogress
  completeSearches?: SMMSearchesComplete
  allImages?: SMMImageAll
  importantImages?: SMMImageImportant
  marineVectors?: SMMMarineVector

  constructor(mapElem: string | HTMLElement, missionId: number | string) {
    this.map = L.map(mapElem)
    this.layerControl = L.control.layers({}, {})
    this.layerControlMaps = L.control.layers({}, {})
    this.layerControlAssets = L.control.layers({}, {})
    this.layerControlUsers = L.control.layers({}, {})
    this.missionId = missionId
    this.overlayAdd = this.overlayAdd.bind(this)
    this.overlayAddAsset = this.overlayAddAsset.bind(this)
    this.overlayAddUser = this.overlayAddUser.bind(this)
    this.mapLayersCallback = this.mapLayersCallback.bind(this)
    this.layerStateChanged = this.layerStateChanged.bind(this)
    this.setupMap()
  }

  convertCookieName(name: string) {
    return name.replace(/[^a-zA-Z0-9]/g, '_')
  }

  layerStateChanged(e: L.LayersControlEvent) {
    cookieJar.set(`layer_${this.convertCookieName(e.name)}_on_map`, e.type === 'overlayadd')
  }

  mapLayersCallback(data: {
    layers: Array<{ name: string; url: string; base: boolean; attribution: string; minZoom: number; maxZoom: number; subdomains?: string; active: boolean; relativeOrder: number }>
  }) {
    let baseSelected = false
    for (const layer of data.layers) {
      const options: L.TileLayerOptions = {
        attribution: layer.attribution,
        minZoom: layer.minZoom,
        maxZoom: layer.maxZoom,
        referrerPolicy: 'strict-origin'
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
        const layerEnabled = cookieJar.get(`layer_${this.convertCookieName(layer.name)}_on_map`)
        if (layerEnabled === true) {
          tileLayer.addTo(this.map)
        }
      }
    }
  }

  setupMap() {
    smmGetJSON<Parameters<typeof this.mapLayersCallback>[0]>('/map/tile/layers/', {}).then(this.mapLayersCallback)

    this.layerControl.addTo(this.map)
    this.layerControlMaps.addTo(this.map)
    this.layerControlAssets.addTo(this.map)
    this.layerControlUsers.addTo(this.map)

    this.map.on('overlayadd', this.layerStateChanged)
    this.map.on('overlayremove', this.layerStateChanged)

    this.map.setView(new LatLng(0, 0), 16)

    this.map.locate({ setView: true, maxZoom: 16 })

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      poiadder({ missionId: this.missionId }).addTo(this.map)
      polygonadder({ missionId: this.missionId }).addTo(this.map)
      lineadder({ missionId: this.missionId }).addTo(this.map)
      new LocateControl({
        setView: 'untilPan',
        keepCurrentZoomLevel: true,
        locateOptions: { enableHighAccuracy: true }
      }).addTo(this.map)
      L.control.imageuploader({ missionId: this.missionId }).addTo(this.map)
    }
    L.control.smmadmin({ missionId: this.missionId }).addTo(this.map)

    const assetUpdateFreq = 3 * 1000
    const userUpdateFreq = 3 * 1000
    const userDataUpdateFreq = 10 * 1000
    const searchIncompleteUpdateFreq = 30 * 1000
    const searchCompleteUpdateFreq = 60 * 1000
    const imageAllUpdateFreq = 60 * 1000
    const marineDataUpdateFreq = 60 * 1000

    // Default leaflet path color
    const defaultColor = '#3388ff'

    this.assets = new SMMAssets(this.map, this.missionId, assetUpdateFreq, 'red', this.overlayAddAsset)
    this.overlayAdd('Assets', this.assets.realtime().addTo(this.map))

    this.users = new SMMUserPositions(this.map, this.missionId, userUpdateFreq, 'red', this.overlayAddUser)
    this.overlayAdd('Users', this.users.realtime().addTo(this.map))

    this.POIs = new SMMPOIs(this.map, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('POIs', this.POIs.realtime().addTo(this.map))

    this.polygons = new SMMPolygons(this.map, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Polygons', this.polygons.realtime().addTo(this.map))

    this.lines = new SMMLines(this.map, this.missionId, userDataUpdateFreq, defaultColor)
    this.overlayAdd('Lines', this.lines.realtime().addTo(this.map))

    this.notStartedSearches = new SMMSearchesNotStarted(this.map, this.missionId, searchIncompleteUpdateFreq, 'orange')
    this.inprogressSearches = new SMMSearchesInprogress(this.map, this.missionId, searchIncompleteUpdateFreq, 'orange')
    this.completeSearches = new SMMSearchesComplete(this.map, this.missionId, searchCompleteUpdateFreq, defaultColor)

    this.overlayAdd('Pending Searches', this.notStartedSearches.realtime().addTo(this.map))
    this.overlayAdd('Inprogress Searches', this.inprogressSearches.realtime().addTo(this.map))
    this.overlayAdd('Completed Searches', this.completeSearches.realtime())

    this.allImages = new SMMImageAll(this.map, this.missionId, imageAllUpdateFreq, defaultColor)
    this.importantImages = new SMMImageImportant(this.map, this.missionId, imageAllUpdateFreq, defaultColor)

    this.overlayAdd('Images (all)', this.allImages.realtime())
    this.overlayAdd('Images (prioritized)', this.importantImages.realtime().addTo(this.map))

    this.marineVectors = new SMMMarineVector(this.map, this.missionId, marineDataUpdateFreq, 'black')
    this.overlayAdd('Marine - Total Drift Vectors', this.marineVectors.realtime())
  }

  overlayAdd(name: string, layer: L.Layer) {
    this.layerControl.addOverlay(layer, name)
  }

  overlayAddAsset(name: string, layer: L.Layer) {
    this.layerControlAssets.addOverlay(layer, name)
  }

  overlayAddUser(name: string, layer: L.Layer) {
    this.layerControlUsers.addOverlay(layer, name)
  }
}

function mapInit() {
  const wrapperEl = document.createElement('div')
  wrapperEl.className = 'd-flex flex-column w-100 h-100'
  document.body.appendChild(wrapperEl)

  const missionId = encodeURIComponent((document.getElementById('missionId') as HTMLInputElement).value)

  if (missionId !== 'all' && missionId !== 'current') {
    const menuEl = document.createElement('div')
    menuEl.className = 'flex-grow-0 flex-shrink-1'
    wrapperEl.appendChild(menuEl)
    const div = ReactDOM.createRoot(menuEl)
    div.render(<SMMMissionTopBar missionId={missionId} />)
  }

  const mapEl = document.createElement('div')
  mapEl.className = 'flex-grow-1'
  wrapperEl.appendChild(mapEl)

  return new SMMMap(mapEl, missionId)
}

mapInit()
