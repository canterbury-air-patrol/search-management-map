import { AssetData } from '../asset/types'

interface OrganizationData {
  id: number
  name: string
  created: string
  creator: string
  deleted?: string
  deleted_by?: string
  role: string
  assets?: OrganizationAssetData[]
  members?: OrganizationMemberData[]
}

interface OrganizationMemberData {
  id: number
  user: string
  role: string
  added: string
  added_by: string
  removed?: string
  removed_by?: string
  organization?: OrganizationData
}

interface OrganizationAssetData {
  id: number
  asset: AssetData
  added: string
  added_by: string
  removed?: string
  removed_by?: string
  organization?: OrganizationData
}

export { OrganizationData, OrganizationMemberData, OrganizationAssetData }
