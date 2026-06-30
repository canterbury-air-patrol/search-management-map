import { Table } from 'react-bootstrap'

import { degreesToDM } from '@canterbury-air-patrol/deg-converter'

interface Point {
  lat: number
  lng: number
  alt?: number
}

/** A GeoJSON-style geometry tagged by its `type` field. Lets TypeScript
 *  narrow `coordinates` automatically instead of probing array depth. */
export type GeometryJSON =
  { type: 'Point'; coordinates: [number, number] } | { type: 'LineString'; coordinates: [number, number][] } | { type: 'Polygon'; coordinates: [number, number][][] }

function coordinateToLatLng(point: number[]): Point {
  return {
    lat: point[1] ?? 0,
    lng: point[0] ?? 0
  }
}

function mapCoordinates(points: number[][]): Point[] {
  return points.map(coordinateToLatLng)
}

interface GeometryPointsProps {
  geometry: GeometryJSON
}

function pointsFromGeometry(geometry: GeometryJSON): Point[] {
  switch (geometry.type) {
    case 'Point':
      return [coordinateToLatLng(geometry.coordinates)]
    case 'LineString':
      return mapCoordinates(geometry.coordinates)
    case 'Polygon': {
      const ring = geometry.coordinates[0]
      return ring ? mapCoordinates(ring) : []
    }
  }
}

function GeometryPoints({ geometry }: GeometryPointsProps) {
  const points = pointsFromGeometry(geometry)
  return (
    <Table responsive>
      <thead>
        <tr>
          <td>Longitude</td>
          <td>Latitude</td>
        </tr>
      </thead>
      <tbody>
        {points.map((point, index) => (
          <tr key={index}>
            <td>{degreesToDM(point.lng, 'lon')}</td>
            <td>{degreesToDM(point.lat, 'lat')}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export { GeometryPoints, mapCoordinates, coordinateToLatLng }
