import React, { useEffect, useState } from 'react'

import { MissionAssetData } from '../asset/types'
import { smmGetJSON, smmPost } from '../ajax'

interface Props {
  searchPk: number
  missionId: number | string
  createdFor: string
  onClose: () => void
}

export function SearchQueueDialog({ searchPk, missionId, createdFor, onClose }: Props) {
  const [selectType, setSelectType] = useState<'type' | 'asset'>('type')
  const [assets, setAssets] = useState<Array<{ id: number; name: string }>>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')

  useEffect(() => {
    smmGetJSON(`/mission/${missionId}/assets/`, (data) => {
      const d = data as { assets: Array<MissionAssetData> }
      if ('assets' in d) {
        const filtered = d.assets.filter((a) => a.type_name === createdFor)
        setAssets(filtered)
        if (filtered.length > 0) setSelectedAssetId(String(filtered[0].id))
      }
    })
  }, [])

  function handleQueue() {
    const data: { asset?: string } = {}
    if (selectType === 'asset') data.asset = selectedAssetId
    smmPost(`/search/${searchPk}/queue/`, data, onClose)
  }

  return (
    <div>
      <div>
        Queue for{' '}
        <select value={selectType} onChange={(e) => setSelectType(e.target.value as 'type' | 'asset')}>
          <option value="type">Asset Type</option>
          <option value="asset">Specific Asset</option>
        </select>
      </div>
      {selectType === 'asset' && (
        <div>
          <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <button className="btn btn-light" onClick={handleQueue}>
          Queue
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
