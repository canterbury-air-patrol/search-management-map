import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import { cookieJar } from '../cookies'
import { SMMMissionUserPointTimeGeoJSON, userNameFromProperty } from './types'
import { UserPopup } from './UserPopup'
import { buildSwatchLabel } from '../components/swatchLabel'
import { mountPopup } from '../components/mountPopup'
import { TrackedPath } from '../components/TrackedPath'
import { userPositionHistoryUrl } from './tracking'

class SMMUserPosition extends TrackedPath {
  userName: string
  popup?: ReturnType<typeof mountPopup>
  constructor(map: L.Map, missionId: MissionId, userName: string, color: string) {
    super(map, missionId, userName, color)
    this.userName = userName
  }

  protected colorCookieKey() {
    return `user_${this.userName}_track_color`
  }

  protected historyUrl() {
    return userPositionHistoryUrl(this.missionId, this.userName)
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

  protected override featureOptions() {
    return {
      updateFeature: this.userUpdate,
      getFeatureId: (feature: SMMMissionUserPointTimeGeoJSON) => userNameFromProperty(feature.properties.user),
      pointToLayer: this.userLayer
    }
  }

  createUser(userName: string) {
    let userObject = this.userObjects[userName]
    if (!userObject) {
      const color = cookieJar.get(`user_${userName}_track_color`)
      userObject = new SMMUserPosition(this.map, this.missionId, userName, color !== undefined ? color : this.color)
      this.userObjects[userName] = userObject
      this.overlayAdd(buildSwatchLabel(userName, userObject), userObject.overlay())
    }
    return userObject
  }

  createPopup(user: SMMMissionUserPointTimeGeoJSON, layer: L.Layer) {
    const userName = userNameFromProperty(user.properties.user)
    const userObject = this.createUser(userName)
    userObject.popup?.unmount()
    userObject.popup = mountPopup(layer, <UserPopup userName={userName} />, { minWidth: 200 })
    layer.once('remove', () => {
      userObject.popup = undefined
    })
  }

  userLayer(user: SMMMissionUserPointTimeGeoJSON, latlng: L.LatLng) {
    const userName = userNameFromProperty(user.properties.user)
    return L.marker(latlng, {
      title: userName
    })
  }

  userPathUpdate(userName: string) {
    this.createUser(userName).update()
  }

  userUpdate(user: SMMMissionUserPointTimeGeoJSON, oldLayer: L.Marker) {
    const userName = userNameFromProperty(user.properties.user)
    this.userPathUpdate(userName)

    if (!oldLayer) {
      return
    }

    const coords = user.geometry.coordinates as [number, number]
    const { alt } = user.properties

    this.userObjects[userName]?.popup?.rerender(<UserPopup userName={userName} coords={coords} alt={alt} />)

    if (user.geometry.type === 'Point') {
      const c = user.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }
}

export { SMMUserPositions }
