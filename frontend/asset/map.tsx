import L from 'leaflet'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'
import '@canterbury-air-patrol/leaflet-dialog'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { ColorResult, CompactPicker } from 'react-color'
import { cookieJar } from '../cookies'
import { MissionAssetData, AssetPointTime } from './types'

import { smmGetJSON } from '../ajax'

interface AssetColorPickerProps {
  color: string
  updateColor: (color: string) => void
}

interface AssetColorPickerState {
  color: string
}

class AssetColorPicker extends React.Component<AssetColorPickerProps, AssetColorPickerState> {
  constructor(props: AssetColorPickerProps) {
    super(props)
    this.state = {
      color: this.props.color
    }
  }

  updateColor = (color: ColorResult) => {
    this.props.updateColor(color.hex)
    this.setState({ color: color.hex })
  }

  render() {
    return <CompactPicker color={this.state.color} onChangeComplete={this.updateColor} />
  }
}

class SMMAsset {
  map: L.Map
  missionId: number | string
  assetId: number
  assetName: string
  color: string
  colorDialog?: L.Control.Dialog
  lastUpdate?: string
  path: Array<L.LatLng>
  updating: boolean
  polyline: L.Polyline
  constructor(map: L.Map, missionId: number | string, assetId: number, assetName: string, color: string) {
    this.missionId = missionId
    this.assetId = assetId
    this.assetName = assetName
    this.color = color
    this.colorDialog = undefined
    this.lastUpdate = undefined
    this.path = []
    this.updating = false
    this.map = map
    this.polyline = L.polyline([], { color: this.color })
    this.updateColor = this.updateColor.bind(this)
    this.colorPicker = this.colorPicker.bind(this)
    this.closeColorPicker = this.closeColorPicker.bind(this)
    this.updateNewRoute = this.updateNewRoute.bind(this)
    this.updateFailed = this.updateFailed.bind(this)
  }

  overlay() {
    return this.polyline
  }

  updateColor(color: string) {
    cookieJar.set(`asset_${this.assetId}_track_color`, color)
    this.color = color
    this.polyline.setStyle({
      color: this.color
    })
  }

  closeColorPicker() {
    this.colorDialog.destroy()
    this.colorDialog = undefined
  }

  colorPicker() {
    if (!this.colorDialog) {
      const dialogContent = document.createElement('div')
      const label = document.createElement('div')
      label.textContent = `Color Picker for ${this.assetName}`
      dialogContent.appendChild(label)
      const colorPickerDiv = document.createElement('div')
      dialogContent.appendChild(colorPickerDiv)
      const btn = document.createElement('button')
      btn.className = 'btn btn-primary'
      btn.onclick = this.closeColorPicker
      btn.textContent = 'Done'
      dialogContent.appendChild(btn)

      this.colorDialog = L.control.dialog({ initOpen: true })
      this.colorDialog.setContent(dialogContent).addTo(this.map).hideClose()
      const div = ReactDOM.createRoot(colorPickerDiv)
      div.render(<AssetColorPicker color={this.color} updateColor={this.updateColor} />)
    } else {
      this.colorDialog.show()
    }
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

    let assetUrl = `/mission/${this.missionId}/data/assets/${this.assetId}/position/history/?oldest=last`
    if (this.lastUpdate) {
      assetUrl = `${assetUrl}&from=${this.lastUpdate}`
    }

    fetch(assetUrl)
      .then((r) => r.json())
      .then(this.updateNewRoute)
      .catch(this.updateFailed)
  }
}

