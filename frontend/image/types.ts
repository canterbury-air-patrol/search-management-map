interface SMMImageData {
  pk: number
  created_at: string
  description: string
  priority: boolean
}

interface SMMImageGeoJSON {
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: SMMImageData
}

export { SMMImageData, SMMImageGeoJSON }
