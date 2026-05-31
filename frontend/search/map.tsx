import { MissionId } from '../mission/MissionId'
import { formatLocalDateTime } from '../format'
import * as ReactDOM from 'react-dom/client'

import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import { SMMRealtime } from '../smmmap'
import { SMMSearchObjectDetailsData } from './types'
import { smmDelete } from '../ajax'
import { SearchQueueDialog } from './SearchQueueDialog'
import { SearchPopup } from './SearchPopup'

class SMMSearch {
  parent: SMMSearches
  search: SMMSearchObjectDetailsData
  QueueDialog?: L.Control.Dialog
  popupRoot?: ReactDOM.Root
  constructor(parent: SMMSearches, search: SMMSearchObjectDetailsData) {
    this.parent = parent
    this.search = search

    this.deleteCallback = this.deleteCallback.bind(this)
    this.searchQueueDestroy = this.searchQueueDestroy.bind(this)
    this.searchQueueDialog = this.searchQueueDialog.bind(this)
  }

  deleteCallback() {
    smmDelete(`/search/${this.search.pk}/`)
  }

  searchQueueDestroy() {
    this.QueueDialog?.destroy()
    this.QueueDialog = undefined
  }

  searchQueueDialog() {
    const container = document.createElement('div')
    this.QueueDialog = L.control.dialog({ initOpen: true }).setContent(container).addTo(this.parent.map).hideClose()
    const root = ReactDOM.createRoot(container)
    root.render(
      <SearchQueueDialog
        searchPk={this.search.pk}
        missionId={this.parent.missionId}
        createdFor={this.search.created_for as string}
        onClose={() => {
          root.unmount()
          this.searchQueueDestroy()
        }}
      />
    )
  }

  createPopup(layer: L.Layer) {
    this.popupRoot?.unmount()
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    this.popupRoot = root
    root.render(
      <SearchPopup
        search={this.search}
        missionId={this.parent.missionId}
        status={this.parent.searchStatus(this.search)}
        onDelete={this.deleteCallback}
        onQueueDialog={this.searchQueueDialog}
      />
    )
    layer.bindPopup(container, { minWidth: 200 })
    layer.once('remove', () => {
      root.unmount()
      if (this.popupRoot === root) {
        this.popupRoot = undefined
      }
    })
  }
}

abstract class SMMSearches extends SMMRealtime {
  searchObjects: { [key: number]: SMMSearch }
  constructor(map: L.Map, missionId: MissionId, interval: number, color: string) {
    super(map, missionId, interval, color)

    this.searchObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  abstract searchStatus(search: SMMSearchObjectDetailsData): string

  getObject(pk: number, search: SMMSearchObjectDetailsData) {
    if (!(pk in this.searchObjects)) {
      const searchObject = new SMMSearch(this, search)
      this.searchObjects[pk] = searchObject
    }
    return this.searchObjects[pk]
  }

  createPopup(search: { properties: SMMSearchObjectDetailsData }, layer: L.Layer) {
    this.getObject(search.properties.pk, search.properties).createPopup(layer)
  }
}

class SMMSearchesNotStarted extends SMMSearches {
  getUrl() {
    return `/mission/${this.missionId}/search/notstarted/`
  }

  searchStatus(search: SMMSearchObjectDetailsData) {
    let status = 'Unassigned'
    if (search.queued_at) {
      const at = formatLocalDateTime(search.queued_at)
      if (search.queued_for_asset) {
        status = `Queued for ${search.queued_for_asset} at ${at}`
      } else {
        status = `Queued for ${search.created_for} at ${at}`
      }
    }

    return status
  }
}

class SMMSearchesInprogress extends SMMSearches {
  getUrl() {
    return `/mission/${this.missionId}/search/inprogress/`
  }

  searchStatus(search: SMMSearchObjectDetailsData) {
    return `In Progress: ${search.inprogress_by}`
  }
}

class SMMSearchesComplete extends SMMSearches {
  getUrl() {
    return `/mission/${this.missionId}/search/completed/`
  }

  searchStatus() {
    return 'Completed'
  }
}

export { SMMSearchesNotStarted, SMMSearchesInprogress, SMMSearchesComplete }
