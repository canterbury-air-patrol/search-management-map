import $ from 'jquery'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import { MarineVectors } from './MarineVectors/MarineVectors'

const vectors = new MarineVectors('vector_inputs_table', 'current_vectors', 'wind_vectors')

vectors.populate_input_table()
vectors.populate_data_tables()

$('#btn_current_vector').on('click', function (e) {
  vectors.newCurrentVector()
  vectors.recalculate()
  e.preventDefault()
})
$('#btn_wind_vector').on('click', function (e) {
  vectors.newWindVector()
  vectors.recalculate()
  e.preventDefault()
})
