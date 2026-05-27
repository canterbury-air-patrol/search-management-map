import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

import { smmGetJSON, smmPost } from '../ajax'

interface CommandFormData {
  assets: { id: number; name: string }[]
  commands: { value: string; label: string }[]
  requires_position: string[]
}
import { LatLngMarkerInput } from '../LatLngMarkerInput'

interface Props {
  map: L.Map
  missionId: number | string
  onClose: () => void
}

export function AssetCommandDialog({ map, missionId, onClose }: Props) {
  const [assets, setAssets] = useState<{ id: number; name: string }[]>([])
  const [commands, setCommands] = useState<{ value: string; label: string }[]>([])
  const [requiresPosition, setRequiresPosition] = useState<string[]>([])
  const [assetId, setAssetId] = useState('')
  const [command, setCommand] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const gotoPos = useRef<L.LatLng>(map.getCenter())

  useEffect(() => {
    smmGetJSON<CommandFormData>(`/mission/${missionId}/assets/command/set/`, {}).then((data) => {
      setAssets(data.assets)
      setCommands(data.commands)
      setRequiresPosition(data.requires_position)
      if (data.assets.length > 0) setAssetId(String(data.assets[0].id))
      if (data.commands.length > 0) setCommand(data.commands[0].value)
    })
  }, [])

  function handleSet() {
    if (!assetId) {
      setError('Asset is required')
      return
    }
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }
    setError('')
    const data: Record<string, string | number> = { asset: assetId, command, reason }
    if (requiresPosition.includes(command)) {
      data.latitude = gotoPos.current.lat
      data.longitude = gotoPos.current.lng
    }
    smmPost(
      `/mission/${missionId}/assets/command/set/`,
      data,
      () => onClose(),
      (errData) => {
        if (errData && typeof errData === 'object' && 'errors' in errData) {
          const msgs = Object.entries((errData as { errors: Record<string, string[]> }).errors).flatMap(([f, es]) => es.map((e) => (f === '__all__' ? e : `${f}: ${e}`)))
          setError(msgs.join('; ') || 'Failed to set command')
        } else {
          setError('Failed to set command')
        }
      }
    )
  }

  return (
    <div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Asset</span>
        </div>
        <select className="form-control" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Command</span>
        </div>
        <select className="form-control" value={command} onChange={(e) => setCommand(e.target.value)}>
          {commands.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Reason</span>
        </div>
        <input type="text" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {requiresPosition.includes(command) && (
        <LatLngMarkerInput
          map={map}
          initialPos={map.getCenter()}
          onChange={(p) => {
            gotoPos.current = p
          }}
        />
      )}
      {error && <div className="text-danger mb-2">{error}</div>}
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
