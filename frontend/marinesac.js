import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

import { MarineSACTable } from './MarineSAC/MarineSAC';

let sac_table = new MarineSACTable("sac_inputs", "data_table")
sac_table.populate_input_table()
sac_table.populate_table()