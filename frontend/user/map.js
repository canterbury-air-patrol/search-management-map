import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'
import { AssetColorPicker } from '../asset/map'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import Cookies from 'universal-cookie'

class SMMUserPosition {
  constructor(map, missionId, userName, color) {
    this.missionId = missionId
    this.userName = userName
    this.color = color
    this.colorDialog = null
    this.map = map
    this.lastUpdate = null
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

  updateColor(color) {
    const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000, sameSite: 'strict' })
    cookieJar.set(`user_${this.userName}_track_color`, color)
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

  updateNewPosition(route) {
    for (const f in route.features) {
      const lon = route.features[f].geometry.coordinates[0]
      const lat = route.features[f].geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = route.features[f].properties.created_at
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
  constructor(map, csrftoken, missionId, interval, color, overlayAdd) {
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
        getFeatureId: function (feature) {
          return feature.properties.user
        },
        pointToLayer: this.userLayer
      }
    )
  }

  createUser(userName) {
    if (!(userName in this.userObjects)) {
      /* Create an overlay for this object */
      const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000 })
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

  createPopup(user, layer) {
    const userName = user.properties.user

    this.createUser(userName)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(userName))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  userLayer(user, latlng) {
    return L.marker(latlng, {
      title: user.properties.user
    })
  }

  userPathUpdate(userName) {
    this.createUser(userName).update()
  }

  userDataToPopUp(data) {
    const dl = document.createElement('dl')
    dl.className = 'row'

    for (const d in data) {
      const dt = document.createElement('dt')
      dt.className = 'user-label col-sm-3'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'user-name col-sm-9'
      dd.textContent = data[d][1]
      dl.appendChild(dd)
    }

    return dl
  }

  userUpdate(user, oldLayer) {
    const userName = user.properties.user
    this.userPathUpdate(userName)

    if (!oldLayer) {
      return
    }

    const coords = user.geometry.coordinates

    const data = [
      ['User', userName],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    const alt = user.properties.alt
    const heading = user.properties.heading
    const fix = user.properties.fix

    if (alt) {
      data.push(['Altitude', alt])
    }
    if (heading) {
      data.push(['Heading', heading])
    }
    if (fix) {
      data.push(['Fix', fix])
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
