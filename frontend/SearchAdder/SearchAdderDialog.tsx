import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

import { smmGetJSON, smmPost } from '../ajax'

type SearchType = 'sector' | 'expanding-box' | 'track-line' | 'shore-line' | 'creeping-line'

interface AssetType {
  id: number
  name: string
}

interface Props {
  map: L.Map
  objectType: 'point' | 'line' | 'polygon'
  objectID: number
  onClose: () => void
}

function initialSearchType(objectType: Props['objectType']): SearchType {
  if (objectType === 'point') return 'sector'
  if (objectType === 'line') return 'track-line'
  return 'creeping-line'
}

function getUrl(searchType: SearchType, objectType: Props['objectType']): string {
  switch (searchType) {
    case 'sector':
      return '/search/sector/create/'
    case 'expanding-box':
      return '/search/expandingbox/create/'
    case 'track-line':
      return '/search/trackline/create/'
    case 'shore-line':
      return '/search/shoreline/create/'
    case 'creeping-line':
      return objectType === 'line' ? '/search/creepingline/create/track/' : '/search/creepingline/create/polygon/'
  }
}

export function SearchAdderDialog({ map, objectType, objectID, onClose }: Props) {
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType(objectType))
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [sweepWidth, setSweepWidth] = useState('')
  const [assetTypeId, setAssetTypeId] = useState('')
  const [iterations, setIterations] = useState('')
  const [firstBearing, setFirstBearing] = useState('0')
  const [width, setWidth] = useState('')
  const previewRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    smmGetJSON('/assets/assettypes/', {}, function (data) {
      const types: AssetType[] = []
      for (const group of data as AssetType[][]) {
        for (const assetType of group) {
          types.push(assetType)
        }
      }
      setAssetTypes(types)
      if (types.length > 0) setAssetTypeId(String(types[0].id))
    })
    return () => {
      previewRef.current?.remove()
    }
  }, [])

  function getData() {
    const data: Record<string, string | number> = {
      sweep_width: sweepWidth,
      asset_type_id: assetTypeId,
      iterations,
      first_bearing: firstBearing,
      width
    }
    if (objectType === 'point') data.poi_id = objectID
    else if (objectType === 'line') data.line_id = objectID
    else data.poly_id = objectID
    return data
  }

  function handlePreview() {
    smmGetJSON(getUrl(searchType, objectType), getData(), function (data) {
      previewRef.current?.remove()
      previewRef.current = L.geoJSON(data as GeoJSON.GeoJsonObject, { color: 'yellow' }).addTo(map)
    })
  }

  function handleCreate() {
    previewRef.current?.remove()
    smmPost(getUrl(searchType, objectType), getData())
    onClose()
  }

  function handleCancel() {
    previewRef.current?.remove()
    onClose()
  }

  const showIterations = searchType === 'expanding-box'
  const showWidth = searchType === 'creeping-line' && objectType === 'line'

  return (
    <div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Search Type</span>
        </div>
        <select className="form-control" value={searchType} onChange={(e) => setSearchType(e.target.value as SearchType)}>
          {objectType === 'point' && (
            <>
              <option value="sector">Sector</option>
              <option value="expanding-box">Expanding Box</option>
            </>
          )}
          {objectType === 'line' && (
            <>
              <option value="track-line">Track Line</option>
              <option value="shore-line">Shore Line</option>
              <option value="creeping-line">Creeping Line Ahead</option>
            </>
          )}
          {objectType === 'polygon' && <option value="creeping-line">Creeping Line Ahead</option>}
        </select>
      </div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Asset Type</span>
        </div>
        <select className="form-control" value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)}>
          {assetTypes.map((at) => (
            <option key={at.id} value={at.id}>
              {at.name}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group input-group-sm mb-3">
        <div className="input-group-prepend">
          <span className="input-group-text">Sweep Width</span>
        </div>
        <input className="form-control form-control-sm" type="number" value={sweepWidth} onChange={(e) => setSweepWidth(e.target.value)} />
      </div>
      {showIterations && (
        <div className="input-group input-group-sm mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">Iterations</span>
          </div>
          <input className="form-control form-control-sm" type="number" value={iterations} onChange={(e) => setIterations(e.target.value)} />
        </div>
      )}
      {showIterations && (
        <div className="input-group input-group-sm mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">First Bearing</span>
          </div>
          <input className="form-control form-control-sm" type="number" min={0} max={359} value={firstBearing} onChange={(e) => setFirstBearing(e.target.value)} />
        </div>
      )}
      {showWidth && (
        <div className="input-group input-group-sm mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">Width (across line)</span>
          </div>
          <input className="form-control form-control-sm" type="number" min={0} value={width} onChange={(e) => setWidth(e.target.value)} />
        </div>
      )}
      <div className="btn-group">
        <button className="btn btn-warning" onClick={handlePreview}>
          Preview
        </button>
        <button className="btn btn-primary" onClick={handleCreate}>
          Create
        </button>
        <button className="btn btn-danger" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
