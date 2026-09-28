import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type {
  NaverChannel,
  NaverChannelResponse,
  NaverConnectRequest,
  NaverSelfTestAvailability,
  PlatformConnectionResponse,
} from '../types/platform'

export class NaverSelfTestError extends ApiError {
  readonly outcomeUnknown: boolean

  constructor(message: string, resultCode?: number, status?: number, outcomeUnknown = false) {
    super(message, resultCode, status)
    this.name = 'NaverSelfTestError'
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function getNaverSelfTestAvailability(
  workspaceId: number,
  signal?: AbortSignal,
): Promise<NaverSelfTestAvailability> {
  const { data } = await http.get<Api<NaverSelfTestAvailability>>(
    `/api/workspaces/${workspaceId}/connections/naver/self-test`, { signal },
  )
  if (!data?.body || typeof data.body.available !== 'boolean'
    || !(data.body.reason === null || typeof data.body.reason === 'string')) {
    throw new ApiError('테스트 연결 가능 여부를 확인하지 못했습니다.')
  }
  return data.body
}

export async function connectNaverSelfTest(
  workspaceId: number,
  signal?: AbortSignal,
): Promise<PlatformConnectionResponse> {
  let response
  try {
    // Handle HTTP errors here so the shared 401 interceptor cannot replay a write.
    response = await http.post<Api<PlatformConnectionResponse>>(
      `/api/workspaces/${workspaceId}/connections/naver/self-test`, {},
      { signal, validateStatus: () => true, timeout: 90_000 },
    )
  } catch (error) {
    if (signal?.aborted) throw error
    throw new NaverSelfTestError('연결 결과를 확인할 수 없습니다. 연결 목록을 확인해 주세요.', undefined, undefined, true)
  }
  const { data, status } = response
  if (status >= 200 && status < 300 && data?.result?.resultCode >= 200 && data.result.resultCode < 300) {
    if (Number.isSafeInteger(data.body?.id) && data.body.id > 0 && data.body.workspaceId === workspaceId
      && data.body.providerType === 'NAVER' && Array.isArray(data.body.assets)
      && typeof data.body.requiresReauth === 'boolean') return data.body
    throw new NaverSelfTestError('연결 응답을 확인할 수 없습니다. 연결 목록을 확인해 주세요.', undefined, status, true)
  }
  const uncertain = status < 400 || status === 408 || status >= 500
  const description = [data?.result?.resultMessage, data?.result?.resultDescription]
    .find((item) => typeof item === 'string' && item.trim() && !['에러', '잘못된 요청입니다', '성공'].includes(item))
  throw new NaverSelfTestError(status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 연결 목록을 확인해 주세요.'
    : uncertain ? '연결 결과를 확인할 수 없습니다. 연결 목록을 확인해 주세요.'
      : description || '내 스토어를 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  data?.result?.resultCode, status, uncertain)
}

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
