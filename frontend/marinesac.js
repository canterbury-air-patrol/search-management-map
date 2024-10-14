import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { MarineSACTable } from '@canterbury-air-patrol/marine-search-area-coverage'
import { SMMMissionTopBar } from './menu/topbar'

export function createMarineSACTable(elementId, missionId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))

  div.render(
    <>
      <SMMMissionTopBar missionId={missionId} />
      <MarineSACTable />
    </>
  )
}

globalThis.createMarineSACTable = createMarineSACTable
