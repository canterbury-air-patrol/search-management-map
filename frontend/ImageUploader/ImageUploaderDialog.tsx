import { useRef } from 'react'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPostBody } from '../ajax'

interface Props {
  map: L.Map
  missionId: number | string
  onClose: () => void
}

export function ImageUploaderDialog({ map, missionId, onClose }: Props) {
  const posRef = useRef<L.LatLng>(map.getCenter())
  const fileRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)

  function handleUpload() {
    const formData = new FormData()
    formData.append('description', descRef.current?.value ?? '')
    formData.append('latitude', String(posRef.current.lat))
    formData.append('longitude', String(posRef.current.lng))
    if (fileRef.current?.files?.[0]) {
      formData.append('file', fileRef.current.files[0])
    }
    smmPostBody(`/mission/${missionId}/image/upload/`, formData)
    onClose()
  }

  return (
    <div>
      <table>
        <tbody>
          <tr>
            <td>File:</td>
            <td>
              <input ref={fileRef} name="file" type="file" accept="image/*" />
            </td>
          </tr>
          <tr>
            <td>Description:</td>
            <td>
              <input ref={descRef} name="description" type="text" />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <LatLngMarkerInput
                map={map}
                initialPos={map.getCenter()}
                onChange={(p) => {
                  posRef.current = p
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="btn-group" role="group">
        <button className="btn btn-primary" onClick={handleUpload}>
          Upload
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
