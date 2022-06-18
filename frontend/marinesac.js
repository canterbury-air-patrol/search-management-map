import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import * as ReactDOM from 'react-dom/client';

import { MarineSACTable } from '@canterbury-air-patrol/marine-search-area-coverage';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MarineSACTable />);