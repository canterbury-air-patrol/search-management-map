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
  renderModelSpecificData (tableRows, data) {
    tableRows.push((
        <tr key='label'>
          <td>Label:</td>
          <td>{data.label}</td>
        </tr>
    ))
  }
}

class UserGeoDetailsPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: null,
      geometry: null
    }
  }

  componentDidMount () {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get(`/mission/${this.props.missionId}/data/${this.props.userGeoType}/${this.props.userGeoId}/json/`, function (data) {
      self.setState({
        data: data.features['0'].properties,
        geometry: data.features['0'].geometry
      })
    })
  }

  render () {
    const parts = []
    if (this.state.data !== null) {
      parts.push((
        <UserGeoDetails key='details'
          data={this.state.data}
        />
      ))
    }
    if (this.state.geometry !== null && this.state.geometry.points !== null) {
      parts.push((
        <GeometryPoints key='points'
            points={this.state.geometry.coordinates}
        />
      ))
      parts.push((
        <GeoJsonMap key='map'
          geometry={this.state.geometry}
        />
      ))
    }
    return (<div>
      {parts}
    </div>)
  }
}
UserGeoDetailsPage.propTypes = {
  userGeoType: PropTypes.string.isRequired,
  userGeoId: PropTypes.number.isRequired,
  missionId: PropTypes.number.isRequired
}

function createUserGeoDetailsPage (elementId, missionId, userGeoId, userGeoType) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<UserGeoDetailsPage
    missionId={missionId}
    userGeoId={userGeoId}
    userGeoType={userGeoType}
    />)
}
export { UserGeoDetailsPage, createUserGeoDetailsPage }

globalThis.createUserGeoDetailsPage = createUserGeoDetailsPage
