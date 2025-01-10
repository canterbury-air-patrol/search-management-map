import $ from 'jquery'
import L from 'leaflet'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'
import { SearchObjectLeeway } from '@canterbury-air-patrol/marine-leeway-data'

function timeFractions(humanTime) {
  const minutes = humanTime % 100
  let hours = (humanTime - minutes) / 100
  hours += minutes / 60
  return hours
}

class MarineVectorsCurrent {
  constructor(idx, timeFrom, timeTo, currentDirection, currentSpeed) {
    this.idx = idx
    this.timeFrom = timeFrom
    this.timeTo = timeTo
    this.currentDirection = currentDirection
    this.currentSpeed = currentSpeed
  }

  getTimeInterval() {
    return timeFractions(this.timeTo) - timeFractions(this.timeFrom)
  }

  getCurrentVectorDirection() {
    return this.currentDirection
  }

  getCurrentVectorDistance() {
    return this.getTimeInterval() * this.currentSpeed
  }

  updateTimeFrom(newTime) {
    this.timeFrom = newTime
  }

  updateTimeTo(newTime) {
    this.timeTo = newTime
  }

  updateCurrentDirection(newDirection) {
    this.currentDirection = newDirection
  }

  updateCurrentSpeed(newSpeed) {
    this.currentSpeed = newSpeed
  }
}

class MarineVectorsWind {
  constructor(idx, timeFrom, timeTo, windDirection, windSpeed, leewayData) {
    this.idx = idx
    this.timeFrom = timeFrom
    this.timeTo = timeTo
    this.windDirectionFrom = parseInt(windDirection)
    this.windSpeed = windSpeed
    this.leewayData = leewayData
  }

  updateLeewayData(leewayData) {
    this.leewayData = leewayData
  }

  getWindDirectionTo() {
    return (this.windDirectionFrom + 180) % 360
  }

  updateWindDirectFrom(newDirection) {
    this.windDirectionFrom = parseInt(newDirection)
  }

  updateWindSpeed(newSpeed) {
    this.windSpeed = parseInt(newSpeed)
  }

  getLeewayRate() {
    return this.windSpeed * this.leewayData.multiplier + this.leewayData.modifier
  }

  getTimeInterval() {
    return timeFractions(this.timeTo) - timeFractions(this.timeFrom)
  }

  getWindVectorDirection() {
    return this.getWindDirectionTo()
  }

  getWindVectorDistance() {
    return this.getTimeInterval() * this.getLeewayRate()
  }
}

const marinesarVectorsInputRows = [
  {
    display_name: 'Subject',
    form_field: 'subject',
    input_type: 'text'
  },
  {
    display_name: 'Reference Position (name)',
    form_field: 'LKP',
    input_type: 'text'
  },
  {
    display_name: 'Latitude',
    form_field: 'LKP_lat',
    input_type: 'text'
  },
  {
    display_name: 'Longitude',
    form_field: 'LKP_lng',
    input_type: 'text'
  },
  {
    display_name: 'Target Description',
    form_field: 'target_description',
    input_type: 'text'
  }
]

export class MarineVectors {
  constructor(inputTableId, currentVectorsTableId, windVectorsTableId) {
    this.currentVectors = []
    this.windVectors = []
    this.leewayData = {}
    this.inputTableId = inputTableId
    this.currentVectorsTableId = currentVectorsTableId
    this.windVectorsTableId = windVectorsTableId
    this.update_leeway_data = this.update_leeway_data.bind(this)
    this.recalculate = this.recalculate.bind(this)
  }

  getResultingVector() {
    let computedBearing = 0
    let computedDistance = 0
    for (const idx in this.currentVectors) {
      const currVector = this.currentVectors[idx]
      if (computedBearing === 0 && computedDistance === 0) {
        computedBearing = currVector.getCurrentVectorDirection()
        computedDistance = currVector.getCurrentVectorDistance()
      } else {
        /* do trig to work out the resulting vector */
        const x1 = computedDistance * Math.cos((computedBearing * Math.PI) / 180)
        const y1 = computedDistance * Math.sin((computedBearing * Math.PI) / 180)
        const currBearing = currVector.getCurrentVectorDirection()
        const currDistance = currVector.getCurrentVectorDistance()
        const x2 = currDistance * Math.cos((currBearing * Math.PI) / 180)
        const y2 = currDistance * Math.sin((currBearing * Math.PI) / 180)
        const x = x1 + x2
        const y = y1 + y2
        computedDistance = Math.sqrt(x * x + y * y)
        computedBearing = (Math.atan(y / x) * 180) / Math.PI
      }
    }
    for (const idx in this.windVectors) {
      const windVector = this.windVectors[idx]
      if (computedBearing === 0 && computedDistance === 0) {
        computedBearing = windVector.getWindVectorDirection()
        computedDistance = windVector.getWindVectorDistance()
      } else {
        /* do trig to work out the resulting vector */
        const x1 = computedDistance * Math.cos((computedBearing * Math.PI) / 180)
        const y1 = computedDistance * Math.sin((computedBearing * Math.PI) / 180)
        const windBearing = windVector.getWindVectorDirection()
        const windDistance = windVector.getWindVectorDistance()
        const x2 = windDistance * Math.cos((windBearing * Math.PI) / 180)
        const y2 = windDistance * Math.sin((windBearing * Math.PI) / 180)
        const x = x1 + x2
        const y = y1 + y2
        computedDistance = Math.sqrt(x * x + y * y)
        computedBearing = (Math.atan(y / x) * 180) / Math.PI
      }
    }
    computedBearing = (computedBearing + 360) % 360
    return { bearing: computedBearing, distance: computedDistance }
  }

