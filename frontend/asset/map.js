import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'
import '@canterbury-air-patrol/leaflet-dialog'
import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'
import { CompactPicker } from 'react-color'

class AssetColorPicker extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      color: this.props.color
    }
  }

  updateColor = (color) => {
    this.props.updateColor(color.hex)
    this.setState({ color })
  }

  render () {
    return (
      <CompactPicker
        color={this.state.color}
        onChangeComplete={this.updateColor} />
    )
  }
}
AssetColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  updateColor: PropTypes.func.isRequired
}

class SMMAsset {
  constructor (map, missionId, assetName, color) {
    this.missionId = missionId
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

  overlay () {
    return this.polyline
  }

  updateColor (color) {
    this.color = color
    this.polyline.setStyle({
      color: this.color
    })
  }

  closeColorPicker () {
    this.colorDialog.destroy()
    this.colorDialog = null
  }

  colorPicker () {
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
      div.render(
        <AssetColorPicker
          color={this.color}
          updateColor={this.updateColor} />)
    } else {
      this.colorDialog.show()
    }
  }

  updateNewRoute (route) {
    for (const f in route.features) {
      const lon = route.features[f].geometry.coordinates[0]
      const lat = route.features[f].geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = route.features[f].properties.created_at
    }
    this.polyline.setLatLngs(this.path)
    this.updating = false
  }

  updateFailed () {
    this.updating = false
  }

  update () {
    if (this.updating) { return }
    this.updating = true

    let assetUrl = `/mission/${this.missionId}/data/assets/${this.assetName}/position/history/?oldest=last`
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
  constructor (map, csrftoken, missionId, interval, color, overlayAdd) {
    super(map, csrftoken, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.assetObjects = {}
    this.createPopup = this.createPopup.bind(this)
    this.assetUpdate = this.assetUpdate.bind(this)
  }

  getUrl () {
    return `/mission/${this.missionId}/data/assets/positions/latest/`
  }

  realtime () {
    return L.realtime({
      url: this.getUrl(),
      type: 'json'
    }, {
      interval: this.interval,
      onEachFeature: this.createPopup,
      updateFeature: this.assetUpdate,
      getFeatureId: function (feature) { return feature.properties.asset }
    })
  }

  createAsset (assetName) {
    if (!(assetName in this.assetObjects)) {
      /* Create an overlay for this object */
      const assetObject = new SMMAsset(this.map, this.missionId, assetName, this.color)
      this.assetObjects[assetName] = assetObject
      assetObject.num = Math.round(Math.random() * 10000)
      this.overlayAdd(`${assetName} <div id='assetNamePicker${assetObject.num}' />`, assetObject.overlay())
    }
    const assetObject = this.assetObjects[assetName]
    $(`#assetNamePicker${assetObject.num}`).on('click', assetObject.colorPicker)
    $(`#assetNamePicker${assetObject.num}`).css('width', '15px')
    $(`#assetNamePicker${assetObject.num}`).css('height', '15px')
    $(`#assetNamePicker${assetObject.num}`).css('display', 'inline-block')
    $(`#assetNamePicker${assetObject.num}`).css('background-color', assetObject.color)
    return assetObject
  }

  createPopup (asset, layer) {
    const assetName = asset.properties.asset

    this.createAsset(assetName)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(assetName))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  assetPathUpdate (assetName) {
    this.createAsset(assetName).update()
  }

  assetDataToPopUp (data) {
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

  assetUpdate (asset, oldLayer) {
    const assetName = asset.properties.asset
    this.assetPathUpdate(assetName)

    if (!oldLayer) { return }

    const coords = asset.geometry.coordinates

    const data = [
      ['Asset', assetName],
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

    const popupContent = this.assetDataToPopUp(data)
    oldLayer.setPopupContent(popupContent)

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }
}

export { SMMAssets }
