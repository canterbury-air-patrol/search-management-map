import $ from 'jquery'
import L from 'leaflet'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

L.LineAdder = function (map, missionId, csrftoken, currentPoints, replaces, label) {
  const RAND_NUM = Math.floor(Math.random() * 16536)
  const points = currentPoints
  let markers = []
  const line = L.polyline(points, { color: 'yellow' }).addTo(map)
  const dialog = L.control.dialog()

  const removeAllMarkers = function () {
    markers.forEach(function (m) { map.removeLayer(m) })
  }

  const updateMarkers = function () {
    // Remove old markers from map
    removeAllMarkers()

    // recreate markers list
    markers = []
    points.forEach(function (p) {
      const m = L.marker(p, {
        draggable: true,
        autopan: true
      })
      markers.push(m)
      m.addTo(map)
      m.on('dragend', function () {
        updateMarker(p, m)
        dialog.open()
      })
    })

    // Tell the line the points have changed
    line.setLatLngs(points)
  }

  const updateMarker = function (point, marker) {
    const markerCoords = marker.getLatLng()
    point.lat = markerCoords.lat
    point.lng = markerCoords.lng
    for (const i in points) {
      if (points[i] === point) {
        updatePointRow(i, point)
      }
    }
    updateMarkers()
  }

  let pointCount = 0
  const addPointRow = function (point) {
    $(`#lineadder-points-${RAND_NUM}`).append('<div id="lineadder-points-' + RAND_NUM + '-' + pointCount + '"><input type="text" id = "lineadder-points-' + RAND_NUM + '-' + pointCount + '-lat" size="12" value="' + degreesToDM(point.lat, true) + '" /><input type="text" id = "lineadder-points-' + RAND_NUM + '-' + pointCount + '-lon" size="12" value="' + degreesToDM(point.lng, false) + '" /></div>')
    pointCount++
  }

  const removePointRow = function () {
    pointCount--
    $(`#lineadder-points-${RAND_NUM}-${pointCount}`).remove()
  }

  const updatePointRow = function (row, point) {
    $(`#lineadder-points-${RAND_NUM}-${row}-lat`).val(degreesToDM(point.lat, true))
    $(`#lineadder-points-${RAND_NUM}-${row}-lon`).val(degreesToDM(point.lng, false))
  }

  updateMarkers()

  const contents = [
    '<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
    '<input type="text" id="lineadder-dialog-name-' + RAND_NUM + '"></input></div>',
    '<div class="btn-group">',
    '<button class="btn btn-primary" id="lineadder-dialog-done-' + RAND_NUM + '">Done</button></div>',
    '<button class="btn btn-warning" id="lineadder-dialog-cancel-' + RAND_NUM + '">Cancel</button>',
    '</div>',
    '<div id="lineadder-points-' + RAND_NUM + '"></div>',
    '<div class="btn-group">',
    '<button class="btn btn-primary" id="lineadder-dialog-next-' + RAND_NUM + '">Next</button>',
    '<button class="btn btn-warning" id="lineadder-dialog-remove-' + RAND_NUM + '">Remove</button>',
    '</div>'
  ].join('')
  dialog.setContent(contents).addTo(map).hideClose()

  points.forEach(function (p) {
    addPointRow(p)
  })
  $(`#lineadder-dialog-name-${RAND_NUM}`).val(label)

  $(`#lineadder-dialog-next-${RAND_NUM}`).on('click', function () {
    const newPoint = map.getCenter()
    addPointRow(newPoint)
    points.push(newPoint)
    updateMarkers()
  })

  $(`#lineadder-dialog-done-${RAND_NUM}`).on('click', function () {
    const data = [
      { name: 'label', value: $('#lineadder-dialog-name-' + RAND_NUM).val() },
      { name: 'csrfmiddlewaretoken', value: csrftoken },
      { name: 'points', value: points.length }
    ]
    for (const i in points) {
      data.push({ name: `point${i}_lat`, value: DMToDegrees($(`#lineadder-points-${RAND_NUM}-${i}-lat`).val()) })
      data.push({ name: `point${i}_lng`, value: DMToDegrees($(`#lineadder-points-${RAND_NUM}-${i}-lon`).val()) })
    }

    if (replaces !== -1) {
      $.post(`/mission/${missionId}/data/userlines/${replaces}/replace/`, data)
    } else {
      $.post(`/mission/${missionId}/data/userlines/create/`, data)
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
    if (points.length > 1) {
      points.pop()
      removePointRow()
    }
    updateMarkers()
  })
}

L.Control.LineAdder = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'LineAdder-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Add Line'

    const markerImg = L.DomUtil.create('img', 'Line-img', link)

    markerImg.src = '/static/icons/draw-line.png'
    markerImg.alt = 'Add Line'

    L.DomEvent.disableClickPropagation(link)

    const self = this

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', function () {
      L.LineAdder(map, self.options.missionId, self.options.csrftoken, [map.getCenter()], -1, '')
    })

    return container
  },

  onRemove: function () {}
})

L.control.lineadder = function (opts) {
  return new L.Control.LineAdder(opts)
}
