import $ from 'jquery';

class MarineSAC {
    constructor(column, asset_type)
    {
        this.column = column
        this.asset_type = asset_type
        this.asset_speed = 0
        this.wu = 0
        this.fw = 0
        this.sweep_width = 0
        this.fatigue = false
        this.corrected_sweep_width = 0
        this.practical_track_spacing = 0
        this.search_area = 0
        this.search_hours = 0
        this.available_search_hours = 0
        this.modified_area = 0
        this.whole_area_practical_track_spacing = 0
    }
    recaclculate()
    {
        this.asset_speed = $("#" + this.asset_type + "_search_speed").val()
        this.wu = parseFloat($("#wu_" + this.column).text())
        this.fw = parseFloat($("#fw_" + this.column).text())
        this.fatigue = $("#fatigue").is(':checked')
        this.practical_track_spacing = parseFloat($("#practical_track_spacing_" + this.column).val())
        this.search_area = parseInt($("#search_area_" + this.column).val())
        this.available_search_hours = parseInt($("#available_search_hours_" + this.column).val())

        this.sweep_width = this.wu * this.fw
        $("#sweep_width_" + this.column).text(this.sweep_width)
        if (this.fatigue)
        {
            $("#ff_" + this.column).text("0.9")
            this.corrected_sweep_width = this.sweep_width * 0.9
        }
        else
        {
            $("#ff_" + this.column).text("1.0")
            this.corrected_sweep_width = this.sweep_width
        }
        $("#corrected_sweep_width_" + this.column).text(this.corrected_sweep_width)

        this.search_hours = this.search_area / (this.asset_speed * this.practical_track_spacing)
        $("#search_hours_total_" + this.column).text(this.search_hours)

        this.modified_area = this.practical_track_spacing * this.asset_speed * this.available_search_hours
        $("#practical_search_area_" + this.column).text(this.modified_area)

        this.whole_area_practical_track_spacing = this.search_area / (this.available_search_hours * this.asset_speed)
        $("#achievable_track_spacing_" + this.column).text(this.whole_area_practical_track_spacing)
    }
}

let table_rows = [
    {
        'display_name': 'Uncorrected Sweep Width (Wu) `NM`',
        'id_prefix': 'wu',
    },
    {
        'display_name': 'Weather Corrected Factor (Fw)',
        'id_prefix': 'fw',
    },
    {
        'display_name': 'Sweep Width (W) (Wu x Fw)',
        'id_prefix': 'sweep_width',
    },
    {
        'display_name': 'Fatigue Factor (Ff)',
        'id_prefix': 'ff',
    },
    {
        'display_name': 'Corrected Sweep Width (W X Ff)',
        'id_prefix': 'corrected_sweep_width',
    },
    {
        'display_name': 'Practical Track Spacing `NM`',
        'id_prefix': 'practical_track_spacing',
        'input': true,
        'input_type': 'number',
    },
    {
        'display_name': 'Search Area',
        'id_prefix': 'search_area',
        'input': true,
        'input_type': 'number',
        'input_default': 144,
    },
    {
        'display_name': 'Search Hours (T) Total',
        'id_prefix': 'search_hours_total',
    },
    {
        'display_name': 'Available Search Hours',
        'id_prefix': 'available_search_hours',
        'input': true,
        'input_type': 'number',
    },
    {
        'display_name': 'Modified Area at Practical Spacing in Available Hours',
        'id_prefix': 'practical_search_area',
    },
    {
        'display_name': 'Track Spacing for Whole Area in Available Time',
        'id_prefix': 'achievable_track_spacing',
    },
]

