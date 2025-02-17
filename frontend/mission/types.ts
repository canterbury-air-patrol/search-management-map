import { AssetData } from '../asset/types'
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
  id: number
  mission: number
  user: string
  user_id: number
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
  mission: number
  asset: AssetData
  creator: string
  added: string
  remover?: string
  removed?: string
  status?: {
    name: string
    since: string
  }
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

interface MissionExternalReferenceData {
  id?: number
  name: string
  code?: string
  url?: string
  notes?: string
  mission: number
}

interface MissionDetailsData {
  mission: MissionData
  me: string
  admin: boolean
  can_add_organizations: boolean
  can_add_users: boolean
  mission_organizations: Array<MissionOrganizationData>
  mission_assets: Array<MissionAssetData>
  mission_users: Array<MissionUserData>
  external_references: Array<MissionExternalReferenceData>
}

export {
  MissionData,
  MissionUserData,
  MissionAssetData,
  MissionAssetStatusValueData,
  MissionAssetStatusData,
  MissionOrganizationData,
  MissionExternalReferenceData,
  MissionDetailsData
}
