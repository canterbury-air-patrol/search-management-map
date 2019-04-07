L.SearchAdder = function(map, objectType, objectID) {
    var RAND_NUM = Math.floor(Math.random() * 16536);
    var searchSelection = "<select class='form-control' id='SearchAdder-search-type-" + RAND_NUM + "'>";
    switch(objectType) {
        case 'point':
        searchSelection += "<option value='sector'>Sector</option>";
        searchSelection += "<option value='expanding-box'>Expanding Box</option>";
        break;
    case 'line':
        searchSelection += "<option value='track-line'>Track Line</option>";
        searchSelection += "<option value='creeping-line'>Creeping Line Ahead</option>";
        break;
    case 'polygon':
        searchSelection += "<option value='creeping-line'>Creeping Line Ahead</option>";
        break;
    }
    searchSelection += "</select>";
    var assetSelection = "<select class='form-control' id='SearchAdder-asset-type-" + RAND_NUM +  "'>";
    assetSelection += "</select>";
    $.get('/assets/assettypes/json/', function(data) {
        $.each(data, function(index, json){
            for(var at in json) {
                $("#SearchAdder-asset-type-" + RAND_NUM).append("<option value='" + json[at].id + "'>" + json[at].name + "</option>");
            }
        })
    })
    var contents = [
        "<div class='form-group form-inline'><label for='SearchAdder-search-type-" + RAND_NUM + "'>Search Type:</label>" + searchSelection + "</div>",
        "<div class='form-group form-inline'><label for='SearchAdder-asset-type-" + RAND_NUM + "'>Asset Type:</label>" + assetSelection + "</div>",
        "<div class='form-group form-inline' id='SearchAdder-sw-"+ RAND_NUM +"'><label for='SearchAdder-sweep-width-" + RAND_NUM + "'>Sweep Width:</label><input class='form-control form-control-sm' type='number' id='SearchAdder-sweep-width-"+ RAND_NUM +"' size='4' /></div>",
        "<div class='form-group form-inline' id='SearchAdder-i-" + RAND_NUM + "'><label for='SearchAdder-iterations-" + RAND_NUM + "'>Iterations:</label><input class='form-control form-control-sm' type='number' id='SearchAdder-iterations-"+ RAND_NUM +"' size='3' /></div>",
        "<div class='form-group form-inline' id='SearchAdder-fb-" + RAND_NUM + "'><label for='SearchAdder-first-bearing-" + RAND_NUM + "'>First Bearing:</label><input class='form-control form-control-sm' type='number' id='SearchAdder-first-bearing-"+ RAND_NUM +"' min='0' max='359' value='0' size='3'/></div>",
        "<div class='form-group form-inline' id='SearchAdder-w-" + RAND_NUM + "'><label for='SearchAdder-width-" + RAND_NUM + "'>Width (across track): </label><input class='form-control form-control-sm' type='number' id='SearchAdder-width-"+ RAND_NUM +"' min='0' size='4' /></div>",
        "<button class='btn btn-default' id='SearchAdder-preview-" + RAND_NUM + "'>Preview</button>",
        "<button class='btn btn-default' id='SearchAdder-create-" + RAND_NUM + "'>Create</button>",
        "<button class='btn btn-danger' id='SearchAdder-cancel-" + RAND_NUM + "'>Cancel</button>",
    ].join('');

    var dialog = new L.control.dialog({}).setContent(contents).addTo(map);

    var changeSearchType = function() {
        var selectedType = $("#SearchAdder-search-type-" + RAND_NUM).val();
        if (selectedType === 'expanding-box') {
            $("#SearchAdder-i-" + RAND_NUM).show();
            $("#SearchAdder-fb-" + RAND_NUM).show();
        } else {
            $("#SearchAdder-i-" + RAND_NUM).hide();
            $("#SearchAdder-fb-" + RAND_NUM).hide();
        }
        if (selectedType === 'creeping-line' && objectType == 'line') {
            $("#SearchAdder-w-" + RAND_NUM).show();
        } else {
            $("#SearchAdder-w-" + RAND_NUM).hide();
        }
    }

    changeSearchType();

    $("#SearchAdder-search-type-" + RAND_NUM).on('change', changeSearchType);

    var getUrl = function() {
        var selectedType = $("#SearchAdder-search-type-" + RAND_NUM).val();
        switch(selectedType) {
            case 'sector':
                return '/search/sector/create/';
            case 'expanding-box':
                return '/search/expandingbox/create/';
            case 'track-line':
                return '/search/trackline/create/';
            case 'creeping-line':
                return (objectType == 'line') ? '/search/creepingline/create/track/' : '/search/creepingline/create/';
            default:
                console.log('search type not supported')
        }
    }

    var getData = function(includeCSRF) {
        var data = [
            {name: 'sweep_width', value: $("#SearchAdder-sweep-width-" + RAND_NUM).val()},
            {name: 'asset_type_id', value: $("#SearchAdder-asset-type-" + RAND_NUM).val()},
            {name: 'iterations', value: $("#SearchAdder-iterations-" + RAND_NUM).val()},
            {name: 'first_bearing', value: $("#SearchAdder-first-bearing-" + RAND_NUM).val()},
            {name: 'width', value: $("#SearchAdder-width-" + RAND_NUM).val()},
        ]
        switch (objectType) {
            case 'point':
                data.push({name: 'poi_id', value: objectID });
                break;
            case 'line':
                data.push({name: 'line_id', value: objectID });
                break;
            case 'polygon':
                data.push({name: 'poly_id', value: objectID });
                break;
        }
        if (includeCSRF) {
            data.push({name: 'csrfmiddlewaretoken', value: csrftoken })
        }
        return data;
    }

    var onMap = null;

    $("#SearchAdder-preview-" + RAND_NUM).on('click', function() {
        $.get(getUrl(), getData(), function(data) {
            if (onMap !== null) {
                onMap.remove();
            }
            onMap = L.geoJSON(data, {color: 'yellow'});
            onMap.addTo(map);
        });
    });

    $("#SearchAdder-create-" + RAND_NUM).on('click', function() {
        if (onMap !== null) {
            onMap.remove();
        }
        $.post(getUrl(), getData(true));
        dialog.destroy();
    });

    $("#SearchAdder-cancel-" + RAND_NUM).on('click', function() {
        if (onMap !== null) {
            onMap.remove();
        }
        dialog.destroy();
    });
}