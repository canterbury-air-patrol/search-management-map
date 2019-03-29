L.LineAdder = function(map, current_points, replaces, label) {
    var rand_num = Math.floor(Math.random() * 16536);
    var points = current_points;
    var markers = [];
    var line = L.polyline(points, {color: 'yellow'}).addTo(map);
    var dialog = L.control.dialog();

    var removeAllMarkers = function() {
        markers.forEach(function(m) { map.removeLayer(m); });
    }

    var updateMarkers = function() {
        // Remove old markers from map
        removeAllMarkers();

        // recreate markers list
        markers = [];
        points.forEach(function (p) {
            var m = L.marker(p, {
                draggable: true,
                autopan: true,
            });
            markers.push(m);
            m.addTo(map);
            m.on('dragend', function(e) { updateMarker(p, m); dialog.open(); });
        });

        // Tell the line the points have changed
        line.setLatLngs(points);
    }

    var updateMarker = function(point, marker) {
        var markerCoords = marker.getLatLng();
        point.lat = markerCoords.lat;
        point.lng = markerCoords.lng;
        updateMarkers();
    }

    updateMarkers();

    var contents = [
        "<button class='btn btn-primary' id='lineadder-dialog-next-" + rand_num + "'>Next</button>",
        "<button class='btn btn-primary' id='lineadder-dialog-done-" + rand_num + "'>Done</button>",
        "<button class='btn btn-warning' id='lineadder-dialog-remove-" + rand_num + "'>Remove</button>",
        "<button class='btn btn-warning' id='lineadder-dialog-cancel-" + rand_num + "'>Cancel</button>",
        "<input type='text' id='lineadder-dialog-name-" + rand_num + "'/>",
    ].join('');
    dialog.setContent(contents).addTo(map);
    $("#lineadder-dialog-name-" + rand_num).val(label);

    $("#lineadder-dialog-next-" + rand_num).click(function(e) {
        points.push(map.getCenter());
        updateMarkers();
    });

    $("#lineadder-dialog-done-" + rand_num).click(function(e) {
        var data = [
            {name: 'label', value: $('#lineadder-dialog-name-' + rand_num).val()},
            {name: 'csrfmiddlewaretoken', value: csrftoken},
            {name: 'points', value: points.length },
        ]
        for(i = 0; i < points.length; i++) {
            data.push({name: 'point'+i+'_lat', value: points[i].lat})
            data.push({name: 'point'+i+'_lng', value: points[i].lng})
        }

        if (replaces != -1) {
            $.post('/data/userlines/' + replaces + '/replace/', data);
        } else {
            $.post('/data/userlines/create/', data);
        }
        removeAllMarkers();
        map.removeLayer(line);
        dialog.destroy();
    });

    $("#lineadder-dialog-cancel-" + rand_num).click(function(e) {
        removeAllMarkers();
        map.removeLayer(line);
        dialog.destroy();
    });

    $("#lineadder-dialog-remove-" + rand_num).click(function(e) {
        if (points.length > 1) {
            points.pop();
        }
        updateMarkers();
    });
}

L.Control.LineAdder = L.Control.extend({
    options: {
        position: 'topleft',
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);
    },


    onAdd: function(map) {
        var container = this._container = L.DomUtil.create('div', 'LineAdder-container leaflet-bar');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Add Line';

        var markerImg = L.DomUtil.create('img', 'Line-img', link);
        var myself = this;

        markerImg.src = '/static/icons/draw-line.png';
        markerImg.alt = 'Add Line';

        L.DomEvent.disableClickPropagation(link);

        L.DomEvent.on(link, 'click', L.DomEvent.stop);
        L.DomEvent.on(link, 'click', function () {
            L.LineAdder(map, [map.getCenter()], -1, '');
        });

        return container;
    },


    onRemove: function(map) {

    },
});

L.control.lineadder = function(opts) {
    return new L.Control.LineAdder(opts);
}
