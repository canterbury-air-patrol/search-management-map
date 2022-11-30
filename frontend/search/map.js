import L from 'leaflet'
import '@canterbury-air-patrol/leaflet-dialog'

import $ from 'jquery'

import { SMMRealtime } from '../smmmap'

class SMMSearch extends SMMRealtime {
  searchDataToPopUp (data) {
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
}

class SMMSearchNotStarted extends SMMSearch {
  getUrl () {
    return `/mission/${this.missionId}/search/notstarted/`
  }

  searchStatusIncomplete (search) {
    const QueuedAt = search.properties.queued_at
    const QueuedForAsset = search.properties.queued_for_asset
    const CreatedFor = search.properties.created_for

    let status = 'Unassigned'
    if (QueuedAt) {
      if (QueuedForAsset) {
        status = `Queued for ${QueuedForAsset} at ${QueuedAt}`
      } else {
        status = `Queued for ${CreatedFor} at ${QueuedAt}`
      }
    }

    return status
  }

  createPopup (search, layer) {
    const SearchID = search.properties.pk
    const SweepWidth = search.properties.sweep_width
    const AssetType = search.properties.created_for
    const SearchType = search.properties.search_type
    const QueuedAt = search.properties.queued_at

    const data = [
      { css: 'type', label: 'Search Type', value: SearchType },
      { css: 'status', label: 'Status', value: this.searchStatusIncomplete(search) },
      { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: AssetType }
    ]

    const popupContent = document.createElement('div')
    popupContent.appendChild(this.searchDataToPopUp(data))

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const buttonData = []
      const self = this
      buttonData.push({
        label: 'Delete',
        onclick: function () { $.get(`/mission/${self.missionId}/search/${SearchID}/delete/`) },
        'btn-class': 'btn-danger'
      })
      if (!QueuedAt) {
        buttonData.push({
          label: 'Queue',
          onclick: function () { self.searchQueueDialog(SearchID, AssetType) },
          'btn-class': 'btn-light'
        })
      }
      buttonData.push({
        label: 'Details',
        href: `/mission/${self.missionId}/search/${SearchID}/details/`,
        'btn-class': 'btn-light'
      })
      popupContent.appendChild(this.createButtonGroup(buttonData))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  searchQueueDialog (searchID, assetType) {
    const contents = [
      `<div>Queue for <select id='queue_${searchID}_select_type'><option value='type'>Asset Type</option><option value='asset'>Specific Asset</option></select></div>`,
      `<div><select id='queue_${searchID}_select_asset'></select></div>`,
      `<div><button class='btn btn-light' id='queue_${searchID}_queue'>Queue</button></div>`,
      `<div><button class='btn btn-danger' id='queue_${searchID}_cancel'>Cancel</button>`
    ].join('')
    const QueueDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.map).hideClose()
    $(`#queue_${searchID}_select_asset`).hide()
    $.get(`/mission/${this.missionId}/assets/json/`, function (data) {
      $.each(data, function (index, json) {
        for (const at in json) {
          if (json[at].type_name === assetType) {
            $(`#queue_${searchID}_select_asset`).append(`<option value='${json[at].id}'>${json[at].name}</option>`)
          }
        }
      })
    })
    $(`#queue_${searchID}_select_type`).on('change', function () {
      if ($(`#queue_${searchID}_select_type`).val() === 'type') {
        $(`#queue_${searchID}_select_asset`).hide()
      } else {
        $(`#queue_${searchID}_select_asset`).show()
      }
    })
    $(`#queue_${searchID}_queue`).on('click', function () {
      const data = [{
        name: 'csrfmiddlewaretoken',
        value: self.csrftoken
      }]
      if ($(`#queue_${searchID}_select_type`).val() === 'asset') {
        data.push({
          name: 'asset',
          value: $(`#queue_${searchID}_select_asset`).val()
        })
      }
      $.post(`/mission/${self.mission_id}/search/${searchID}/queue/`, data, function (data) {
        QueueDialog.destroy()
      })
    })
    $(`#queue_${searchID}_cancel`).on('click', function () { QueueDialog.destroy() })
  }
}

class SMMSearchInprogress extends SMMSearch {
  getUrl () {
    return `/mission/${this.missionId}/search/inprogress/`
  }

  searchStatusInprogress (search) {
    const InprogressBy = search.properties.inprogress_by

    return `In Progress: ${InprogressBy}`
  }

  createPopup (search, layer) {
    const SweepWidth = search.properties.sweep_width
    const AssetType = search.properties.created_for
    const InprogressBy = search.properties.inprogress_by
    const InprogressAt = search.properties.inprogress_at
    const SearchType = search.properties.search_type

    const data = [
      { css: 'type', label: 'Search Type', value: SearchType },
      { css: 'status', label: 'Status', value: this.searchStatusInprogress(search) },
      { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: AssetType },
      { css: 'inprogress', label: 'Inprogress By', value: InprogressBy },
      { css: 'inprogress', label: 'Search Started', value: InprogressAt }
    ]

    const popupContent = document.createElement('div')
    popupContent.appendChild(this.searchDataToPopUp(data))

    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

class SMMSearchComplete extends SMMSearch {
  getUrl () {
    return `/mission/${this.missionId}/search/completed/`
  }

  createPopup (search, layer) {
    const SweepWidth = search.properties.sweep_width
    const AssetType = search.properties.created_for
    const InprogressBy = search.properties.inprogress_by
    const SearchType = search.properties.search_type

    const data = [
      { css: 'type', label: 'Search Type', value: SearchType },
      { css: 'status', label: 'Status', value: 'Completed' },
      { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: AssetType },
      { css: 'completedby', label: 'Completed By', value: InprogressBy }
    ]

    const popupContent = this.searchDataToPopUp(data)
    layer.bindPopup(popupContent, { minWidth: 200 })
  }
}

export { SMMSearchNotStarted, SMMSearchInprogress, SMMSearchComplete }
