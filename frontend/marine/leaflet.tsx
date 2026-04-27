import React from 'react'
import * as ReactDOM from 'react-dom/client'
import L from 'leaflet'

import { MarineVectors, MarineVectorsDisplay } from '@canterbury-air-patrol/marine-total-drift-vector'
import { Button, ButtonGroup } from 'react-bootstrap'
import { smmGetJSON, smmPostBody } from '../ajax'

interface CustomMarineVectorsProps {
  map: L.Map
  missionId: number
  posName: string
  pos: L.LatLng
  poiId: number
  dialog: L.Control.Dialog
}

class CustomMarineVectors extends MarineVectors<CustomMarineVectorsProps> {
  onMap?: L.GeoJSON

  constructor(props: CustomMarineVectorsProps) {
    super(props)

    this.state.LKPLat = this.props.pos.lat
    this.state.LKPLon = this.props.pos.lng

    this.add = this.add.bind(this)
    this.cancel = this.cancel.bind(this)
    this.preview = this.preview.bind(this)
  }

  formatTime(time: Date) {
    return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
  }

  getData() {
    const data = {
      from_lat: this.props.pos.lat,
      from_lng: this.props.pos.lng,
      poi_id: this.props.poiId,
      leeway_multiplier: this.state.selectedLeeway.multiplier,
      leeway_modifier: this.state.selectedLeeway.modifier,
      curr_total: this.state.currentVectors.length,
      wind_total: this.state.windVectors.length
    }

    this.state.currentVectors.forEach((currVector, idx: number) => {
      data['curr_' + idx + '_from'] = this.formatTime(currVector.timeFrom)
      data['curr_' + idx + '_to'] = this.formatTime(currVector.timeTo)
      data['curr_' + idx + '_speed'] = currVector.getVectorSpeed()
      data['curr_' + idx + '_direction'] = currVector.getVectorDirection()
      data['curr_' + idx + '_distance'] = currVector.getVectorDistance()
    })

    this.state.windVectors.forEach((windVector, idx: number) => {
      data['wind_' + idx + '_from'] = this.formatTime(windVector.timeFrom)
      data['wind_' + idx + '_to'] = this.formatTime(windVector.timeTo)
      data['wind_' + idx + '_from_direction'] = windVector.direction
      data['wind_' + idx + '_speed'] = windVector.getVectorSpeed()
      data['wind_' + idx + '_direction'] = windVector.getVectorDirection()
      data['wind_' + idx + '_distance'] = windVector.getVectorDistance()
    })

    return data
  }

  add() {
    smmPostBody(
      `/mission/${this.props.missionId}/sar/marine/vectors/create/`,
      URLSearchParams(this.getData()),
      () => {
        if (this.onMap) {
          this.props.map.removeLayer(this.onMap)
          this.onMap = undefined
        }
        this.props.dialog.remove()
      },
      () => {
        console.error('Error fetching data:')
      }
    )
  }

  preview() {
    if (this.onMap) {
      this.props.map.removeLayer(this.onMap)
      this.onMap = undefined
    }
    smmGetJSON(
      `/mission/${this.props.missionId}/sar/marine/vectors/create/`,
      this.getData(),
      (data) => {
        this.onMap = L.geoJSON(data, { color: 'yellow' })
        this.onMap.addTo(this.props.map)
      },
      () => {
        console.error('Error fetching data:')
      }
    )
  }

  cancel() {
    if (this.onMap) {
      this.props.map.removeLayer(this.onMap)
      this.onMap = undefined
    }
    this.props.dialog.remove()
  }

  render() {
    this.recalculate()
    const actions = {
      updateField: this.updateField,
      updateCurrentData: this.updateCurrentData,
      updateCurrentTimeFrom: this.updateCurrentTimeFrom,
      updateCurrentTimeTo: this.updateCurrentTimeTo,
      updateLeewayData: this.updateLeewayData,
      updateWindData: this.updateWindData,
      updateWindTimeFrom: this.updateWindTimeFrom,
      updateWindTimeTo: this.updateWindTimeTo,
      addCurrentVector: this.addCurrentVector,
      addWindVector: this.addWindVector
    }
    return (
      <>
        <MarineVectorsDisplay data={{ ...this.state, distance: this.distance, bearing: this.bearing }} actions={actions} />
        <ButtonGroup>
          <Button onClick={this.add}>Create</Button>
          <Button onClick={this.preview} variant="warning">
            Preview
          </Button>
          <Button onClick={this.cancel} variant="danger">
            Cancel
          </Button>
        </ButtonGroup>
      </>
    )
  }
}

const MarineVectorsLeaflet = function (map: L.Map, missionId: number, posName, pos, poiId: number) {
  const container = document.createElement('div')
  const dialog = L.control.dialog({ initOpen: true, size: [1000, 500] })
  ReactDOM.createRoot(container).render(<CustomMarineVectors map={map} missionId={missionId} posName={posName} pos={pos} poiId={Number(poiId)} dialog={dialog} />)
  dialog.setContent(container).addTo(map).hideClose()
}

export { MarineVectorsLeaflet }