class SMMAssets extends SMMRealtime {
  overlayAdd: (name: string, overlay: L.Layer) => void
  assetObjects: { [key: number]: SMMAsset }
  assetNameMap: { [key: number]: string }
  assetIconMap: { [key: number]: string }
  assetStatusMap: { [key: number]: { status: string; notes: string } }
  constructor(map: L.Map, missionId: number | string, interval: number, color: string, overlayAdd: (name: string, overlay: L.Layer) => void) {
    super(map, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.assetObjects = {}
    this.createPopup = this.createPopup.bind(this)
    this.assetUpdate = this.assetUpdate.bind(this)
    this.assetLayer = this.assetLayer.bind(this)
    this.updateAssetNameMap = this.updateAssetNameMap.bind(this)
    this.assetListCB = this.assetListCB.bind(this)
    this.assetNameMap = {}
    this.assetIconMap = {}
    this.assetStatusMap = {}
    window.setInterval(this.updateAssetNameMap, interval)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/assets/positions/latest/`
  }

  assetListCB(data: { assets: Array<MissionAssetData> }) {
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

  updateAssetNameMap() {
    smmGetJSON(`/mission/${this.missionId}/assets/?include_removed=true`, {}, this.assetListCB)
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
      /* Create an overlay for this object */
      const color = cookieJar.get(`asset_${assetId}_track_color`)
      const assetObject = new SMMAsset(this.map, this.missionId, assetId, this.assetNameMap[assetId], color !== undefined ? color : this.color)
      this.assetObjects[assetId] = assetObject
      this.overlayAdd(`${this.assetNameMap[assetId]} <div id='assetNamePicker${assetId}' />`, assetObject.overlay())
    }
    const assetObject = this.assetObjects[assetId]
    const pickerDiv = document.getElementById(`assetNamePicker${assetId}`)
    if (pickerDiv) {
      pickerDiv.addEventListener('click', assetObject.colorPicker)
      Object.assign(pickerDiv.style, { width: '15px', height: '15px', display: 'inline-block', backgroundColor: assetObject.color })
    }
    return assetObject
  }

  getAssetIcon(assetId: number) {
    return this.assetIconMap[assetId]
  }

  createPopup(asset: { properties: { asset: number } }, layer: L.Layer) {
    const assetId = asset.properties.asset

    this.createAsset(assetId)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(assetId.toString()))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  assetPathUpdate(assetId: number) {
    this.createAsset(assetId)?.update()
  }

  assetDataToPopUp(data: Array<{ label: string; value: string }>) {
    const dl = document.createElement('dl')
    dl.className = 'row'

    for (const d of data) {
      const dt = document.createElement('dt')
      dt.className = 'asset-label col-sm-3'
      dt.textContent = d.label
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'asset-name col-sm-9'
      dd.textContent = d.value
      dl.appendChild(dd)
    }

    return dl
  }

  assetLayer(asset: { properties: { asset: number } }, latlng: L.LatLng) {
    const iconUrl = this.getAssetIcon(asset.properties.asset)
    if (iconUrl) {
      return L.marker(latlng, {
        icon: L.icon(
          {
            iconUrl,
            iconSize: [50, 50],
            iconAnchor: [25, 50]
          },
          {
            title: this.assetNameMap[asset.properties.asset]
          }
        )
      })
    }
    return L.marker(latlng, {
      title: this.assetNameMap[asset.properties.asset]
    })
  }

  assetUpdate(asset: { properties: { asset: number; alt?: number; heading?: number; fix?: string }; geometry: { type: string; coordinates: Array<number> } }, oldLayer: L.Marker) {
    const assetId = asset.properties.asset
    this.assetPathUpdate(assetId)

    if (!oldLayer) {
      return
    }

    const coords = asset.geometry.coordinates

    const data = [
      { label: 'Asset', value: this.assetNameMap[assetId] },
      { label: 'Lat', value: degreesToDM(coords[1], true) },
      { label: 'Long', value: degreesToDM(coords[0], false) }
    ]

    const { alt, heading, fix } = asset.properties

    if (alt) {
      data.push({ label: 'Altitude', value: alt.toString() })
    }
    if (heading) {
      data.push({ label: 'Heading', value: heading.toString() })
    }
    if (fix) {
      data.push({ label: 'Fix', value: fix })
    }

    if (assetId in this.assetStatusMap) {
      data.push({ label: 'Status', value: this.assetStatusMap[assetId].status })
      if (this.assetStatusMap[assetId].notes !== '') {
        data.push({ label: 'Status Notes', value: this.assetStatusMap[assetId].notes })
      }
    }

    const popupContent = this.assetDataToPopUp(data)
    oldLayer.setPopupContent(popupContent)

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      if (oldLayer._icon && oldLayer._icon.title !== this.assetNameMap[assetId]) {
        oldLayer._icon.title = this.assetNameMap[assetId]
      }

      const currentIcon = oldLayer.getIcon()
      if (assetId in this.assetIconMap) {
        const iconUrl = this.assetIconMap[assetId]
        if (currentIcon.options.iconUrl !== iconUrl) {
          oldLayer.setIcon(
            L.icon({
              iconUrl,
              iconSize: [50, 50],
              iconAnchor: [25, 50],
              title: this.assetNameMap[assetId]
            })
          )
        }
      }

      return oldLayer
    }
  }
}

export { SMMAssets, AssetColorPicker }
