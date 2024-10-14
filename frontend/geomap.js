import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React from 'react'
import PropTypes from 'prop-types'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Polyline, Polygon, Marker, TileLayer } from 'react-leaflet'

import { mapCoordinates } from './geometry/details'

import './geomap.css'

class GeoJsonMap extends React.Component {
  constructor(props) {
    super(props)

    L.Icon.Default.prototype.options.iconUrl = markerIcon
    L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
    L.Icon.Default.prototype.options.shadowUrl = markerIconShadow
  }

  render() {
    const geometry = this.props.geometry
    const coordinates = mapCoordinates(geometry.coordinates)
    let firstPoint = [0, 0]
    const objects = []

    switch (geometry.type) {
      case 'LineString':
        firstPoint = coordinates[0]
        objects.push(<Polyline key="linestring" positions={coordinates} />)
        break
      case 'Polygon':
        firstPoint = coordinates[0][0]
        objects.push(<Polygon key="polygon" positions={coordinates} />)
        break
      case 'Point':
        firstPoint = coordinates
        objects.push(<Marker key="point" position={coordinates} />)
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
GeoJsonMap.propTypes = {
  geometry: PropTypes.object.isRequired
}

export { GeoJsonMap }
