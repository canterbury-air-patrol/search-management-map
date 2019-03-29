L.POIAdder = function(map, pos, replaces, label) {
    var marker = new L.marker(pos, {
        draggable: true,
        autoPan: true
    }).addTo(map);
    var RAND_NUM = Math.floor(Math.random() * 16536);
    var contents = [
        "<div class='input-short'><label>Lat</label><input type='text' id='poi-dialog-lat-" + RAND_NUM + "' /></div>",
        "<div class='input-short'><label>Lon</label><input type='text' id='poi-dialog-lon-" + RAND_NUM + "' /></div>",
        "<div class='input-label'><label>Label</label><textarea autofocus id='poi-dialog-label-" + RAND_NUM + "' rows=2>" + label + "</textarea></div>",
        "<button class='btn btn-primary' id='poi-dialog-create-" + RAND_NUM + "'>Create</button><button class='btn btn-danger' id='poi-dialog-cancel-" + RAND_NUM + "'>Cancel</button>",
    ].join('');
    var markerDialog = new L.control.dialog({'initOpen': false}).setContent(contents).addTo(map);
    if (replaces !== -1) {
        $('#poi-dialog-lat-' + RAND_NUM).val(pos.lat);
        $('#poi-dialog-lon-' + RAND_NUM).val(pos.lng);
        $('#poi-dialog-create-' + RAND_NUM).html('Update');
        markerDialog.open();
    }
    $('#poi-dialog-create-' + RAND_NUM).click(function() {
         var data = {
             lat: $('#poi-dialog-lat-' + RAND_NUM).val(),
             lon: $('#poi-dialog-lon-' + RAND_NUM).val(),
             label: $('#poi-dialog-label-' + RAND_NUM).val(),
             csrfmiddlewaretoken: csrftoken,       
         }
         if (replaces === -1)
         {
             $.post('/data/pois/create/', data);
         }
         else
         {
             $.post('/data/pois/' + replaces + '/replace/', data);
         }
         map.removeLayer(marker);
         markerDialog.destroy();
    });
    $('#poi-dialog-cancel-' + RAND_NUM).click(function() {
         map.removeLayer(marker);
         markerDialog.destroy();
    });
    map.on('dialog:opened', function () {
        var markerCoords = marker.getLatLng();
        $('#poi-dialog-lat-' + RAND_NUM).val(markerCoords.lat);
        $('#poi-dialog-lon-' + RAND_NUM).val(markerCoords.lng);
    });
    marker.on('dragend', function () {
        markerDialog.open();
    });
}

L.Control.POIAdder = L.Control.extend({
    options: {
        position: 'topleft',
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);
    },

    onAdd: function(map) {
        var container = this._container = L.DomUtil.create('div', 'POIAdder-container leaflet-bar');
        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Add POI';

        var markerImg = L.DomUtil.create('img', 'POIAdder-marker', link);

        markerImg.src = '/static/leaflet/images/marker-icon.png';
        markerImg.alt = 'Add POI';

        L.DomEvent.disableClickPropagation(link);

        L.DomEvent.on(link, 'click', L.DomEvent.stop);
        L.DomEvent.on(link, 'click', function () {
            L.POIAdder(map, map.getCenter(), -1, '');
        });

        return container;
    },

    onRemove: function() {

    }
});

L.control.poiadder = function(opts) {
    return new L.Control.POIAdder(opts);
}
