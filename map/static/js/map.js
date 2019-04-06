var assetLines = {};
var layerControl;
// eslint-disable-next-line no-unused-vars
var myMap;

function overlayAdd(name, layer) {
    layerControl.addOverlay(layer, name);
}

function assetPathUpdate(name)
{
    $.ajax({
        type: "GET",
        url: "/data/assets/" + name + "/position/history/",
        success: function(route) {
            var path = []
            for(var f in route.features)
            {
                var lon = route.features[f].geometry.coordinates[0];
                var lat = route.features[f].geometry.coordinates[1];
                path.push(L.latLng(lat, lon));
            }
            assetLines[name].setLatLngs(path);
        },
    });
}

function assetUpdate(asset, oldLayer) {
    var assetName = asset.properties.asset;
    assetPathUpdate(assetName);

    if (!oldLayer) {return; }

    var popupContent = assetName;
    var alt = asset.properties.alt;
    var heading = asset.properties.heading;
    var fix = asset.properties.fix;

    if (alt) {
        popupContent = popupContent + "<br />(alt=" + alt + ")";
    }

    if (heading) {
        popupContent = popupContent + "<br />(heading=" + heading + ")";
    }

    if (fix) {
        popupContent = popupContent + "<br />(" + fix + "d fix)";
    }

    oldLayer.bindPopup(popupContent);

    if (asset.geometry.type === 'Point') {
        var c = asset.geometry.coordinates;
        oldLayer.setLatLng([c[1], c[0]]);
        return oldLayer;
    }
}

function assetCreate(asset) {
    var assetName = asset.properties.asset;

    if(!(assetName in assetLines))
    {
        /* Create an overlay for this object */
        var track = L.polyline([], {color: 'red'});
        assetLines[assetName] = track;
        overlayAdd(assetName, track);
    }
}

function poiCreate(poi, layer) {
    var POILabel = poi.properties.label;
    var poiID = poi.properties.pk;
    var coords = poi.geometry.coordinates;

    var popupContent = 'POI: ' + POILabel + '<br />';

    popupContent += '<button class="btn btn-default" onClick="L.POIAdder(myMap, L.latLng(' + coords[1] + ', ' + coords[0] + '),' + poiID + ',\'' + POILabel + '\');">Move</button>'
    popupContent += '<button class="btn btn-danger" onClick="$.get(\'/data/pois/' + poiID + '/delete/\')">Delete</button>'
    popupContent += '<button class="btn btn-default" onClick="L.SearchAdder(myMap, \'point\', ' + poiID + ');">Create Search</button>'

    layer.bindPopup(popupContent);
}

function userPolygonCreate(poly, layer) {
    var PolyLabel = poly.properties.label;
    var PolyID = poly.properties.pk;
    var coords = poly.geometry.coordinates;

    var popupContent = PolyLabel + '<br />';

    var pointList = '';
    var i = 0;
    for (i = 0; i < (coords[0].length - 1); i++) {
        var point = coords[0][i];
        pointList += 'L.latLng(' + point[1] + ', ' + point[0] + '), ';
    }

    popupContent += '<button class="btn btn-default" onClick="L.PolygonAdder(myMap, [' + pointList + '], ' + PolyID + ', \'' + PolyLabel + '\')">Edit</button>';
    popupContent += '<button class="btn btn-danger" onClick="$.get(\'/data/userpolygons/' + PolyID + '/delete/\')">Delete</button>'

    layer.bindPopup(popupContent);
}

function userLineCreate(line, layer) {
    var LineLabel = line.properties.label;
    var LineID = line.properties.pk;
    var coords = line.geometry.coordinates;

    var popupContent = LineLabel + '<br />';

    var pointList = '';
    coords.forEach(function(point) {
        pointList += 'L.latLng(' + point[1] + ', ' + point[0] + '), ';
    })

    popupContent += '<button class="btn btn-default" onClick="L.LineAdder(myMap, [' + pointList + '], ' + LineID + ', \'' + LineLabel + '\')">Edit</button>';
    popupContent += '<button class="btn btn-danger" onClick="$.get(\'/data/userlines/' + LineID + '/delete/\')">Delete</button>'
    popupContent += '<button class="btn btn-default" onClick="L.SearchAdder(myMap, \'line\', ' + LineID + ');">Create Search</button>'

    layer.bindPopup(popupContent);
}

function sectorSearchIncompleteCreate(line, layer) {
    var SectorSearchID = line.properties.pk;
    var SSweepWidth = line.properties.sweep_width;

    var popupContent = 'Sector Search<br />';

    popupContent += "Sweep Width = " + SSweepWidth + "m<br />";

    layer.bindPopup(popupContent);
}

