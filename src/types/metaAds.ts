export type DateRange = {
  since: string
  until: string
}

export type SavedMetaAdAccount = {
  assetId: number
  connectionId: number
  externalId: string
  name: string
  connectionName: string
  requiresReauth: boolean
}

export type MetaCampaign = {
  id: string
  name: string
  status: string
  effectiveStatus: string
  objective: string
}

export type MetaAdMetrics = {
  spend: number
  impressions: number
  clicks: number
  ctr: number | null
  cpc: number | null
  cpm: number | null
  purchaseValue: number
  roas: number | null
}

export type MetaAdDailyAverage = {
  spend: number
  impressions: number
  clicks: number
}

export type MetaCampaignPerformance = {
  campaignId: string
  campaignName: string
  metrics: MetaAdMetrics
  dailyAverage: MetaAdDailyAverage
}

export type MetaAdAccountSummary = {
  assetId: number
  connectionId: number
  adAccountId: string
  name: string
  currency: string
  timezoneName: string
  metrics: MetaAdMetrics
  dailyAverage: MetaAdDailyAverage
}

export type MetaAdCurrencyPerformance = {
  currency: string
  accountCount: number
  metrics: MetaAdMetrics
  dailyAverage: MetaAdDailyAverage
}

export type MetaAdAccountPerformanceResponse = DateRange & {
  days: number
  account: MetaAdAccountSummary
  campaigns: MetaCampaignPerformance[]
}

export type MetaAdWorkspacePerformanceResponse = DateRange & {
  days: number
  accountCount: number
  accounts: MetaAdAccountSummary[]
  totalsByCurrency: MetaAdCurrencyPerformance[]
}
