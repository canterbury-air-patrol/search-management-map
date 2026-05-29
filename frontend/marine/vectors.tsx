import L from 'leaflet'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { SMMRealtime } from '../smmmap'
import { TotalDriftVectorData } from './types'
import { smmDelete } from '../ajax'
import { MarineVectorPopup } from './MarineVectorPopup'

class SMMMarineVector extends SMMRealtime {
  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/sar/marine/vectors/current/`
  }

  createPopup(tdv: { properties: TotalDriftVectorData }, layer: L.Layer) {
    const tdvID = tdv.properties.pk

    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    root.render(<MarineVectorPopup pk={tdvID} missionId={this.missionId} onDelete={() => smmDelete(`/sar/marine/vectors/${tdvID}/`)} />)
    layer.bindPopup(container)
    layer.on('remove', () => root.unmount())
  }
}

export { SMMMarineVector }
