import $ from 'jquery'
import L from 'leaflet'
import { MappedMarker } from '../smmleaflet'

L.LineAdder = function (map, missionId, csrftoken, currentPoints, replaces, label) {
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
    $(`#lineadder-points-${RAND_NUM}`).append(
      `<div id="lineadder-points-${RAND_NUM}-${pointCount}"><input type="text" id = "lineadder-points-${RAND_NUM}-${pointCount}-lat" size="12" /><input type="text" id="lineadder-points-${RAND_NUM}-${pointCount}-lon" size="12" /></div>`
    )
    return pointCount++
  }

  const updateLine = function () {
    const newPoints = []
    markers.forEach(function (m) {
      newPoints.push(m.getMarker().getLatLng())
    })
    line.setLatLngs(newPoints)
  }

  const addMarker = function (pos) {
    const pointRow = addPointRow()
    const mappedMarker = new MappedMarker($(`#lineadder-points-${RAND_NUM}-${pointRow}-lat`), $(`#lineadder-points-${RAND_NUM}-${pointRow}-lon`), pos, updateLine)
    mappedMarker.getMarker().addTo(map)
    markers.push(mappedMarker)
    updateLine()
  }

  currentPoints.forEach(addMarker)

  const removeAllMarkers = function () {
    markers.forEach(function (m) {
      map.removeLayer(m.getMarker())
    })
  }

  const removeMarker = function () {
    pointCount--
    $(`#lineadder-points-${RAND_NUM}-${pointCount}`).remove()
    const marker = markers.pop()
    map.removeLayer(marker.getMarker())
    updateLine()
  }

  $(`#lineadder-dialog-next-${RAND_NUM}`).on('click', function () {
    addMarker(map.getCenter())
  })

  $(`#lineadder-dialog-done-${RAND_NUM}`).on('click', function () {
    const data = [
      { name: 'label', value: $(`#lineadder-dialog-name-${RAND_NUM}`).val() },
      { name: 'csrfmiddlewaretoken', value: csrftoken },
      { name: 'points', value: markers.length }
    ]
    for (const i in markers) {
      const markerLatLng = markers[i].getMarker().getLatLng()
      data.push({ name: `point${i}_lat`, value: markerLatLng.lat })
      data.push({ name: `point${i}_lng`, value: markerLatLng.lng })
    }

    if (replaces !== -1) {
      $.post(`/data/userlines/${replaces}/replace/`, data)
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
    L.LineAdder(this.map, this.options.missionId, this.options.csrftoken, [this.map.getCenter()], -1, '')
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
