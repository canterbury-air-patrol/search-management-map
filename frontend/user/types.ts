interface SMMMissionUserPointTimeData {
  pk: number
  user: string
  created_at: string
  alt?: number
}

interface SMMMissionUserPointTimeGeoJSON {
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: SMMMissionUserPointTimeData
}

export { SMMMissionUserPointTimeData, SMMMissionUserPointTimeGeoJSON }
