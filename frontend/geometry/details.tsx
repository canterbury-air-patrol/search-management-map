import { Table } from 'react-bootstrap'

import React from 'react'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

interface Point {
  lat: number
  lng: number
  alt?: number
}

function coordinateToLatLng(point: number[]): Point {
  return {
    lat: point[1],
    lng: point[0]
  }
}

function mapCoordinates(points: number[][]): Point[] {
  return points.map(coordinateToLatLng)
}

interface GeometryPointsProps {
  points: [number, number] | [number, number][] | [number, number][][]
}

class GeometryPoints extends React.Component<GeometryPointsProps, never> {
  pointsFromProps() {
    if (!Array.isArray(this.props.points[0])) {
      return [coordinateToLatLng(this.props.points as [number, number])]
    } else if (Array.isArray(this.props.points[0][0])) {
      return mapCoordinates((this.props.points as [number, number][][])[0])
    } else {
      return mapCoordinates(this.props.points as [number, number][])
    }
  }

  render() {
    const points = this.pointsFromProps()

    const tableRows = points.map((point, index) => (
      <tr key={index}>
        <td>{degreesToDM(point.lng, 'lon')}</td>
        <td>{degreesToDM(point.lat, 'lat')}</td>
      </tr>
    ))
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

export { GeometryPoints, mapCoordinates, coordinateToLatLng }
