import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type {
  MetaAssetSelection,
  MetaAuthorizeResponse,
  MetaDiscoveredAsset,
  PlatformAssetResponse,
  PlatformConnectionResponse,
} from '../types/platform'

function authorizeBaseUrl(): string {
  const origin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '')
  if (origin) {
    return origin
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8480'
  }
  return import.meta.env.VITE_API_BASE_URL ?? ''
}

export async function startMetaAuthorization(
  workspaceId: number,
): Promise<MetaAuthorizeResponse> {
  const { data } = await http.post<Api<MetaAuthorizeResponse>>(
    `/api/workspaces/${workspaceId}/connections/meta/authorize`,
    undefined,
    {
      baseURL: authorizeBaseUrl(),
      withCredentials: true,
    },
  )
  if (!data?.body?.authorizationUrl) {
    throw new ApiError('Meta 연결 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function listPlatformConnections(
  workspaceId: number,
): Promise<PlatformConnectionResponse[]> {
  const { data } = await http.get<Api<PlatformConnectionResponse[]>>(
    `/api/workspaces/${workspaceId}/connections`,
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('연결 목록 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function discoverMetaAssets(
  workspaceId: number,
  connectionId: number,
): Promise<MetaDiscoveredAsset[]> {
  const { data } = await http.get<Api<MetaDiscoveredAsset[]>>(
    `/api/workspaces/${workspaceId}/connections/${connectionId}/meta/assets`,
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('Meta 자산 조회 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function selectMetaAssets(
  workspaceId: number,
  connectionId: number,
  assets: MetaAssetSelection[],
): Promise<PlatformAssetResponse[]> {
  const { data } = await http.post<Api<PlatformAssetResponse[]>>(
    `/api/workspaces/${workspaceId}/connections/${connectionId}/meta/assets`,
    { assets },
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('자산 저장 응답이 올바르지 않습니다.')
  }
  return data.body
}
