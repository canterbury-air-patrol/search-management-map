import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { cookieJar } from '../cookies'
import { SMMMissionUserPointTimeGeoJSON } from './types'
import { UserPopup } from './UserPopup'
import { ColorPickerDialog } from '../asset/ColorPickerDialog'

class SMMUserPosition {
  map: L.Map
  missionId: number | string
  userName: string
  color: string
  colorDialog?: L.Control.Dialog
  popupRoot?: ReactDOM.Root
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
      const container = document.createElement('div')
      this.colorDialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(this.map).hideClose()
      const root = ReactDOM.createRoot(container)
      root.render(
        <ColorPickerDialog
          name={this.userName}
          color={this.color}
          onColorChange={this.updateColor}
          onClose={() => {
            root.unmount()
            this.closeColorPicker()
          }}
        />
      )
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

    fetch(userUrl)
      .then((r) => r.json())
      .then(this.updateNewPosition)
      .catch(this.updateError)
  }
}

class SMMUserPositions extends SMMRealtime {
  userObjects: { [key: string]: SMMUserPosition }
  overlayAdd: (name: string, overlay: L.Layer) => void
  constructor(map: L.Map, missionId: number | string, interval: number, color: string, overlayAdd: (name: string, overlay: L.Layer) => void) {
    super(map, missionId, interval, color)
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
    const pickerDiv = document.getElementById(`userNamePicker${userName}`)
    if (pickerDiv) {
      pickerDiv.addEventListener('click', userObject.colorPicker)
      Object.assign(pickerDiv.style, { width: '15px', height: '15px', display: 'inline-block', backgroundColor: userObject.color })
    }
    return userObject
  }

  createPopup(user: SMMMissionUserPointTimeGeoJSON, layer: L.Layer) {
    const userName = user.properties.user
    const userObject = this.createUser(userName)
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    userObject.popupRoot = root
    root.render(<UserPopup userName={userName} />)
    layer.bindPopup(container, { minWidth: 200 })
  }

  userLayer(user: SMMMissionUserPointTimeGeoJSON, latlng: L.LatLng) {
    return L.marker(latlng, {
      title: user.properties.user
    })
  }

  userPathUpdate(userName: string) {
    this.createUser(userName).update()
  }

  userUpdate(user: SMMMissionUserPointTimeGeoJSON, oldLayer: L.Marker) {
    const userName = user.properties.user
    this.userPathUpdate(userName)

    if (!oldLayer) {
      return
    }

    const coords = user.geometry.coordinates as [number, number]
    const { alt } = user.properties

    this.userObjects[userName]?.popupRoot?.render(<UserPopup userName={userName} coords={coords} alt={alt} />)

    if (user.geometry.type === 'Point') {
      const c = user.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }
}

export { SMMUserPositions }
