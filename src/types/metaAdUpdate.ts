export type MetaAdObjectType = 'ad' | 'ad-set' | 'campaign'

export type MetaAdUpdateStatus = 'ACTIVE' | 'PAUSED'

// Only opted-in fields are included in an update. The API also treats null as
// omitted; dailyBudget is supported only for ad sets and campaigns.
export type MetaAdUpdatePatch = {
  name?: string | null
  status?: MetaAdUpdateStatus | null
  dailyBudget?: number | null
}

export type MetaAdUpdateResult = {
  id: string
  success: true
}
