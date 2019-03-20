var assetLines = {};
var layerControl;

function overlay_add(name, layer) {
    layerControl.addOverlay(layer, name);
}

function asset_path_update(name)
{
    $.ajax({
        type: "GET",
        url: "/data/assets/" + name + "/position/history/",
        success: function(route) {
            path = []
            for(f in route.features)
            {
                lon = route.features[f].geometry.coordinates[0];
                lat = route.features[f].geometry.coordinates[1];
                path.push(L.latLng(lat, lon));
            }
            assetLines[name].setLatLngs(path);
        },
    });
}

function asset_update(asset, oldLayer) {
    var assetName = asset.properties.asset;
    asset_path_update(assetName);

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

    if (asset.geometry.type == 'Point') {
        var c = asset.geometry.coordinates;
        oldLayer.setLatLng([c[1], c[0]]);
        return oldLayer;
    }
}

function asset_create(asset, layer) {
    var assetName = asset.properties.asset;

    if(!(assetName in assetLines))
    {
        /* Create an overlay for this object */
        track = L.polyline([], {color: 'red'});
        assetLines[assetName] = track;
        overlay_add(assetName, track);
    }
}

function map_init(map, options) {
    layerControl = L.control.layers({}, {});
    layerControl.addTo(map);

    map.locate({ setView: true, maxZoom: 16 });


    realtime = L.realtime({
            url: "/data/assets/positions/latest/",
            type: 'json',
        }, {
            interval: 3 * 1000,
            onEachFeature: asset_create,
            updateFeature: asset_update,
            getFeatureId: function(feature) { return feature.properties.asset; }
        }).addTo(map);

    overlay_add("Assets", realtime);
}
