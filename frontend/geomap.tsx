import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React from 'react'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Polyline, Polygon, Marker, TileLayer } from 'react-leaflet'

import { mapCoordinates, coordinateToLatLng } from './geometry/details'

import './geomap.css'

interface GeoJsonMapProps {
  geometry: {
    type: string
    coordinates: [number, number] | [number, number][] | [number, number][][]
  }
}

class GeoJsonMap extends React.Component<GeoJsonMapProps, never> {
  constructor(props: GeoJsonMapProps) {
    super(props)

    L.Icon.Default.prototype.options.iconUrl = markerIcon
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
    L.Icon.Default.prototype.options.shadowUrl = markerIconShadow
  }

  render() {
    const geometry = this.props.geometry
    let firstPoint = { lat: 0, lng: 0 }
    const objects = []

    switch (geometry.type) {
      case 'LineString':
        {
          const coordinates = mapCoordinates(geometry.coordinates as [number, number][])
          firstPoint = coordinates[0]
          objects.push(<Polyline key="linestring" positions={coordinates} />)
        }
        break
      case 'Polygon':
        {
          const coordinates = mapCoordinates((geometry.coordinates as [number, number][][])[0])
          firstPoint = coordinates[0]
          objects.push(<Polygon key="polygon" positions={coordinates} />)
        }
        break
      case 'Point':
        firstPoint = coordinateToLatLng(geometry.coordinates as [number, number])
        objects.push(<Marker key="point" position={firstPoint} />)
        break
      default:
        break
    }

    const tileLayers = [
      <TileLayer
        key="layer-base"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    ]

    return (
      <MapContainer center={firstPoint} zoom={13} className="dialog-map">
        {tileLayers}
        {objects}
      </MapContainer>
    )
  }
}

export { GeoJsonMap }
