import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type {
  NaverChannel,
  NaverChannelResponse,
  NaverConnectRequest,
  PlatformConnectionResponse,
} from '../types/platform'

export async function listNaverConnections(
  workspaceId: number,
  signal?: AbortSignal,
): Promise<PlatformConnectionResponse[]> {
  const { data } = await http.get<Api<PlatformConnectionResponse[]>>(
    `/api/workspaces/${workspaceId}/connections`, { signal },
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('연결 목록 응답이 올바르지 않습니다.')
  }
  return data.body.filter((connection) => connection.providerType === 'NAVER')
}

export async function connectNaver(
  workspaceId: number,
  request: NaverConnectRequest,
  signal?: AbortSignal,
): Promise<PlatformConnectionResponse> {
  // SELF never sends a seller identifier, including one left over from a form switch.
  const payload: NaverConnectRequest = {
    clientId: request.clientId.trim(),
    clientSecret: request.clientSecret,
    tokenType: request.tokenType,
    ...(request.tokenType === 'SELLER' ? { accountId: request.accountId?.trim() } : {}),
  }
  const { data } = await http.post<Api<PlatformConnectionResponse>>(
    `/api/workspaces/${workspaceId}/connections/naver`, payload, { signal },
  )
  if (!data?.body?.id || data.body.providerType !== 'NAVER') {
    throw new ApiError('네이버 연결 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function discoverNaverChannels(
  workspaceId: number,
  connectionId: number,
  signal?: AbortSignal,
): Promise<NaverChannel[]> {
  const { data } = await http.get<Api<NaverChannel[]>>(
    `/api/workspaces/${workspaceId}/connections/${connectionId}/naver/channels`, { signal },
  )
  if (!Array.isArray(data?.body) || !data.body.every(isChannel)) {
    throw new ApiError('네이버 채널 조회 응답이 올바르지 않습니다.')
  }
  return uniqueStoreChannels(data.body)
}

export async function selectNaverChannels(
  workspaceId: number,
  connectionId: number,
  channelNos: number[],
  signal?: AbortSignal,
): Promise<NaverChannelResponse[]> {
  const { data } = await http.post<Api<NaverChannelResponse[]>>(
    `/api/workspaces/${workspaceId}/connections/${connectionId}/naver/channels`,
    { channelNos: [...new Set(channelNos)] },
    { signal },
  )
  if (!Array.isArray(data?.body) || !data.body.every((item) => isChannel(item) && Number.isSafeInteger(item.assetId) && item.assetId > 0)) {
    throw new ApiError('네이버 채널 저장 응답이 올바르지 않습니다.')
  }
  return uniqueStoreChannels(data.body)
}

function isChannel(value: NaverChannel): boolean {
  return Boolean(value && Number.isSafeInteger(value.channelNo) && value.channelNo > 0
    && typeof value.channelType === 'string' && typeof value.name === 'string'
    && (value.url === null || typeof value.url === 'string'))
}

function uniqueStoreChannels<T extends NaverChannel>(channels: T[]): T[] {
  return [...new Map(channels.filter((channel) => channel.channelType === 'STOREFARM')
    .map((channel) => [channel.channelNo, channel])).values()]
}
