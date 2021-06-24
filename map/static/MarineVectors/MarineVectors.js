var time_fractions = function(human_time) {
    var minutes = human_time % 100;
    var hours = (human_time - minutes) / 100;
    hours += minutes / 60;
    return hours;
};

class MarineVectorsCurrent {
    constructor(idx, time_from, time_to, current_direction, current_speed)
    {
        this.idx = idx
        this.time_from = time_from
        this.time_to = time_to
        this.current_direction = current_direction
        this.current_speed = current_speed
    }
    getTimeInterval()
    {
        var start_time = time_fractions(this.time_from)
        var end_time = time_fractions(this.time_to)
        return end_time - start_time
    }
    getCurrentVectorDirection()
    {
        return this.current_direction
    }
    getCurrentVectorDistance()
    {
        return this.getTimeInterval() * this.current_speed
    }
    updateTimeFrom(new_time)
    {
        this.time_from = new_time
    }
    updateTimeTo(new_time)
    {
        this.time_to = new_time
    }
    updateCurrentDirection(new_direction)
    {
        this.current_direction = new_direction
    }
    updateCurrentSpeed(new_speed)
    {
        this.current_speed = new_speed
    }
}

class MarineVectorsWind {
    constructor(idx, time_from, time_to, wind_direction, wind_speed, leeway_data)
    {
        this.idx = idx
        this.time_from = time_from
        this.time_to = time_to
        this.wind_direction_from = parseInt(wind_direction)
        this.wind_speed = wind_speed
        this.leeway_data = leeway_data
    }
    updateLeewayData(leeway_data)
    {
        this.leeway_data = leeway_data
    }
    getWindDirectionTo()
    {
        return (this.wind_direction_from + 180) % 360;
    }
    updateWindDirectFrom(new_direction)
    {
        this.wind_direction_from = parseInt(new_direction)
    }
    updateWindSpeed(new_speed)
    {
        this.wind_speed = parseInt(new_speed)
    }
    getLeewayRate()
    {
        return (this.wind_speed * this.leeway_data.multiplier) + this.leeway_data.modifier;
    }
    getTimeInterval()
    {
        var start_time = time_fractions(this.time_from)
        var end_time = time_fractions(this.time_to)
        return end_time - start_time
    }
    getWindVectorDirection()
    {
        return this.getWindDirectionTo()
    }
    getWindVectorDistance()
    {
        return this.getTimeInterval() * this.getLeewayRate()
    }
}

marinesar_vectors_input_rows = [
    {
        'display_name': 'Subject',
        'form_field': 'subject',
        'input_type': 'text',
    },
    {
        'display_name': 'Reference Position (name)',
        'form_field': 'LKP',
        'input_type': 'text',
    },
    {
        'display_name': 'Latitude',
        'form_field': 'LKP_lat',
        'input_type': 'text',
    },
    {
        'display_name': 'Longitude',
        'form_field': 'LKP_lng',
        'input_type': 'text',
    },
    {
        'display_name': 'Target Description',
        'form_field': 'target_description',
        'input_type': 'text',
    },
]

