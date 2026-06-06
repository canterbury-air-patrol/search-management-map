import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { cookieJar, PREFERENCE_COOKIE_OPTS } from '../cookies'
import { smmGetJSON } from '../ajax'
import { ColorPickerDialog } from '../asset/ColorPickerDialog'
import { renderInLeafletDialog } from './renderInLeafletDialog'

/** Minimal shape the history endpoints share: a list of point features in
 *  [lon, lat] order, each carrying the time it was recorded. Both the
 *  asset and user position-history responses are supersets of this. */
interface PositionHistory {
  features: Array<{ geometry: { coordinates: [number, number] }; properties: { created_at: string } }>
}

/**
 * Shared behaviour for a single moving entity rendered as a growing
 * polyline (SMMAsset, SMMUserPosition): the accumulated path, the track
 * colour with its persisted preference and swatch, the colour-picker
 * dialog, and the in-flight-guarded incremental history fetch.
 *
 * Subclasses supply only what differs: the cookie key the colour is
 * stored under and the endpoint that returns the position history.
 */
export abstract class TrackedPath {
  map: L.Map
  missionId: MissionId
  /** Human-readable label shown in the colour-picker dialog. */
  displayName: string
  color: string
  swatch?: HTMLElement
  lastUpdate?: string
  path: L.LatLng[]
  updating: boolean
  polyline: L.Polyline

  constructor(map: L.Map, missionId: MissionId, displayName: string, color: string) {
    this.map = map
    this.missionId = missionId
    this.displayName = displayName
    this.color = color
    this.path = []
    this.updating = false
    this.polyline = L.polyline([], { color: this.color })
  }

  /** Cookie key under which this track's colour preference is stored. */
  protected abstract colorCookieKey(): string
  /** Endpoint returning this track's position history (GeoJSON features). */
  protected abstract historyUrl(): string

  overlay() {
    return this.polyline
  }

  updateColor = (color: string) => {
    cookieJar.set(this.colorCookieKey(), color, PREFERENCE_COOKIE_OPTS)
    this.color = color
    this.polyline.setStyle({ color: this.color })
    if (this.swatch) this.swatch.style.backgroundColor = color
  }

  colorPicker = () => {
    renderInLeafletDialog(this.map, (onClose) => <ColorPickerDialog name={this.displayName} color={this.color} onColorChange={this.updateColor} onClose={onClose} />, {
      initOpen: true
    })
  }

  private applyHistory = (route: PositionHistory) => {
    for (const feature of route.features) {
      const lon = feature.geometry.coordinates[0]
      const lat = feature.geometry.coordinates[1]
      this.path.push(L.latLng(lat, lon))
      this.lastUpdate = feature.properties.created_at
    }
    this.polyline.setLatLngs(this.path)
    this.updating = false
  }

  private updateFailed = () => {
    this.updating = false
  }

  update() {
    if (this.updating) {
      return
    }
    this.updating = true

    const params: Record<string, string | undefined> = { oldest: 'last' }
    if (this.lastUpdate != null) {
      params.from = this.lastUpdate
    }

    smmGetJSON<PositionHistory>(this.historyUrl(), params).then(this.applyHistory).catch(this.updateFailed)
  }
}
