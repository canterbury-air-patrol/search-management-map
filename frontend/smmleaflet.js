import L from 'leaflet'

import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

class MappedMarker {
  constructor (latInput, lngInput, pos, cb = null) {
    this.latInput = latInput
    this.lngInput = lngInput
    this.cb = cb
    this.marker = L.marker(pos, {
      draggable: true,
      autoPan: true
    })
    this.updateTxtLatLng = this.updateTxtLatLng.bind(this)
    this.updateMarkerLatLng = this.updateMarkerLatLng.bind(this)

    this.latInput.on('change keydown paste input', this.updateMarkerLatLng)
    this.lngInput.on('change keydown paste input', this.updateMarkerLatLng)
    this.marker.on('dragend', this.updateTxtLatLng)
    this.updateTxtLatLng()
  }

  updateMarkerLatLng () {
    const latLng = L.latLng(DMToDegrees(this.latInput.val()), DMToDegrees(this.lngInput.val()))
    this.marker.setLatLng(latLng)
    if (this.cb !== null) {
      this.cb()
    }
  }

  updateTxtLatLng () {
    const markerCoords = this.marker.getLatLng()
    this.latInput.val(degreesToDM(markerCoords.lat, true))
    this.lngInput.val(degreesToDM(markerCoords.lng, false))
    if (this.cb !== null) {
      this.cb()
    }
  }

  getMarker () {
    return this.marker
  }
}

export { MappedMarker }