search_object_leeway = [
    {
        'description': 'PIW - Unknown',
        'multiplier': 0.011,
        'modifier': 0.07,
        'divergence': 30,
    },
    {
        'description': 'PIW - Vertical',
        'multiplier': 0.014,
        'modifier': 0.07,
        'divergence': 18,
    },
    {
        'description': 'PIW - Sitting',
        'multiplier': 0.012,
        'modifier': 0.00,
        'divergence': 18,
    },
    {
        'description': 'PIW - Horizontal - Survival Suit',
        'multiplier': 0.014,
        'modifier': 0.10,
        'divergence': 30,
    },
    {
        'description': 'PIW - Horizontal - Scuba Suit',
        'multiplier': 0.007,
        'modifier': 0.08,
        'divergence': 30,
    },
    {
        'description': 'PIW - Horizontal - Deceased',
        'multiplier': 0.015,
        'modifier': 0.08,
        'divergence': 30,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - No Ballast - Unknown',
        'multiplier': 0.042,
        'modifier': 0.03,
        'divergence': 28,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - No Ballast - no canopy, no drogue',
        'multiplier': 0.057,
        'modifier': 0.21,
        'divergence': 24,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - No Ballast - no canopy, w/drogue',
        'multiplier': 0.044,
        'modifier': -0.20,
        'divergence': 28,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - No Ballast - canopy, no drogue',
        'multiplier': 0.037,
        'modifier': 0.11,
        'divergence': 24,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - No Ballast - canopy, w/drogue',
        'multiplier': 0.030,
        'modifier': 0.00,
        'divergence': 28,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - Shallow Ballast and Canopy - Unknown',
        'multiplier': 0.029,
        'modifier': 0.00,
        'divergence': 22,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - Shallow Ballast and Canopy - no drogue',
        'multiplier': 0.032,
        'modifier': -0.02,
        'divergence': 22,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - Shallow Ballast and Canopy - w/drogue',
        'multiplier': 0.025,
        'modifier': 0.01,
        'divergence': 22,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - Shallow Ballast and Canopy - capsized',
        'multiplier': 0.017,
        'modifier': -0.10,
        'divergence': 8,
    },
    {
        'description': 'Survival Craft - Maritime Life Raft - Deep Ballast and Canopies',
        'multiplier': 0.030,
        'modifier': 0.02,
        'divergence': 13,
    },
    {
        'description': 'Survival Craft - Other Maritime Survival Craft - life capsule',
        'multiplier': 0.038,
        'modifier': -0.08,
        'divergence': 22,
    },
    {
        'description': 'Survival Craft - Other Maritime Survival Craft - USCG Sea Rescue Kit',
        'multiplier': 0.025,
        'modifier': -0.04,
        'divergence': 7,
    },
    {
        'description': 'Survival Craft - Aviation Life Rafts - no ballast, w/canopy Evac/Slide - 4-6 person no drogue',
        'multiplier': 0.037,
        'modifier': 0.11,
        'divergence': 24,
    },
    {
        'description': 'Survival Craft - Aviation Life Rafts - no ballast, w/canopy Evac/Slide - 46-person',
        'multiplier': 0.028,
        'modifier': -0.01,
        'divergence': 15,
    },
    {
        'description': 'Person Powered Craft - Sea Kayak - w/person on aft deck',
        'multiplier': 0.011,
        'modifier': 0.24,
        'divergence': 15,
    },
    {
        'description': 'Person Powered Craft - Surf Board - w/person',
        'multiplier': 0.020,
        'modifier': 0.00,
        'divergence': 15,
    },
    {
        'description': 'Person Powered Craft - Wind Surfer - w/person and mast/sail in water',
        'multiplier': 0.023,
        'modifier': 0.10,
        'divergence': 12,
    },
    {
        'description': 'Sailing Vessel - Mono-hull - Full Keel - Deep Draft',
        'multiplier': 0.030,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Sailing Vessel - Mono-hull - Full Keel - Shoal Draft',
        'multiplier': 0.040,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Power Vessel - Skiffs - Flat Bottom - Boston Whaler',
        'multiplier': 0.034,
        'modifier': 0.04,
        'divergence': 22,
    },
    {
        'description': 'Power Vessel - Skiffs - V-hull - std. Configuraton',
        'multiplier': 0.030,
        'modifier': 0.08,
        'divergence': 15,
    },
    {
        'description': 'Power Vessel - Skiffs - V-hull - Swamped',
        'multiplier': 0.017,
        'modifier': 0.00,
        'divergence': 15,
    },
    {
        'description': 'Power Vessel - Sports Boat - Cuddy Cabin - Modified V-hull',
        'multiplier': 0.069,
        'modifier': -0.08,
        'divergence': 19,
    },
    {
        'description': 'Power Vessel - Sports Fisher - Center Console - Open cockpit',
        'multiplier': 0.060,
        'modifier': -0.09,
        'divergence': 22,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Unknown',
        'multiplier': 0.037,
        'modifier': 0.02,
        'divergence': 48,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Sampans',
        'multiplier': 0.040,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Side-stern Trawler',
        'multiplier': 0.042,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Longliners',
        'multiplier': 0.037,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Junk',
        'multiplier': 0.027,
        'modifier': 0.10,
        'divergence': 48,
    },
    {
        'description': 'Power Vessels - Commercial Fishing Vessels - Gill-netter - w/rear reel',
        'multiplier': 0.040,
        'modifier': 0.01,
        'divergence': 33,
    },
    {
        'description': 'Power Vessels - Coastal Freighter',
        'multiplier': 0.028,
        'modifier': 0.00,
        'divergence': 48,
    },
    {
        'description': 'Boating Debris - F/V Debris',
        'multiplier': 0.020,
        'modifier': 0.00,
        'divergence': 10,
    },
    {
        'description': 'Boating Debris - Bait/wharf box holds a cubic meter of Ice - Unknown',
        'multiplier': 0.013,
        'modifier': 0.27,
        'divergence': 31,
    },
    {
        'description': 'Boating Debris - Bait/wharf box holds a cubic meter of Ice - lightly loaded',
        'multiplier': 0.026,
        'modifier': 0.18,
        'divergence': 15,
    },
    {
        'description': 'Boating Debris - Bait/wharf box holds a cubic meter of Ice - fully loaded',
        'multiplier': 0.016,
        'modifier': 0.16,
        'divergence': 33,
    },
]

