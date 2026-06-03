import { MissionId } from '../mission/MissionId'
import L from 'leaflet'

import { SMMRealtime } from '../smmmap'
import { TotalDriftVectorData } from './types'
import { smmDelete } from '../ajax'
import { MarineVectorPopup } from './MarineVectorPopup'
import { mountPopup } from '../components/mountPopup'

class SMMMarineVector extends SMMRealtime {
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.createPopup = this.createPopup.bind(this)
  }

  getUrl() {
    return `/mission/${this.missionId}/sar/marine/vectors/current/`
  }

  createPopup(tdv: { properties: TotalDriftVectorData }, layer: L.Layer) {
    const tdvID = tdv.properties.pk
    mountPopup(layer, <MarineVectorPopup pk={tdvID} missionId={this.missionId} onDelete={() => smmDelete(`/sar/marine/vectors/${tdvID}/`)} />)
  }
}

export { SMMMarineVector }
