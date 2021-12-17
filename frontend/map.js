import $ from 'jquery';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';

import 'leaflet-realtime';
import 'leaflet-dialog';
import 'leaflet-dialog/Leaflet.Dialog.css';
import 'leaflet.locatecontrol';

import './Admin/admin.js';
import './POIAdder/POIAdder.js';
import './PolygonAdder/PolygonAdder.js';
import './LineAdder/LineAdder.js';
import './ImageUploader/ImageUploader.js';
import './SearchAdder/SearchAdder.js';

import { deg_to_dm, dm_to_deg } from './deg_conv';

var assetLines = {};
var layerControl;
// eslint-disable-next-line no-unused-vars
var myMap;

function overlayAdd(name, layer) {
    layerControl.addOverlay(layer, name);
}

function assetPathUpdate(name)
{
    if (!(name in assetLines)) {
        var track = L.polyline([], {color: 'red'});
        assetLines[name] = {track: track, updating: false, lastUpdate: null, path: []};
        overlayAdd(name, track);
    }
    var assetLine = assetLines[name]
    if (assetLine.updating) { return; }
    assetLine.updating = true;

    var url = "/mission/" + mission_id + "/data/assets/" + name + "/position/history/?oldest=last";
    if(assetLine.lastUpdate != null) {
        url = url + "&from=" + assetLine.lastUpdate
    }

    $.ajax({
        type: "GET",
        url: url,
        success: function(route) {
            for(var f in route.features)
            {
                var lon = route.features[f].geometry.coordinates[0];
                var lat = route.features[f].geometry.coordinates[1];
                assetLine.path.push(L.latLng(lat, lon));
                assetLine.lastUpdate = route.features[f].properties.created_at;
            }
            assetLine.track.setLatLngs(assetLine.path);
            assetLine.updating = false;
        },
        error: function() {
            assetLine.updating = false;
        },
    });
}

function assetUpdate(asset, oldLayer) {
    var assetName = asset.properties.asset;
    assetPathUpdate(assetName);

    if (!oldLayer) {return; }

    var coords = asset.geometry.coordinates;

    var popupContent = '';
    popupContent += '<dl class="row"><dt class="asset-label col-sm-3">Asset</dt><dd class="asset-name col-sm-9">' + assetName + '</dd>';

    popupContent += '<dt class="asset-lat-label col-sm-3">Lat</dt><dd class="asset-lat-val col-sm-9">' + deg_to_dm(coords[1], true) + '</dd>';
    popupContent += '<dt class="asset--lng-label col-sm-3">Long</dt><dd class="asset-lng-val col-sm-9">' + deg_to_dm(coords[0]) + '</dd>';

    var alt = asset.properties.alt;
    var heading = asset.properties.heading;
    var fix = asset.properties.fix;

    if (alt) {
        popupContent = popupContent + '<dt class="asset-alt-label col-sm-3">Altitude</dt><dd class="asset-alt-val col-sm-9">' + alt + 'm</dd>';
    }

    if (heading) {
        popupContent = popupContent + '<dt class="asset-heading-label col-sm-3">Heading</dt><dd class="asset-heading-val col-sm-9">' + heading + ' &deg;</dd>';
    }

    if (fix) {
        popupContent = popupContent + '<dt class="asset-fix-label col-sm-3">Fix</dt><dd class="asset-fix-val col-sm-9">' + fix + 'd</dd>';
    }

    popupContent += '</dl>';

    oldLayer.bindPopup(popupContent, { minWidth: 200});

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
        assetLines[assetName] = {track: track, updating: false};
        overlayAdd(assetName, track);
    }
}

function poiCreate(poi, layer) {
    var POILabel = poi.properties.label;
    var poiID = poi.properties.pk;
    var coords = poi.geometry.coordinates;

    var popupContent = '<dl class="poi row"><dt class="poi-label col-sm-2">POI</dt><dd class="poi-name col-sm-10">' + POILabel + '</dd>';

    popupContent += '<dt class="poi-lat-label col-sm-2">Lat</dt><dd class="poi-lat-val col-sm-10">' + deg_to_dm(coords[1], true) + '</dd>';
    popupContent += '<dt class="poi-lng-label col-sm-2">Long</dt><dd class="poi-lng-val col-sm-10">' + deg_to_dm(coords[0]) + '</dd></dl>';

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        popupContent += '<div class="btn-group"><button class="btn btn-light" onClick="L.POIAdder(myMap, L.latLng(' + coords[1] + ', ' + coords[0] + '),' + poiID + ',\'' + POILabel + '\');">Move</button>'
        popupContent += '<button class="btn btn-danger" onClick="$.get(\'/mission/' + mission_id + '/data/pois/' + poiID + '/delete/\')">Delete</button>'
        popupContent += '<button class="btn btn-light" onClick="L.SearchAdder(myMap, \'point\', ' + poiID + ');">Create Search</button>'
        popupContent += '<button class="btn btn-light" onClick="L.MarineVectors(myMap, \'' + POILabel + '\', L.latLng(' + coords[1] + ', ' + coords[0] + '), ' + poiID + ');">Calculate TDV</button>'
        popupContent += '</div>'
    }

    layer.bindPopup(popupContent);
}

