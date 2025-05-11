interface SMMUserGeoLabelData {
  pk: number
  created_at: string
  created_by: string
  deleted_at?: string
  deleted_by?: string
  replaced_at?: string
  replaced_by?: string
  label: string
}

interface SMMUserGeoLineGeoJSON {
  properties: SMMUserGeoLabelData
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export { SMMUserGeoLabelData, SMMUserGeoLineGeoJSON }