  addCurrentVector() {
    const currentVector = new MarineVectorsCurrent(this.currentVectors.length + 1, 0, 0, 0, 0)
    this.currentVectors.push(currentVector)
    return currentVector
  }

  addWindVector() {
    const windVector = new MarineVectorsWind(this.windVectors.length + 1, 0, 0, 0, 0, this.leewayData)
    this.windVectors.push(windVector)
    return windVector
  }

  populate_input_table() {
    for (const idx in marinesarVectorsInputRows) {
      const row = marinesarVectorsInputRows[idx]
      let html = '<tr>'
      html += '<td>'
      html += `<label for="${row.form_field}">${row.display_name}</label>`
      html += '</td>'
      html += '<td>'
      html += `<input type="${row.input_type}" id="${row.form_field}" name="${row.form_field}" />`
      html += '</td>'
      html += '</tr>'

      $(`#${this.inputTableId}`).append(html)
    }

    let html = '<tr>'
    html += '<td>'
    html += '<label for="leeway_type">Leeway Type:</label>'
    html += '</td>'
    html += '<td colspan="2">'
    html += '<select id="leeway_type" name="leeway_type" class="selectpicker" data-live-search="true" />'
    html += '</td>'
    html += '</tr>'

    $(`#${this.inputTableId}`).append(html)
    this.populate_leeway_selector('leeway_type')

    html = '<tr>'
    html += '<th>Multiplier</th>'
    html += '<th>Modifier</th>'
    html += '<th>Diveregence</th>'
    html += '</tr><tr>'
    html += '<td id="leeway_multiplier" />'
    html += '<td id="leeway_modifier" />'
    html += '<td id="leeway_divergence" />'
    html += '</tr>'

    $(`#${this.inputTableId}`).append(html)

    this.update_leeway_data()
  }

  populate_data_tables() {
    let html = '<thead>'
    html += '<th>From:</th>'
    html += '<th>To:</th>'
    html += '<th>Direction (&deg;T)</th>'
    html += '<th>Speed (knots)</th>'
    html += '<th>Time Interval</th>'
    html += '<th>Vector direction (&deg;T)</th>'
    html += '<th>Vector distance (NM)</th>'
    html += '</thead>'

    $(`#${this.currentVectorsTableId}`).html(html)

    html = '<thead>'
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

    $(`#${this.windVectorsTableId}`).html(html)
  }

  update_leeway_data() {
    const idx = $(`#${this.leewaySelector}`).val()
    this.leewayData = SearchObjectLeeway[idx]
    $('#leeway_multiplier').text(this.leewayData.multiplier)
    $('#leeway_modifier').text(this.leewayData.modifier)
    $('#leeway_divergence').text(this.leewayData.divergence)
    this.recalculate()
  }

  populate_leeway_selector(leewaySelector) {
    this.leewaySelector = leewaySelector

    for (const idx in SearchObjectLeeway) {
      const leeway = SearchObjectLeeway[idx]

      const html = '<option value="' + idx + '">' + leeway.description + '</option>'
      $(`#${this.leewaySelector}`).append(html)
    }

    $(`#${this.leewaySelector}`).on('change', this.update_leeway_data)
  }

