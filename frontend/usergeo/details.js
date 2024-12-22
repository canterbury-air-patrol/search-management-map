import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'

import $ from 'jquery'

import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints } from '../geometry/details'
import { GeoJsonMap } from '../geomap'

class UserGeoDetails extends SMMObjectDetails {
  renderModelSpecificData(tableRows, data) {
    tableRows.push(
      <tr key="label">
        <td>Label:</td>
        <td>{data.label}</td>
      </tr>
    )
  }
}

class UserGeoDetailsPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      data: null,
      geometry: null
    }

    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data) {
    this.setState({
      data: data.features['0'].properties,
      geometry: data.features['0'].geometry
    })
  }

  async updateData() {
    await $.getJSON(`/data/usergeo/${this.props.userGeoId}/`, this.updateDataResponse)
  }

  render() {
    const parts = []
    if (this.state.data !== null) {
      parts.push(<UserGeoDetails key="details" data={this.state.data} />)
    }
    if (this.state.geometry !== null && this.state.geometry.points !== null) {
      parts.push(<GeometryPoints key="points" points={this.state.geometry.coordinates} />)
      parts.push(<GeoJsonMap key="map" geometry={this.state.geometry} />)
    }
    return <div>{parts}</div>
  }
}
UserGeoDetailsPage.propTypes = {
  userGeoId: PropTypes.number.isRequired,
  missionId: PropTypes.number.isRequired
}

function createUserGeoDetailsPage(elementId, missionId, userGeoId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<UserGeoDetailsPage missionId={missionId} userGeoId={userGeoId} />)
}
export { UserGeoDetailsPage, createUserGeoDetailsPage }

globalThis.createUserGeoDetailsPage = createUserGeoDetailsPage
