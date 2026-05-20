import $ from 'jquery'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'

L.PolygonAdder = function (map, missionId, currentPoints, replaces, label) {
  const RAND_NUM = Math.floor(Math.random() * 16536)
  const markers = []
  const polygon = L.polygon(currentPoints, { color: 'yellow' }).addTo(map)
  const dialog = L.control.dialog()

  const contents = [
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
    `<input type="text" id="polygonadder-dialog-name-${RAND_NUM}" value="${label}"></input></div>`,
    '<div class="btn-group">',
    `<button class="btn btn-primary" id="polygonadder-dialog-done-${RAND_NUM}">Done</button>`,
    `<button class="btn btn-danger" id="polygonadder-dialog-cancel-${RAND_NUM}">Cancel</button>`,
    '</div>',
    `<div id="polygonadder-points-${RAND_NUM}"></div>`,
    '<div class="btn-group">',
    `<button class="btn btn-primary" id="polygonadder-dialog-next-${RAND_NUM}">Next</button>`,
    `<button class="btn btn-danger" id="polygonadder-dialog-remove-${RAND_NUM}">Remove</button>`,
    '</div>'
  ].join('')
  dialog.setContent(contents).addTo(map).hideClose()

  let pointCount = 0
  const addPointRow = function () {
    const pointsEl = document.getElementById(`polygonadder-points-${RAND_NUM}`)
    const row = document.createElement('div')
    row.id = `polygonadder-points-${RAND_NUM}-${pointCount}`
    const mountEl = document.createElement('div')
    row.appendChild(mountEl)
    pointsEl.appendChild(row)
    return { mountEl, pointIndex: pointCount++ }
  }

  const updatePolygon = function () {
    const newPoints = []
    markers.forEach(function (m) {
      newPoints.push(m.getLatLng())
    })
    polygon.setLatLngs(newPoints)
  }

  const addMarker = function (pos) {
    const { mountEl, pointIndex } = addPointRow()
    let currentPos = pos
    const root = ReactDOM.createRoot(mountEl)
    root.render(
      <LatLngMarkerInput
        map={map}
        initialPos={pos}
        showLabels={pointIndex === 0}
        onChange={function (p) {
          currentPos = p
          updatePolygon()
        }}
      />
    )
    markers.push({
      root: root,
      getLatLng: function () {
        return currentPos
      }
    })
    updatePolygon()
  }

  currentPoints.forEach(addMarker)

  const removeAllMarkers = function () {
    markers.forEach(function (m) {
      m.root.unmount()
    })
  }

  const removeMarker = function () {
    pointCount--
    document.getElementById(`polygonadder-points-${RAND_NUM}-${pointCount}`).remove()
    const handle = markers.pop()
    handle.root.unmount()
    updatePolygon()
  }

  $(`#polygonadder-dialog-next-${RAND_NUM}`).on('click', function () {
    addMarker(map.getCenter())
  })

  $(`#polygonadder-dialog-done-${RAND_NUM}`).on('click', function () {
    const data = {
      label: $(`#polygonadder-dialog-name-${RAND_NUM}`).val(),
      points: markers.length
    }
    for (const i in markers) {
      const markerLatLng = markers[i].getLatLng()
      data[`point${i}_lat`] = markerLatLng.lat
      data[`point${i}_lng`] = markerLatLng.lng
    }

    if (replaces !== -1) {
      smmPost(`/data/userpolygons/${replaces}/replace/`, data)
    } else {
      smmPost(`/mission/${missionId}/data/userpolygons/create/`, data)
    }
    removeAllMarkers()
    map.removeLayer(polygon)
    dialog.destroy()
  })

  $(`#polygonadder-dialog-cancel-${RAND_NUM}`).on('click', function () {
    removeAllMarkers()
    map.removeLayer(polygon)
    dialog.destroy()
  })

  $(`#polygonadder-dialog-remove-${RAND_NUM}`).on('click', function () {
    if (markers.length > 1) {
      removeMarker()
    }
  })
}

L.Control.PolygonAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    L.PolygonAdder(this.map, this.options.missionId, [this.map.getCenter()], -1, '')
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'PolygonAdder-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add Area'

    const markerImg = L.DomUtil.create('img', 'Polygon-img', link)

    markerImg.src = '/static/icons/draw-polygon.png'
    markerImg.alt = 'Add Area'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

L.control.polygonadder = function (opts) {
  return new L.Control.PolygonAdder(opts)
}