  recalculate() {
    for (const idx in this.currentVectors) {
      const currVector = this.currentVectors[idx]
      const cvc = currVector.idx
      currVector.timeFrom = $(`#curr_time_start_${cvc}`).val()
      currVector.timeTo = $(`#curr_time_end_${cvc}`).val()
      currVector.currentDirection = $(`#curr_direction_${cvc}`).val()
      currVector.currentSpeed = $(`#curr_speed_${cvc}`).val()
      $(`#curr_time_interval_${cvc}`).text(currVector.getTimeInterval())
      $(`#curr_vector_degrees_${cvc}`).text(currVector.getCurrentVectorDirection())
      $(`#curr_vector_distance_${cvc}`).text(currVector.getCurrentVectorDistance())
    }
    for (const idx in this.windVectors) {
      const windVector = this.windVectors[idx]
      windVector.updateLeewayData(this.leewayData)
      const wvc = windVector.idx
      windVector.timeFrom = $(`#wind_time_start_${wvc}`).val()
      windVector.timeTo = $(`#wind_time_end_${wvc}`).val()
      windVector.updateWindDirectFrom($(`#wind_from_direction_${wvc}`).val())
      windVector.updateWindSpeed($(`#wind_speed_${wvc}`).val())
      $(`#wind_leeway_direction_${wvc}`).text(windVector.getWindDirectionTo())
      $(`#wind_leeway_rate_${wvc}`).text(windVector.getLeewayRate())
      $(`#wind_time_interval_${wvc}`).text(windVector.getTimeInterval())
      $(`#wind_vector_degrees_${wvc}`).text(windVector.getWindVectorDirection())
      $(`#wind_vector_distance_${wvc}`).text(windVector.getWindVectorDistance())
    }
    const results = this.getResultingVector()
    $('#tdv_result_direction').text(Math.round(results.bearing))
    $('#tdv_result_distance').text(results.distance.toFixed(2))
  }

  newCurrentVector() {
    const currVector = this.addCurrentVector()
    const cvc = currVector.idx
    $('#' + this.currentVectorsTableId).append(
      '<tr>' +
        '<td><input type="number" minlength="4" maxlength="4" id="curr_time_start_' +
        cvc +
        '" name="curr_time_start_' +
        cvc +
        '" /></td>' +
        '<td><input type="number" minlength="4" maxlength="4" id="curr_time_end_' +
        cvc +
        '" name="curr_time_end_' +
        cvc +
        '" /></td>' +
        '<td><input type="number" minlength="3" maxlength="3" max="360" id="curr_direction_' +
        cvc +
        '" name="curr_direction_' +
        cvc +
        '" /></td>' +
        '<td><input type="number" minlength="1" maxlength="3" id="curr_speed_' +
        cvc +
        '" name="curr_speed_' +
        cvc +
        '" /></td>' +
        '<td id="curr_time_interval_' +
        cvc +
        '">0.0</td>' +
        '<td id="curr_vector_degrees_' +
        cvc +
        '">000</td>' +
        '<td id="curr_vector_distance_' +
        cvc +
        '">0</td>' +
        '</tr>'
    )
    $(`#curr_time_start_${cvc}`).on('change', this.recalculate)
    $(`#curr_time_end_${cvc}`).on('change', this.recalculate)
    $(`#curr_direction_${cvc}`).on('change', this.recalculate)
    $(`#curr_speed_${cvc}`).on('change', this.recalculate)
  }

  newWindVector() {
    const windVector = this.addWindVector()
    const wvc = windVector.idx
    $('#' + this.windVectorsTableId).append(
      '<tr>' +
        '<td><input type="number" minlength="4" maxlength="4" id="wind_time_start_' +
        wvc +
        '" name="wind_time_start_' +
        wvc +
        '" /></td>' +
        '<td><input type="number" minlength="4" maxlength="4" id="wind_time_end_' +
        wvc +
        '" name="wind_time_end_' +
        wvc +
        '" /></td>' +
        '<td><input type="number" minlength="3" maxlength="3" max="360" id="wind_from_direction_' +
        wvc +
        '" name="wind_from_direction_' +
        wvc +
        '" /></td>' +
        '<td><input type="number" minlength="1" maxlength="3" id="wind_speed_' +
        wvc +
        '" name="wind_speed_' +
        wvc +
        '" /></td>' +
        '<td id="wind_leeway_direction_' +
        wvc +
        '">000</td>' +
        '<td id="wind_leeway_rate_' +
        wvc +
        '">0</td>' +
        '<td id="wind_time_interval_' +
        wvc +
        '">0.0</td>' +
        '<td id="wind_vector_degrees_' +
        wvc +
        '">000</td>' +
        '<td id="wind_vector_distance_' +
        wvc +
        '">0</td>' +
        '</tr>'
    )
    $(`#wind_time_start_${wvc}`).on('change', this.recalculate)
    $(`#wind_time_end_${wvc}`).on('change', this.recalculate)
    $(`#wind_from_direction_${wvc}`).on('change', this.recalculate)
    $(`#wind_speed_${wvc}`).on('change', this.recalculate)
  }
}

