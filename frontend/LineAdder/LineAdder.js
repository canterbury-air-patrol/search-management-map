import $ from 'jquery'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { LatLngMarkerInput } from '../LatLngMarkerInput'
import { smmPost } from '../ajax'

L.LineAdder = function (map, missionId, currentPoints, replaces, label) {
  const RAND_NUM = Math.floor(Math.random() * 16536)
  const markers = []
  const line = L.polyline(currentPoints, { color: 'yellow' }).addTo(map)
  const dialog = L.control.dialog()

  const contents = [
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
    `<input type="text" id="lineadder-dialog-name-${RAND_NUM}" value="${label}"></input></div>`,
    '<div class="btn-group">',
    `<button class="btn btn-primary" id="lineadder-dialog-done-${RAND_NUM}">Done</button>`,
    `<button class="btn btn-danger" id="lineadder-dialog-cancel-${RAND_NUM}">Cancel</button>`,
    '</div>',
    `<div id="lineadder-points-${RAND_NUM}"></div>`,
    '<div class="btn-group">',
    `<button class="btn btn-primary" id="lineadder-dialog-next-${RAND_NUM}">Next</button>`,
    `<button class="btn btn-danger" id="lineadder-dialog-remove-${RAND_NUM}">Remove</button>`,
    '</div>'
  ].join('')
  dialog.setContent(contents).addTo(map).hideClose()

  let pointCount = 0
  const addPointRow = function () {
    const pointsEl = document.getElementById(`lineadder-points-${RAND_NUM}`)
    const row = document.createElement('div')
    row.id = `lineadder-points-${RAND_NUM}-${pointCount}`
    const mountEl = document.createElement('div')
    row.appendChild(mountEl)
    pointsEl.appendChild(row)
    return { mountEl, pointIndex: pointCount++ }
  }

  const updateLine = function () {
    const newPoints = []
    markers.forEach(function (m) {
      newPoints.push(m.getLatLng())
    })
    line.setLatLngs(newPoints)
  }

  const addMarker = function (pos) {
    const { mountEl } = addPointRow()
    let currentPos = pos
    const root = ReactDOM.createRoot(mountEl)
    root.render(
      <LatLngMarkerInput
        map={map}
        initialPos={pos}
        onChange={function (p) {
          currentPos = p
          updateLine()
        }}
      />
    )
    markers.push({
      root: root,
      getLatLng: function () {
        return currentPos
      }
    })
    updateLine()
  }

  currentPoints.forEach(addMarker)

  const removeAllMarkers = function () {
    markers.forEach(function (m) {
      m.root.unmount()
    })
  }

  const removeMarker = function () {
    pointCount--
    document.getElementById(`lineadder-points-${RAND_NUM}-${pointCount}`).remove()
    const handle = markers.pop()
    handle.root.unmount()
    updateLine()
  }

  $(`#lineadder-dialog-next-${RAND_NUM}`).on('click', function () {
    addMarker(map.getCenter())
  })

  $(`#lineadder-dialog-done-${RAND_NUM}`).on('click', function () {
    const data = {
      label: $(`#lineadder-dialog-name-${RAND_NUM}`).val(),
      points: markers.length
    }
    for (const i in markers) {
      const markerLatLng = markers[i].getLatLng()
      data[`point${i}_lat`] = markerLatLng.lat
      data[`point${i}_lng`] = markerLatLng.lng
    }

    if (replaces !== -1) {
      smmPost(`/data/userlines/${replaces}/replace/`, data)
    } else {
      smmPost(`/mission/${missionId}/data/userlines/create/`, data)
    }
    removeAllMarkers()
    map.removeLayer(line)
    dialog.destroy()
  })

  $(`#lineadder-dialog-cancel-${RAND_NUM}`).on('click', function () {
    removeAllMarkers()
    map.removeLayer(line)
    dialog.destroy()
  })

  $(`#lineadder-dialog-remove-${RAND_NUM}`).on('click', function () {
    if (markers.length > 1) {
      removeMarker()
    }
  })
}

L.Control.LineAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onClick: function () {
    L.LineAdder(this.map, this.options.missionId, [this.map.getCenter()], -1, '')
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'LineAdder-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add Line'

    const markerImg = L.DomUtil.create('img', 'Line-img', link)

    markerImg.src = '/static/icons/draw-line.png'
    markerImg.alt = 'Add Line'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

L.control.lineadder = function (opts) {
  return new L.Control.LineAdder(opts)
}
