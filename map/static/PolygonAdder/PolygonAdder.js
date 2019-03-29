L.PolygonAdder = function(map, currentPoints, replaces, label) {
	var RAND_NUM = Math.floor(Math.random() * 16536);
	var points = currentPoints;
	var markers = [];
	var polygon = L.polygon(points, { color: 'yellow' }).addTo(map);
	var dialog = L.control.dialog();

	var removeAllMarkers = function() {
		markers.forEach(function(m) {
			map.removeLayer(m);
		});
	};

	var updateMarkers = function() {
		// Remove old markers from map
		removeAllMarkers();

		// recreate markers list
		markers = [];
		points.forEach(function(p) {
			var m = L.marker(p, {
				draggable: true,
				autopan: true,
			});
			markers.push(m);
			m.addTo(map);
			m.on('dragend', function() {
				dialog.open();
				updateMarker(p, m);
			});
		});

		// Tell the polygon the points have changed
		polygon.setLatLngs(points);
	};

	var updateMarker = function(point, marker) {
		var markerCoords = marker.getLatLng();
		point.lat = markerCoords.lat;
		point.lng = markerCoords.lng;
		updateMarkers();
	};

	updateMarkers();

	var contents = [
		"<button class='btn btn-primary' id='polygonadder-dialog-next-" +
			RAND_NUM +
			"'>Next</button>",
		"<button class='btn btn-primary' id='polygonadder-dialog-done-" +
			RAND_NUM +
			"'>Done</button>",
		"<button class='btn btn-warning' id='polygonadder-dialog-remove-" +
			RAND_NUM +
			"'>Remove</button>",
		"<button class='btn btn-warning' id='polygonadder-dialog-cancel-" +
			RAND_NUM +
			"'>Cancel</button>",
		"<input type='text' id='polygonadder-dialog-name-" + RAND_NUM + "'></input>",
	].join('');
	dialog.setContent(contents).addTo(map);
	$('#polygonadder-dialog-name-' + RAND_NUM).val(label);

	$('#polygonadder-dialog-next-' + RAND_NUM).click(function() {
		points.push(map.getCenter());
		updateMarkers();
	});

	$('#polygonadder-dialog-done-' + RAND_NUM).click(function() {
		var data = [
			{ name: 'label', value: $('#polygonadder-dialog-name-' + RAND_NUM).val() },
			{ name: 'csrfmiddlewaretoken', value: csrftoken },
			{ name: 'points', value: points.length },
		];
		for (var i = 0; i < points.length; i++) {
			data.push({ name: 'point' + i + '_lat', value: points[i].lat });
			data.push({ name: 'point' + i + '_lng', value: points[i].lng });
		}
		if (replaces !== -1) {
			$.post('/data/userpolygons/' + replaces + '/replace/', data);
		} else {
			$.post('/data/userpolygons/create/', data);
		}
		removeAllMarkers();
		map.removeLayer(polygon);
		dialog.destroy();
	});

	$('#polygonadder-dialog-cancel-' + RAND_NUM).click(function() {
		removeAllMarkers();
		map.removeLayer(polygon);
		dialog.destroy();
	});

	$('#polygonadder-dialog-remove-' + RAND_NUM).click(function() {
		if (points.length > 1) {
			points.pop();
		}
		updateMarkers();
	});
};

L.Control.PolygonAdder = L.Control.extend({
	options: {
		position: 'topleft',
	},

	initialize: function(options) {
		L.Control.prototype.initialize.call(this, options);
	},

	onAdd: function(map) {
		var container = (this._container = L.DomUtil.create(
			'div',
			'PolygonAdder-container leaflet-bar'
		));
		var link = L.DomUtil.create('a', '', container);
		link.href = '#';
		link.title = 'Add Area';

		var markerImg = L.DomUtil.create('img', 'Polygon-img', link);

		markerImg.src = '/static/icons/draw-polygon.png';
		markerImg.alt = 'Add Area';

		L.DomEvent.disableClickPropagation(link);

		L.DomEvent.on(link, 'click', L.DomEvent.stop);
		L.DomEvent.on(link, 'click', function() {
			L.PolygonAdder(map, [map.getCenter()], -1, '');
		});

		return container;
	},

	onRemove: function() {},
});

L.control.polygonadder = function(opts) {
	return new L.Control.PolygonAdder(opts);
};
