interface SMMSearchObjectDetailsData {
  pk: number
  created_at: string
  created_by: string
  created_for: string
  datum: number
  deleted_at?: string
  deleted_by?: string
  replaced_at?: string
  replaced_by?: string
  inprogress_at?: string
  inprogress_by?: string
  completed_at?: string
  completed_by?: string
  sweep_width: number
  queued_at?: string
  queued_for_asset?: string
  search_type: string
  iterations?: number
  first_bearing?: number
  width?: number
}

export { SMMSearchObjectDetailsData }
