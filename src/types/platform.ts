export type ProviderType = 'META' | 'THREADS' | 'GOOGLE' | 'NAVER' | 'COUPANG'

export type PlatformType =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'THREADS'
  | 'GOOGLE_ADS'
  | 'NAVER_ADS'
  | 'NAVER_SMART_STORE'
  | 'COUPANG'

export type AssetType = 'AD_ACCOUNT' | 'PAGE' | 'PROFILE'

export type PlatformAssetResponse = {
  id: number
  externalId: string
  name: string
  platformType: PlatformType
  assetType: AssetType
  facebookPageId: string | null
}

export type PlatformConnectionResponse = {
  id: number
  workspaceId: number
  providerType: ProviderType
  externalAccountId: string
  accountName: string
  requiresReauth: boolean
  expiresAt: string | null
  assets: PlatformAssetResponse[]
}

export type MetaAuthorizeResponse = {
  authorizationUrl: string
  expiresInSeconds: number
}

export type MetaDiscoveredAsset = {
  externalId: string
  name: string
  platformType: PlatformType
  assetType: AssetType
  facebookPageId: string | null
}

export type MetaAssetSelection = {
  externalId: string
  platformType: PlatformType
  assetType: AssetType
}

export const META_ASSET_SELECT_MAX = 100
