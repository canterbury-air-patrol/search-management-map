import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'
import { MissionAssetData } from '../asset/types'
import { SMMSearchObjectDetailsData } from './types'

class SMMSearch {
  parent: SMMSearches
  search: SMMSearchObjectDetailsData
  QueueDialog?: L.Control.Dialog
  constructor(parent: SMMSearches, search: SMMSearchObjectDetailsData) {
    this.parent = parent
    this.search = search

    this.deleteCallback = this.deleteCallback.bind(this)
    this.searchQueueAssetListCallback = this.searchQueueAssetListCallback.bind(this)
    this.searchQueueSubmit = this.searchQueueSubmit.bind(this)
    this.searchQueueDestroy = this.searchQueueDestroy.bind(this)
    this.searchQueueUpdateSelectType = this.searchQueueUpdateSelectType.bind(this)
    this.searchQueueDialog = this.searchQueueDialog.bind(this)
  }

  deleteCallback() {
    const { csrftoken } = this.parent
    $.ajax({
      url: `/search/${this.search.pk}/`,
      method: 'DELETE',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRFToken', csrftoken)
      }
    })
  }

  createDetailsButton() {
    return {
      label: 'Details',
      href: `/search/${this.search.pk}/`,
      btnClass: 'btn-light'
    }
  }

  searchDataToPopUp(data: Array<{ css: string; label: string; value: string }>) {
    const dl = document.createElement('dl')
    dl.className = 'search-data row'

    for (const d of data) {
      const dt = document.createElement('dt')
      dt.className = `search-${d.css}-label col-sm-6`
      dt.textContent = d.label
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = `search-${d.css}-value col-sm-6`
      dd.textContent = d.value
      dl.appendChild(dd)
    }

    return dl
  }

  searchQueueAssetListCallback(data: { assets: Array<MissionAssetData> }) {
    if ('assets' in data) {
      for (const asset of data.assets) {
        if (asset.type_name === this.search.created_for) {
          $(`#queue_${this.search.pk}_select_asset`).append(`<option value='${asset.id}'>${asset.name}</option>`)
        }
      }
    }
  }

  searchQueueDestroy() {
    this.QueueDialog.destroy()
    this.QueueDialog = undefined
  }

  searchQueueSubmit() {
    const data = [
      {
        name: 'csrfmiddlewaretoken',
        value: this.parent.csrftoken
      }
    ]
    if ($(`#queue_${this.search.pk}_select_type`).val() === 'asset') {
      data.push({
        name: 'asset',
        value: $(`#queue_${this.search.pk}_select_asset`).val() as string
      })
    }
    $.post(`/search/${this.search.pk}/queue/`, data, this.searchQueueDestroy)
  }

  searchQueueUpdateSelectType() {
    if ($(`#queue_${this.search.pk}_select_type`).val() === 'type') {
      $(`#queue_${this.search.pk}_select_asset`).hide()
    } else {
      $(`#queue_${this.search.pk}_select_asset`).show()
    }
  }

  searchQueueDialog() {
    const contents = [
      `<div>Queue for <select id='queue_${this.search.pk}_select_type'><option value='type'>Asset Type</option><option value='asset'>Specific Asset</option></select></div>`,
      `<div><select id='queue_${this.search.pk}_select_asset'></select></div>`,
      `<div><button class='btn btn-light' id='queue_${this.search.pk}_queue'>Queue</button></div>`,
      `<div><button class='btn btn-danger' id='queue_${this.search.pk}_cancel'>Cancel</button>`
    ].join('')
    this.QueueDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.parent.map).hideClose()
    $(`#queue_${this.search.pk}_select_asset`).hide()
    $.getJSON(`/mission/${this.parent.missionId}/assets/`, this.searchQueueAssetListCallback)
    $(`#queue_${this.search.pk}_select_type`).on('change', this.searchQueueUpdateSelectType)
    $(`#queue_${this.search.pk}_queue`).on('click', this.searchQueueSubmit)
    $(`#queue_${this.search.pk}_cancel`).on('click', this.searchQueueDestroy)
  }

  createPopup(layer: L.Layer) {
    const data = [
      { css: 'type', label: 'Search Type', value: this.search.search_type },
      { css: 'status', label: 'Status', value: this.parent.searchStatus(this.search) },
      { css: 'sweep-width', label: 'Sweep Width', value: this.search.sweep_width + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: this.search.created_for as string }
    ]

    if (this.search.completed_by) {
      data.push({
        css: 'completed',
        label: 'Completed By',
        value: this.search.completed_by
      })
    } else if (this.search.inprogress_by) {
      data.push({
        css: 'inprogress',
        label: 'Inprogress By',
        value: this.search.inprogress_by
      })
    }
    if (this.search.inprogress_at) {
      data.push({
        css: 'inprogress',
        label: 'Search Started',
        value: this.search.inprogress_at
      })
    }
    if (this.search.completed_at) {
      data.push({
        css: 'completed',
        label: 'Search Completed',
        value: this.search.completed_at
      })
    }

    const popupContent = document.createElement('div')
    popupContent.appendChild(this.searchDataToPopUp(data))

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      const buttonData = []
      if (!this.search.inprogress_at) {
        buttonData.push({
          label: 'Delete',
          onclick: this.deleteCallback,
          btnClass: 'btn-danger'
        })
      }
      if (!this.search.queued_at && !this.search.inprogress_at) {
        buttonData.push({
          label: 'Queue',
          onclick: this.searchQueueDialog,
          btnClass: 'btn-light'
        })
      }
      buttonData.push(this.createDetailsButton())
      popupContent.appendChild(this.parent.createButtonGroup(buttonData))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

abstract class SMMSearches extends SMMRealtime {
  searchObjects: { [key: number]: SMMSearch }
  constructor(map: L.Map, csrftoken: string, missionId: number | string, interval: number, color: string) {
    super(map, csrftoken, missionId, interval, color)

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
      if (search.queued_for_asset) {
        status = `Queued for ${search.queued_for_asset} at ${search.queued_at}`
      } else {
        status = `Queued for ${search.created_for} at ${search.queued_at}`
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
