import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'
import { AssetColorPicker } from '../asset/map'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { cookieJar } from '../cookies'
import { SMMMissionUserPointTimeGeoJSON } from './types'

class SMMUserPosition {
  map: L.Map
  missionId: number | string
  userName: string
  color: string
  colorDialog?: L.Control.Dialog
  lastUpdate?: string
  path: L.LatLng[]
  updating: boolean
  polyline: L.Polyline
  constructor(map: L.Map, missionId: number | string, userName: string, color: string) {
    this.missionId = missionId
    this.userName = userName
    this.color = color
    this.map = map
    this.path = []
    this.updating = false
    this.polyline = L.polyline([], { color: this.color })
    this.updateColor = this.updateColor.bind(this)
    this.colorPicker = this.colorPicker.bind(this)
    this.closeColorPicker = this.closeColorPicker.bind(this)
    this.updateNewPosition = this.updateNewPosition.bind(this)
    this.updateError = this.updateError.bind(this)
  }

  overlay() {
    return this.polyline
  }

  updateColor(color: string) {
    cookieJar.set(`user_${this.userName}_track_color`, color)
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
      label.textContent = `Color Picker for ${this.userName}`
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

  updateNewPosition(route: { features: Array<SMMMissionUserPointTimeGeoJSON> }) {
    for (const feature of route.features) {
      const lon = feature.geometry.coordinates[0]
      const lat = feature.geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = feature.properties.created_at
    }
    this.polyline.setLatLngs(this.path)
    this.updating = false
  }

  updateError() {
    this.updating = false
  }

  update() {
    if (this.updating) {
      return
    }
    this.updating = true

    let userUrl = `/mission/${this.missionId}/data/user/${this.userName}/position/history/?oldest=last`
    if (this.lastUpdate != null) {
      userUrl = `${userUrl}&from=${this.lastUpdate}`
    }

    $.ajax({
      type: 'GET',
      url: userUrl,
      success: this.updateNewPosition,
      error: this.updateError
    })
  }
}

class SMMUserPositions extends SMMRealtime {
  userObjects: { [key: string]: SMMUserPosition }
  overlayAdd: (name: string, overlay: L.Layer) => void
  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string, overlayAdd: (name: string, overlay: L.Layer) => void) {
    super(map, csrftoken, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.userObjects = {}
    this.createPopup = this.createPopup.bind(this)
    this.userUpdate = this.userUpdate.bind(this)
    this.userLayer = this.userLayer.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/data/users/positions/latest/`
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
        updateFeature: this.userUpdate,
        getFeatureId: function (feature: SMMMissionUserPointTimeGeoJSON) {
          return feature.properties.user
        },
        pointToLayer: this.userLayer
      }
    )
  }

  createUser(userName: string) {
    if (!(userName in this.userObjects)) {
      /* Create an overlay for this object */
      const color = cookieJar.get(`user_${userName}_track_color`)
      const userObject = new SMMUserPosition(this.map, this.missionId, userName, color !== undefined ? color : this.color)
      this.userObjects[userName] = userObject
      this.overlayAdd(`${userName} <div id='userNamePicker${userName}' />`, userObject.overlay())
    }
    const userObject = this.userObjects[userName]
    $(`#userNamePicker${userName}`).on('click', userObject.colorPicker)
    $(`#userNamePicker${userName}`).css('width', '15px')
    $(`#userNamePicker${userName}`).css('height', '15px')
    $(`#userNamePicker${userName}`).css('display', 'inline-block')
    $(`#userNamePicker${userName}`).css('background-color', userObject.color)
    return userObject
  }

  createPopup(user: SMMMissionUserPointTimeGeoJSON, layer: L.Layer) {
    const userName = user.properties.user

    this.createUser(userName)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(userName))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  userLayer(user: SMMMissionUserPointTimeGeoJSON, latlng: L.LatLng) {
    return L.marker(latlng, {
      title: user.properties.user
    })
  }

  userPathUpdate(userName: string) {
    this.createUser(userName).update()
  }

  userDataToPopUp(data: Array<{ label: string; value: string }>) {
    const dl = document.createElement('dl')
    dl.className = 'row'

    for (const d of data) {
      const dt = document.createElement('dt')
      dt.className = 'user-label col-sm-3'
      dt.textContent = d.label
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'user-name col-sm-9'
      dd.textContent = d.value
      dl.appendChild(dd)
    }

    return dl
  }

  userUpdate(user: SMMMissionUserPointTimeGeoJSON, oldLayer: L.Marker) {
    const userName = user.properties.user
    this.userPathUpdate(userName)

    if (!oldLayer) {
      return
    }

    const coords = user.geometry.coordinates

    const data = [
      { label: 'User', value: userName },
      { label: 'Lat', value: degreesToDM(coords[1], true) },
      { label: 'Long', value: degreesToDM(coords[0], false) }
    ]

    const { alt } = user.properties

    if (alt) {
      data.push({ label: 'Altitude', value: alt.toString() })
    }

    const popupContent = this.userDataToPopUp(data)
    oldLayer.setPopupContent(popupContent)

    if (user.geometry.type === 'Point') {
      const c = user.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }
}

export { SMMUserPositions }
