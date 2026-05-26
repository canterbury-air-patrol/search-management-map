import L from 'leaflet'

export function flattenPoints(points: L.LatLng[]): Record<string, string | number> {
  const data: Record<string, string | number> = { points: points.length }
  points.forEach((p, i) => {
    data[`point${i}_lat`] = p.lat
    data[`point${i}_lng`] = p.lng
  })
  return data
}
