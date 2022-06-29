import $ from 'jquery'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import L, { LatLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet-realtime'
import '@canterbury-air-patrol/leaflet-dialog'
import '@canterbury-air-patrol/leaflet-dialog/Leaflet.Dialog.css'
import 'leaflet.locatecontrol'

import './Admin/admin.js'
import './POIAdder/POIAdder.js'
import './PolygonAdder/PolygonAdder.js'
import './LineAdder/LineAdder.js'
import './ImageUploader/ImageUploader.js'
import './SearchAdder/SearchAdder.js'
import './MarineVectors/MarineVectors.js'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

class SMMMap {
  constructor (mapElem, missionId, csrftoken) {
    this.map = L.map(mapElem)
    this.layerControl = L.control.layers({}, {})
    this.assetLines = {}
    this.missionId = missionId
    this.csrftoken = csrftoken
    this.setupMap()

    this.searchIncompleteCreate = this.searchIncompleteCreate.bind(this)
  }

  setupMap () {
    L.Icon.Default.prototype.options.iconUrl = markerIcon
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
    L.Icon.Default.prototype.options.shadowUrl = markerIconShadow

    const self = this

    $.get('/map/tile/layers/', function (data) {
      let baseSelected = false
      const layersBase = {}
      const layersExtra = {}
      for (const d in data.layers) {
        const layer = data.layers[d]
        const options = {
          attribution: layer.attribution,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom
        }
        if (layer.subdomains !== '') {
          options.subdomains = layer.subdomains
        }
        const tileLayer = L.tileLayer(layer.url, options)
        if (layer.base) {
          if (!baseSelected) {
            tileLayer.addTo(self.map)
            baseSelected = true
          }
          layersBase[layer.name] = tileLayer
        } else {
          layersExtra[layer.name] = tileLayer
        }
      }
      L.control.layers(layersBase, layersExtra).addTo(self.map)
    })

    this.layerControl.addTo(this.map)

    this.map.setView(new LatLng(0, 0), 16)

    this.map.locate({ setView: true, maxZoom: 16 })

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      L.control.poiadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.polygonadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.lineadder({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
      L.control.locate({
        setView: 'untilPan',
        keepCurrentZoomLevel: true,
        locateOptions: { enableHighAccuracy: true }
      }).addTo(this.map)
      L.control.imageuploader({ missionId: this.missionId, csrftoken: this.csrftoken }).addTo(this.map)
    }
    L.control.smmadmin({}).addTo(this.map)

    const assetUpdateFreq = 3 * 1000
    const userDataUpdateFreq = 10 * 1000
    const searchIncompleteUpdateFreq = 30 * 1000
    const searchCompleteUpdateFreq = 60 * 1000
    const imageAllUpdateFreq = 60 * 1000
    const marineDataUpdateFreq = 60 * 1000

    let realtime = L.realtime({
      url: `/mission/${this.missionId}/data/assets/positions/latest/`,
      type: 'json'
    }, {
      interval: assetUpdateFreq,
      onEachFeature: function (asset) { self.assetCreate(asset) },
      updateFeature: function (asset) { self.assetUpdate(asset) },
      getFeatureId: function (feature) { return feature.properties.asset }
    }).addTo(this.map)
    this.overlayAdd('Assets', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/data/pois/current/`,
      type: 'json'
    }, {
      interval: userDataUpdateFreq,
      onEachFeature: function (poi, layer) { self.poiCreate(poi, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('POIs', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/data/userpolygons/current/`,
      type: 'json'
    }, {
      interval: userDataUpdateFreq,
      onEachFeature: function (polygon, layer) { self.userPolygonCreate(polygon, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('Polygons', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/data/userlines/current/`,
      type: 'json'
    }, {
      interval: userDataUpdateFreq,
      onEachFeature: function (line, layer) { self.userLineCreate(line, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('Lines', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/search/incomplete/`,
      type: 'json'
    }, {
      interval: searchIncompleteUpdateFreq,
      color: 'orange',
      onEachFeature: function (search, layer) { self.searchIncompleteCreate(search, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('Incomplete Searches', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/search/completed/`,
      type: 'json'
    }, {
      interval: searchCompleteUpdateFreq,
      onEachFeature: function (search, layer) { self.searchCompletedCreate(search, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    })
    this.overlayAdd('Completed Searches', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/image/list/all/`,
      type: 'json'
    }, {
      interval: imageAllUpdateFreq,
      onEachFeature: function (image, layer) { self.imageCreate(image, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    })
    this.overlayAdd('Images (all)', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/image/list/important/`,
      type: 'json'
    }, {
      interval: imageAllUpdateFreq,
      onEachFeature: function (image, layer) { self.imageCreate(image, layer) },
      getFeatureId: function (feature) { return feature.properties.pk },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: '/static/icons/image-x-generic.png',
            iconSize: [24, 24]
          })
        })
      }
    }).addTo(this.map)
    this.overlayAdd('Images (prioritized)', realtime)

    realtime = L.realtime({
      url: `/mission/${this.missionId}/sar/marine/vectors/current/`,
      type: 'json'
    }, {
      color: 'black',
      interval: marineDataUpdateFreq,
      onEachFeature: function (tdv, layer) { self.tdvCreate(tdv, layer) },
      getFeatureId: function (feature) { return feature.properties.pk }
    }).addTo(this.map)
    this.overlayAdd('Marine - Total Drift Vectors', realtime)
  }

  overlayAdd (name, layer) {
    this.layerControl.addOverlay(layer, name)
  }

  assetPathUpdate (name) {
    if (!(name in this.assetLines)) {
      const assetTrack = L.polyline([], { color: 'red' })
      this.assetLines[name] = { track: assetTrack, updating: false, lastUpdate: null, path: [] }
      this.overlayAdd(name, assetTrack)
    }
    const assetLine = this.assetLines[name]
    if (assetLine.updating) { return }
    assetLine.updating = true

    let assetUrl = `/mission/${this.missionId}/data/assets/${name}/position/history/?oldest=last`
    if (assetLine.lastUpdate != null) {
      assetUrl = `${assetUrl}&from=${assetLine.lastUpdate}`
    }

    $.ajax({
      type: 'GET',
      url: assetUrl,
      success: function (route) {
        for (const f in route.features) {
          const lon = route.features[f].geometry.coordinates[0]
          const lat = route.features[f].geometry.coordinates[1]
          assetLine.path.push(L.latLng(lat, lon))
          assetLine.lastUpdate = route.features[f].properties.created_at
        }
        assetLine.track.setLatLngs(assetLine.path)
        assetLine.updating = false
      },
      error: function () {
        assetLine.updating = false
      }
    })
  }

  assetUpdate (asset, oldLayer) {
    const assetName = asset.properties.asset
    this.assetPathUpdate(assetName)

    if (!oldLayer) { return }

    const coords = asset.geometry.coordinates

    const popupContent = document.createElement('div')
    const data = [
      ['Asset', assetName],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    const alt = asset.properties.alt
    const heading = asset.properties.heading
    const fix = asset.properties.fix

    if (alt) {
      data.append(['Altitude', alt])
    }
    if (heading) {
      data.append(['Heading', heading])
    }
    if (fix) {
      data.append(['Fix', fix])
    }

    for (const d in data) {
      popupContent.appendChild(document.createElement('<dl class="row"><dt class="asset-label col-sm-3">' + d[0] + '</dt><dd class="asset-name col-sm-9">' + d[1] + '</dd>'))
    }

    oldLayer.bindPopup(popupContent, { minWidth: 200 })

    if (asset.geometry.type === 'Point') {
      const c = asset.geometry.coordinates
      oldLayer.setLatLng([c[1], c[0]])
      return oldLayer
    }
  }

  assetCreate (asset) {
    const assetName = asset.properties.asset

    if (!(assetName in this.assetLines)) {
      /* Create an overlay for this object */
      const assetTrack = L.polyline([], { color: 'red' })
      this.assetLines[assetName] = { track: assetTrack, updating: false }
      this.overlayAdd(assetName, assetTrack)
    }
  }

  createButtonGroup (data) {
    const btngroup = document.createElement('div')
    btngroup.className = 'btn-group'

    for (const d in data) {
      const btnData = data[d]
      const btn = document.createElement('button')
      btn.className = `btn ${btnData['btn-class']}`
      btn.onclick = btnData.onclick
      btn.textContent = btnData.label
      btngroup.appendChild(btn)
    }

    return btngroup
  }

  poiCreate (poi, layer) {
    const POILabel = poi.properties.label
    const poiID = poi.properties.pk
    const coords = poi.geometry.coordinates

    const popupContent = document.createElement('div')

    const data = [
      ['POI', POILabel],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    for (const d in data) {
      const dl = document.createElement('dl')
      dl.className = 'poi row'

      const dt = document.createElement('dt')
      dt.className = 'asset-label col-sm-2'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'asset-name col-sm-10'
      dd.textContent = data[d][1]
      dl.appendChild(dd)

      popupContent.appendChild(dl)
    }

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this

      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Move',
          onclick: function () { L.POIAdder(self.map, self.missionId, self.csrftoken, L.latLng(coords[1], coords[0]), poiID, POILabel) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/pois/${poiID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'point', poiID) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Calculate TDV',
          onclick: function () { L.MarineVectors(self.map, self.missionId, self.csrftoken, POILabel, L.latLng(coords[1], coords[0]), poiID) },
          'btn-class': 'btn-light'
        }
      ]))
    }

    layer.bindPopup(popupContent)
  }

  userPolygonCreate (poly, layer) {
    const PolyLabel = poly.properties.label
    const PolyID = poly.properties.pk
    const coords = poly.geometry.coordinates

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'polygon row'
    popupContent.appendChild(dl)
    const dt = document.createElement('dt')
    dt.className = 'polygon-label col-sm-3'
    dt.textContent = 'Polygon'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'polygon-name col-sm-9'
    dd.textContent = PolyLabel
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Edit',
          onclick: function () {
            const points = []
            for (const i in coords[0]) {
              points.push(L.latLng(coords[0][i][1], coords[0][i][0]))
            }
            L.PolygonAdder(self.map, self.missionId, self.csrftoken, points, PolyID, PolyLabel).create()
          },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/userpolygons/${PolyID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'polygon', PolyID) },
          'btn-class': 'btn-light'
        }
      ]))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  userLineCreate (line, layer) {
    const LineLabel = line.properties.label
    const LineID = line.properties.pk
    const coords = line.geometry.coordinates

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'line row'
    const dt = document.createElement('dt')
    dt.className = 'line-label col-sm-3'
    dt.textContent = 'Line'
    dl.appendChild(dt)
    const dd = document.createElement('dd')
    dd.className = 'line-name col-sm-9'
    dd.textContent = LineLabel
    dl.appendChild(dd)
    popupContent.appendChild(dl)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Edit',
          onclick: function () { L.LineAdder(self.map, self.missionId, self.csrftoken, coords.map(x => L.latLng(x[1], x[0])), LineID, LineLabel) },
          'btn-class': 'btn-light'
        },
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/data/userlines/${LineID}/delete/`) },
          'btn-class': 'btn-danger'
        },
        {
          label: 'Create Search',
          onclick: function () { L.SearchAdder(self.map, self.csrftoken, 'line', LineID) },
          'btn-class': 'btn-light'
        }
      ]))
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

  searchStatusIncomplete (search) {
    const InprogressBy = search.properties.inprogress_by
    const QueuedAt = search.properties.queued_at
    const QueuedForAsset = search.properties.queued_for_asset
    const CreatedFor = search.properties.created_for

    let status = 'Unassigned'
    if (InprogressBy) {
      status = `In Progress: ${InprogressBy}`
    } else if (QueuedAt) {
      if (QueuedForAsset) {
        status = `Queued for ${QueuedForAsset} at ${QueuedAt}`
      } else {
        status = `Queued for ${CreatedFor} at ${QueuedAt}`
      }
    }

    return status
  }

  searchIncompleteCreate (search, layer) {
    const SearchID = search.properties.pk
    const SweepWidth = search.properties.sweep_width
    const AssetType = search.properties.created_for
    const InprogressBy = search.properties.inprogress_by
    const SearchType = search.properties.search_type
    const QueuedAt = search.properties.queued_at

    const data = [
      { css: 'type', label: 'Search Type', value: SearchType },
      { css: 'status', label: 'Status', value: this.searchStatusIncomplete(search) },
      { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
      { css: 'asset-type', label: 'Asset Type', value: AssetType }
    ]
    if (InprogressBy) {
      data.push({ css: 'inprogress', label: 'Inprogress By', value: InprogressBy })
    }

    const popupContent = document.createElement('div')
    popupContent.appendChild(this.searchDataToPopUp(data))

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const buttonData = []
      const self = this
      if (!InprogressBy) {
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
      }
      popupContent.appendChild(this.createButtonGroup(buttonData))
    }
    layer.bindPopup(popupContent, { minWidth: 200 })
  }

  searchCompletedCreate (search, layer) {
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

  imageCreate (image, layer) {
    const ImageDesc = image.properties.description
    const imageID = image.properties.pk
    const coords = image.geometry.coordinates

    const popupContent = document.createElement('div')

    const dl = document.createElement('dl')
    dl.className = 'row'
    popupContent.appendChild(dl)

    const data = [
      ['Image', ImageDesc],
      ['Lat', degreesToDM(coords[1], true)],
      ['Long', degreesToDM(coords[0])]
    ]

    for (const d in data) {
      const dt = document.createElement('dt')
      dt.className = 'image-label col-sm-2'
      dt.textContent = data[d][0]
      dl.appendChild(dt)
      const dd = document.createElement('dd')
      dd.className = 'image-name col-sm-10'
      dd.textContent = data[d][1]
      dl.appendChild(dd)
    }

    const div = document.createElement('div')
    div.style = 'width: 128px'
    popupContent.appendChild(div)
    const a = document.createElement('a')
    a.href = `/mission/${this.missionId}/image/${imageID}/full/`
    div.appendChild(a)
    const img = document.createElement('img')
    img.src = `/mission/${this.missionId}/image/${imageID}/thumbnail/`
    a.appendChild(img)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      if (image.properties.priority) {
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Deprioritize',
            onclick: function () { $.get(`/mission/${self.missionId}/image/${imageID}/priority/unset/`) },
            'btn-class': 'btn-light'
          }
        ]))
      } else {
        popupContent.appendChild(this.createButtonGroup([
          {
            label: 'Prioritize',
            onclick: function () { $.get(`/mission/${self.missionId}/image/${imageID}/priority/set/`) },
            'btn-class': 'btn-light'
          }
        ]))
      }
    }

    layer.bindPopup(popupContent)
  }

  tdvCreate (tdv, layer) {
    const tdvID = tdv.properties.pk

    const popupContent = document.createElement('div')
    const dl = document.createElement('dl')
    dl.className = 'row'
    popupContent.appendChild(dl)

    const dt = document.createElement('dt')
    dt.className = 'image-label col-sm-2'
    dt.textContent = 'Total Drift Vector'
    dl.appendChild(dt)

    const dd = document.createElement('dd')
    dd.className = 'image-name col-sm-10'
    dd.textContent = tdvID
    dl.appendChild(dd)

    if (this.missionId !== 'current' && this.missionId !== 'all') {
      const self = this
      popupContent.appendChild(this.createButtonGroup([
        {
          label: 'Delete',
          onclick: function () { $.get(`/mission/${self.missionId}/sar/marine/vectors/${tdvID}/delete/`) },
          'btn-class': 'btn-danger'
        }
      ]))
    }

    layer.bindPopup(popupContent)
  }
}

function mapInit () {
  const mapEl = document.createElement('div')
  mapEl.setAttribute('style', 'width:100%;height:100%;position:inherit;')
  document.body.appendChild(mapEl)

  const csrftoken = $('[name=csrfmiddlewaretoken]').val()
  const missionId = encodeURIComponent($('#missionId').val())

  return new SMMMap(mapEl, missionId, csrftoken)
}

mapInit()