function userPolygonCreate(poly, layer) {
    var PolyLabel = poly.properties.label;
    var PolyID = poly.properties.pk;
    var coords = poly.geometry.coordinates;

    var popupContent = '<dl class="polygon row"><dt class="polygon-label col-sm-3">Polygon</dt><dd class="polygon-name col-sm-9">' + PolyLabel + '</dd></dl>';

    var pointList = '';
    var i = 0;
    for (i = 0; i < (coords[0].length - 1); i++) {
        var point = coords[0][i];
        pointList += 'L.latLng(' + point[1] + ', ' + point[0] + '), ';
    }

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        popupContent += '<div class="btn-group"><button class="btn btn-light" onClick="L.PolygonAdder(myMap, [' + pointList + '], ' + PolyID + ', \'' + PolyLabel + '\').create()">Edit</button>';
        popupContent += '<button class="btn btn-danger" onClick="$.get(\'/mission/' + mission_id + '/data/userpolygons/' + PolyID + '/delete/\')">Delete</button>'
        popupContent += '<button class="btn btn-light" onClick="L.SearchAdder(myMap, \'polygon\', ' + PolyID + ');">Create Search</button></div>'
    }
    layer.bindPopup(popupContent, { minWidth: 200 });
}

function userLineCreate(line, layer) {
    var LineLabel = line.properties.label;
    var LineID = line.properties.pk;
    var coords = line.geometry.coordinates;

    var popupContent = '<dl class="line row"><dt class="line-label col-sm-3">Line</dt><dd class="line-name col-sm-9">' + LineLabel + '</dd></dl>';

    var pointList = '';
    coords.forEach(function(point) {
        pointList += 'L.latLng(' + point[1] + ', ' + point[0] + '), ';
    })

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        popupContent += '<dev class="btn-group"><button class="btn btn-light" onClick="L.LineAdder(myMap, [' + pointList + '], ' + LineID + ', \'' + LineLabel + '\')">Edit</button>';
        popupContent += '<button class="btn btn-danger" onClick="$.get(\'/mission/' + mission_id + '/data/userlines/' + LineID + '/delete/\')">Delete</button>'
        popupContent += '<button class="btn btn-light" onClick="L.SearchAdder(myMap, \'line\', ' + LineID + ');">Create Search</button></div>'
    }

    layer.bindPopup(popupContent, { minWidth: 200 });
}

function searchQueueDialog(searchID, assetType) {
    var contents = [
        "<div>Queue for <select id='queue_" + searchID + "_select_type'><option value='type'>Asset Type</option><option value='asset'>Specific Asset</option></select></div>",
        "<div><select id='queue_" + searchID + "_select_asset'></select></div>",
        "<div><button class='btn btn-light' id='queue_" + searchID + "_queue'>Queue</button></div>",
        "<div><button class='btn btn-danger' id='queue_" + searchID + "_cancel'>Cancel</button>",
    ].join('');
    var QueueDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(myMap).hideClose();
    $("#queue_" + searchID + "_select_asset").hide();
    $.get('/mission/' + mission_id + '/assets/json/', function(data) {
        $.each(data, function(index, json){
            for(var at in json) {
                console.log(json[at]);
                if (json[at].type_name == assetType)
                {
                    $("#queue_" + searchID + "_select_asset").append("<option value='" + json[at].id + "'>" + json[at].name + "</option>");
                }
            }
        })
    })
    $("#queue_" + searchID + "_select_type").change(function() {
        if ($("#queue_" + searchID + "_select_type").val() == "type")
        {
            $("#queue_" + searchID + "_select_asset").hide();
        }
        else
        {
            $("#queue_" + searchID + "_select_asset").show();
        }
    });
    $("#queue_" + searchID + "_queue").click(function() {
        var data = [
            {name: 'csrfmiddlewaretoken', value: csrftoken},
        ];
        if ($("#queue_" + searchID + "_select_type").val() == "asset")
        {
            data.push({name: 'asset', value: $("#queue_" + searchID + "_select_asset").val()});
        }
        $.post("/mission/" + mission_id + "/search/" + searchID + "/queue/", data, function(data) {
            QueueDialog.destroy();
        });
    });
    $("#queue_" + searchID + "_cancel").click(function() {QueueDialog.destroy()});
}

