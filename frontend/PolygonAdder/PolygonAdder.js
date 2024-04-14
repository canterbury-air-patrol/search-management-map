import $ from 'jquery'
import L from 'leaflet'
import { MappedMarker } from '../smmleaflet'

L.PolygonAdder = function (map, missionId, csrftoken, currentPoints, replaces, label) {
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
    $(`#polygonadder-points-${RAND_NUM}`).append(`<div id="polygonadder-points-${RAND_NUM}-${pointCount}"><input type="text" id = "polygonadder-points-${RAND_NUM}-${pointCount}-lat" size="12" /><input type="text" id = "polygonadder-points-${RAND_NUM}-${pointCount}-lon" size="12" /></div>`)
    return pointCount++
  }

  const updatePolygon = function () {
    const newPoints = []
    markers.forEach(function (m) {
      newPoints.push(m.getMarker().getLatLng())
    })
    polygon.setLatLngs(newPoints)
  }

  const addMarker = function (pos) {
    const pointRow = addPointRow()
    const mappedMarker = new MappedMarker($(`#polygonadder-points-${RAND_NUM}-${pointRow}-lat`), $(`#polygonadder-points-${RAND_NUM}-${pointRow}-lon`), pos, updatePolygon)
    mappedMarker.getMarker().addTo(map)
    markers.push(mappedMarker)
    updatePolygon()
  }

  currentPoints.forEach(addMarker)

  const removeAllMarkers = function () {
    markers.forEach(function (m) { map.removeLayer(m.getMarker()) })
  }

  const removeMarker = function () {
    pointCount--
    $(`#polygonadder-points-${RAND_NUM}-${pointCount}`).remove()
    const marker = markers.pop()
    map.removeLayer(marker.getMarker())
    updatePolygon()
  }

  $(`#polygonadder-dialog-next-${RAND_NUM}`).on('click', function () {
    addMarker(map.getCenter())
  })

  $(`#polygonadder-dialog-done-${RAND_NUM}`).on('click', function () {
    const data = [
      { name: 'label', value: $(`#polygonadder-dialog-name-${RAND_NUM}`).val() },
      { name: 'csrfmiddlewaretoken', value: csrftoken },
      { name: 'points', value: markers.length }
    ]
    for (const i in markers) {
      const markerLatLng = markers[i].getMarker().getLatLng()
      data.push({ name: `point${i}_lat`, value: markerLatLng.lat })
      data.push({ name: `point${i}_lng`, value: markerLatLng.lng })
    }

    if (replaces !== -1) {
      $.post(`/data/userpolygons/${replaces}/replace/`, data)
    } else {
      $.post(`/mission/${missionId}/data/userpolygons/create/`, data)
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
    L.PolygonAdder(this.map, this.options.missionId, this.options.csrftoken, [this.map.getCenter()], -1, '')
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'PolygonAdder-container leaflet-bar')
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
