import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

interface Props {
  map: L.Map
  initialPos: L.LatLng
  onChange?: (pos: L.LatLng) => void
}

export function LatLngMarkerInput({ map, initialPos, onChange }: Props) {
  const [latText, setLatText] = useState(degreesToDM(initialPos.lat, true))
  const [lngText, setLngText] = useState(degreesToDM(initialPos.lng, false))
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const marker = L.marker(initialPos, { draggable: true, autoPan: true }).addTo(map)
    markerRef.current = marker
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setLatText(degreesToDM(pos.lat, true))
      setLngText(degreesToDM(pos.lng, false))
      onChange?.(pos)
    })
    return () => {
      marker.remove()
    }
  }, [])

  function syncMarker(lat: string, lng: string) {
    const latDeg = DMToDegrees(lat)
    const lngDeg = DMToDegrees(lng)
    if (isFinite(latDeg) && isFinite(lngDeg) && markerRef.current) {
      const pos = L.latLng(latDeg, lngDeg)
      markerRef.current.setLatLng(pos)
      onChange?.(pos)
    }
  }

  return (
    <>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Lat</span>
        </div>
        <input
          type="text"
          className="form-control"
          value={latText}
          onChange={(e) => {
            setLatText(e.target.value)
            syncMarker(e.target.value, lngText)
          }}
        />
      </div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Long</span>
        </div>
        <input
          type="text"
          className="form-control"
          value={lngText}
          onChange={(e) => {
            setLngText(e.target.value)
            syncMarker(latText, e.target.value)
          }}
        />
      </div>
    </>
  )
}
