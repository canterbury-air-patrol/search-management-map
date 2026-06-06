import { MissionId } from '../mission/MissionId'
import L from 'leaflet'
import React from 'react'

import { smmDelete } from '../ajax'
import { SMMRealtime } from '../smmmap'
import { mountPopup } from '../components/mountPopup'
import { SMMUserGeoLabelData } from './types'

/**
 * Abstract base for per-feature geo objects (SMMPOI, SMMLine, SMMPolygon).
 * Handles deleteCallback and the createPopup lifecycle via mountPopup.
 */
abstract class SMMUserGeoLayer {
  map: L.Map
  missionId: MissionId
  data: SMMUserGeoLabelData
  private popup?: ReturnType<typeof mountPopup>

  constructor(map: L.Map, missionId: MissionId, data: SMMUserGeoLabelData) {
    this.map = map
    this.missionId = missionId
    this.data = data
    this.deleteCallback = this.deleteCallback.bind(this)
    this.editCallback = this.editCallback.bind(this)
    this.createSearchCallback = this.createSearchCallback.bind(this)
  }

  abstract editCallback(): void
  abstract createSearchCallback(): void
  abstract renderPopup(): React.ReactElement

  deleteCallback() {
    smmDelete(`/data/usergeo/${this.data.pk}/`)
  }

  getPopupOptions(): L.PopupOptions {
    return {}
  }

  createPopup(layer: L.Layer) {
    this.popup?.unmount()
    this.popup = mountPopup(layer, this.renderPopup(), this.getPopupOptions())
  }
}

/**
 * Abstract base for geo-layer collection classes (SMMPOIs, SMMLines, SMMPolygons).
 * Handles the objects cache, getObject, and createPopup dispatch.
 */
abstract class SMMUserGeoCollection<TGeoJSON extends { properties: SMMUserGeoLabelData }, TLayer extends SMMUserGeoLayer> extends SMMRealtime {
  objects: { [key: number]: TLayer }

  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.objects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  abstract createObject(feature: TGeoJSON): TLayer

  getObject(pk: number, feature: TGeoJSON): TLayer {
    let obj = this.objects[pk]
    if (!obj) {
      obj = this.createObject(feature)
      this.objects[pk] = obj
    }
    return obj
  }

  createPopup(feature: TGeoJSON, layer: L.Layer) {
    this.getObject(feature.properties.pk, feature).createPopup(layer)
  }
}

export { SMMUserGeoLayer, SMMUserGeoCollection }
