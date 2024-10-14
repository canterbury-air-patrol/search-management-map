import $ from 'jquery'
import L from 'leaflet'

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

L.Control.SMMAdmin = L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function (options) {
    L.Control.prototype.initialize.call(this, options)
  },

  onCommand: function () {
    L.SMMAdmin.AssetCommand(this.map, this.options.missionId, this.options.csrftoken)
  },

  onCancel: function () {
    this.AdminDialog.destroy()
  },

  onClick: function () {
    const contents = [
      '<div><button class="btn btn-light" id="asset_command">Set Asset Command</button></div>',
      '<div><button class="btn btn-danger" id="admin_close">Close</button>'
    ].join('')
    this.AdminDialog = L.control.dialog({ initOpen: true }).setContent(contents).addTo(this.map).hideClose()
    $('#asset_command').on('click', this.onCommand.bind(this))
    $('#admin_close').on('click', this.onCancel.bind(this))
  },

  onAdd: function (map) {
    const container = (this._container = L.DomUtil.create('div', 'SMMAdmin-container leaflet-bar'))
    const link = L.DomUtil.create('a', '', container)
    link.href = '#'
    link.title = 'Admin'

    const adminImg = L.DomUtil.create('img', 'SMMAdmin-marker', link)

    adminImg.src = '/static/icons/administration.png'
    adminImg.alt = 'Admin'

    L.DomEvent.disableClickPropagation(link)

    this.map = map

    L.DomEvent.on(link, 'click', L.DomEvent.stop)
    L.DomEvent.on(link, 'click', this.onClick.bind(this))

    return container
  },

  onRemove: function () {}
})

L.control.smmadmin = function (opts) {
  return new L.Control.SMMAdmin(opts)
}
