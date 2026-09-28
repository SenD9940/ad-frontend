export type MetaCampaignObjective =
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES'

export type MetaAdObjective = 'OUTCOME_TRAFFIC' | 'OUTCOME_SALES'

export type MetaSpecialAdCategory =
  | 'CREDIT'
  | 'EMPLOYMENT'
  | 'FINANCIAL_PRODUCTS_SERVICES'
  | 'HOUSING'
  | 'ISSUES_ELECTIONS_POLITICS'
  | 'ONLINE_GAMBLING_AND_GAMING'

export type MetaCallToAction =
  | 'LEARN_MORE'
  | 'SHOP_NOW'
  | 'SIGN_UP'
  | 'CONTACT_US'
  | 'BOOK_TRAVEL'
  | 'DOWNLOAD'
  | 'GET_QUOTE'
  | 'APPLY_NOW'
  | 'GET_OFFER'

export type MetaCampaignCreateRequest = {
  name: string
  objective: MetaCampaignObjective
  specialAdCategories: MetaSpecialAdCategory[]
  specialAdCategoryCountry?: string[]
}

export type MetaAdCreateRequest = {
  campaign: Omit<MetaCampaignCreateRequest, 'objective'> & { objective: MetaAdObjective }
  adSet: {
    name: string
    dailyBudget: number
    countries: string[]
    ageMin: number
    ageMax: number
    pixelId?: string
  }
  ad: {
    name: string
    pageAssetId: number
    instagramAssetId?: number
    linkUrl: string
    message: string
    headline: string
    description?: string
    callToAction: MetaCallToAction
  } & ({ imageKey: string; imageUrl?: never } | { imageUrl: string; imageKey?: never })
}

export type MetaAdCreateResult = {
  assetId: number
  adAccountId: string
  campaignId: string | null
  adSetId: string | null
  creativeId: string | null
  adId: string | null
  // This is the operation outcome. Every created Meta object remains PAUSED.
  status: 'CREATED' | 'FAILED' | 'UNKNOWN'
  failedStep: 'CAMPAIGN' | 'AD_SET' | 'CREATIVE' | 'AD' | null
  message: string
}

export type MetaCampaignCreateResult = { id: string }