function searchDataToPopUp(data) {
    var res = '<dl class="search-data row">';

    for (var d in data) {
         res += '<dt class="search-' + data[d].css + '-label col-sm-6">' + data[d].label + '</dt>'
         res += '<dd class="search-' + data[d].css + '-value col-sm-6">' + data[d].value + '</dd>'
    }

    res += '</dl>';

    return res;
}

function searchStatusIncomplete(search) {
    var InprogressBy = search.properties.inprogress_by;
    var QueuedAt = search.properties.queued_at;
    var QueuedForAsset = search.properties.queued_for_asset;
    var CreatedFor = search.properties.created_for;

    var status = "";
    if (InprogressBy)
    {
        status = "In Progress: " + InprogressBy;
    }
    else if(QueuedAt)
    {
        if (QueuedForAsset)
        {
            status = "Queued for " + QueuedForAsset + " at " + QueuedAt;
        }
        else
        {
            status = "Queued for " + CreatedFor + " at " + QueuedAt;
        }
    }
    else
    {
        status = "Unassigned";
    }

    return status;
}

function searchIncompleteCreate(search, layer) {
    var SearchID = search.properties.pk;
    var SweepWidth = search.properties.sweep_width;
    var AssetType = search.properties.created_for;
    var InprogressBy = search.properties.inprogress_by;
    var SearchType = search.properties.search_type;
    var QueuedAt = search.properties.queued_at;

    var data = [
        { css: 'type', label: 'Search Type', value: SearchType },
        { css: 'status', label: 'Status', value: searchStatusIncomplete(search) },
        { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
        { css: 'asset-type', label: 'Asset Type', value: AssetType }
    ]
    if (InprogressBy) {
        data.push({ css: 'inprogress', label: 'Inprogress By', value: InprogressBy })
    }

    var popupContent = searchDataToPopUp(data);

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        popupContent += '<div class="btn-group">';
        if (!InprogressBy) {
            popupContent += '<button class="btn btn-danger" onClick="$.get(\'/mission/' + mission_id + '/search/' + SearchID + '/delete/\')">Delete</button>'
            if (!QueuedAt) {
                popupContent += '<button class="btn btn-light" onClick="searchQueueDialog(\'' + SearchID + '\', \'' + AssetType + '\')">Queue</button>'
            }
        }
        popupContent += '</div>';
    }

    layer.bindPopup(popupContent, { minWidth: 200 });
}

function searchCompletedCreate(search, layer) {
    var SearchID = search.properties.pk;
    var SweepWidth = search.properties.sweep_width;
    var AssetType = search.properties.created_for;
    var InprogressBy = search.properties.inprogress_by;
    var SearchType = search.properties.search_type;

    var data = [
        { css: 'type', label: 'Search Type', value: SearchType },
        { css: 'status', label: 'Status', value: 'Completed' },
        { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
        { css: 'asset-type', label: 'Asset Type', value: AssetType },
        { css: 'completedby', label: 'Completed By', value: InprogressBy }
    ]

    var popupContent = searchDataToPopUp(data);
    layer.bindPopup(popupContent, { minWidth: 200 });
}

function imageCreate(image, layer) {
    var ImageDesc = image.properties.description;
    var imageID = image.properties.pk;
    var coords = image.geometry.coordinates;

    var popupContent = '<dl class="row"><dt class="image-label col-sm-2">Image</dt><dd class="image-name col-sm-10">' + ImageDesc + '</dd>';

    popupContent += '<dt class="image-lat-label col-sm-2">Lat</dt><dd class="image-lat-val col-sm-10">' + deg_to_dm(coords[1], true) + '</dd>';
    popupContent += '<dt class="image-lng-label col-sm-2">Long</dt><dd class="image-lng-val col-sm-10">' + deg_to_dm(coords[0]) + '</dd></dl>';

    popupContent += '<div style="width: 128px"><a href="/mission/' + mission_id + '/image/' + imageID + '/full/"><img src="/mission/' + mission_id + '/image/' + imageID + '/thumbnail/" /></a></div>';

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        if (image.properties.priority) {
            popupContent += '<dev class="btn-group"><button class="btn btn-light" onClick="$.get(\'/mission/' + mission_id + '/image/' + imageID + '/priority/unset/\');">Deprioritize</button>';
        } else {
            popupContent += '<dev class="btn-group"><button class="btn btn-light" onClick="$.get(\'/mission/' + mission_id + '/image/' + imageID + '/priority/set/\');">Prioritize</button>';
        }
    }
    popupContent += '</div>'
    layer.bindPopup(popupContent);
}

