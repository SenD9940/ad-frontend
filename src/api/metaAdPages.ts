import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { MetaDiscoveredAsset, PlatformAssetResponse } from '../types/platform'

export async function listMetaAdPages(workspaceId: number, assetId: number): Promise<MetaDiscoveredAsset[]> {
  const { data } = await http.get<Api<MetaDiscoveredAsset[]>>(`/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/pages`, { timeout: 45_000 })
  if (!Array.isArray(data?.body)) throw new ApiError('광고 계정의 페이지 조회 응답이 올바르지 않습니다.')
  return data.body.filter((asset) => asset.platformType === 'FACEBOOK' && asset.assetType === 'PAGE')
}

export async function saveMetaAdPage(workspaceId: number, assetId: number, externalId: string): Promise<PlatformAssetResponse[]> {
  const { data } = await http.post<Api<PlatformAssetResponse[]>>(`/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/pages`, { externalId }, { timeout: 45_000 })
  if (!Array.isArray(data?.body)) throw new ApiError('페이지 저장 응답이 올바르지 않습니다.')
  return data.body
}
