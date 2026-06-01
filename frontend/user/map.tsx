import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import * as ReactDOM from 'react-dom/client'
import { cookieJar } from '../cookies'
import { smmGetJSON } from '../ajax'
import { SMMMissionUserPointTimeGeoJSON } from './types'
import { UserPopup } from './UserPopup'
import { ColorPickerDialog } from '../asset/ColorPickerDialog'
import { renderInLeafletDialog } from '../components/renderInLeafletDialog'
import { buildSwatchLabel } from '../components/swatchLabel'

class SMMUserPosition {
  map: L.Map
  missionId: MissionId
  userName: string
  color: string
  swatch?: HTMLElement
  popupRoot?: ReactDOM.Root
  lastUpdate?: string
  path: L.LatLng[]
  updating: boolean
  polyline: L.Polyline
  constructor(map: L.Map, missionId: MissionId, userName: string, color: string) {
    this.missionId = missionId
    this.userName = userName
    this.color = color
    this.map = map
    this.path = []
    this.updating = false
    this.polyline = L.polyline([], { color: this.color })
    this.updateColor = this.updateColor.bind(this)
    this.colorPicker = this.colorPicker.bind(this)
    this.updateNewPosition = this.updateNewPosition.bind(this)
    this.updateError = this.updateError.bind(this)
  }

  overlay() {
    return this.polyline
  }

  updateColor(color: string) {
    cookieJar.set(`user_${this.userName}_track_color`, color)
    this.color = color
    this.polyline.setStyle({ color: this.color })
    if (this.swatch) this.swatch.style.backgroundColor = color
  }

  colorPicker() {
    renderInLeafletDialog(this.map, (onClose) => <ColorPickerDialog name={this.userName} color={this.color} onColorChange={this.updateColor} onClose={onClose} />, {
      initOpen: true
    })
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

    const userUrl = `/mission/${this.missionId}/data/user/${this.userName}/position/history/`
    const params: Record<string, string | undefined> = { oldest: 'last' }
    if (this.lastUpdate != null) {
      params.from = this.lastUpdate
    }

    smmGetJSON<{ features: Array<SMMMissionUserPointTimeGeoJSON> }>(userUrl, params).then(this.updateNewPosition).catch(this.updateError)
  }
}

class SMMUserPositions extends SMMRealtime {
  userObjects: { [key: string]: SMMUserPosition }
  overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string, overlayAdd: (name: string | HTMLElement, overlay: L.Layer) => void) {
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
      const color = cookieJar.get(`user_${userName}_track_color`)
      const userObject = new SMMUserPosition(this.map, this.missionId, userName, color !== undefined ? color : this.color)
      this.userObjects[userName] = userObject
      this.overlayAdd(buildSwatchLabel(userName, userObject), userObject.overlay())
    }
    return this.userObjects[userName]
  }

  createPopup(user: SMMMissionUserPointTimeGeoJSON, layer: L.Layer) {
    const userName = user.properties.user
    const userObject = this.createUser(userName)
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    userObject.popupRoot = root
    root.render(<UserPopup userName={userName} />)
    layer.bindPopup(container, { minWidth: 200 })
    layer.once('remove', () => {
      root.unmount()
      userObject.popupRoot = undefined
    })
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
