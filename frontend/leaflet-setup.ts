/**
 * Side-effect module that wires Leaflet's default marker icons to the
 * assets bundled by esbuild. Import once at the top of any entrypoint
 * that uses Leaflet markers (map.tsx, geomap.tsx, ...).
 */
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.prototype.options.iconUrl = markerIcon
L.Icon.Default.prototype.options.iconRetinaUrl = markerIcon2x
L.Icon.Default.prototype.options.shadowUrl = markerIconShadow
