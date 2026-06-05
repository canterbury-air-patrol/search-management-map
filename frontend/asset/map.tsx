import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import '@canterbury-air-patrol/leaflet-dialog'
import { cookieJar } from '../cookies'
import { MissionAssetSummary } from './types'

import { smmGetJSON } from '../ajax'
import { AssetPopup } from './AssetPopup'
import { buildSwatchLabel } from '../components/swatchLabel'
import { mountPopup } from '../components/mountPopup'
import { TrackedPath } from '../components/TrackedPath'

class SMMAsset extends TrackedPath {
  assetId: number
  constructor(map: L.Map, missionId: MissionId, assetId: number, assetName: string, color: string) {
    super(map, missionId, assetName, color)
    this.assetId = assetId
  }

  protected colorCookieKey() {
    return `asset_${this.assetId}_track_color`
  }

  protected historyUrl() {
    return `/mission/${this.missionId}/data/assets/${this.assetId}/position/history/`
  }
}

class SMMAssets extends SMMRealtime {
  overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void
  assetObjects: { [key: number]: SMMAsset }
  assetNameMap: { [key: number]: string }
  assetIconMap: { [key: number]: string }
  assetStatusMap: { [key: number]: { status: string; notes: string } }
  popups: { [key: number]: ReturnType<typeof mountPopup> }
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string, overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void) {
    super(map, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.assetObjects = {}
    this.popups = {}
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
    const data = await smmGetJSON<{ assets: Array<MissionAssetSummary> }>(`/mission/${this.missionId}/assets/?include_removed=true`, {})
    // Rebuild the maps from scratch so an asset that drops its icon /
    // status / name on the server doesn't carry a stale entry forever.
    const names: { [key: number]: string } = {}
    const icons: { [key: number]: string } = {}
    const statuses: { [key: number]: { status: string; notes: string } } = {}
    for (const asset of data.assets) {
      names[asset.id] = asset.name
      if (asset.status) statuses[asset.id] = asset.status
      if (asset.icon_url) icons[asset.id] = asset.icon_url
    }
    this.assetNameMap = names
    this.assetIconMap = icons
    this.assetStatusMap = statuses
  }

  protected override featureOptions() {
    return {
      updateFeature: this.assetUpdate,
      getFeatureId: (feature: { properties: { asset: number } }) => feature.properties.asset,
      pointToLayer: this.assetLayer
    }
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
    this.popups[assetId]?.unmount()
    const assetName = this.assetNameMap[assetId] ?? String(assetId)
    this.popups[assetId] = mountPopup(layer, <AssetPopup assetName={assetName} coords={asset.geometry.coordinates} />, { minWidth: 200 })
    layer.once('remove', () => delete this.popups[assetId])
  }

  assetPathUpdate(assetId: number) {
    this.createAsset(assetId)?.update()
  }

  assetLayer(asset: { properties: { asset: number } }, latlng: L.LatLng) {
    const iconUrl = this.getAssetIcon(asset.properties.asset)
    const title = this.assetNameMap[asset.properties.asset]
    return L.marker(latlng, iconUrl ? { title, icon: customAssetIcon(iconUrl) } : { title })
  }

  assetUpdate(asset: { properties: { asset: number; alt?: number; heading?: number; fix?: string }; geometry: { type: string; coordinates: Array<number> } }, oldLayer: L.Marker) {
    const assetId = asset.properties.asset
    this.assetPathUpdate(assetId)

    if (!oldLayer) {
      return
    }

    const coords = asset.geometry.coordinates as [number, number]
    const { alt, heading, fix } = asset.properties
    this.popups[assetId]?.rerender(
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

      const desiredIconUrl = this.assetIconMap[assetId] // undefined when the asset has no custom icon
      const currentIconUrl = oldLayer.getIcon().options.iconUrl
      if (desiredIconUrl !== currentIconUrl) {
        oldLayer.setIcon(desiredIconUrl ? customAssetIcon(desiredIconUrl) : new L.Icon.Default())
      }

      return oldLayer
    }
  }
}

/** Constant icon dimensions for assets that ship a custom icon_url.
 *  Centralising here means assetLayer/assetUpdate can't drift. */
function customAssetIcon(iconUrl: string): L.Icon {
  return L.icon({ iconUrl, iconSize: [50, 50], iconAnchor: [25, 50] })
}

export { SMMAssets }