let input_rows = [
    {
        'display_name': 'Target Description',
        'form_field': 'target_description',
        'input_type': 'text',
    },
    {
        'display_name': 'Meteorological Visibility (km)',
        'form_field': 'met_visibility',
        'input_type': 'number',
    },
    {
        'display_name': 'Wind Speed (knots)',
        'form_field': 'wind_speed',
        'input_type': 'number',
    },
    {
        'display_name': 'Sea Height (meters)',
        'form_field': 'sea_height',
        'input_type': 'number',
    },
    {
        'display_name': 'Boat Search Speed (knots)',
        'form_field': 'boat_search_speed',
        'input_type': 'number',
    },
    {
        'display_name': 'Aircraft Search Speed (knots)',
        'form_field': 'aircraft_search_speed',
        'input_type': 'number',
    },
    {
        'display_name': 'Target Type',
        'form_field': 'target_type',
        'input_type': 'select',
    },
    {
        'display_name': 'Fatigue',
        'form_field': 'fatigue',
        'input_type': 'checkbox',
    },
]

let search_weather_impact_small_object = {
    'low': 1.0,
    'medium': 0.5,
    'high': 0.25,
}

let search_weather_impact_large_object = {
    'low': 1.0,
    'medium': 0.8,
    'high': 0.5,
}

