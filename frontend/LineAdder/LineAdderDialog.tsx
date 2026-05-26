import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'
import { FormInputGroup } from '../components/FormInputGroup'
import { DialogActions } from '../components/DialogActions'
import { flattenPoints } from '../components/flattenPoints'

interface Props {
  map: L.Map
  missionId: number
  initialPoints: L.LatLng[]
  replaces: number
  initialLabel: string
  onClose: () => void
}

export function LineAdderDialog({ map, missionId, initialPoints, replaces, initialLabel, onClose }: Props) {
  const [label, setLabel] = useState(initialLabel)
  const [positions, setPositions] = useState<L.LatLng[]>(initialPoints)
  const positionsRef = useRef<L.LatLng[]>([...initialPoints])
  const lineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    const line = L.polyline(positionsRef.current, { color: 'yellow' }).addTo(map)
    lineRef.current = line
    return () => {
      line.remove()
    }
  }, [])

  function handlePositionChange(index: number, pos: L.LatLng) {
    positionsRef.current[index] = pos
    lineRef.current?.setLatLngs(positionsRef.current)
  }

  function addPoint() {
    const next = [...positionsRef.current, map.getCenter()]
    positionsRef.current = next
    setPositions(next)
    lineRef.current?.setLatLngs(next)
  }

  function removePoint() {
    if (positionsRef.current.length <= 1) return
    const next = positionsRef.current.slice(0, -1)
    positionsRef.current = next
    setPositions(next)
    lineRef.current?.setLatLngs(next)
  }

  function handleDone() {
    const data = { label, ...flattenPoints(positionsRef.current) }
    if (replaces !== -1) {
      smmPost(`/data/userlines/${replaces}/replace/`, data)
    } else {
      smmPost(`/mission/${missionId}/data/userlines/create/`, data)
    }
    onClose()
  }

  return (
    <div>
      <FormInputGroup label="Name">
        <input type="text" className="form-control" value={label} onChange={(e) => setLabel(e.target.value)} />
      </FormInputGroup>
      <DialogActions className="mb-2">
        <button className="btn btn-primary" onClick={handleDone}>
          Done
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </DialogActions>
      {positions.map((pos, i) => (
        <LatLngMarkerInput key={i} map={map} initialPos={pos} showLabels={i === 0} onChange={(p) => handlePositionChange(i, p)} />
      ))}
      <DialogActions>
        <button className="btn btn-primary" onClick={addPoint}>
          Next
        </button>
        <button className="btn btn-danger" onClick={removePoint} disabled={positions.length <= 1}>
          Remove
        </button>
      </DialogActions>
    </div>
  )
}
