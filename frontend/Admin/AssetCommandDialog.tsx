import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import { smmGet, smmPost } from '../ajax'

interface Props {
  map: L.Map
  missionId: number | string
  onClose: () => void
}

export function AssetCommandDialog({ map, missionId, onClose }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)

  function handleCommandChange() {
    const form = formRef.current
    if (!form) return
    const selectedCommand = (form.querySelector('#id_command') as HTMLSelectElement)?.value
    if (selectedCommand === 'GOTO') {
      const lat = form.querySelector('#latitude') as HTMLElement
      const lng = form.querySelector('#longitude') as HTMLElement
      if (lat) lat.style.display = ''
      if (lng) lng.style.display = ''
      if (!markerRef.current) {
        markerRef.current = L.marker(map.getCenter(), { draggable: true, autoPan: true }).addTo(map)
      }
    } else {
      const lat = form.querySelector('#latitude') as HTMLElement
      const lng = form.querySelector('#longitude') as HTMLElement
      if (lat) lat.style.display = 'none'
      if (lng) lng.style.display = 'none'
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
  }

  function handleSet() {
    const form = formRef.current
    const data: Record<string, string | number> = {
      asset: (form?.querySelector('#id_asset') as HTMLInputElement)?.value,
      reason: (form?.querySelector('#id_reason') as HTMLInputElement)?.value,
      command: (form?.querySelector('#id_command') as HTMLSelectElement)?.value
    }
    if (markerRef.current) {
      const coords = markerRef.current.getLatLng()
      data.latitude = coords.lat
      data.longitude = coords.lng
    }
    smmPost(`/mission/${missionId}/assets/command/set/`, data, (result) => {
      if (result === 'Created') {
        onClose()
        return
      }
      if (form) form.innerHTML = result as string
    })
  }

  useEffect(() => {
    smmGet(`/mission/${missionId}/assets/command/set/`, {}, (data) => {
      if (!formRef.current) return
      formRef.current.innerHTML = data as string
      formRef.current.querySelector('#id_command')?.addEventListener('change', handleCommandChange)
    })
    return () => {
      if (markerRef.current) map.removeLayer(markerRef.current)
    }
  }, [])

  return (
    <div>
      <div ref={formRef} />
      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleSet}>
          Set
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
