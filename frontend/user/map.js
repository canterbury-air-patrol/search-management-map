import L from 'leaflet'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMRealtime } from '../smmmap'

class SMMUserPosition {
  constructor (missionId, userName, color) {
    this.missionId = missionId
    this.userName = userName
    this.color = color
    this.lastUpdate = null
    this.path = []
    this.updating = false
    this.polyline = L.polyline([], { color: this.color })
  }

  overlay () {
    return this.polyline
  }

  update () {
    if (this.updating) { return }
    this.updating = true

    let userUrl = `/mission/${this.missionId}/data/user/${this.userName}/position/history/?oldest=last`
    if (this.lastUpdate != null) {
      userUrl = `${userUrl}&from=${this.lastUpdate}`
    }

    const self = this
    $.ajax({
      type: 'GET',
      url: userUrl,
      success: function (route) {
        for (const f in route.features) {
          const lon = route.features[f].geometry.coordinates[0]
          const lat = route.features[f].geometry.coordinates[1]
          self.path.push(L.latLng(lat, lon))
          self.lastUpdate = route.features[f].properties.created_at
        }
        self.polyline.setLatLngs(self.path)
        self.updating = false
      },
      error: function () {
        self.updating = false
      }
    })
  }
}

class SMMUserPositions extends SMMRealtime {
  constructor (map, csrftoken, missionId, interval, color, overlayAdd) {
    super(map, csrftoken, missionId, interval, color)
    this.overlayAdd = overlayAdd
    this.userObjects = {}
  }

  getUrl () {
    return `/mission/${this.missionId}/data/users/positions/latest/`
  }

  realtime () {
    const self = this
    return L.realtime({
      url: this.getUrl(),
      type: 'json'
    }, {
      interval: this.interval,
      onEachFeature: function (user, layer) { self.createPopup(user, layer) },
      updateFeature: function (user, oldLayer) { return self.userUpdate(user, oldLayer) },
      getFeatureId: function (feature) { return feature.properties.user }
    })
  }

  createUser (userName) {
    if (!(userName in this.userObjects)) {
      /* Create an overlay for this object */
      const userObject = new SMMUserPosition(this.missionId, userName, this.color)
      this.userObjects[userName] = userObject
      this.overlayAdd(userName, userObject.overlay())
    }
    return this.userObjects[userName]
  }

  createPopup (user, layer) {
    const userName = user.properties.user

    this.createUser(userName)

    const popupContent = document.createElement('div')

    popupContent.appendChild(document.createTextNode(userName))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  userPathUpdate (userName) {
    this.createUser(userName).update()
  }

  userDataToPopUp (data) {
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

  userUpdate (user, oldLayer) {
    const userName = user.properties.user
    this.userPathUpdate(userName)

    if (!oldLayer) { return }

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