class MarineVectors {
    constructor(input_table_id, current_vectors_table_id, wind_vectors_table_id) {
        this.current_vectors = []
        this.wind_vectors = []
        this.leeway_data = {}
        this.input_table_id = input_table_id
        this.current_vectors_table_id = current_vectors_table_id
        this.wind_vectors_table_id = wind_vectors_table_id
    }
    getResultingVector()
    {
        var bearing = 0;
        var distance = 0;
        for (var idx in this.current_vectors)
        {
            var curr_vector = this.current_vectors[idx]
            if (bearing == 0 && distance == 0)
            {
                bearing = curr_vector.getCurrentVectorDirection()
                distance = curr_vector.getCurrentVectorDistance()
            }
            else
            {
                /* do trig to work out the resulting vector */
                var x1 = distance * Math.cos(bearing * Math.PI / 180);
                var y1 = distance * Math.sin(bearing * Math.PI / 180);
                var curr_bearing = curr_vector.getCurrentVectorDirection();
                var curr_distance = curr_vector.getCurrentVectorDistance();
                var x2 = curr_distance * Math.cos(curr_bearing * Math.PI / 180);
                var y2 = curr_distance * Math.sin(curr_bearing * Math.PI / 180);
                var x = x1 + x2;
                var y = y1 + y2;
                distance = Math.sqrt(x * x + y * y);
                bearing = Math.atan(y/x) * 180 / Math.PI;
            }
        }
        for (var idx in this.wind_vectors)
        {
            var wind_vector = this.wind_vectors[idx]
            if (bearing == 0 && distance == 0)
            {
                bearing = wind_vector.getWindVectorDirection()
                distance = wind_vector.getWindVectorDistance()
            }
            else
            {
                /* do trig to work out the resulting vector */
                var x1 = distance * Math.cos(bearing * Math.PI / 180);
                var y1 = distance * Math.sin(bearing * Math.PI / 180);
                var wind_bearing = wind_vector.getWindVectorDirection();
                var wind_distance = wind_vector.getWindVectorDistance();
                var x2 = wind_distance * Math.cos(wind_bearing * Math.PI / 180);
                var y2 = wind_distance * Math.sin(wind_bearing * Math.PI / 180);
                var x = x1 + x2;
                var y = y1 + y2;
                distance = Math.sqrt(x * x + y * y);
                bearing = Math.atan(y/x) * 180 / Math.PI;
            }
        }
        bearing = (bearing + 360) % 360;
        return { 'bearing': bearing, 'distance': distance }
    }
    addCurrentVector()
    {
        let current_vector = new MarineVectorsCurrent(this.current_vectors.length + 1, 0, 0, 0, 0)
        this.current_vectors.push(current_vector)
        return current_vector
    }
    addWindVector()
    {
        let wind_vector = new MarineVectorsWind(this.wind_vectors.length + 1, 0, 0, 0, 0, this.leeway_data)
        this.wind_vectors.push(wind_vector)
        return wind_vector
    }

