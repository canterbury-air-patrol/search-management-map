import { Table } from 'react-bootstrap'

import React from 'react'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

interface Point {
  lat: number
  lng: number
  alt?: number
}

/** A GeoJSON-style geometry tagged by its `type` field. Lets TypeScript
 *  narrow `coordinates` automatically instead of probing array depth. */
export type GeometryJSON =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }

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
  geometry: GeometryJSON
}

class GeometryPoints extends React.Component<GeometryPointsProps, never> {
  pointsFromGeometry(): Point[] {
    const { geometry } = this.props
    switch (geometry.type) {
      case 'Point':
        return [coordinateToLatLng(geometry.coordinates)]
      case 'LineString':
        return mapCoordinates(geometry.coordinates)
      case 'Polygon':
        return mapCoordinates(geometry.coordinates[0])
    }
  }

  render() {
    const points = this.pointsFromGeometry()

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
