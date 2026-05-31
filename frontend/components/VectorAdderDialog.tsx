import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'
import { FormInputGroup } from './FormInputGroup'
import { DialogActions } from './DialogActions'
import { flattenPoints } from './flattenPoints'

const resourceMap = { line: 'userlines', polygon: 'userpolygons' } as const

interface Props {
  map: L.Map
  type: 'line' | 'polygon'
  missionId: number
  initialPoints: L.LatLng[]
  replaces: number
  initialLabel: string
  onClose: () => void
}

export function VectorAdderDialog({ map, type, missionId, initialPoints, replaces, initialLabel, onClose }: Props) {
  const [label, setLabel] = useState(initialLabel)
  const [positions, setPositions] = useState<L.LatLng[]>(initialPoints)
  const positionsRef = useRef<L.LatLng[]>([...initialPoints])
  const shapeRef = useRef<L.Polyline | L.Polygon | null>(null)

  useEffect(() => {
    // Mount-only: the shape is updated in place via setLatLngs below;
    // changing type or map mid-dialog isn't supported.
    const shape = type === 'line' ? L.polyline(positionsRef.current, { color: 'yellow' }) : L.polygon(positionsRef.current, { color: 'yellow' })
    shape.addTo(map)
    shapeRef.current = shape
    return () => {
      shape.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePositionChange(index: number, pos: L.LatLng) {
    positionsRef.current[index] = pos
    shapeRef.current?.setLatLngs(positionsRef.current)
  }

  function addPoint() {
    const next = [...positionsRef.current, map.getCenter()]
    positionsRef.current = next
    setPositions(next)
    shapeRef.current?.setLatLngs(next)
  }

  function removePoint() {
    if (positionsRef.current.length <= 1) return
    const next = positionsRef.current.slice(0, -1)
    positionsRef.current = next
    setPositions(next)
    shapeRef.current?.setLatLngs(next)
  }

  function handleDone() {
    const resource = resourceMap[type]
    const data = { label, ...flattenPoints(positionsRef.current) }
    if (replaces !== -1) {
      smmPost(`/data/${resource}/${replaces}/replace/`, data)
    } else {
      smmPost(`/mission/${missionId}/data/${resource}/create/`, data)
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