    populate_input_table()
    {
        for (var idx in marinesar_vectors_input_rows)
        {
            var row = marinesar_vectors_input_rows[idx]

            var html = '<tr>'
            html += '<td>'
            html += '<label for="' + row['form_field'] + '">' + row['display_name'] + ':</label>'
            html += '</td>'
            html += '<td>'
            html += '<input type="' + row['input_type'] + '" id="' + row['form_field'] + '" name="' + row['form_field'] + '" />'
            html += '</td>'
            html += '</tr>'

            $("#" + this.input_table_id).append(html)
        }

        var html = '<tr>'
        html += '<td>'
        html += '<label for="leeway_type">Leeway Type:</label>'
        html += '</td>'
        html += '<td colspan="2">'
        html += '<select id="leeway_type" name="leeway_type" class="selectpicker" data-live-search="true" />'
        html += '</td>'
        html += '</tr>'

        $("#" + this.input_table_id).append(html)
        this.populate_leeway_selector("leeway_type")

        html = '<tr>'
        html += '<th>Multiplier</th>'
        html += '<th>Modifier</th>'
        html += '<th>Diveregence</th>'
        html += '</tr><tr>'
        html += '<td id="leeway_multiplier" />'
        html += '<td id="leeway_modifier" />'
        html += '<td id="leeway_divergence" />'
        html += '</tr>'

        $("#" + this.input_table_id).append(html)

        this.update_leeway_data()
    }

    populate_data_tables()
    {
        var html = '<thead>'
        html += '<th>From:</th>'
        html += '<th>To:</th>'
        html += '<th>Direction (&deg;T)</th>'
        html += '<th>Speed (knots)</th>'
        html += '<th>Time Interval</th>'
        html += '<th>Vector direction (&deg;T)</th>'
        html += '<th>Vector distance (NM)</th>'
        html += '</thead>'

        $("#" + this.current_vectors_table_id).html(html)

        var html = '<thead>'
        html += '<th>From:</th>'
        html += '<th>To:</th>'
        html += '<th>Direction (&deg;T)</th>'
        html += '<th>Speed (knots)</th>'
        html += '<th>Leeway Direction (&deg;T)</th>'
        html += '<th>Leeway Rate (knots)</th>'
        html += '<th>Time Interval</th>'
        html += '<th>Vector direction (&deg;T)</th>'
        html += '<th>Vector distance (NM)</th>'
        html += '</thead>'

        $("#" + this.wind_vectors_table_id).html(html)
    }

    update_leeway_data()
    {
        var leeway_idx = $("#" + this.leeway_selector).val();
        this.leeway_data = search_object_leeway[leeway_idx];
        $("#leeway_multiplier").text(this.leeway_data['multiplier'])
        $("#leeway_modifier").text(this.leeway_data['modifier'])
        $("#leeway_divergence").text(this.leeway_data['divergence'])
        this.recalculate();
    }

    populate_leeway_selector(leeway_selector)
    {
        var vectors = this
        this.leeway_selector = leeway_selector

        for (var idx in search_object_leeway)
        {
            var leeway = search_object_leeway[idx]

            var html = '<option value="' + idx + '">' + leeway['description'] + '</option>';
            $("#" + this.leeway_selector).append(html)
        }

        $("#" + this.leeway_selector).change(function()
        {
            vectors.update_leeway_data()
        })
    }

