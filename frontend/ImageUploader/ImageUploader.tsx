import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { ImageUploaderDialog } from './ImageUploaderDialog'
import { createIconControl } from '../components/iconControl'

interface ImageUploaderControlOptions {
  missionId: number | string
}

function openUploader(map: L.Map, missionId: number | string) {
  const container = document.createElement('div')
  const dialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(map).hideClose()
  const root = ReactDOM.createRoot(container)
  root.render(
    <ImageUploaderDialog
      map={map}
      missionId={missionId}
      onClose={() => {
        root.unmount()
        dialog.destroy()
      }}
    />
  )
}

L.control.imageuploader = function (opts: ImageUploaderControlOptions) {
  return createIconControl({
    iconUrl: '/static/icons/image-x-generic.png',
    title: 'Image Uploader',
    cssPrefix: 'ImageUploader',
    onClick: (map) => openUploader(map, opts.missionId)
  })
}
