type SMMUserName = string | [string]

interface SMMMissionUserPointTimeData {
  pk: number
  user: SMMUserName
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

function userNameFromProperty(user: SMMUserName) {
  if (Array.isArray(user)) return user[0] ?? ''
  return user
}

export { SMMMissionUserPointTimeData, SMMMissionUserPointTimeGeoJSON, userNameFromProperty }