    recalculate()
    {
        for (var idx in this.current_vectors)
        {
            var curr_vector = this.current_vectors[idx]
            var cvc = curr_vector.idx
            curr_vector.time_from = $("#curr_time_start_" + cvc).val()
            curr_vector.time_to = $("#curr_time_end_" + cvc).val()
            curr_vector.current_direction = $("#curr_direction_" + cvc).val()
            curr_vector.current_speed = $("#curr_speed_" + cvc).val()
            $("#curr_time_interval_" + cvc).text(curr_vector.getTimeInterval())
            $("#curr_vector_degrees_" + cvc).text(curr_vector.getCurrentVectorDirection())
            $("#curr_vector_distance_" + cvc).text(curr_vector.getCurrentVectorDistance())
        }
        for (var idx in this.wind_vectors)
        {
            var wind_vector = this.wind_vectors[idx]
            wind_vector.updateLeewayData(this.leeway_data)
            var wvc = wind_vector.idx
            wind_vector.time_from = $("#wind_time_start_" + wvc).val()
            wind_vector.time_to = $("#wind_time_end_" + wvc).val()
            wind_vector.updateWindDirectFrom($("#wind_from_direction_" + wvc).val())
            wind_vector.updateWindSpeed($("#wind_speed_" + wvc).val())
            $("#wind_leeway_direction_" + wvc).text(wind_vector.getWindDirectionTo())
            $("#wind_leeway_rate_" + wvc).text(wind_vector.getLeewayRate())
            $("#wind_time_interval_" + wvc).text(wind_vector.getTimeInterval())
            $("#wind_vector_degrees_" + wvc).text(wind_vector.getWindVectorDirection())
            $("#wind_vector_distance_" + wvc).text(wind_vector.getWindVectorDistance())
        }
        var results = this.getResultingVector()
        $("#tdv_result_direction").text(Math.round(results['bearing']))
        $("#tdv_result_distance").text(results['distance'].toFixed(2))
    }

    newCurrentVector()
    {
        var curr_vector = this.addCurrentVector()
        var cvc = curr_vector.idx
        $('#' + this.current_vectors_table_id).append('<tr>' +
            '<td><input type="number" minlength="4" maxlength="4" id="curr_time_start_' + cvc + '" name="curr_time_start_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="4" maxlength="4" id="curr_time_end_' + cvc + '" name="curr_time_end_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="3" maxlength="3" max="360" id="curr_direction_' + cvc + '" name="curr_direction_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="1" maxlength="3" id="curr_speed_' + cvc + '" name="curr_speed_' + cvc + '" /></td>' +
            '<td id="curr_time_interval_' + cvc + '">0.0</td>' +
            '<td id="curr_vector_degrees_' + cvc + '">000</td>' +
            '<td id="curr_vector_distance_' + cvc + '">0</td>' +
        '</tr>')
        var vectors = this;
        $("#curr_time_start_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_time_end_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_direction_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_speed_" + cvc).change(function()
        {
            vectors.recalculate();
        })
    }

    newWindVector()
    {
        var vectors = this
        var wind_vector = this.addWindVector()
        var wvc = wind_vector.idx
        $('#' + this.wind_vectors_table_id).append('<tr>' +
            '<td><input type="number" minlength="4" maxlength="4" id="wind_time_start_' + wvc + '" name="wind_time_start_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="4" maxlength="4" id="wind_time_end_' + wvc + '" name="wind_time_end_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="3" maxlength="3" max="360" id="wind_from_direction_' + wvc + '" name="wind_from_direction_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="1" maxlength="3" id="wind_speed_' + wvc + '" name="wind_speed_' + wvc + '" /></td>' +
            '<td id="wind_leeway_direction_' + wvc + '">000</td>' +
            '<td id="wind_leeway_rate_' + wvc + '">0</td>' +
            '<td id="wind_time_interval_' + wvc + '">0.0</td>' +
            '<td id="wind_vector_degrees_' + wvc + '">000</td>' +
            '<td id="wind_vector_distance_' + wvc + '">0</td>' +
        '</tr>')
        $("#wind_time_start_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_time_end_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_from_direction_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_speed_" + wvc).change(function()
        {
            vectors.recalculate();
        })
    }
}