function tdvCreate(tdv, layer) {
    var tdvID = tdv.properties.pk;

    var popupContent = '<dl class="row"><dt class="image-label col-sm-2">Total Drift Vector</dt><dd class="image-name col-sm-10">' + tdvID + '</dd>'

    if (mission_id !== 'current' && mission_id !== 'all')
    {
        popupContent += '<div class="btn-group">'
        popupContent += '<button class="btn btn-danger" onClick="$.get(\'/mission/' + mission_id + '/sar/marine/vectors/' + tdvID + '/delete/\')">Delete</button>'
        popupContent += '</div>'
    }

    layer.bindPopup(popupContent);
}

// eslint-disable-next-line no-unused-vars
function mapInit() {
    var mapEl = document.createElement('div')
    mapEl.setAttribute('style','width:100%;height:100%;position:inherit;')
    document.body.appendChild(mapEl)

    var map = L.map(mapEl);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

    myMap = map;

    layerControl = L.control.layers({}, {});
    layerControl.addTo(map);

    map.setView(new LatLng(0, 0), 16);

    map.locate({ setView: true, maxZoom: 16 });

    if (mission_id !== 'current' && mission_id !== 'all') {
        L.control.poiadder({}).addTo(map);
        L.control.polygonadder({}).addTo(map);
        L.control.lineadder({}).addTo(map);
        L.control.locate({
            setView: 'untilPan',
            keepCurrentZoomLevel: true,
            locateOptions: { enableHighAccuracy: true},
        }).addTo(map);
        L.control.imageuploader({}).addTo(map);
    }
    L.control.smmadmin({}).addTo(map);

    var assetUpdateFreq = 3 * 1000;
    var assetTrackUpdateFreq = 30 * 1000;
    var userDataUpdateFreq = 10 * 1000;
    var searchIncompleteUpdateFreq = 30 * 1000;
    var searchCompleteUpdateFreq = 60 * 1000;
    var imageAllUpdateFreq = 60 * 1000;
    var marineDataUpdateFreq = 60 * 1000;

    var realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/assets/positions/latest/",
            type: 'json',
        }, {
            interval: assetUpdateFreq,
            onEachFeature: assetCreate,
            updateFeature: assetUpdate,
            getFeatureId: function(feature) { return feature.properties.asset; }
        }).addTo(map);

    overlayAdd("Assets", realtime);

    realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/pois/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: poiCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("POIs", realtime);

    realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/userpolygons/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: userPolygonCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Polygons", realtime);

    realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/userlines/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: userLineCreate,
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(map);

    overlayAdd("Lines", realtime);

    realtime = L.realtime({
        url: '/mission/' + mission_id + '/search/incomplete/',
        type: 'json',
    }, {
        interval: searchIncompleteUpdateFreq,
        color: 'orange',
        onEachFeature: searchIncompleteCreate,
        getFeatureId: function(feature) { return feature.properties.pk; }
    }).addTo(map);
    overlayAdd("Incomplete Searches", realtime);

    realtime = L.realtime({
        url: "/mission/" + mission_id + "/search/completed/",
        type: 'json',
    }, {
        interval: searchCompleteUpdateFreq,
        onEachFeature: searchCompletedCreate,
        getFeatureId: function(feature) { return feature.properties.pk; }
    });
    overlayAdd("Completed Searches", realtime);

    realtime = L.realtime({
             url: "/mission/" + mission_id + "/image/list/all/",
             type: 'json',
         }, {
             interval: imageAllUpdateFreq,
             onEachFeature: imageCreate,
             getFeatureId: function(feature) { return feature.properties.pk; }
         });

     overlayAdd("Images (all)", realtime);
    
    realtime = L.realtime({
            url: "/mission/" + mission_id + "/image/list/important/",
            type: 'json',
        }, {
            interval: imageAllUpdateFreq,
            onEachFeature: imageCreate,
            getFeatureId: function(feature) { return feature.properties.pk; },
            pointToLayer: function(feature, latlng) {
              return L.marker(latlng, {'icon': L.icon({
                  iconUrl: '/static/icons/image-x-generic.png',
                  iconSize: [24, 24],
              })});
            },
        }).addTo(map);

    overlayAdd("Images (prioritized)", realtime);

    realtime = L.realtime({
        url: "/mission/" + mission_id + "/sar/marine/vectors/current/",
        type: 'json',
    }, {
        color: 'black',
        interval: marineDataUpdateFreq,
        onEachFeature: tdvCreate,
        getFeatureId: function(feature) { return feature.properties.pk; },
    }).addTo(map);

    overlayAdd("Marine - Total Drift Vectors", realtime);
}

mapInit();