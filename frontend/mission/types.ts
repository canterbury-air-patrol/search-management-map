import { OrganizationData } from '../organization/types'

interface MissionData {
  id: number
  name: string
  description: string
  started: string
  creator: string
  closed?: string
  closed_by?: string
  admin: boolean
}

interface MissionUserData {
  mission: number
  user: string
  creator: string
  added: string
  permissions: {
    admin: boolean
    add_organization: boolean
    add_user: boolean
  }
}

interface MissionAssetData {
  id: number
  name: string
  type_id: number
  type_name: string
  icon_url?: string
  status?: MissionAssetStatusData
}

interface MissionAssetStatusValueData {
  id: number
  name: string
  description: string
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

interface MissionOrganizationData {
  mission: number
  organization: OrganizationData
  creator: string
  added: string
  permissions: {
    add_organization: boolean
    add_user: boolean
  }
}

export { MissionData, MissionUserData, MissionAssetData, MissionAssetStatusValueData, MissionAssetStatusData, MissionOrganizationData }