let search_object_distance = [
    {
        'object': 'Person in Water',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.2,
            },
            {
                'vis': 10,
                'sw': 0.3,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 0.3,
            },
            {
                'vis': 5,
                'sw': 0.4,
            },
            {
                'vis': 10,
                'sw': 0.5,
            },
            {
                'vis': 15,
                'sw': 0.6,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.0,
            },
            {
                'vis': 5,
                'sw': 0.1,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.0,
            },
            {
                'vis': 5,
                'sw': 0.1,
            },
        ]
    },
    {
        'object': 'Raft 1 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.7,
            },
            {
                'vis': 5,
                'sw': 1.2,
            },
            {
                'vis': 10,
                'sw': 1.8,
            },
            {
                'vis': 15,
                'sw': 2.1,
            },
            {
                'vis': 20,
                'sw': 2.4,
            },
            {
                'vis': 25,
                'sw': 2.5,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.5,
            },
            {
                'vis': 15,
                'sw': 2.9,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 25,
                'sw': 3.3,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.3,
            },
            {
                'vis': 5,
                'sw': 0.7,
            },
            {
                'vis': 10,
                'sw': 0.9,
            },
            {
                'vis': 20,
                'sw': 1.2,
            },
            {
                'vis': 30,
                'sw': 1.4,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.3,
            },
            {
                'vis': 5,
                'sw': 0.7,
            },
            {
                'vis': 10,
                'sw': 0.9,
            },
            {
                'vis': 20,
                'sw': 1.2,
            },
            {
                'vis': 30,
                'sw': 1.4,
            },
        ],
    },
    {
        'object': 'Raft 4 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.8,
            },
            {
                'vis': 5,
                'sw': 1.5,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 15,
                'sw': 2.9,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 25,
                'sw': 3.4,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.1,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.1,
            },
            {
                'vis': 15,
                'sw': 3.8,
            },
            {
                'vis': 20,
                'sw': 4.2,
            },
            {
                'vis': 25,
                'sw': 4.4,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.0,
            },
            {
                'vis': 10,
                'sw': 1.3,
            },
            {
                'vis': 20,
                'sw': 1.8,
            },
            {
                'vis': 30,
                'sw': 2.0,
            },
            {
                'vis': 40,
                'sw': 2.2,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.3,
            },
            {
                'vis': 5,
                'sw': 1.0,
            },
            {
                'vis': 10,
                'sw': 1.3,
            },
            {
                'vis': 20,
                'sw': 1.8,
            },
            {
                'vis': 30,
                'sw': 2.1,
            },
            {
                'vis': 40,
                'sw': 2.3,
            },
        ],
    },
    {
        'object': 'Raft 6 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 1.7,
            },
            {
                'vis': 10,
                'sw': 2.7,
            },
            {
                'vis': 15,
                'sw': 3.4,
            },
            {
                'vis': 20,
                'sw': 3.8,
            },
            {
                'vis': 25,
                'sw': 4.1,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 3.5,
            },
            {
                'vis': 15,
                'sw': 4.4,
            },
            {
                'vis': 20,
                'sw': 5.0,
            },
            {
                'vis': 25,
                'sw': 5.3,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.1,
            },
            {
                'vis': 10,
                'sw': 1.5,
            },
            {
                'vis': 20,
                'sw': 2.2,
            },
            {
                'vis': 30,
                'sw': 2.5,
            },
            {
                'vis': 40,
                'sw': 2.8,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.1,
            },
            {
                'vis': 10,
                'sw': 1.6,
            },
            {
                'vis': 20,
                'sw': 2.2,
            },
            {
                'vis': 30,
                'sw': 2.6,
            },
            {
                'vis': 40,
                'sw': 2.8,
            },
        ],
    },
    {
        'object': 'Raft 10 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 1.8,
            },
            {
                'vis': 10,
                'sw': 2.9,
            },
            {
                'vis': 15,
                'sw': 3.7,
            },
            {
                'vis': 20,
                'sw': 4.2,
            },
            {
                'vis': 25,
                'sw': 4.6,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.3,
            },
            {
                'vis': 10,
                'sw': 3.7,
            },
            {
                'vis': 15,
                'sw': 4.7,
            },
            {
                'vis': 20,
                'sw': 5.4,
            },
            {
                'vis': 25,
                'sw': 5.8,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.2,
            },
            {
                'vis': 10,
                'sw': 1.7,
            },
            {
                'vis': 20,
                'sw': 2.5,
            },
            {
                'vis': 30,
                'sw': 2.9,
            },
            {
                'vis': 40,
                'sw': 3.2,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.3,
            },
            {
                'vis': 10,
                'sw': 1.8,
            },
            {
                'vis': 20,
                'sw': 2.6,
            },
            {
                'vis': 30,
                'sw': 3.0,
            },
            {
                'vis': 40,
                'sw': 3.3,
            },
        ],
    },
    {
        'object': 'Raft 15 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.2,
            },
            {
                'vis': 15,
                'sw': 4.0,
            },
            {
                'vis': 20,
                'sw': 4.5,
            },
            {
                'vis': 25,
                'sw': 4.9,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.5,
            },
            {
                'vis': 10,
                'sw': 4.0,
            },
            {
                'vis': 15,
                'sw': 5.1,
            },
            {
                'vis': 20,
                'sw': 5.7,
            },
            {
                'vis': 25,
                'sw': 6.2,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.3,
            },
            {
                'vis': 10,
                'sw': 1.9,
            },
            {
                'vis': 20,
                'sw': 2.7,
            },
            {
                'vis': 30,
                'sw': 3.3,
            },
            {
                'vis': 40,
                'sw': 3.6,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.4,
            },
            {
                'vis': 10,
                'sw': 2.0,
            },
            {
                'vis': 20,
                'sw': 2.8,
            },
            {
                'vis': 30,
                'sw': 3.4,
            },
            {
                'vis': 40,
                'sw': 3.7,
            },
        ],
    },
    {
        'object': 'Raft 20 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 2.1,
            },
            {
                'vis': 10,
                'sw': 3.5,
            },
            {
                'vis': 15,
                'sw': 4.4,
            },
            {
                'vis': 20,
                'sw': 5.1,
            },
            {
                'vis': 25,
                'sw': 5.6,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.3,
            },
            {
                'vis': 5,
                'sw': 2.6,
            },
            {
                'vis': 10,
                'sw': 4.3,
            },
            {
                'vis': 15,
                'sw': 5.7,
            },
            {
                'vis': 20,
                'sw': 6.4,
            },
            {
                'vis': 25,
                'sw': 6.9,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.5,
            },
            {
                'vis': 10,
                'sw': 2.1,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 30,
                'sw': 3.8,
            },
            {
                'vis': 40,
                'sw': 4.2,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.5,
            },
            {
                'vis': 10,
                'sw': 2.2,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 30,
                'sw': 3.9,
            },
            {
                'vis': 40,
                'sw': 4.3,
            },
        ],
    },
    {
        'object': 'Raft 25 person',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 3.7,
            },
            {
                'vis': 15,
                'sw': 4.7,
            },
            {
                'vis': 20,
                'sw': 5.5,
            },
            {
                'vis': 25,
                'sw': 6.0,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.3,
            },
            {
                'vis': 5,
                'sw': 2.7,
            },
            {
                'vis': 10,
                'sw': 4.3,
            },
            {
                'vis': 15,
                'sw': 5.8,
            },
            {
                'vis': 20,
                'sw': 6.7,
            },
            {
                'vis': 25,
                'sw': 7.5,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 20,
                'sw': 3.4,
            },
            {
                'vis': 30,
                'sw': 4.1,
            },
            {
                'vis': 40,
                'sw': 4.6,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 20,
                'sw': 3.5,
            },
            {
                'vis': 30,
                'sw': 4.2,
            },
            {
                'vis': 40,
                'sw': 4.7,
            },
        ],
    },
    {
        'object': 'Power Board <5m (15ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 0.7,
            },
            {
                'vis': 10,
                'sw': 1.0,
            },
            {
                'vis': 15,
                'sw': 1.2,
            },
            {
                'vis': 20,
                'sw': 1.3,
            },
            {
                'vis': 25,
                'sw': 1.4,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.0,
            },
            {
                'vis': 10,
                'sw': 1.5,
            },
            {
                'vis': 15,
                'sw': 1.8,
            },
            {
                'vis': 20,
                'sw': 1.9,
            },
            {
                'vis': 25,
                'sw': 2.0,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 0.9,
            },
            {
                'vis': 10,
                'sw': 1.2,
            },
            {
                'vis': 20,
                'sw': 1.5,
            },
            {
                'vis': 30,
                'sw': 1.7,
            },
            {
                'vis': 40,
                'sw': 1.8,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.4,
            },
            {
                'vis': 5,
                'sw': 1.0,
            },
            {
                'vis': 10,
                'sw': 1.3,
            },
            {
                'vis': 20,
                'sw': 1.7,
            },
            {
                'vis': 30,
                'sw': 1.8,
            },
            {
                'vis': 40,
                'sw': 2.0,
            },
        ],
    },
    {
        'object': 'Power Boat 5-8m (15-25ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.8,
            },
            {
                'vis': 5,
                'sw': 1.4,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 15,
                'sw': 2.9,
            },
            {
                'vis': 20,
                'sw': 3.4,
            },
            {
                'vis': 25,
                'sw': 3.8,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 1.9,
            },
            {
                'vis': 10,
                'sw': 3.0,
            },
            {
                'vis': 15,
                'sw': 3.9,
            },
            {
                'vis': 20,
                'sw': 4.5,
            },
            {
                'vis': 25,
                'sw': 5.0,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.7,
            },
            {
                'vis': 10,
                'sw': 2.4,
            },
            {
                'vis': 20,
                'sw': 3.6,
            },
            {
                'vis': 30,
                'sw': 4.3,
            },
            {
                'vis': 40,
                'sw': 4.8,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.7,
            },
            {
                'vis': 10,
                'sw': 2.5,
            },
            {
                'vis': 20,
                'sw': 3.7,
            },
            {
                'vis': 30,
                'sw': 4.4,
            },
            {
                'vis': 40,
                'sw': 5.0,
            },
        ],
    },
    {
        'object': 'Power Boat 8-12m (25-40ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.8,
            },
            {
                'vis': 5,
                'sw': 1.8,
            },
            {
                'vis': 10,
                'sw': 3.1,
            },
            {
                'vis': 15,
                'sw': 4.1,
            },
            {
                'vis': 20,
                'sw': 4.9,
            },
            {
                'vis': 25,
                'sw': 5.6,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.3,
            },
            {
                'vis': 10,
                'sw': 4.0,
            },
            {
                'vis': 15,
                'sw': 5.3,
            },
            {
                'vis': 20,
                'sw': 6.4,
            },
            {
                'vis': 25,
                'sw': 7.3,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.1,
            },
            {
                'vis': 10,
                'sw': 3.3,
            },
            {
                'vis': 20,
                'sw': 5.3,
            },
            {
                'vis': 30,
                'sw': 6.7,
            },
            {
                'vis': 40,
                'sw': 7.7,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 3.4,
            },
            {
                'vis': 20,
                'sw': 5.4,
            },
            {
                'vis': 30,
                'sw': 6.8,
            },
            {
                'vis': 40,
                'sw': 7.8,
            },
        ],
    },
    {
        'object': 'Power Boat 12-20m (40-65ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 4.2,
            },
            {
                'vis': 15,
                'sw': 5.9,
            },
            {
                'vis': 20,
                'sw': 7.4,
            },
            {
                'vis': 25,
                'sw': 8.7,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 3.0,
            },
            {
                'vis': 10,
                'sw': 5.4,
            },
            {
                'vis': 15,
                'sw': 7.6,
            },
            {
                'vis': 20,
                'sw': 9.6,
            },
            {
                'vis': 25,
                'sw': 11.3,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.7,
            },
            {
                'vis': 10,
                'sw': 4.5,
            },
            {
                'vis': 20,
                'sw': 8.1,
            },
            {
                'vis': 30,
                'sw': 10.9,
            },
            {
                'vis': 40,
                'sw': 13.1,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.7,
            },
            {
                'vis': 10,
                'sw': 4.5,
            },
            {
                'vis': 20,
                'sw': 8.2,
            },
            {
                'vis': 30,
                'sw': 10.9,
            },
            {
                'vis': 40,
                'sw': 13.1,
            },
        ],
    },
    {
        'object': 'Power Boat 20-27m (65-90ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.3,
            },
            {
                'vis': 10,
                'sw': 4.6,
            },
            {
                'vis': 15,
                'sw': 6.8,
            },
            {
                'vis': 20,
                'sw': 8.8,
            },
            {
                'vis': 25,
                'sw': 10.6,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 3.0,
            },
            {
                'vis': 10,
                'sw': 6.0,
            },
            {
                'vis': 15,
                'sw': 8.7,
            },
            {
                'vis': 20,
                'sw': 11.3,
            },
            {
                'vis': 25,
                'sw': 13.6,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 5.0,
            },
            {
                'vis': 20,
                'sw': 9.8,
            },
            {
                'vis': 30,
                'sw': 13.5,
            },
            {
                'vis': 40,
                'sw': 16.7,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 5.1,
            },
            {
                'vis': 20,
                'sw': 9.8,
            },
            {
                'vis': 30,
                'sw': 13.6,
            },
            {
                'vis': 40,
                'sw': 16.7,
            },
        ],
    },
    {
        'object': 'Sail Boat 5m (15ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.8,
            },
            {
                'vis': 5,
                'sw': 1.4,
            },
            {
                'vis': 10,
                'sw': 2.2,
            },
            {
                'vis': 15,
                'sw': 2.7,
            },
            {
                'vis': 20,
                'sw': 3.1,
            },
            {
                'vis': 25,
                'sw': 3.4,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.0,
            },
            {
                'vis': 5,
                'sw': 1.8,
            },
            {
                'vis': 10,
                'sw': 2.8,
            },
            {
                'vis': 15,
                'sw': 3.5,
            },
            {
                'vis': 20,
                'sw': 4.1,
            },
            {
                'vis': 25,
                'sw': 4.5,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.2,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 30,
                'sw': 3.9,
            },
            {
                'vis': 40,
                'sw': 4.3,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 20,
                'sw': 3.3,
            },
            {
                'vis': 30,
                'sw': 4.0,
            },
            {
                'vis': 40,
                'sw': 4.4,
            },
        ],
    },
    {
        'object': 'Sail Boat 5m (15ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.8,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.6,
            },
            {
                'vis': 15,
                'sw': 3.3,
            },
            {
                'vis': 20,
                'sw': 3.9,
            },
            {
                'vis': 25,
                'sw': 4.4,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.1,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.3,
            },
            {
                'vis': 15,
                'sw': 4.3,
            },
            {
                'vis': 20,
                'sw': 5.0,
            },
            {
                'vis': 25,
                'sw': 5.6,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.2,
            },
            {
                'vis': 20,
                'sw': 3.2,
            },
            {
                'vis': 30,
                'sw': 3.9,
            },
            {
                'vis': 40,
                'sw': 4.3,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 1.6,
            },
            {
                'vis': 10,
                'sw': 2.3,
            },
            {
                'vis': 20,
                'sw': 3.3,
            },
            {
                'vis': 30,
                'sw': 4.0,
            },
            {
                'vis': 40,
                'sw': 4.4,
            },
        ],
    },
    {
        'object': 'Sail Boat 8m (25ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 1.8,
            },
            {
                'vis': 10,
                'sw': 2.9,
            },
            {
                'vis': 15,
                'sw': 3.9,
            },
            {
                'vis': 20,
                'sw': 4.6,
            },
            {
                'vis': 25,
                'sw': 5.1,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.1,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 3.8,
            },
            {
                'vis': 15,
                'sw': 5.0,
            },
            {
                'vis': 20,
                'sw': 5.9,
            },
            {
                'vis': 25,
                'sw': 6.7,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.1,
            },
            {
                'vis': 20,
                'sw': 4.9,
            },
            {
                'vis': 30,
                'sw': 6.1,
            },
            {
                'vis': 40,
                'sw': 7.0,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 2.1,
            },
            {
                'vis': 10,
                'sw': 3.2,
            },
            {
                'vis': 20,
                'sw': 5.0,
            },
            {
                'vis': 30,
                'sw': 6.2,
            },
            {
                'vis': 40,
                'sw': 7.1,
            },
        ],
    },
    {
        'object': 'Sail Boat 9m (30ft)',
        'weather_corrections': search_weather_impact_small_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.4,
            },
            {
                'vis': 15,
                'sw': 4.6,
            },
            {
                'vis': 20,
                'sw': 5.5,
            },
            {
                'vis': 25,
                'sw': 6.3,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.5,
            },
            {
                'vis': 10,
                'sw': 4.4,
            },
            {
                'vis': 15,
                'sw': 5.9,
            },
            {
                'vis': 20,
                'sw': 7.1,
            },
            {
                'vis': 25,
                'sw': 8.1,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.0,
            },
            {
                'vis': 10,
                'sw': 3.1,
            },
            {
                'vis': 20,
                'sw': 4.9,
            },
            {
                'vis': 30,
                'sw': 6.1,
            },
            {
                'vis': 40,
                'sw': 7.0,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.5,
            },
            {
                'vis': 5,
                'sw': 2.1,
            },
            {
                'vis': 10,
                'sw': 3.2,
            },
            {
                'vis': 20,
                'sw': 5.0,
            },
            {
                'vis': 30,
                'sw': 6.2,
            },
            {
                'vis': 40,
                'sw': 7.1,
            },
        ],
    },
    {
        'object': 'Sail Boat 12m (40ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 4.1,
            },
            {
                'vis': 15,
                'sw': 5.7,
            },
            {
                'vis': 20,
                'sw': 7.0,
            },
            {
                'vis': 25,
                'sw': 8.1,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.3,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 5.2,
            },
            {
                'vis': 15,
                'sw': 7.2,
            },
            {
                'vis': 20,
                'sw': 9.0,
            },
            {
                'vis': 25,
                'sw': 10.5,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.6,
            },
            {
                'vis': 10,
                'sw': 4.3,
            },
            {
                'vis': 20,
                'sw': 7.6,
            },
            {
                'vis': 30,
                'sw': 10.0,
            },
            {
                'vis': 40,
                'sw': 11.9,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.6,
            },
            {
                'vis': 10,
                'sw': 4.3,
            },
            {
                'vis': 20,
                'sw': 7.6,
            },
            {
                'vis': 30,
                'sw': 10.9,
            },
            {
                'vis': 40,
                'sw': 12.0,
            },
        ],
    },
    {
        'object': 'Sail Boat 15m (50ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.2,
            },
            {
                'vis': 10,
                'sw': 4.3,
            },
            {
                'vis': 15,
                'sw': 6.1,
            },
            {
                'vis': 20,
                'sw': 7.7,
            },
            {
                'vis': 25,
                'sw': 9.1,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 2.9,
            },
            {
                'vis': 10,
                'sw': 5.2,
            },
            {
                'vis': 15,
                'sw': 7.9,
            },
            {
                'vis': 20,
                'sw': 9.9,
            },
            {
                'vis': 25,
                'sw': 11.7,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.7,
            },
            {
                'vis': 10,
                'sw': 4.6,
            },
            {
                'vis': 20,
                'sw': 8.4,
            },
            {
                'vis': 30,
                'sw': 11.3,
            },
            {
                'vis': 40,
                'sw': 13.7,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.7,
            },
            {
                'vis': 10,
                'sw': 4.6,
            },
            {
                'vis': 20,
                'sw': 8.5,
            },
            {
                'vis': 30,
                'sw': 11.4,
            },
            {
                'vis': 40,
                'sw': 13.7,
            },
        ],
    },
    {
        'object': 'Sail Boat 20-23m (65-75ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.3,
            },
            {
                'vis': 10,
                'sw': 4.5,
            },
            {
                'vis': 15,
                'sw': 6.5,
            },
            {
                'vis': 20,
                'sw': 8.3,
            },
            {
                'vis': 25,
                'sw': 9.9,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 3.0,
            },
            {
                'vis': 10,
                'sw': 5.8,
            },
            {
                'vis': 15,
                'sw': 8.4,
            },
            {
                'vis': 20,
                'sw': 10.8,
            },
            {
                'vis': 25,
                'sw': 12.9,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 4.9,
            },
            {
                'vis': 20,
                'sw': 9.3,
            },
            {
                'vis': 30,
                'sw': 12.7,
            },
            {
                'vis': 40,
                'sw': 15.5,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 4.9,
            },
            {
                'vis': 20,
                'sw': 9.3,
            },
            {
                'vis': 30,
                'sw': 12.8,
            },
            {
                'vis': 40,
                'sw': 15.6,
            },
        ],
    },
    {
        'object': 'Sail Boat 23-27m (75-90ft)',
        'weather_corrections': search_weather_impact_large_object,
        '8ft': [
            {
                'vis': 2,
                'sw': 0.9,
            },
            {
                'vis': 5,
                'sw': 2.4,
            },
            {
                'vis': 10,
                'sw': 4.7,
            },
            {
                'vis': 15,
                'sw': 6.8,
            },
            {
                'vis': 20,
                'sw': 8.9,
            },
            {
                'vis': 25,
                'sw': 10.7,
            },
        ],
        '14ft': [
            {
                'vis': 2,
                'sw': 1.2,
            },
            {
                'vis': 5,
                'sw': 3.1,
            },
            {
                'vis': 10,
                'sw': 6.1,
            },
            {
                'vis': 15,
                'sw': 8.9,
            },
            {
                'vis': 20,
                'sw': 11.5,
            },
            {
                'vis': 25,
                'sw': 13.8,
            },
        ],
        '500ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 5.1,
            },
            {
                'vis': 20,
                'sw': 9.9,
            },
            {
                'vis': 30,
                'sw': 13.7,
            },
            {
                'vis': 40,
                'sw': 17.0,
            },
        ],
        '1000ft': [
            {
                'vis': 2,
                'sw': 0.6,
            },
            {
                'vis': 5,
                'sw': 2.8,
            },
            {
                'vis': 10,
                'sw': 5.1,
            },
            {
                'vis': 20,
                'sw': 9.9,
            },
            {
                'vis': 30,
                'sw': 13.8,
            },
            {
                'vis': 40,
                'sw': 17.0,
            },
        ],
    },

]

