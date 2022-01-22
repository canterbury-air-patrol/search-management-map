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
import './MarineVectors/MarineVectors.js';

import { deg_to_dm } from './deg_conv';

class smm_map {
    constructor(map_elem) {
        this.map = L.map(map_elem);
        this.layerControl = L.control.layers({}, {});
        this.assetLines = {};
        this.setupMap();
    };

    setupMap() {
        let self = this;
        $.get('/map/tile/layers/', function(data) {
            let base_selected = false;
            let base_layers = {};
            let extra_layers = {};
            for (let d in data.layers) {
                let layer = data.layers[d];
                let options = {
                    'attributes': layer['atrributes'],
                    'minZoom': layer['minZoom'],
                    'maxZoom': layer['maxZoom'],
                }
                if (layer['subdomains'] != '') {
                    options['subdomains'] = layer['subdomains']
                }
                let tile_layer = L.tileLayer(layer.url, options);
                if (layer.base) {
                    if (!base_selected) {
                        tile_layer.addTo(self.map);
                    }
                    base_layers[layer.name] = tile_layer;
                } else {
                    extra_layers[layer.name] = tile_layer;
                }
            }
            L.control.layers(base_layers, extra_layers).addTo(self.map);
        });

        this.layerControl.addTo(this.map);

        this.map.setView(new LatLng(0, 0), 16);

        this.map.locate({ setView: true, maxZoom: 16 });

        if (mission_id !== 'current' && mission_id !== 'all') {
            L.control.poiadder({}).addTo(this.map);
            L.control.polygonadder({}).addTo(this.map);
            L.control.lineadder({}).addTo(this.map);
            L.control.locate({
                setView: 'untilPan',
                keepCurrentZoomLevel: true,
                locateOptions: { enableHighAccuracy: true},
            }).addTo(this.map);
            L.control.imageuploader({}).addTo(this.map);
        }
        L.control.smmadmin({}).addTo(this.map);

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
            onEachFeature: function(asset) { self.assetCreate(asset) },
            updateFeature: function(asset) { self.assetUpdate(asset) },
            getFeatureId: function(feature) { return feature.properties.asset; }
        }).addTo(this.map);

        this.overlayAdd("Assets", realtime);

        realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/pois/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: function(poi, layer) { self.poiCreate(poi, layer) },
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(this.map);

        this.overlayAdd("POIs", realtime);

        realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/userpolygons/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: function(polygon, layer) { self.userPolygonCreate(polygon, layer) },
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(this.map);

        this.overlayAdd("Polygons", realtime);

        realtime = L.realtime({
            url: "/mission/" + mission_id + "/data/userlines/current/",
            type: 'json',
        }, {
            interval: userDataUpdateFreq,
            onEachFeature: function(line, layer) { self.userLineCreate(line, layer) },
            getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(this.map);

        this.overlayAdd("Lines", realtime);

        realtime = L.realtime({
        url: '/mission/' + mission_id + '/search/incomplete/',
        type: 'json',
        }, {
        interval: searchIncompleteUpdateFreq,
        color: 'orange',
        onEachFeature: function(search, layer) { self.searchIncompleteCreate(search, layer) },
        getFeatureId: function(feature) { return feature.properties.pk; }
        }).addTo(this.map);
        this.overlayAdd("Incomplete Searches", realtime);

        realtime = L.realtime({
        url: "/mission/" + mission_id + "/search/completed/",
        type: 'json',
        }, {
        interval: searchCompleteUpdateFreq,
        onEachFeature: function(search, layer) { self.searchCompletedCreate(search, layer) },
        getFeatureId: function(feature) { return feature.properties.pk; }
        });
        this.overlayAdd("Completed Searches", realtime);

        realtime = L.realtime({
                url: "/mission/" + mission_id + "/image/list/all/",
                type: 'json',
            }, {
                interval: imageAllUpdateFreq,
                onEachFeature: function(image, layer) { self.imageCreate(image, layer) },
                    getFeatureId: function(feature) { return feature.properties.pk; }
                });

        this.overlayAdd("Images (all)", realtime);

        realtime = L.realtime({
                url: "/mission/" + mission_id + "/image/list/important/",
                type: 'json',
            }, {
                interval: imageAllUpdateFreq,
                onEachFeature: function(image, layer) { self.imageCreate(image, layer) },
                getFeatureId: function(feature) { return feature.properties.pk; },
                pointToLayer: function(feature, latlng) {
                    return L.marker(latlng, {'icon': L.icon({
                        iconUrl: '/static/icons/image-x-generic.png',
                        iconSize: [24, 24],
                    })});
                },
            }).addTo(this.map);

        this.overlayAdd("Images (prioritized)", realtime);

        realtime = L.realtime({
            url: "/mission/" + mission_id + "/sar/marine/vectors/current/",
            type: 'json',
        }, {
            color: 'black',
            interval: marineDataUpdateFreq,
            onEachFeature: function(tdv, layer) { self.tdvCreate(tdv, layer) },
            getFeatureId: function(feature) { return feature.properties.pk; },
        }).addTo(this.map);

        this.overlayAdd("Marine - Total Drift Vectors", realtime);
    };

    overlayAdd(name, layer) {
        this.layerControl.addOverlay(layer, name);
    };

    assetPathUpdate(name)
    {
        if (!(name in this.assetLines)) {
            var track = L.polyline([], {color: 'red'});
            this.assetLines[name] = {track: track, updating: false, lastUpdate: null, path: []};
            this.overlayAdd(name, track);
        }
        var assetLine = this.assetLines[name]
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
    };

    assetUpdate(asset, oldLayer) {
        let assetName = asset.properties.asset;
        this.assetPathUpdate(assetName);

        if (!oldLayer) {return; }

        let coords = asset.geometry.coordinates;

        let popupContent = document.createElement('div');
        let data = [
            ['Asset', assetName],
            ['Lat', deg_to_dm(coords[1], true)],
            ['Long', deg_to_dm(coords[0])],
        ];

        let alt = asset.properties.alt;
        let heading = asset.properties.heading;
        let fix = asset.properties.fix;

        if (alt)
        {
            data.append(['Altitude', alt]);
        }
        if (heading)
        {
            data.append(['Heading', heading]);
        }
        if (fix)
        {
            data.append(['Fix', fix]);
        }

        for (let d in data)
        {
            popupContent.appendChild(document.createElement('<dl class="row"><dt class="asset-label col-sm-3">' + d[0] + '</dt><dd class="asset-name col-sm-9">' + d[1] + '</dd>'));
        }

        oldLayer.bindPopup(popupContent, { minWidth: 200});

        if (asset.geometry.type === 'Point') {
            let c = asset.geometry.coordinates;
            oldLayer.setLatLng([c[1], c[0]]);
            return oldLayer;
        }
    };

    assetCreate(asset) {
        var assetName = asset.properties.asset;

        if(!(assetName in this.assetLines))
        {
            /* Create an overlay for this object */
            var track = L.polyline([], {color: 'red'});
            this.assetLines[assetName] = {track: track, updating: false};
            this.overlayAdd(assetName, track);
        }
    };

    createButtonGroup(data)
    {
        let btngroup = document.createElement('div');
        btngroup.className = "btn-group";

        for (let d in data)
        {
            let btn_data = data[d];
            let btn = document.createElement('button');
            btn.className = "btn " + btn_data['btn-class'];
            btn.onclick = btn_data['onclick'];
            btn.textContent = btn_data['label'];
            btngroup.appendChild(btn);
        }

        return btngroup;
    }

    poiCreate(poi, layer) {
        let POILabel = poi.properties.label;
        let poiID = poi.properties.pk;
        let coords = poi.geometry.coordinates;

        let popupContent = document.createElement('div');

        let data = [
            ['POI', POILabel],
            ['Lat', deg_to_dm(coords[1], true)],
            ['Long', deg_to_dm(coords[0])],
        ];

        for (let d in data)
        {
            let dl = document.createElement('dl');
            dl.className="poi row";

            let dt = document.createElement('dt');
            dt.className="asset-label col-sm-2";
            dt.textContent = data[d][0];
            dl.appendChild(dt);
            let dd = document.createElement('dd');
            dd.className = 'asset-name col-sm-10';
            dd.textContent = data[d][1];
            dl.appendChild(dd);

            popupContent.appendChild(dl);
        }

        if (mission_id !== 'current' && mission_id !== 'all')
        {
            var self = this;

            popupContent.appendChild(this.createButtonGroup([
                {
                    'label': 'Move',
                    'onclick': function() { L.POIAdder(self.map, L.latLng(coords[1], coords[0]), poiID, POILabel); },
                    'btn-class': 'btn-light'
                },
                {
                    'label': 'Delete',
                    'onclick': function() { $.get('/mission/' + mission_id + '/data/pois/' + poiID + '/delete/'); },
                    'btn-class': 'btn-danger'
                },
                {
                    'label': 'Create Search',
                    'onclick': function() { L.SearchAdder(self.map, 'point', poiID); },
                    'btn-class': 'btn-light'
                },
                {
                    'label': 'Calculate TDV',
                    'onclick': function() { L.MarineVectors(self.map, POILabel, L.latLng(coords[1], coords[0]), poiID); },
                    'btn-class': 'btn-light',
                }
            ]));
        }

        layer.bindPopup(popupContent);
    };


    userPolygonCreate(poly, layer) {
        let PolyLabel = poly.properties.label;
        let PolyID = poly.properties.pk;
        let coords = poly.geometry.coordinates;

        let popupContent = document.createElement('div');

        let dl = document.createElement('dl');
        dl.className = 'polygon row';
        popupContent.appendChild(dl);

        let dt = document.createElement('dt');
        dt.className = 'polygon-label col-sm-3';
        dt.textContent = 'Polygon';
        dl.appendChild(dt);
        let dd = document.createElement('dd');
        dd.className = 'polygon-name col-sm-9';
        dd.textContent = PolyLabel;
        dl.appendChild(dd);

        if (mission_id !== 'current' && mission_id !== 'all')
        {
            let self = this;
            popupContent.appendChild(this.createButtonGroup([
                {
                    'label': 'Edit',
                    'onclick': function() {
                        let points = [];
                        for (let i = 0; i < (coords[0].length - 1); i++)
                        {
                            points.push(L.latLng(coords[0][i][1], coords[0][i][0]));
                        }
                        L.PolygonAdder(self.map, points, PolyID, PolyLabel).create() },
                    'btn-class': 'btn-light',
                },
                {
                    'label': 'Delete',
                    'onclick': function() { $.get('/mission/' + mission_id + '/data/userpolygons/' + PolyID + '/delete/'); },
                    'btn-class': 'btn-danger',
                },
                {
                    'label': 'Create Search',
                    'onclick': function() { L.SearchAdder(self.map, 'polygon', PolyID); },
                    'btn-class': 'btn-light'
                }
            ]));
        }
        layer.bindPopup(popupContent, { minWidth: 200 });
    };

    userLineCreate(line, layer) {
        var LineLabel = line.properties.label;
        var LineID = line.properties.pk;
        var coords = line.geometry.coordinates;

        var popupContent = document.createElement('div');
        let dl = document.createElement('dl');
        dl.className = 'line row';
        let dt = document.createElement('dt');
        dt.className = 'line-label col-sm-3';
        dt.textContent = 'Line';
        dl.appendChild(dt);
        let dd = document.createElement('dd');
        dd.className = 'line-name col-sm-9';
        dd.textContent = LineLabel;
        dl.appendChild(dd);
        popupContent.appendChild(dl);


        if (mission_id !== 'current' && mission_id !== 'all')
        {
            let self = this;
            popupContent.appendChild(this.createButtonGroup([
                {
                    'label': 'Edit',
                    'onclick': function() { L.LineAdder(self.map, coords.map(x => L.latLng(x[1], x[0]) ), LineID, LineLabel); },
                    'btn-class': 'btn-light',
                },
                {
                    'label': 'Delete',
                    'onclick': function() { $.get('/mission/' + mission_id + '/data/userlines/' + LineID + '/delete/'); },
                    'btn-class': 'btn-danger',
                },
                {
                    'label': 'Create Search',
                    'onclick': function() { L.SearchAdder(self.map, 'line', LineID); },
                    'btn-class': 'btn-light',
                }
            ]));
        }

        layer.bindPopup(popupContent, { minWidth: 200 });
    };

    searchQueueDialog(searchID, assetType) {
        var contents = [
            "<div>Queue for <select id='queue_" + searchID + "_select_type'><option value='type'>Asset Type</option><option value='asset'>Specific Asset</option></select></div>",
            "<div><select id='queue_" + searchID + "_select_asset'></select></div>",
            "<div><button class='btn btn-light' id='queue_" + searchID + "_queue'>Queue</button></div>",
            "<div><button class='btn btn-danger' id='queue_" + searchID + "_cancel'>Cancel</button>",
        ].join('');
        var QueueDialog = new L.control.dialog({'initOpen': true}).setContent(contents).addTo(this.map).hideClose();
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
        $("#queue_" + searchID + "_select_type").on('change', function() {
            if ($("#queue_" + searchID + "_select_type").val() == "type")
            {
                $("#queue_" + searchID + "_select_asset").hide();
            }
            else
            {
                $("#queue_" + searchID + "_select_asset").show();
            }
        });
        $("#queue_" + searchID + "_queue").on('click', function() {
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
        $("#queue_" + searchID + "_cancel").on('click', function() {QueueDialog.destroy()});
    }

    searchDataToPopUp(data) {
        let dl = document.createElement('dl');
        dl.className = 'search-data row';

        for (var d in data) {
            let dt = document.createElement('dt');
            dt.className = 'search-' + data[d].css + '-label col-sm-6';
            dt.textContent = data[d].label;
            dl.appendChild(dt);
            let dd = document.createElement('dd');
            dd.className = 'search-' + data[d].css + '-value col-sm-6';
            dd.textContent = data[d].value;
            dl.appendChild(dd);
        }

        return dl;
    };

    searchStatusIncomplete(search) {
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
    };

    searchIncompleteCreate(search, layer) {
        let SearchID = search.properties.pk;
        let SweepWidth = search.properties.sweep_width;
        let AssetType = search.properties.created_for;
        let InprogressBy = search.properties.inprogress_by;
        let SearchType = search.properties.search_type;
        let QueuedAt = search.properties.queued_at;

        let data = [
            { css: 'type', label: 'Search Type', value: SearchType },
            { css: 'status', label: 'Status', value: this.searchStatusIncomplete(search) },
            { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
            { css: 'asset-type', label: 'Asset Type', value: AssetType }
        ]
        if (InprogressBy) {
            data.push({ css: 'inprogress', label: 'Inprogress By', value: InprogressBy })
        }

        var popupContent = document.createElement('div');
        popupContent.appendChild(this.searchDataToPopUp(data));

        if (mission_id !== 'current' && mission_id !== 'all')
        {
            let button_data = [];
            let self = this;
            if (!InprogressBy)
            {
                button_data.push({
                    'label': 'Delete',
                    'onclick': function() { $.get('/mission/' + mission_id + '/search/' + SearchID + '/delete/'); },
                    'btn-class': 'btn-danger',
                });
                if (!QueuedAt)
                {
                    button_data.push({
                        'label': 'Queue',
                        'onclick': function() { self.searchQueueDialog(SearchID, AssetType); },
                        'btn-class': 'btn-light',
                    });
                }
            }
            popupContent.appendChild(this.createButtonGroup(button_data));
        }
        layer.bindPopup(popupContent, { minWidth: 200 });
    };

    searchCompletedCreate(search, layer) {
        let SearchID = search.properties.pk;
        let SweepWidth = search.properties.sweep_width;
        let AssetType = search.properties.created_for;
        let InprogressBy = search.properties.inprogress_by;
        let SearchType = search.properties.search_type;

        let data = [
            { css: 'type', label: 'Search Type', value: SearchType },
            { css: 'status', label: 'Status', value: 'Completed' },
            { css: 'sweep-width', label: 'Sweep Width', value: SweepWidth + 'm' },
            { css: 'asset-type', label: 'Asset Type', value: AssetType },
            { css: 'completedby', label: 'Completed By', value: InprogressBy }
        ]

        let popupContent = this.searchDataToPopUp(data);
        layer.bindPopup(popupContent, { minWidth: 200 });
    };

    imageCreate(image, layer) {
        let ImageDesc = image.properties.description;
        let imageID = image.properties.pk;
        let coords = image.geometry.coordinates;

        let popupContent = document.createElement('div');

        let dl = document.createElement('dl');
        dl.className = 'row';
        popupContent.appendChild(dl);

        let data = [
            ['Image', ImageDesc],
            ['Lat', deg_to_dm(coords[1], true)],
            ['Long', deg_to_dm(coords[0])],
        ];

        for (let d in data)
        {
            let dt = document.createElement('dt');
            dt.className="image-label col-sm-2";
            dt.textContent = data[d][0];
            dl.appendChild(dt);
            let dd = document.createElement('dd');
            dd.className = 'image-name col-sm-10';
            dd.textContent = data[d][1];
            dl.appendChild(dd);
        }

        let div = document.createElement('div');
        div.style = 'width: 128px';
        popupContent.appendChild(div);
        let a = document.createElement('a');
        a.href = '/mission/' + mission_id + '/image/' + imageID + '/full/';
        div.appendChild(a);
        let img = document.createElement('img');
        img.src = '/mission/' + mission_id + '/image/' + imageID + '/thumbnail/';
        a.appendChild(img);

        if (mission_id !== 'current' && mission_id !== 'all')
        {
            if (image.properties.priority) {
                popupContent.appendChild(this.createButtonGroup([
                {
                    'label': 'Deprioritize',
                    'onclick': function() { $.get('/mission/' + mission_id + '/image/' + imageID + '/priority/unset/') },
                    'btn-class': 'btn-light',
                }
                ]));
            } else {
                popupContent.appendChild(this.createButtonGroup([
                    {
                        'label': 'Prioritize',
                        'onclick': function() { $.get('/mission/' + mission_id + '/image/' + imageID + '/priority/set/') },
                        'btn-class': 'btn-light',
                    }
                ]));
            }
        }
        layer.bindPopup(popupContent);
    };

    tdvCreate(tdv, layer) {
        let tdvID = tdv.properties.pk;

        let popupContent = document.createElement('div');
        let dl = document.createElement('dl');
        dl.className = 'row';
        popupContent.appendChild(dl);

        let dt = document.createElement('dt');
        dt.className = 'image-label col-sm-2';
        dt.textContent = 'Total Drift Vector';
        dl.appendChild(dt);

        let dd = document.createElement('dd');
        dd.className = 'image-name col-sm-10';
        dd.textContent = tdvID;
        dl.appendChild(dd);

        if (mission_id !== 'current' && mission_id !== 'all')
        {
            popupContent.appendChild(this.createButtonGroup([
                {
                    'label': 'Delete',
                    'onclick': function() { $.get('/mission/' + mission_id + '/sar/marine/vectors/' + tdvID + '/delete/'); },
                    'btn-class': 'btn-danger',
                }
            ]));
        }

        layer.bindPopup(popupContent);
    };
};

function mapInit() {
    var mapEl = document.createElement('div')
    mapEl.setAttribute('style','width:100%;height:100%;position:inherit;')
    document.body.appendChild(mapEl)

    let smm_map_object = new smm_map(mapEl);

    return smm_map_object;
}

mapInit();