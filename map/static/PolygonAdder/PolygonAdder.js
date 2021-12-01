L.PolygonAdder = function(map, currentPoints, replaces, label) {
	var open = false;

	var isOpen = function () {
		return open;
	}

	var create = function() {
		var RAND_NUM = Math.floor(Math.random() * 16536);
		var points = currentPoints;
		var markers = [];
		var polygon = L.polygon(points, { color: 'yellow' }).addTo(map);
		var dialog = L.control.dialog();
		
		var openAdder = function () {
			open = true;
			dialog.open();		
		}

		var closeAdder = function () {
			open = false;
			dialog.destroy();
		}

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
					openAdder();
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
			for (i = 0; i < points.length; i++) {
				if (points[i] == point)
				{
					updatePointRow(i, point);
				}
			}
			updateMarkers();
		};

		var point_count = 0;
		var addPointRow = function(point) {
			$('#polygonadder-points-' + RAND_NUM).append('<div id="polygonadder-points-' + RAND_NUM + '-' + point_count + '"><input type="text" id = "polygonadder-points-' + RAND_NUM + '-' + point_count + '-lat" size="12" value="' + deg_to_dm(point.lat, true) + '" /><input type="text" id = "polygonadder-points-' + RAND_NUM + '-' + point_count + '-lon" size="12" value="' + deg_to_dm(point.lng, false) + '" /></div>');
			point_count++;
		}

		var removePointRow = function() {
			point_count--;
			$('#polygonadder-points-' + RAND_NUM + '-' + point_count).remove();
		}

		var updatePointRow = function(row, point) {
			$('#polygonadder-points-' + RAND_NUM + '-' + row + '-lat').val(deg_to_dm(point.lat, true));
			$('#polygonadder-points-' + RAND_NUM + '-' + row + '-lon').val(deg_to_dm(point.lng, false));
		}
		updateMarkers();

		var contents = [
			'<div class="input-group input-group-sm mb-3"><div class="input-group-prepend"><span class="input-group-text">Name</span></div>',
					'<input type="text" id="polygonadder-dialog-name-' + RAND_NUM + '"></input></div>',
			'<div class="btn-group">',
			'<button class="btn btn-primary" id="polygonadder-dialog-done-' + RAND_NUM + '">Done</button>',
			'<button class="btn btn-warning" id="polygonadder-dialog-cancel-' + RAND_NUM + '">Cancel</button>',
			'</div>',
			'<div id="polygonadder-points-' + RAND_NUM + '"></div>',
			'<div class="btn-group">',
			'<button class="btn btn-primary" id="polygonadder-dialog-next-' + RAND_NUM + '">Next</button>',
			'<button class="btn btn-warning" id="polygonadder-dialog-remove-' + RAND_NUM + '">Remove</button>',
			'</div>',
		].join('');
		dialog.setContent(contents).addTo(map).hideClose();
	
		points.forEach(function (p) {
			addPointRow(p);
		});
		$('#polygonadder-dialog-name-' + RAND_NUM).val(label);
	
		$('#polygonadder-dialog-next-' + RAND_NUM).click(function() {
			var new_point = map.getCenter();
			addPointRow(new_point);
			points.push(new_point);
			updateMarkers();
		});
	
		$('#polygonadder-dialog-done-' + RAND_NUM).click(function() {
			var data = [
				{ name: 'label', value: $('#polygonadder-dialog-name-' + RAND_NUM).val() },
				{ name: 'csrfmiddlewaretoken', value: csrftoken },
				{ name: 'points', value: points.length },
			];
			for (var i = 0; i < points.length; i++) {
				data.push({ name: 'point' + i + '_lat', value: dm_to_deg ($("#polygonadder-points-" + RAND_NUM + "-" + i + "-lat").val()) });
				data.push({ name: 'point' + i + '_lng', value: dm_to_deg ($("#polygonadder-points-" + RAND_NUM + "-" + i + "-lon").val()) });
			}
			if (replaces !== -1) {
				$.post('/mission/' + mission_id + '/data/userpolygons/' + replaces + '/replace/', data);
			} else {
				$.post('/mission/' + mission_id + '/data/userpolygons/create/', data);
			}
			removeAllMarkers();
			map.removeLayer(polygon);
			closeAdder();
		});
	
		$('#polygonadder-dialog-cancel-' + RAND_NUM).click(function() {
			removeAllMarkers();
			map.removeLayer(polygon);
			closeAdder();
		});
	
		$('#polygonadder-dialog-remove-' + RAND_NUM).click(function() {
			if (points.length > 1) {
				points.pop();
				removePointRow();
			}
			updateMarkers();
		});

		openAdder();
	};
	
	return {
		isOpen: isOpen,
		create: create
	}
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
		link.adder = L.PolygonAdder(map, [map.getCenter()], -1, '');

		var markerImg = L.DomUtil.create('img', 'Polygon-img', link);

		markerImg.src = '/static/icons/draw-polygon.png';
		markerImg.alt = 'Add Area';

		L.DomEvent.disableClickPropagation(link);

		L.DomEvent.on(link, 'click', L.DomEvent.stop);
		L.DomEvent.on(link, 'click', function() {
			if(!link.adder.isOpen()) {
				link.adder.create();
			}
		});

		return container;
	},

	onRemove: function() {},
});

L.control.polygonadder = function(opts) {
	return new L.Control.PolygonAdder(opts);
};
