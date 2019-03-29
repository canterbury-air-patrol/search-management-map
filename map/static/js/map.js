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
}
