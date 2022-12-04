import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom/client'
import Collapsible from 'react-collapsible'

import $ from 'jquery'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'
import { SMMObjectDetails } from '../SMMObjects/details'

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

class SearchPoints extends React.Component {
  render () {
    const tableRows = []
    for (const pointIdx in this.props.points) {
      tableRows.push((
        <tr key={pointIdx}>
          <td>{degreesToDM(this.props.points[pointIdx][0])}</td>
          <td>{degreesToDM(this.props.points[pointIdx][1], true)}</td>
        </tr>
      ))
    }
    return (
      <Table>
        <thead>
          <tr>
            <td>Longitude</td>
            <td>Latitude</td>
          </tr>
        </thead>
        <tbody>
          { tableRows }
        </tbody>
      </Table>
    )
  }
}
SearchPoints.propTypes = {
  points: PropTypes.array.isRequired
}

class SearchDetailsPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: null,
      geometry: null
    }
  }

  componentDidMount () {
    this.updateData()
    $.ajaxSetup({ timeout: 2500 })
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get(`/search/${this.props.searchId}/json/`, function (data) {
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
        <SearchDetails key='details'
          data={this.state.data}
        />
      ))
    }
    if (this.state.geometry !== null && this.state.geometry.points !== null) {
      parts.push((
        <Collapsible key='points' trigger='Coordinates'>
          <SearchPoints
            points={this.state.geometry.coordinates}
          />
        </Collapsible>
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