function sectorSearchCompleteCreate(line, layer) {
    var SectorSearchID = line.properties.pk;

    var popupContent = '';

    layer.bindPopup(popupContent);
}


function expandingBoxSearchIncompleteCreate(line, layer) {
    var ExpandingBoxSearchID = line.properties.pk;
    var EBSweepWidth = line.properties.sweep_width;
    var EBFirstBearing = line.properties.first_bearing;
    var EBIterations = line.properties.iterations;

    var popupContent = 'Expanding Box Search<br />';

    popupContent += "Sweep Width = " + EBSweepWidth + "m<br />";
    popupContent += "First Bearing = " + EBFirstBearing + "&#176;T<br />";
    popupContent += "Complete Boxes = " + EBIterations + "<br />";

    layer.bindPopup(popupContent);
}

function expandingBoxSearchCompleteCreate(line, layer) {
    var ExpandingBoxSearchID = line.properties.pk;

    var popupContent = '';

    layer.bindPopup(popupContent);
}

function trackLineSearchIncompleteCreate(line, layer) {
    var TrackLineSearchID = line.properties.pk;
    var TLSweepWidth = line.properties.sweep_width;

    var popupContent = 'Track Line Search<br />';

    popupContent += "Sweep Width = " + TLSweepWidth + "m<br />";

    layer.bindPopup(popupContent);
}

function trackLineSearchCompleteCreate(line, layer) {
    var TrackLineSearchID = line.properties.pk;

    var popupContent = '';

    layer.bindPopup(popupContent);
}

function creepingLineSearchIncompleteCreate(line, layer) {
    var TrackLineSearchID = line.properties.pk;
    var TLSweepWidth = line.properties.sweep_width;

    var popupContent = 'Track Line Search<br />';

    popupContent += "Sweep Width = " + TLSweepWidth + "m<br />";

    layer.bindPopup(popupContent);
}

function creepingLineSearchCompleteCreate(line, layer) {
    var TrackLineSearchID = line.properties.pk;

    var popupContent = '';

    layer.bindPopup(popupContent);
}

// eslint-disable-next-line no-unused-vars
function mapInit(map) {
    myMap = map;
    layerControl = L.control.layers({}, {});
    layerControl.addTo(map);

    map.locate({ setView: true, maxZoom: 16 });

    L.control.poiadder({}).addTo(map);
    L.control.polygonadder({}).addTo(map);
    L.control.lineadder({}).addTo(map);
    L.control.locate({
        setView: 'untilPan',
        keepCurrentZoomLevel: true,
        locateOptions: { enableHighAccuracy: true},
    }).addTo(map);

    var realtime = L.realtime({
            url: "/data/assets/positions/latest/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: assetCreate,
            updateFeature: assetUpdate,
            getFeatureId: function(feature) { return feature.properties.asset; }
        }).addTo(map);

    overlayAdd("Assets", realtime);

    realtime = L.realtime({
            url: "/data/pois/current/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: poiCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("POIs", realtime);

    realtime = L.realtime({
            url: "/data/userpolygons/current/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: userPolygonCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Polygons", realtime);

    realtime = L.realtime({
            url: "/data/userlines/current/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: userLineCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Lines", realtime);


    realtime = L.realtime({
            url: "/search/sector/incomplete/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            color: 'orange',
            onEachFeature: sectorSearchIncompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Sector Searches (incomplete)", realtime);


    realtime = L.realtime({
            url: "/search/sector/completed/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: sectorSearchCompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        });

    overlayAdd("Sector Searches (completed)", realtime);

    realtime = L.realtime({
            url: "/search/expandingbox/incomplete/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            color: 'orange',
            onEachFeature: expandingBoxSearchIncompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("ExpandingBox Searches (incomplete)", realtime);

    realtime = L.realtime({
            url: "/search/expandingbox/completed/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: expandingBoxSearchCompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        });

    overlayAdd("Expanding Box Searches (completed)", realtime);


    realtime = L.realtime({
            url: "/search/trackline/incomplete/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            color: 'orange',
            onEachFeature: trackLineSearchIncompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Track Line Searches (incomplete)", realtime);

    realtime = L.realtime({
            url: "/search/trackline/completed/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: trackLineSearchCompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        });

    overlayAdd("Track Line Searches (completed)", realtime);

    realtime = L.realtime({
            url: "/search/creepingline/incomplete/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            color: 'orange',
            onEachFeature: creepingLineSearchIncompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Creeping Line Searches (incomplete)", realtime);

    realtime = L.realtime({
            url: "/search/creepingline/completed/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: creepingLineSearchCompleteCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        });

    overlayAdd("Creeping Line Searches (completed)", realtime);
}
