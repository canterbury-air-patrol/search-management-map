import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import '@canterbury-air-patrol/leaflet-dialog'
import * as ReactDOM from 'react-dom/client'
import { cookieJar } from '../cookies'
import { MissionAssetData, AssetPointTime } from './types'

import { smmGetJSON } from '../ajax'
import { AssetPopup } from './AssetPopup'
import { ColorPickerDialog } from './ColorPickerDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { buildSwatchLabel } from '../components/swatchLabel'

class SMMAsset {
  map: L.Map
  missionId: MissionId
  assetId: number
  assetName: string
  color: string
  swatch?: HTMLElement
  lastUpdate?: string
  path: Array<L.LatLng>
  updating: boolean
  polyline: L.Polyline
  constructor(map: L.Map, missionId: MissionId, assetId: number, assetName: string, color: string) {
    this.missionId = missionId
    this.assetId = assetId
    this.assetName = assetName
    this.color = color
    this.lastUpdate = undefined
    this.path = []
    this.updating = false
    this.map = map
    this.polyline = L.polyline([], { color: this.color })
    this.updateColor = this.updateColor.bind(this)
    this.colorPicker = this.colorPicker.bind(this)
    this.updateNewRoute = this.updateNewRoute.bind(this)
    this.updateFailed = this.updateFailed.bind(this)
  }

  overlay() {
    return this.polyline
  }

  updateColor(color: string) {
    cookieJar.set(`asset_${this.assetId}_track_color`, color)
    this.color = color
    this.polyline.setStyle({ color: this.color })
    if (this.swatch) this.swatch.style.backgroundColor = color
  }

  colorPicker() {
    renderInLeafletDialog(this.map, (onClose) => <ColorPickerDialog name={this.assetName} color={this.color} onColorChange={this.updateColor} onClose={onClose} />, {
      initOpen: true
    })
  }

  updateNewRoute(route: { features: Array<{ geometry: { coordinates: Array<number> }; properties: AssetPointTime }> }) {
    for (const feature of route.features) {
      const lon = feature.geometry.coordinates[0]
      const lat = feature.geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = feature.properties.created_at
    }
    this.polyline.setLatLngs(this.path)
    this.updating = false
  }

  updateFailed() {
    this.updating = false
  }

  update() {
    if (this.updating) {
      return
    }
    this.updating = true

    const assetUrl = `/mission/${this.missionId}/data/assets/${this.assetId}/position/history/`
    const params: Record<string, string | undefined> = { oldest: 'last' }
    if (this.lastUpdate) {
      params.from = this.lastUpdate
    }

    smmGetJSON<{ features: Array<{ geometry: { coordinates: Array<number> }; properties: AssetPointTime }> }>(assetUrl, params).then(this.updateNewRoute).catch(this.updateFailed)
  }
}

class SMMAssets extends SMMRealtime {
  overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void
  assetObjects: { [key: number]: SMMAsset }
  assetNameMap: { [key: number]: string }
  assetIconMap: { [key: number]: string }
  assetStatusMap: { [key: number]: { status: string; notes: string } }
  popupRoots: { [key: number]: ReactDOM.Root }
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string, overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void) {
    super(map, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.assetObjects = {}
    this.popupRoots = {}
    this.createPopup = this.createPopup.bind(this)
    this.assetUpdate = this.assetUpdate.bind(this)
    this.assetLayer = this.assetLayer.bind(this)
    this.updateAssetNameMap = this.updateAssetNameMap.bind(this)
    this.assetNameMap = {}
    this.assetIconMap = {}
    this.assetStatusMap = {}
    window.setInterval(this.updateAssetNameMap, interval)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/assets/positions/latest/`
  }

  async updateAssetNameMap() {
    const data = await smmGetJSON<{ assets: Array<MissionAssetData> }>(`/mission/${this.missionId}/assets/?include_removed=true`, {})
    for (const asset of data.assets) {
      this.assetNameMap[asset.id] = asset.name
      if (asset.status) {
        this.assetStatusMap[asset.id] = asset.status
      }
      if (asset.icon_url) {
        this.assetIconMap[asset.id] = asset.icon_url
      }
    }
  }

  realtime() {
    return L.realtime(
      {
        url: this.getUrl(),
        type: 'json'
      },
      {
        interval: this.interval,
        onEachFeature: this.createPopup,
        updateFeature: this.assetUpdate,
        getFeatureId: function (feature: { properties: { asset: number } }) {
          return feature.properties.asset
        },
        pointToLayer: this.assetLayer
      }
    )
  }

  createAsset(assetId: number) {
    if (!(assetId in this.assetNameMap)) {
      return null
    }
    if (!(assetId in this.assetObjects)) {
      const color = cookieJar.get(`asset_${assetId}_track_color`)
      const assetObject = new SMMAsset(this.map, this.missionId, assetId, this.assetNameMap[assetId], color !== undefined ? color : this.color)
      this.assetObjects[assetId] = assetObject
      this.overlayAdd(buildSwatchLabel(this.assetNameMap[assetId], assetObject), assetObject.overlay())
    }
    return this.assetObjects[assetId]
  }

  getAssetIcon(assetId: number) {
    return this.assetIconMap[assetId]
  }

  createPopup(asset: { properties: { asset: number }; geometry: { coordinates: [number, number] } }, layer: L.Layer) {
    const assetId = asset.properties.asset
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    this.popupRoots[assetId] = root
    root.render(<AssetPopup assetName={String(assetId)} coords={asset.geometry.coordinates} />)
    layer.bindPopup(container, { minWidth: 200 })
    layer.once('remove', () => {
      root.unmount()
      delete this.popupRoots[assetId]
    })
  }

  assetPathUpdate(assetId: number) {
    this.createAsset(assetId)?.update()
  }

  assetLayer(asset: { properties: { asset: number } }, latlng: L.LatLng) {
    const iconUrl = this.getAssetIcon(asset.properties.asset)
    const title = this.assetNameMap[asset.properties.asset]
    if (iconUrl) {
      return L.marker(latlng, {
        title,
        icon: L.icon({
          iconUrl,
          iconSize: [50, 50],
          iconAnchor: [25, 50]
        })
      })
    }
    return L.marker(latlng, { title })
  }

  assetUpdate(asset: { properties: { asset: number; alt?: number; heading?: number; fix?: string }; geometry: { type: string; coordinates: Array<number> } }, oldLayer: L.Marker) {
    const assetId = asset.properties.asset
    this.assetPathUpdate(assetId)

    if (!oldLayer) {
      return
    }

    const coords = asset.geometry.coordinates as [number, number]
    const { alt, heading, fix } = asset.properties
    this.popupRoots[assetId]?.render(
      <AssetPopup
        assetName={this.assetNameMap[assetId]}
        coords={coords}
        alt={alt}
        heading={heading}
        fix={fix}
        status={assetId in this.assetStatusMap ? this.assetStatusMap[assetId] : undefined}
      />
    )

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])

      const newTitle = this.assetNameMap[assetId]
      const iconEl = oldLayer.getElement()
      if (iconEl && iconEl.title !== newTitle) {
        iconEl.title = newTitle
      }
      oldLayer.options.title = newTitle

      const currentIcon = oldLayer.getIcon()
      if (assetId in this.assetIconMap) {
        const iconUrl = this.assetIconMap[assetId]
        if (currentIcon.options.iconUrl !== iconUrl) {
          oldLayer.setIcon(
            L.icon({
              iconUrl,
              iconSize: [50, 50],
              iconAnchor: [25, 50]
            })
          )
        }
      }

      return oldLayer
    }
  }
}

export { SMMAssets }
