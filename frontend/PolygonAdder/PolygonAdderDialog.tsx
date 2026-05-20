import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'

interface Props {
  map: L.Map
  missionId: number
  initialPoints: L.LatLng[]
  replaces: number
  initialLabel: string
  onClose: () => void
}

export function PolygonAdderDialog({ map, missionId, initialPoints, replaces, initialLabel, onClose }: Props) {
  const [label, setLabel] = useState(initialLabel)
  const [positions, setPositions] = useState<L.LatLng[]>(initialPoints)
  const positionsRef = useRef<L.LatLng[]>([...initialPoints])
  const polygonRef = useRef<L.Polygon | null>(null)

  useEffect(() => {
    const polygon = L.polygon(positionsRef.current, { color: 'yellow' }).addTo(map)
    polygonRef.current = polygon
    return () => {
      polygon.remove()
    }
  }, [])

  function handlePositionChange(index: number, pos: L.LatLng) {
    positionsRef.current[index] = pos
    polygonRef.current?.setLatLngs(positionsRef.current)
  }

  function addPoint() {
    const next = [...positionsRef.current, map.getCenter()]
    positionsRef.current = next
    setPositions(next)
    polygonRef.current?.setLatLngs(next)
  }

  function removePoint() {
    if (positionsRef.current.length <= 1) return
    const next = positionsRef.current.slice(0, -1)
    positionsRef.current = next
    setPositions(next)
    polygonRef.current?.setLatLngs(next)
  }

  function handleDone() {
    const data: Record<string, string | number> = { label, points: positionsRef.current.length }
    positionsRef.current.forEach((p, i) => {
      data[`point${i}_lat`] = p.lat
      data[`point${i}_lng`] = p.lng
    })
    if (replaces !== -1) {
      smmPost(`/data/userpolygons/${replaces}/replace/`, data)
    } else {
      smmPost(`/mission/${missionId}/data/userpolygons/create/`, data)
    }
    onClose()
  }

  return (
    <div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Name</span>
        </div>
        <input type="text" className="form-control" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="btn-group mb-2">
        <button className="btn btn-primary" onClick={handleDone}>
          Done
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </div>
      {positions.map((pos, i) => (
        <LatLngMarkerInput key={i} map={map} initialPos={pos} showLabels={i === 0} onChange={(p) => handlePositionChange(i, p)} />
      ))}
      <div className="btn-group">
        <button className="btn btn-primary" onClick={addPoint}>
          Next
        </button>
        <button className="btn btn-danger" onClick={removePoint} disabled={positions.length <= 1}>
          Remove
        </button>
      </div>
    </div>
  )
}
