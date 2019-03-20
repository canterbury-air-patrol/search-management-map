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
        L.DomEvent.on(link, 'click', function() {
            var marker = new L.marker(map.getCenter(), {
                draggable: true,
                autoPan: true
            }).addTo(map);
            var rand_num = Math.floor(Math.random() * 16536);
            var contents = [
                "<div class='input-short'><label>Lat</label><input type='text' id='poi-dialog-lat-" + rand_num + "' /></div>",
                "<div class='input-short'><label>Lon</label><input type='text' id='poi-dialog-lon-" + rand_num + "' /></div>",
                "<div class='input-label'><label>Label</label><textarea autofocus id='poi-dialog-label-" + rand_num + "' rows=2></textarea></div>",
                "<button class='btn btn-primary' id='poi-dialog-create-" + rand_num + "'>Create</button><button class='btn btn-danger' id='poi-dialog-cancel-" + rand_num + "'>Cancel</button>",
            ].join('');
            var markerDialog = new L.control.dialog({'initOpen': false}).setContent(contents).addTo(map);
            $('#poi-dialog-create-' + rand_num).click(function(e) {
                $.post('/data/pois/create/', {
                    lat: $('#poi-dialog-lat-' + rand_num).val(),
                    lon: $('#poi-dialog-lon-' + rand_num).val(),
                    label: $('#poi-dialog-label-' + rand_num).val(),
                    csrfmiddlewaretoken: csrftoken,
                });
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
        })

        return container;
    },

    onRemove: function(map) {

    }
});

L.control.poiadder = function(opts) {
    return new L.Control.POIAdder(opts);
}
