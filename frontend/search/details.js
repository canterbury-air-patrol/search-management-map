import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'
import Collapsible from 'react-collapsible'

import $ from 'jquery'

import { SMMObjectDetails } from '../SMMObjects/details'
import { GeometryPoints } from '../geometry/details'
import { GeoJsonMap } from '../geomap'
import { ExpandingBoxSearch, SectorSearch } from '@canterbury-air-patrol/sar-search-patterns'
import { SearchRunner } from '@canterbury-air-patrol/sar-search-runner'

class SearchDetails extends SMMObjectDetails {
  renderModelSpecificData (tableRows, data) {
    tableRows.push((
      <tr key='search_type'>
        <td>Type:</td>
        <td>{data.search_type}</td>
      </tr>
    ))

    tableRows.push((
      <tr key='created_for'>
        <td>Asset Type:</td>
        <td>{data.created_for}</td>
      </tr>
    ))

    if (data.inprogress_by !== null) {
      tableRows.push((
        <tr key='inprogress_at'>
          <td>In Progress Since:</td>
          <td>{(new Date(data.inprogress_at)).toLocaleString()}</td>
        </tr>
      ))
      tableRows.push((
        <tr>
          <td>In Progress By:</td>
          <td>{data.inprogress_by}</td>
        </tr>
      ))
    }

    if (data.queued_at !== null) {
      tableRows.push((
        <tr key='queued_at'>
          <td>Queued:</td>
          <td>{(new Date(data.queued_at)).toLocaleString()}</td>
        </tr>
      ))
      if (data.queued_for !== null) {
        tableRows.push((
          <tr key='queued_for'>
            <td>Queued For:</td>
            <td>{data.queued_for}</td>
          </tr>
        ))
      }
    }

    if (data.sweep_width !== null) {
      tableRows.push((
        <tr key='sweep_width'>
          <td>Sweep Width:</td>
          <td>{data.sweep_width}m</td>
        </tr>
      ))
    }

    if (data.iterations !== null) {
      tableRows.push((
        <tr key='iterations'>
          <td>Iterations:</td>
          <td>{data.iterations}</td>
        </tr>
      ))
    }

    if (data.first_bearing !== null) {
      tableRows.push((
        <tr key='first_bearing'>
          <td>First Bearing:</td>
          <td>{data.first_bearing}</td>
        </tr>
      ))
    }

    if (data.width !== null) {
      tableRows.push((
        <tr key='width'>
          <td>Width:</td>
          <td>{data.width}m</td>
        </tr>
      ))
    }
  }
}

function createSearch (data) {
  if (data.search_type === 'Sector') {
    return new SectorSearch(data.sweep_width, 3, 3, 0)
  }
  if (data.search_type === 'Expanding Box') {
    return new ExpandingBoxSearch(data.sweep_width, data.iterations, data.first_bearing)
  }
  return null
}

class SearchDetailsPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: null,
      search: null,
      geometry: null
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
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

  updateDataResponse (data) {
    const search = createSearch(data.features['0'].properties)
    this.setState({
      data: data.features['0'].properties,
      search,
      geometry: data.features['0'].geometry
    })
  }

  async updateData () {
    await $.get(`/search/${this.props.searchId}/json/`, this.updateDataResponse)
  }

  render () {
    const parts = []
    if (this.state.data !== null) {
      parts.push((
        <SearchDetails key='details'
          data={this.state.data}
        />
      ))
    }
    if (this.state.search !== null) {
      parts.push((
        <Collapsible key='runner' trigger='Runner'>
          <SearchRunner search={this.state.search} />
        </Collapsible>
      ))
    }
    if (this.state.geometry !== null && this.state.geometry.points !== null) {
      parts.push((
        <Collapsible key='points' trigger='Coordinates'>
          <GeometryPoints
            points={this.state.geometry.coordinates}
          />
        </Collapsible>
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
SearchDetailsPage.propTypes = {
  searchId: PropTypes.number.isRequired,
  missionId: PropTypes.number.isRequired
}

function createSearchDetailsPage (elementId, missionId, searchId) {
  const div = ReactDOM.createRoot(document.getElementById(elementId))
  div.render(<SearchDetailsPage
    missionId={missionId}
    searchId={searchId}
    />)
}
export { SearchDetails, createSearchDetailsPage }

globalThis.createSearchDetailsPage = createSearchDetailsPage
