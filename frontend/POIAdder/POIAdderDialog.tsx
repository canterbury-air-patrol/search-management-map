import React, { useRef, useState } from 'react'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'
import { FormInputGroup } from '../components/FormInputGroup'
import { DialogActions } from '../components/DialogActions'

interface Props {
  map: L.Map
  missionId: number
  initialPos: L.LatLng
  replaces: number
  initialLabel: string
  onClose: () => void
}

export function POIAdderDialog({ map, missionId, initialPos, replaces, initialLabel, onClose }: Props) {
  const [label, setLabel] = useState(initialLabel)
  const posRef = useRef<L.LatLng>(initialPos)

  function createOrReplace() {
    const data = { lat: posRef.current.lat, lon: posRef.current.lng, label }
    if (replaces === -1) {
      smmPost(`/mission/${missionId}/data/pois/create/`, data)
    } else {
      smmPost(`/data/pois/${replaces}/replace/`, data)
    }
    onClose()
  }

  return (
    <div>
      <FormInputGroup label="Name">
        <textarea autoFocus className="form-control" rows={2} value={label} onChange={(e) => setLabel(e.target.value)} />
      </FormInputGroup>
      <LatLngMarkerInput
        map={map}
        initialPos={initialPos}
        onChange={(p) => {
          posRef.current = p
        }}
      />
      <DialogActions>
        <button className="btn btn-primary" onClick={createOrReplace}>
          Create
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </DialogActions>
    </div>
  )
}
