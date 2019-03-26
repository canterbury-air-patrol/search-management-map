L.POIAdder = function(map, pos, replaces, label) {
    var marker = new L.marker(pos, {
        draggable: true,
        autoPan: true
    }).addTo(map);
    var rand_num = Math.floor(Math.random() * 16536);
    var contents = [
        "<div class='input-short'><label>Lat</label><input type='text' id='poi-dialog-lat-" + rand_num + "' /></div>",
        "<div class='input-short'><label>Lon</label><input type='text' id='poi-dialog-lon-" + rand_num + "' /></div>",
        "<div class='input-label'><label>Label</label><textarea autofocus id='poi-dialog-label-" + rand_num + "' rows=2>" + label + "</textarea></div>",
        "<button class='btn btn-primary' id='poi-dialog-create-" + rand_num + "'>Create</button><button class='btn btn-danger' id='poi-dialog-cancel-" + rand_num + "'>Cancel</button>",
    ].join('');
    var markerDialog = new L.control.dialog({'initOpen': false}).setContent(contents).addTo(map);
    if (replaces != -1) {
        $('#poi-dialog-lat-' + rand_num).val(pos.lat);
        $('#poi-dialog-lon-' + rand_num).val(pos.lng);
        $('#poi-dialog-create-' + rand_num).html('Update');
        markerDialog.open();
    }
    $('#poi-dialog-create-' + rand_num).click(function(e) {
         var data = {
             lat: $('#poi-dialog-lat-' + rand_num).val(),
             lon: $('#poi-dialog-lon-' + rand_num).val(),
             label: $('#poi-dialog-label-' + rand_num).val(),
             csrfmiddlewaretoken: csrftoken,       
         }
         if (replaces == -1)
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
    $('#poi-dialog-cancel-' + rand_num).click(function(e) {
         map.removeLayer(marker);
         markerDialog.destroy();
    });
    map.on('dialog:opened', function (e) {
        var markerCoords = marker.getLatLng();
        $('#poi-dialog-lat-' + rand_num).val(markerCoords.lat);
        $('#poi-dialog-lon-' + rand_num).val(markerCoords.lng);
    });
    marker.on('dragend', function (e) {
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
        var myself = this;

        markerImg.src = '/static/leaflet/images/marker-icon.png';
        markerImg.alt = 'Add POI';

        L.DomEvent.disableClickPropagation(link);

        L.DomEvent.on(link, 'click', L.DomEvent.stop);
        L.DomEvent.on(link, 'click', function () {
            L.POIAdder(map, map.getCenter(), -1, '');
        });

        return container;
    },

    onRemove: function(map) {

    }
});

L.control.poiadder = function(opts) {
    return new L.Control.POIAdder(opts);
}
