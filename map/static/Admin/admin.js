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

L.SMMAdmin.TrackPosition = function(map) {
    var state = 'stopped';
    var watchID = 0;

    var assetSelect = "<select class='form-control' id='track-position-asset'></select>"
    var contents = [
        "<div>" + assetSelect + "</div>",
        "<div id='track-position-error'></div>",
        "<div><table><tr><th>Lat</th><th>Long</th><th>Alt</th><th>Heading</th></tr><tr><td id='track-position-lat'></td><td id='track-position-lon'></td><td id='track-position-alt'></td><td id='track-position-heading'></td></tr></table></div>",
        "<div><button class='btn btn-default' id='record_start'>Start</button>",
        "<button class='btn btn-default' id='record_stop'>Stop</button>",
        "<button class='btn btn-default' id='record_close'>Close</button></div>",
    ].join('');
    var trackPositionDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(map);

    $.get('/assets/mine/json/', function(data) {
        $.each(data, function(index, json){
            for(var at in json) {
                $("#track-position-asset").append("<option value='" + json[at].id + "'>" + json[at].name + "</option>");
            }
        })
    })

    var updateButtons = function() {
        if(state == 'stopped') {
            $("#record_start").show();
            $("#record_stop").hide();
        } else {
            $("#record_start").hide();
            $("#record_stop").show();
        }
    }
    updateButtons();

    $("#record_start").click(function() { state = 'running'; updateButtons(); })
    $("#record_stop").click(function() { state = 'stopped'; updateButtons(); })
    $("#record_close").click(function() {
        state = 'closed';
        trackPositionDialog.destroy();
        navigator.geolocation.clearWatch(watchID);
    })

    var errorHandler = function(error) {
        var msg = null;
        switch(error.code) {
            case error.PERMISSION_DENIED:
                 msg = "No permision given to access location";
                 break;
            case error.POSITION_UNAVAILABLE:
                 msg = "Unable to get the current position";
                 break;
            case error.TIMEOUT:
                 msg = "Timed out getting position";
                 break;
            default:
                 msg = "Unknown error: " + error.code;
                 break;
        }
        if (msg == null) {
             $("#track-position-error").text('');
        } else {
             $("#track-position-error").text('Error: ' + msg);
        }
    }

    var updatePosition = function(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var altitude = position.coords.altitude;
        var heading = position.coords.heading;

        var asset_name = $("#track-position-asset option:selected").text();
        var data = {
            lat: latitude,
            lon: longitude,
            alt: altitude,
            heading: heading,
        };

        $("#track-position-lat").text(latitude);
        $("#track-position-lon").text(longitude);
        $("#track-position-alt").text(altitude);
        $("#track-position-heading").text(heading);

        if (state == 'running') {
            $.get('/data/assets/' + asset_name + '/position/add/', data);
        }
    }

    if (navigator.geolocation) {
        var options = {
            timeout:60000,
            enableHighAccuracy: true
        };
        watchID = navigator.geolocation.watchPosition(updatePosition, errorHandler, options);
    }
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
                "<div><button class='btn btn-default' id='asset_track'>Track as Asset</button></div>",
                "<div><button class='btn btn-default' id='admin_close'>Close</button>",
            ].join('');
            var AdminDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(map);
            $("#asset_command").click(function() {L.SMMAdmin.AssetCommand(map)});
            $("#asset_track").click(function() {L.SMMAdmin.TrackPosition(map)});
            $("#admin_close").click(function() {AdminDialog.destroy()});
        });

        return container;
    },

    onRemove: function() {

    }
})


L.control.smmadmin = function(opts) {
    return new L.Control.SMMAdmin(opts);
}
