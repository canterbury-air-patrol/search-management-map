import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMSearch {
  constructor(parent, search) {
    this.parent = parent
    this.SearchID = search.properties.pk
    this.SweepWidth = search.properties.sweep_width
    this.AssetType = search.properties.created_for
    this.SearchType = search.properties.search_type
    this.QueuedAt = search.properties.queued_at
    this.QueuedForAsset = search.properties.queued_for_asset
    this.CreatedFor = search.properties.created_for
    this.InprogressBy = search.properties.inprogress_by
    this.InprogressAt = search.properties.inprogress_at
    this.CompletedBy = search.properties.completed_by
    this.CompletedAt = search.properties.completed_at

    this.deleteCallback = this.deleteCallback.bind(this)
    this.searchQueueAssetListCallback = this.searchQueueAssetListCallback.bind(this)
    this.searchQueueSubmit = this.searchQueueSubmit.bind(this)
    this.searchQueueDestroy = this.searchQueueDestroy.bind(this)
    this.searchQueueUpdateSelectType = this.searchQueueUpdateSelectType.bind(this)
    this.searchQueueDialog = this.searchQueueDialog.bind(this)
  }

  deleteCallback() {
    const csrftoken = this.parent.csrftoken
    $.ajax({
      url: `/search/${this.SearchID}/`,
      method: 'DELETE',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRFToken', csrftoken)
      }
    })
  }

  createDetailsButton() {
    return {
      label: 'Details',
      href: `/search/${this.SearchID}/`,
      'btn-class': 'btn-light'
    }
  }

  searchDataToPopUp(data) {
    const dl = document.createElement('dl')
    dl.className = 'search-data row'

    for (const d in data) {
      const dt = document.createElement('dt')
      dt.className = `search-${data[d].css}-label col-sm-6`
      dt.textContent = data[d].label
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = `search-${data[d].css}-value col-sm-6`
      dd.textContent = data[d].value
      dl.appendChild(dd)
    }

    return dl
  }

  searchQueueAssetListCallback(data) {
    if ('assets' in data) {
      for (const at in data.assets) {
        if (data.assets[at].type_name === this.AssetType) {
          $(`#queue_${this.SearchID}_select_asset`).append(`<option value='${data.assets[at].id}'>${data.assets[at].name}</option>`)
        }
      }
    }
  }

  searchQueueDestroy() {
    this.QueueDialog.destroy()
    this.QueueDialog = null
  }

  searchQueueSubmit() {
    const data = [
      {
        name: 'csrfmiddlewaretoken',
        value: this.parent.csrftoken
      }
    ]
    if ($(`#queue_${this.SearchID}_select_type`).val() === 'asset') {
      data.push({
        name: 'asset',
        value: $(`#queue_${this.SearchID}_select_asset`).val()
      })
    }
    $.post(`/search/${this.SearchID}/queue/`, data, this.searchQueueDestroy)
  }

  searchQueueUpdateSelectType() {
    if ($(`#queue_${this.SearchID}_select_type`).val() === 'type') {
      $(`#queue_${this.SearchID}_select_asset`).hide()
    } else {
      $(`#queue_${this.SearchID}_select_asset`).show()
    }
  }

  searchQueueDialog() {
    const contents = [
      `<div>Queue for <select id='queue_${this.SearchID}_select_type'><option value='type'>Asset Type</option><option value='asset'>Specific Asset</option></select></div>`,
      `<div><select id='queue_${this.SearchID}_select_asset'></select></div>`,
      `<div><button class='btn btn-light' id='queue_${this.SearchID}_queue'>Queue</button></div>`,
      `<div><button class='btn btn-danger' id='queue_${this.SearchID}_cancel'>Cancel</button>`
    ].join('')
    this.QueueDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.parent.map).hideClose()
    $(`#queue_${this.SearchID}_select_asset`).hide()
    $.getJSON(`/mission/${this.parent.missionId}/assets/`, this.searchQueueAssetListCallback)
    $(`#queue_${this.SearchID}_select_type`).on('change', this.searchQueueUpdateSelectType)
    $(`#queue_${this.SearchID}_queue`).on('click', this.searchQueueSubmit)
    $(`#queue_${this.SearchID}_cancel`).on('click', this.searchQueueDestroy)
  }

  createPopup(layer) {
    const data = [
      { css: 'type', label: 'Search Type', value: this.SearchType },
      { css: 'status', label: 'Status', value: this.parent.searchStatus(this) },
      { css: 'sweep-width', label: 'Sweep Width', value: this.SweepWidth + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: this.AssetType }
    ]

    if (this.CompletedBy) {
      data.push({
        css: 'completed',
        label: 'Completed By',
        value: this.CompletedBy
      })
    } else if (this.InprogressBy) {
      data.push({
        css: 'inprogress',
        label: 'Inprogress By',
        value: this.InprogressBy
      })
    }
    if (this.InprogressAt) {
      data.push({
        css: 'inprogress',
        label: 'Search Started',
        value: this.InprogressAt
      })
    }
    if (this.CompletedAt) {
      data.push({
        css: 'completed',
        label: 'Search Completed',
        value: this.CompletedAt
      })
    }

    const popupContent = document.createElement('div')
    popupContent.appendChild(this.searchDataToPopUp(data))

    if (this.parent.missionId !== 'current' && this.parent.missionId !== 'all') {
      const buttonData = []
      if (!this.InprogressAt) {
        buttonData.push({
          label: 'Delete',
          onclick: this.deleteCallback,
          'btn-class': 'btn-danger'
        })
      }
      if (!this.QueuedAt && !this.InprogressAt) {
        buttonData.push({
          label: 'Queue',
          onclick: this.searchQueueDialog,
          'btn-class': 'btn-light'
        })
      }
      buttonData.push(this.createDetailsButton())
      popupContent.appendChild(this.parent.createButtonGroup(buttonData))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

class SMMSearches extends SMMRealtime {
  constructor(map, csrftoken, missionId, interval, color) {
    super(map, csrftoken, missionId, interval, color)

    this.searchObjects = {}
    this.createPopup = this.createPopup.bind(this)
  }

  getObject(pk, search) {
    if (!(pk in this.searchObjects)) {
      const searchObject = new SMMSearch(this, search)
      this.searchObjects[pk] = searchObject
    }
    return this.searchObjects[pk]
  }

  createPopup(search, layer) {
    this.getObject(search.properties.pk, search).createPopup(layer)
  }
}

class SMMSearchesNotStarted extends SMMSearches {
  getUrl() {
    return `/mission/${this.missionId}/search/notstarted/`
  }

  searchStatus(search) {
    let status = 'Unassigned'
    if (search.QueuedAt) {
      if (search.QueuedForAsset) {
        status = `Queued for ${search.QueuedForAsset} at ${search.QueuedAt}`
      } else {
        status = `Queued for ${search.CreatedFor} at ${search.QueuedAt}`
      }
    }

    return status
  }
}

class SMMSearchesInprogress extends SMMSearches {
  getUrl() {
    return `/mission/${this.missionId}/search/inprogress/`
  }

  searchStatus(search) {
    return `In Progress: ${search.InprogressBy}`
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
