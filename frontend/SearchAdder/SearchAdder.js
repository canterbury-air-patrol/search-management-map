import $ from 'jquery'

import L from 'leaflet'

L.SearchAdder = function (map, csrftoken, objectType, objectID) {
  const RAND_NUM = Math.floor(Math.random() * 16536)
  let searchSelection = `<select class='form-control' id='SearchAdder-search-type-${RAND_NUM}'>`
  switch (objectType) {
    case 'point':
      searchSelection += '<option value="sector">Sector</option>'
      searchSelection += '<option value="expanding-box">Expanding Box</option>'
      break
    case 'line':
      searchSelection += '<option value="track-line">Track Line</option>'
      searchSelection += '<option value="shore-line">Shore Line</option>'
      searchSelection += '<option value="creeping-line">Creeping Line Ahead</option>'
      break
    case 'polygon':
      searchSelection += '<option value="creeping-line">Creeping Line Ahead</option>'
      break
  }
  searchSelection += '</select>'
  const assetSelection = `<select class="form-control" id="SearchAdder-asset-type-${RAND_NUM}"></select>`
  $.getJSON('/assets/assettypes/', function (data) {
    $.each(data, function (index, json) {
      for (const at in json) {
        $(`#SearchAdder-asset-type-${RAND_NUM}`).append(`<option value='${json[at].id}'>${json[at].name}</option>`)
      }
    })
  })
  const generateInputs = function (inputs) {
    let res = ''
    for (const i in inputs) {
      res += `<div class="input-group input-group-sm mb-3" id="SearchAdder-${inputs[i].id}-${RAND_NUM}">`
      res += '<div class="input-group-prepend">'
      res += '<span class="input-group-text">'
      res += inputs[i].label
      res += '</span>'
      res += '</div>'
      res += inputs[i].input_html
      res += '</div>'
    }
    return res
  }
  let contents = generateInputs([
    { id: 'st', label: 'Search Type', input_html: searchSelection },
    { id: 'at', label: 'Asset Type', input_html: assetSelection },
    { id: 'sw', label: 'Sweep Width', input_html: `<input class="form-control form-control-sm" type="number" id="SearchAdder-sweep-width-${RAND_NUM}" size="4" />` },
    { id: 'i', label: 'Iterations', input_html: `<input class="form-control form-control-sm" type="number" id="SearchAdder-iterations-${RAND_NUM}" size="3" />` },
    {
      id: 'fb',
      label: 'First Bearing',
      input_html: `<input class="form-control form-control-sm" type="number" id="SearchAdder-first-bearing-${RAND_NUM}" min="0" max="359" value="0" size="3"/>`
    },
    { id: 'w', label: 'Width (across line)', input_html: `<input class="form-control form-control-sm" type="number" id="SearchAdder-width-${RAND_NUM}" min="0" size="4" />` }
  ])

  contents += [
    `<div class="btn-group"><button class="btn btn-warning" id="SearchAdder-preview-${RAND_NUM}">Preview</button>`,
    `<button class="btn btn-primary" id="SearchAdder-create-${RAND_NUM}">Create</button>`,
    `<button class="btn btn-danger" id="SearchAdder-cancel-${RAND_NUM}">Cancel</button></div>`
  ].join('')

  const dialog = L.control.dialog({}).setContent(contents).addTo(map)
  dialog.hideClose()

  const changeSearchType = function () {
    const selectedType = $(`#SearchAdder-search-type-${RAND_NUM}`).val()
    const itElem = $(`#SearchAdder-i-${RAND_NUM}`)
    const fbElem = $(`#SearchAdder-fb-${RAND_NUM}`)
    const wdElem = $(`#SearchAdder-w-${RAND_NUM}`)
    if (selectedType === 'expanding-box') {
      itElem.show()
      fbElem.show()
    } else {
      itElem.hide()
      fbElem.hide()
    }
    if (selectedType === 'creeping-line' && objectType === 'line') {
      wdElem.show()
    } else {
      wdElem.hide()
    }
  }

  changeSearchType()

  $(`#SearchAdder-search-type-${RAND_NUM}`).on('change', changeSearchType)

  const getUrl = function () {
    const selectedType = $(`#SearchAdder-search-type-${RAND_NUM}`).val()
    switch (selectedType) {
      case 'sector':
        return '/search/sector/create/'
      case 'expanding-box':
        return '/search/expandingbox/create/'
      case 'track-line':
        return '/search/trackline/create/'
      case 'shore-line':
        return '/search/shoreline/create/'
      case 'creeping-line':
        return objectType === 'line' ? '/search/creepingline/create/track/' : '/search/creepingline/create/polygon/'
      default:
        console.log('search type not supported')
    }
  }

  const getData = function (includeCSRF) {
    const data = [
      { name: 'sweep_width', value: $(`#SearchAdder-sweep-width-${RAND_NUM}`).val() },
      { name: 'asset_type_id', value: $(`#SearchAdder-asset-type-${RAND_NUM}`).val() },
      { name: 'iterations', value: $(`#SearchAdder-iterations-${RAND_NUM}`).val() },
      { name: 'first_bearing', value: $(`#SearchAdder-first-bearing-${RAND_NUM}`).val() },
      { name: 'width', value: $(`#SearchAdder-width-${RAND_NUM}`).val() }
    ]
    switch (objectType) {
      case 'point':
        data.push({ name: 'poi_id', value: objectID })
        break
      case 'line':
        data.push({ name: 'line_id', value: objectID })
        break
      case 'polygon':
        data.push({ name: 'poly_id', value: objectID })
        break
    }
    if (includeCSRF) {
      data.push({ name: 'csrfmiddlewaretoken', value: csrftoken })
    }
    return data
  }

  let onMap = null

  $(`#SearchAdder-preview-${RAND_NUM}`).on('click', function () {
    $.get(getUrl(), getData(), function (data) {
      if (onMap !== null) {
        onMap.remove()
      }
      onMap = L.geoJSON(data, { color: 'yellow' })
      onMap.addTo(map)
    })
  })

  $(`#SearchAdder-create-${RAND_NUM}`).on('click', function () {
    if (onMap !== null) {
      onMap.remove()
    }
    $.post(getUrl(), getData(true))
    dialog.destroy()
  })

  $(`#SearchAdder-cancel-${RAND_NUM}`).on('click', function () {
    if (onMap !== null) {
      onMap.remove()
    }
    dialog.destroy()
  })
}