export class MarineSACTable {
    constructor(input_table_id, table_id)
    {
        this.input_table_id = input_table_id
        this.table_id = table_id
        this.columns = [new MarineSAC("8ft", "boat"), new MarineSAC("14ft", "boat"), new MarineSAC("500ft", "aircraft"), new MarineSAC("1000ft", "aircraft")]
    }
    recaclculate()
    {
        var visibility = $("#met_visibility").val()
        var wind_speed = parseInt($("#wind_speed").val())
        var sea_height = parseFloat($("#sea_height").val())

        // Determine sea/wind impact category
        var weather_impact = 'low'
        if (wind_speed >= 25 || sea_height >= 1.5)
        {
            weather_impact = 'high'
        }
        else if(wind_speed >= 15 || sea_height >= 1.0)
        {
            weather_impact = 'medium'
        }

        // Update the uncorrected sweep width and weather correct factors
        var target_type = $("#" + this.target_type_id).val()
        var target_data = search_object_distance[target_type]

        for (var col_idx in this.columns)
        {
            var column_name = this.columns[col_idx].column

            var visible_distance_data = target_data[column_name]

            var highest_seen_sweep_width = 0
            var highest_seen_vis = 0
            for (var idx in visible_distance_data)
            {
                var data = visible_distance_data[idx]
                if (data['vis'] <= visibility && data['vis'] > highest_seen_vis)
                {
                    highest_seen_sweep_width = data['sw']
                    highest_seen_vis = data['vis']
                }
            }
            $("#wu_" + column_name).text(highest_seen_sweep_width)

            $("#fw_" + column_name).text(target_data['weather_corrections'][weather_impact])
        }
    
        // Recalculate each column
        for (var col_idx in this.columns)
        {
            var column = this.columns[col_idx]
            column.recaclculate()
        }
    }

