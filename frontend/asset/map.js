import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'
import '@canterbury-air-patrol/leaflet-dialog'
import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'
import { CompactPicker } from 'react-color'
import Cookies from 'universal-cookie'

class AssetColorPicker extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      color: this.props.color
    }
  }

  updateColor = (color) => {
    this.props.updateColor(color.hex)
    this.setState({ color })
  }

  render() {
    return <CompactPicker color={this.state.color} onChangeComplete={this.updateColor} />
  }
}
AssetColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  updateColor: PropTypes.func.isRequired
}

class SMMAsset {
  constructor(map, missionId, assetId, assetName, color) {
    this.missionId = missionId
    this.assetId = assetId
    this.assetName = assetName
    this.color = color
    this.colorDialog = null
    this.lastUpdate = null
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

  updateColor(color) {
    const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000, sameSite: 'strict' })
    cookieJar.set(`asset_${this.assetId}_track_color`, color)
    this.color = color
    this.polyline.setStyle({
      color: this.color
    })
  }

  closeColorPicker() {
    this.colorDialog.destroy()
    this.colorDialog = null
  }

  colorPicker() {
    if (this.colorDialog === null) {
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

  updateNewRoute(route) {
    for (const f in route.features) {
      const lon = route.features[f].geometry.coordinates[0]
      const lat = route.features[f].geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = route.features[f].properties.created_at
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
    if (this.lastUpdate != null) {
      assetUrl = `${assetUrl}&from=${this.lastUpdate}`
    }

    $.ajax({
      type: 'GET',
      url: assetUrl,
      success: this.updateNewRoute,
      error: this.updateFailed
    })
  }
}

class SMMAssets extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color, overlayAdd) {
    super(map, csrftoken, missionId, interval, color)
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

  assetListCB(data) {
    for (const assetIdx in data.assets) {
      const asset = data.assets[assetIdx]
      this.assetNameMap[asset.id] = asset.name
      if (asset.status !== undefined) {
        this.assetStatusMap[asset.id] = asset.status
      }
      if (asset.icon_url !== undefined) {
        this.assetIconMap[asset.id] = asset.icon_url
      }
    }
  }

  updateAssetNameMap() {
    $.getJSON(`/mission/${this.missionId}/assets/?include_removed=true`, this.assetListCB)
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
        getFeatureId: function (feature) {
          return feature.properties.asset
        },
        pointToLayer: this.assetLayer
      }
    )
  }

  createAsset(assetId) {
    if (!(assetId in this.assetNameMap)) {
      return null
    }
    if (!(assetId in this.assetObjects)) {
      /* Create an overlay for this object */
      const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000 })
      const color = cookieJar.get(`asset_${assetId}_track_color`)
      const assetObject = new SMMAsset(this.map, this.missionId, assetId, this.assetNameMap[assetId], color !== undefined ? color : this.color)
      this.assetObjects[assetId] = assetObject
      this.overlayAdd(`${this.assetNameMap[assetId]} <div id='assetNamePicker${assetId}' />`, assetObject.overlay())
    }
    const assetObject = this.assetObjects[assetId]
    $(`#assetNamePicker${assetId}`).on('click', assetObject.colorPicker)
    $(`#assetNamePicker${assetId}`).css('width', '15px')
    $(`#assetNamePicker${assetId}`).css('height', '15px')
    $(`#assetNamePicker${assetId}`).css('display', 'inline-block')
    $(`#assetNamePicker${assetId}`).css('background-color', assetObject.color)
    return assetObject
  }

  getAssetIcon(assetId) {
    if (!(assetId in this.assetIconMap)) {
      return this.assetIconMap[assetId]
    }
  }

  createPopup(asset, layer) {
    const assetId = asset.properties.asset

    this.createAsset(assetId)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(assetId))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  assetPathUpdate(assetId) {
    this.createAsset(assetId)?.update()
  }

  assetDataToPopUp(data) {
    const dl = document.createElement('dl')
    dl.className = 'row'

    for (const d in data) {
      const dt = document.createElement('dt')
      dt.className = 'asset-label col-sm-3'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'asset-name col-sm-9'
      dd.textContent = data[d][1]
      dl.appendChild(dd)
    }

    return dl
  }

  assetLayer(asset, latlng) {
    const iconUrl = this.getAssetIcon(asset.properties.id)
    if (iconUrl) {
      return L.marker(latlng, {
        icon: L.icon(
          {
            iconUrl,
            iconSize: [50, 50],
            iconAnchor: [25, 50]
          },
          {
            title: this.assetNameMap[asset.properties.id]
          }
        )
      })
    }
    return L.marker(latlng, {
      title: this.assetNameMap[asset.properties.id]
    })
  }

  assetUpdate(asset, oldLayer) {
    const assetId = asset.properties.asset
    this.assetPathUpdate(assetId)

    if (!oldLayer) {
      return
    }

    const coords = asset.geometry.coordinates

    const data = [
      ['Asset', this.assetNameMap[assetId]],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    const alt = asset.properties.alt
    const heading = asset.properties.heading
    const fix = asset.properties.fix

    if (alt) {
      data.push(['Altitude', alt])
    }
    if (heading) {
      data.push(['Heading', heading])
    }
    if (fix) {
      data.push(['Fix', fix])
    }

    if (assetId in this.assetStatusMap) {
      data.push(['Status', this.assetStatusMap[assetId].status])
      if (this.assetStatusMap[assetId].notes !== '') {
        data.push(['Status Notes', this.assetStatusMap[assetId].notes])
      }
    }

    const popupContent = this.assetDataToPopUp(data)
    oldLayer.setPopupContent(popupContent)

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      if (oldLayer._icon.title !== this.assetNameMap[assetId]) {
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
