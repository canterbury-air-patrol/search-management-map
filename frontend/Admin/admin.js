import $ from 'jquery'
import L from 'leaflet'
import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

L.SMMAdmin = {}

L.SMMAdmin.AssetCommand = function (map, missionId, csrftoken) {
  const contents = [
    '<div id="assetcommanddialog"></div>',
    '<div><button class="btn btn-primary" id="command_create">Set</button>',
    '<button class="btn btn-danger" id="command_cancel">Cancel</button></div>'
  ].join('')
  const assetCommandDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()
  let gotoPoint = null
  const changeSelectedCommand = function () {
    const selectedCommand = $('#id_command').val()
    if (selectedCommand === 'GOTO') {
      $('#latitude').show()
      $('#longitude').show()
      if (gotoPoint == null) {
        gotoPoint = L.marker(map.getCenter(), { draggable: true, autoPan: true }).addTo(map)
        gotoPoint.on('dragend', function () {})
      }
    } else {
      $('#latitude').hide()
      $('#longitude').hide()
      if (gotoPoint != null) {
        map.removeLayer(gotoPoint)
        gotoPoint = null
      }
    }
  }
  $('#command_cancel').on('click', function () {
    if (gotoPoint != null) {
      map.removeLayer(gotoPoint)
    }
    assetCommandDialog.destroy()
  })
  $('#command_create').on('click', function () {
    const data = [
      { name: 'csrfmiddlewaretoken', value: csrftoken },
      { name: 'asset', value: $('#id_asset').val() },
      { name: 'reason', value: $('#id_reason').val() },
      { name: 'command', value: $('#id_command').val() }
    ]
    if (gotoPoint != null) {
      const coords = gotoPoint.getLatLng()
      data.push({ name: 'latitude', value: coords.lat })
      data.push({ name: 'longitude', value: coords.lng })
    }
    $.post(`/mission/${missionId}/assets/command/set/`, data, function (data) {
      if (data === 'Created') {
        if (gotoPoint != null) {
          map.removeLayer(gotoPoint)
        }
        assetCommandDialog.destroy()
        return
      }
      $('#assetcommanddialog').html(data)
    })
  })
  $.get(`/mission/${missionId}/assets/command/set/`, {}, function (data) {
    $('#assetcommanddialog').html(data)
    $('#id_command').on('change', changeSelectedCommand)
  })
}

L.SMMAdmin.TrackPosition = function (map) {
  let state = 'stopped'
  let watchID = 0

  const assetSelect = "<select class='form-control' id='track-position-asset'></select>"
  const contents = [
    `<div>${assetSelect}</div>`,
    '<div id="track-position-error"></div>',
    '<div><table><tr><th>Lat</th><th>Long</th><th>Alt</th><th>Heading</th></tr><tr><td id="track-position-lat"></td><td id="track-position-lon"></td><td id="track-position-alt"></td><td id="track-position-heading"></td></tr></table></div>',
    '<div><button class="btn btn-primary" id="record_start">Start</button>',
    '<button class="btn btn-danger" id="record_stop">Stop</button>',
    '<button class="btn btn-danger" id="record_close">Close</button></div>'
  ].join('')
  const trackPositionDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()

  $.get('/assets/mine/json/', function (data) {
    $.each(data, function (index, json) {
      for (const at in json) {
        $('#track-position-asset').append(`<option value='${json[at].id}'>${json[at].name}</option>`)
      }
    })
  })

  const updateButtons = function () {
    if (state === 'stopped') {
      $('#record_start').show()
      $('#record_stop').hide()
    } else {
      $('#record_start').hide()
      $('#record_stop').show()
    }
  }
  updateButtons()

  $('#record_start').on('click', function () { state = 'running'; updateButtons() })
  $('#record_stop').on('click', function () { state = 'stopped'; updateButtons() })
  $('#record_close').on('click', function () {
    state = 'closed'
    trackPositionDialog.destroy()
    navigator.geolocation.clearWatch(watchID)
  })

  const errorHandler = function (error) {
    let msg = null
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg = 'No permision given to access location'
        break
      case error.POSITION_UNAVAILABLE:
        msg = 'Unable to get the current position'
        break
      case error.TIMEOUT:
        msg = 'Timed out getting position'
        break
      default:
        msg = `Unknown error: ${error.code}`
        break
    }
    $('#track-position-error').text('Error: ' + msg)
  }

  const updatePosition = function (position) {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    const altitude = position.coords.altitude
    const newHeading = position.coords.heading

    const assetName = $('#track-position-asset option:selected').text()
    const data = {
      lat: latitude,
      lon: longitude,
      alt: altitude,
      heading: newHeading
    }

    $('#track-position-lat').text(degreesToDM(latitude, true))
    $('#track-position-lon').text(degreesToDM(longitude, false))
    $('#track-position-alt').text(Math.floor(altitude))
    $('#track-position-heading').text(newHeading)

    if (state === 'running') {
      $.get(`/data/assets/${assetName}/position/add/`, data)
    }
  }

  if (navigator.geolocation) {
    const options = {
      timeout: 60000,
      enableHighAccuracy: true
    }
    watchID = navigator.geolocation.watchPosition(updatePosition, errorHandler, options)
  }
}

L.Control.SMMAdmin = L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onAdd: function (map) {
    const container = this._container = L.DomUtil.create('div', 'SMMAdmin-container leaflet-bar')
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Admin'

    const adminImg = L.DomUtil.create('img', 'SMMAdmin-marker', link)

    adminImg.src = '/static/icons/administration.png'
    adminImg.alt = 'Admin'

    L.DomEvent.disableClickPropagation(link)

    const self = this

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', function () {
      const contents = [
        '<div><button class="btn btn-light" id="asset_command">Set Asset Command</button></div>',
        '<div><button class="btn btn-light" id="asset_track">Track as Asset</button></div>',
        '<div><button class="btn btn-danger" id="admin_close">Close</button>'
      ].join('')
      const AdminDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(map).hideClose()
      $('#asset_command').on('click', function () { L.SMMAdmin.AssetCommand(map, self.options.missionId, self.options.csrftoken) })
      $('#asset_track').on('click', function () { L.SMMAdmin.TrackPosition(map) })
      $('#admin_close').on('click', function () { AdminDialog.destroy() })
    })

    return container
  },

  onRemove: function () {}
})

L.control.smmadmin = function (opts) {
  return new L.Control.SMMAdmin(opts)
}
