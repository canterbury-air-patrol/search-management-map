import { MissionId, isSpecificMission } from '../mission/MissionId'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'

import { smmPost } from '../ajax'
import './tracking.css'

type PositionPayload = {
  lat: number
  lon: number
  alt: number | null
  heading: number | null
}
type PositionCoords = Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'altitude' | 'heading'>

interface UserTrackingControlOptions {
  missionId: number
  userName: string
}

interface UserTrackingControlInstance {
  _container?: HTMLDivElement
  _link?: HTMLAnchorElement
  _watchID?: number
  _tracking?: boolean
  _activate?: (ev: Event) => void
  _onKeyDown?: (ev: Event) => void
}

export function userPositionAddUrl(missionId: number, userName: string) {
  return `/mission/${missionId}/data/user/${encodeURIComponent(userName)}/position/add/`
}

export function userPositionHistoryUrl(missionId: MissionId, userName: string) {
  const encodedUser = encodeURIComponent(userName)
  if (isSpecificMission(missionId)) return `/mission/${missionId}/data/user/${encodedUser}/position/history/`
  return `/mission/${missionId}/data/users/${encodedUser}/position/history/`
}

export function userPositionPayload(coords: PositionCoords): PositionPayload {
  return {
    lat: coords.latitude,
    lon: coords.longitude,
    alt: coords.altitude,
    heading: coords.heading
  }
}

function setTrackingState(control: UserTrackingControlInstance, tracking: boolean, title: string) {
  control._tracking = tracking
  control._container?.classList.toggle('is-tracking', tracking)
  if (control._link) control._link.title = title
}

export function createUserTrackingControl(opts: UserTrackingControlOptions): L.Control {
  const Ctrl = L.Control.extend({
    options: { position: 'topleft' },

    onAdd(this: UserTrackingControlInstance) {
      const container = L.DomUtil.create('div', 'UserTracker-container leaflet-bar')
      const link = L.DomUtil.create('a', '', container)
      link.href = '#'
      link.title = 'Track My Position'
      link.setAttribute('role', 'button')
      link.tabIndex = 0

      const img = L.DomUtil.create('img', 'UserTracker-marker', link)
      img.src = markerIcon
      img.alt = 'Track My Position'

      const positionUpdate = (position: GeolocationPosition) => {
        smmPost(userPositionAddUrl(opts.missionId, opts.userName), userPositionPayload(position.coords)).catch((err) => {
          console.error('Failed to record user position:', err)
          stopTracking()
          setTrackingState(this, false, 'Position tracking failed')
        })
      }

      const positionError = (error: GeolocationPositionError) => {
        console.error(`Unable to track user position: ${error.message}`)
        stopTracking()
        setTrackingState(this, false, 'Position tracking unavailable')
      }

      const stopTracking = () => {
        if (this._watchID !== undefined) {
          navigator.geolocation.clearWatch(this._watchID)
          this._watchID = undefined
        }
        setTrackingState(this, false, 'Track My Position')
      }

      const startTracking = () => {
        if (!navigator.geolocation) {
          setTrackingState(this, false, 'Geolocation is not supported')
          return
        }
        this._watchID = navigator.geolocation.watchPosition(positionUpdate, positionError, {
          timeout: 15000,
          maximumAge: 1000,
          enableHighAccuracy: true
        })
        setTrackingState(this, true, 'Stop Tracking My Position')
      }

      const activate = (ev: Event) => {
        L.DomEvent.stop(ev)
        if (this._tracking) stopTracking()
        else startTracking()
      }
      const onKeyDown = (ev: Event) => {
        const key = (ev as KeyboardEvent).key
        if (key === 'Enter' || key === ' ') activate(ev)
      }

      L.DomEvent.disableClickPropagation(link)
      L.DomEvent.on(link, 'click', activate)
      L.DomEvent.on(link, 'keydown', onKeyDown)

      this._container = container
      this._link = link
      this._tracking = false
      this._activate = activate
      this._onKeyDown = onKeyDown

      return container
    },

    onRemove(this: UserTrackingControlInstance) {
      if (this._watchID !== undefined) {
        navigator.geolocation.clearWatch(this._watchID)
        this._watchID = undefined
      }
      if (this._link && this._activate && this._onKeyDown) {
        L.DomEvent.off(this._link, 'click', this._activate)
        L.DomEvent.off(this._link, 'keydown', this._onKeyDown)
      }
      this._container = undefined
      this._link = undefined
      this._activate = undefined
      this._onKeyDown = undefined
    }
  })
  return new Ctrl()
}
