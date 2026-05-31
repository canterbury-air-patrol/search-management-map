import L from 'leaflet'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmDelete } from '../ajax'
import { SMMRealtime } from '../smmmap'
import { SMMUserGeoLabelData } from './types'

/**
 * Abstract base for per-feature geo objects (SMMPOI, SMMLine, SMMPolygon).
 * Handles deleteCallback and the createPopup lifecycle (container, root, bind, unmount).
 */
abstract class SMMUserGeoLayer {
  map: L.Map
  missionId: number | string
  data: SMMUserGeoLabelData
  popupRoot?: ReactDOM.Root

  constructor(map: L.Map, missionId: number | string, data: SMMUserGeoLabelData) {
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
    this.popupRoot?.unmount()
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    this.popupRoot = root
    root.render(this.renderPopup())
    layer.bindPopup(container, this.getPopupOptions())
    layer.once('remove', () => {
      root.unmount()
      if (this.popupRoot === root) {
        this.popupRoot = undefined
      }
    })
  }
}

/**
 * Abstract base for geo-layer collection classes (SMMPOIs, SMMLines, SMMPolygons).
 * Handles the objects cache, getObject, and createPopup dispatch.
 */
abstract class SMMUserGeoCollection<TGeoJSON extends { properties: SMMUserGeoLabelData }, TLayer extends SMMUserGeoLayer> extends SMMRealtime {
  objects: { [key: number]: TLayer }

  constructor(map: L.Map, missionId: number | string, interval: number, color: string) {
    super(map, missionId, interval, color)
    this.objects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  abstract createObject(feature: TGeoJSON): TLayer

  getObject(pk: number, feature: TGeoJSON): TLayer {
    if (!(pk in this.objects)) {
      this.objects[pk] = this.createObject(feature)
    }
    return this.objects[pk]
  }

  createPopup(feature: TGeoJSON, layer: L.Layer) {
    this.getObject(feature.properties.pk, feature).createPopup(layer)
  }
}

export { SMMUserGeoLayer, SMMUserGeoCollection }
