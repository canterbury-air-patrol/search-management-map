interface AssetTypeData {
  id: number
  name: string
}

interface AssetData {
  id: number
  name: string
  type_id: number
  type_name: string
  owner: string
  status?: string
  status_inop?: boolean
  status_since?: string
  icon_url?: string
}

interface AssetFullStatusData {
  asset_id: number
  name: number
  asset_type: string
  owner: string
  last_command?: AssetCommandData
  mission_id?: number
  mission_name?: string
  current_search_id?: number
  queued_search_id?: number
  status?: AssetStatusData
}

interface AssetCommandData {
  id?: number
  action?: string
  action_txt?: string
  reason?: string
  issued?: string
  issued_by?: string
  response: {
    set?: string
    by?: string
    type?: string
    message?: string
  }
  latitude?: number
  longitude?: number
}

interface AssetStatusValueData {
  id: number
  name: string
  inop: boolean
  description: string
}

interface AssetStatusData {
  id: number
  asset: string
  asset_id: number
  status: string
  inop: boolean
  since: string
  notes: string
}

interface MissionAssetStatusData {
  id: number
  asset: string
  asset_id: number
  status: string
  status_description: string
  since: string
  notes: string
}

interface MissionAssetData {
  id: number
  name: string
  type_id: number
  type_name: string
  icon_url: string
  status?: MissionAssetStatusData
}

interface AssetPointTime {
  asset: number
  created_at: string
  heading?: number
  fix?: number
}

export { AssetTypeData, AssetData, AssetFullStatusData, AssetCommandData, AssetStatusValueData, AssetStatusData, MissionAssetData, AssetPointTime }
