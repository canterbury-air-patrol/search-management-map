import { Table } from 'react-bootstrap'

import React from 'react'
import PropTypes from 'prop-types'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

function coordinateToLatLng(point) {
  return {
    lat: point[1],
    lng: point[0]
  }
}

function mapCoordinates(points) {
  if (!Array.isArray(points[0])) {
    return coordinateToLatLng(points)
  }
  return points.map((p) => mapCoordinates(p))
}

class GeometryPoints extends React.Component {
  render() {
    let points = mapCoordinates(this.props.points)
    if (!Array.isArray(points)) {
      points = [points]
    }
    if (Array.isArray(points[0])) {
      points = points[0]
    }

    const tableRows = []
    for (const pointIdx in points) {
      tableRows.push(
        <tr key={pointIdx}>
          <td>{degreesToDM(points[pointIdx].lng)}</td>
          <td>{degreesToDM(points[pointIdx].lat, true)}</td>
        </tr>
      )
    }
    return (
      <Table responsive>
        <thead>
          <tr>
            <td>Longitude</td>
            <td>Latitude</td>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </Table>
    )
  }
}
GeometryPoints.propTypes = {
  points: PropTypes.array.isRequired
}

export { GeometryPoints, mapCoordinates }
