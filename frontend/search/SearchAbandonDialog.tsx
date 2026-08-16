import { useState } from 'react'

import { smmPost } from '../ajax'
import { FormInputGroup } from '../components/FormInputGroup'

interface Props {
  searchPk: number
  assetName: string
  onClose: () => void
}

export function SearchAbandonDialog({ searchPk, assetName, onClose }: Props) {
  const [reason, setReason] = useState('Abandoned from map')
  const [error, setError] = useState('')

  function handleAbandon() {
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }
    setError('')
    smmPost(
      `/search/${searchPk}/abandon/`,
      { reason },
      () => onClose(),
      (errData) => {
        if (errData && typeof errData === 'object' && 'errors' in errData) {
          const msgs = Object.entries((errData as { errors: Record<string, string[]> }).errors).flatMap(([f, es]) => es.map((e) => (f === '__all__' ? e : `${f}: ${e}`)))
          setError(msgs.join('; ') || 'Failed to abandon search')
        } else {
          setError('Failed to abandon search')
        }
      }
    )
  }

  return (
    <div>
      <p>Take {assetName} off this search?</p>
      <FormInputGroup label="Reason">
        <input type="text" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormInputGroup>
      {error && <div className="text-danger mb-2">{error}</div>}
      <div className="btn-group">
        <button className="btn btn-warning" onClick={handleAbandon}>
          Abandon Search
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