    populate_input_table()
    {
        var sac_table = this

        for (var idx in input_rows)
        {
            var row = input_rows[idx]

            var html = '<tr>'

            html += '<td><label for="' + row['form_field'] + '">' + row['display_name'] + '</label></td>'
            if (row['input_type'] == 'select')
            {
                html += '<td><select id="' + row['form_field'] + '" name="' + row['form_field'] + '"></select></td>'
            }
            else
            {
                html += '<td><input type="' + row['input_type'] + '" id="' + row['form_field'] + '" name="' + row['form_field'] + '"></input></td>'
            }
            html += '</tr>'
            $("#" + this.input_table_id).append(html)
            $("#" + row['form_field']).change(function()
            {
                sac_table.recaclculate()
            })
        }

        this.target_type_id = 'target_type'
        this.populate_target_types()
    }

    populate_target_types()
    {
        var sac_table = this

        for (var idx in search_object_distance)
        {
            $("#" + this.target_type_id).append('<option value="' + idx + '">' + search_object_distance[idx]['object'] + '</option>');
        }

        $("#" + this.target_type_id).change(function() {
            sac_table.recaclculate()
        })
    }

    populate_table()
    {
        var sac_table = this

        var html = '<thead><th></th><th colspan="2">Height of Eye</th><th colspan="2">Aircraft</th></thead><thead><th></th><th>2.4m (8ft)</th><th>4.2m (14ft)</th><th>500ft</th><th>1000ft</th></thead>'
        $("#" + this.table_id).html(html)
        for (var idx in table_rows)
        {
            var html = '<tr>'
            html += '<th>' + table_rows[idx]['display_name'] + '</th>'
            for (var col_idx in this.columns)
            {
                var column = this.columns[col_idx]
                if (table_rows[idx]['input'])
                {
                    html += '<td>'
                    html += '<input type="' + table_rows[idx]['input_type'] + '" id="' + table_rows[idx]['id_prefix'] + '_' + column.column + '" value="' + table_rows[idx]['input_default'] + '" />'
                }
                else
                {
                    html += '<td id="' + table_rows[idx]['id_prefix'] + '_' + column.column + '">'
                }
                html += '</td>'
            }
            $("#" + this.table_id).append(html)
            if (table_rows[idx]['input'])
            {
                for (var col_idx in this.columns)
                {
                    var column = this.columns[col_idx]
                    $('#' + table_rows[idx]['id_prefix'] + '_' + column.column).change(
                        function()
                        {
                            sac_table.recaclculate()
                        }
                    )
                }
            }
        }
    }
}