L.MarineVectors = function(map, pos_name, pos) {
    var contents = [
        "<div id='marinevectorsdialog'>",
        "<table id='mvd_input_table'></table>",
        "<table id='mvd_curr_vectors'></table>",
        "<button class='btn btn-primary' id='curr_create'>Add Current</button>",
        "<table id='mvd_wind_vectors'></table></div>",
        "<button class='btn btn-primary' id='wind_create'>Add Wind</button>",
        "<div><button class='btn btn-primary' id='command_show'>Show</button>",
        "<button class='btn btn-danger' id='command_cancel'>Cancel</button></div>",
    ].join('');
    var marineVectorsDialog = new L.control.dialog({'initOpen': true, size: [1000, 500]}).setContent(contents).addTo(map).hideClose();
    var marine_vectors = new MarineVectors("mvd_input_table", "mvd_curr_vectors", "mvd_wind_vectors")
    var onMap = null

    marine_vectors.populate_input_table()
    marine_vectors.populate_data_tables()

    $('#LKP').val(pos_name);
    $('#LKP_lat').val(deg_to_dm(pos.lat, true));
    $('#LKP_lng').val(deg_to_dm(pos.lng, false));

    $('#curr_create').click(function() {
        marine_vectors.newCurrentVector();
        marine_vectors.recalculate();
    });
    $('#wind_create').click(function() {
        marine_vectors.newWindVector();
        marine_vectors.recalculate();
    });

    $("#command_cancel").click(function() {
        if (onMap !== null) {
            onMap.remove();
        }
        marineVectorsDialog.destroy();
    })
    $("#command_show").click(function() {
        var data = [
            { name: 'from_lat', value: dm_to_deg($("#LKP_lat").val()) },
            { name: 'from_lng', value: dm_to_deg($("#LKP_lng").val()) },
            { name: 'curr_total', value: marine_vectors.current_vectors.length },
            { name: 'wind_total', value: marine_vectors.wind_vectors.length },
        ]
        for (var curr_idx in marine_vectors.current_vectors)
        {
            var curr_vector = marine_vectors.current_vectors[curr_idx]

            data.push({ 'name': 'curr_' + curr_idx + '_direction', 'value': curr_vector.getCurrentVectorDirection()})
            data.push({ 'name': 'curr_' + curr_idx + '_distance', 'value': curr_vector.getCurrentVectorDistance() })
        }

        for (var wind_idx in marine_vectors.wind_vectors)
        {
            var wind_vector = marine_vectors.wind_vectors[wind_idx]

            data.push({ 'name': 'wind_' + wind_idx + '_direction', 'value': wind_vector.getWindVectorDirection()})
            data.push({ 'name': 'wind_' + wind_idx + '_distance', 'value': wind_vector.getWindVectorDistance() })
        }

        $.get('/mission/' + mission_id + '/sar/marine/vectors/create/', data, function(data) {
            if (onMap !== null) {
                onMap.remove();
            }
            onMap = L.geoJSON(data, {color: 'yellow'});
            onMap.addTo(map);
        });
    })
    $("#command_create").click(function() {
        var data = [
            { name: 'csrfmiddlewaretoken', value: csrftoken},
            { name: 'asset', value: $("#id_asset").val()},
            { name: 'reason', value: $("#id_reason").val()},
            { name: 'command', value: $("#id_command").val()},
        ]
        if (gotoPoint != null) {
            var coords = gotoPoint.getLatLng();
            data.push({name: 'latitude', value: coords.lat })
            data.push({name: 'longitude', value: coords.lng })
        }
        $.post('/mission/' + mission_id + '/assets/command/set/', data, function(data) {
            console.log(data);
            if (data === "Created") {
                if (gotoPoint != null) {
                    map.removeLayer(gotoPoint);
                }
                assetCommandDialog.destroy();
                return;
            }
            $("#assetcommanddialog").html(data);
        });
    })
}