L.MarineVectors = function (map, missionId, csrftoken, posName, pos, poiId) {
  const contents = [
    '<div id="marinevectorsdialog">',
    '<table id="mvd_input_table"></table>',
    '<table id="mvd_curr_vectors"></table>',
    '<button class="btn btn-primary" id="curr_create">Add Current</button>',
    '<table id="mvd_wind_vectors"></table></div>',
    '<button class="btn btn-primary" id="wind_create">Add Wind</button>',
    '<h2>Resulting Total Drift Vector:</h2>',
    'Direction: <em id="tdv_result_direction"></em> &deg;T <br />',
    'Distance: <em id="tdv_result_distance"></em> NM',
    '<div><button class="btn btn-primary" id="tdv_show">Show</button>',
    '<div><button class="btn btn-primary" id="tdv_create">Create</button>',
    '<button class="btn btn-danger" id="tdv_cancel">Cancel</button></div>'
  ].join('')
  const marineVectorsDialog = L.control
    .dialog({ initOpen: true, size: [1000, 500] })
    .setContent(contents)
    .addTo(map)
    .hideClose()
  const marineVectors = new MarineVectors('mvd_input_table', 'mvd_curr_vectors', 'mvd_wind_vectors')
  let onMap = null

  marineVectors.populate_input_table()
  marineVectors.populate_data_tables()

  $('#LKP').val(posName)
  $('#LKP_lat').val(degreesToDM(pos.lat, true))
  $('#LKP_lng').val(degreesToDM(pos.lng, false))

  $('#curr_create').on('click', function () {
    marineVectors.newCurrentVector()
    marineVectors.recalculate()
  })
  $('#wind_create').on('click', function () {
    marineVectors.newWindVector()
    marineVectors.recalculate()
  })

  $('#tdv_cancel').on('click', function () {
    if (onMap !== null) {
      onMap.remove()
    }
    marineVectorsDialog.destroy()
  })
  const getData = function () {
    const data = [
      { name: 'from_lat', value: DMToDegrees($('#LKP_lat').val()) },
      { name: 'from_lng', value: DMToDegrees($('#LKP_lng').val()) },
      { name: 'poi_id', value: poiId },
      { name: 'leeway_multiplier', value: marineVectors.leewayData.multiplier },
      { name: 'leeway_modifier', value: marineVectors.leewayData.modifier },
      { name: 'curr_total', value: marineVectors.currentVectors.length },
      { name: 'wind_total', value: marineVectors.windVectors.length }
    ]
    for (const idx in marineVectors.currentVectors) {
      const currVector = marineVectors.currentVectors[idx]

      data.push({ name: 'curr_' + idx + '_from', value: currVector.timeFrom })
      data.push({ name: 'curr_' + idx + '_to', value: currVector.timeTo })
      data.push({ name: 'curr_' + idx + '_speed', value: currVector.currentSpeed })
      data.push({ name: 'curr_' + idx + '_direction', value: currVector.getCurrentVectorDirection() })
      data.push({ name: 'curr_' + idx + '_distance', value: currVector.getCurrentVectorDistance() })
    }

    for (const idx in marineVectors.windVectors) {
      const windVector = marineVectors.windVectors[idx]

      data.push({ name: 'wind_' + idx + '_from', value: windVector.timeFrom })
      data.push({ name: 'wind_' + idx + '_to', value: windVector.timeTo })
      data.push({ name: 'wind_' + idx + '_from_direction', value: windVector.windDirectionFrom })
      data.push({ name: 'wind_' + idx + '_speed', value: windVector.windSpeed })
      data.push({ name: 'wind_' + idx + '_direction', value: windVector.getWindVectorDirection() })
      data.push({ name: 'wind_' + idx + '_distance', value: windVector.getWindVectorDistance() })
    }

    return data
  }

  $('#tdv_show').on('click', function () {
    $.get(`/mission/${missionId}/sar/marine/vectors/create/`, getData(), function (data) {
      if (onMap !== null) {
        onMap.remove()
      }
      onMap = L.geoJSON(data, { color: 'yellow' })
      onMap.addTo(map)
    })
  })
  $('#tdv_create').on('click', function () {
    const data = getData()
    data.push({ name: 'csrfmiddlewaretoken', value: csrftoken })

    $.post(`/mission/${missionId}/sar/marine/vectors/create/`, data, function () {
      if (onMap !== null) {
        onMap.remove()
      }
      marineVectorsDialog.destroy()
    })
  })
}
