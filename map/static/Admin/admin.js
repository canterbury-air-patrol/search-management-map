L.SMMAdmin = {}

L.SMMAdmin.AssetCommand = function(map) {
    var contents = [
        "<div id='assetcommanddialog'></div>",
        "<div><button class='btn btn-default' id='command_create'>Set</button>",
        "<button class='btn btn-default' id='command_cancel'>Cancel</button></div>",
    ].join('');
    var assetCommandDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(map);
    var gotoPoint = null;
    var changeSelectedCommand = function() {
        var selectedCommand = $("#id_command").val();
        if (selectedCommand == 'GOTO') {
            $("#latitude").show();
            $("#longitude").show();
            if (gotoPoint == null) {
                gotoPoint = new L.marker(map.getCenter(), { draggable: true, autoPan: true}).addTo(map);
                gotoPoint.on('dragend', function() {})
            }
        } else {
            $("#latitude").hide();
            $("#longitude").hide();
            if (gotoPoint != null) {
                map.removeLayer(gotoPoint);
                delete gotoPoint;
                gotoPoint = null;
            }
        }
    }
    $("#command_cancel").click(function() {
        if (gotoPoint != null) {
            map.removeLayer(gotoPoint);
        }
        assetCommandDialog.destroy();
    })
    $("#command_create").click(function() {
        var data = [
            { name: 'csrfmiddlewaretoken', value: csrftoken},
            { name: 'asset', value: $("#id_asset").val()},
            { name: 'reason', value: $("#id_reason").val()},
            { name: 'command', value: $("#id_command").val()},
        ]
        if (gotoPoint != null) {
            var coords = gotoPoint.getLatLng();
            data.push({name: 'latitude', value: coords.lat })
            data.push({name: 'longitude', value: coords.lng })
        }
        $.post('/assets/command/set/', data, function(data) {
            console.log(data);
            if (data === "Created") {
                if (gotoPoint != null) {
                    map.removeLayer(gotoPoint);
                }
                assetCommandDialog.destroy();
                return;
            }
            $("#assetcommanddialog").html(data);
        });
    })
    $.get("/assets/command/set/", {}, function(data) {
         $("#assetcommanddialog").html(data);
         $("#id_command").on('change', changeSelectedCommand)
    });
}

L.Control.SMMAdmin = L.Control.extend({
    options: {
        position: 'bottomleft',
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);
    },


    onAdd: function(map) {
        var container = this._container = L.DomUtil.create('div', 'SMMAdmin-container leaflet-bar');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Admin';

        var adminImg = L.DomUtil.create('img', 'SMMAdmin-marker', link);

        adminImg.src = '/static/icons/administration.png';
        adminImg.alt = 'Admin';

        L.DomEvent.disableClickPropagation(link);

        L.DomEvent.on(link, 'click', L.DomEvent.stop);
        L.DomEvent.on(link, 'click', function () {
            var contents = [
                "<div><button class='btn btn-default' id='asset_command'>Set Asset Command</button></div>",
            ].join('');
            var AdminDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(map);
            $("#asset_command").click(function() {L.SMMAdmin.AssetCommand(map)});
        });

        return container;
    },

    onRemove: function() {

    }
})


L.control.smmadmin = function(opts) {
    return new L.Control.SMMAdmin(opts);
}
