import http, { ApiError } from './http'
import { NAVER_AUTHORIZATION_STATUSES } from '../types/naverAuthorization'
import type { NaverAuthorization, NaverCapabilities } from '../types/naverAuthorization'

export class NaverAuthorizationError extends ApiError {
  readonly outcomeUnknown: boolean
  constructor(message: string, status?: number, outcomeUnknown = false) {
    super(message, undefined, status)
    this.name = 'NaverAuthorizationError'
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function getNaverCapabilities(workspaceId: number, signal?: AbortSignal): Promise<NaverCapabilities> {
  const data = await request('GET', `${base(workspaceId)}/capabilities`, undefined, signal)
  const body = record(data)
  if (!body || body.mode !== 'SOLUTION_OAUTH' || typeof body.ready !== 'boolean'
    || typeof body.manualConnectionAllowed !== 'boolean' || !nullableString(body.reason)) throw invalidResponse()
  return body as NaverCapabilities
}

export async function startNaverAuthorization(workspaceId: number, options: {
  reconnectConnectionId?: number; marketplaceReceipt?: string
} = {}): Promise<NaverAuthorization> {
  if (options.reconnectConnectionId !== undefined && !positiveInteger(options.reconnectConnectionId)) throw invalidResponse()
  const body = await request('POST', `${base(workspaceId)}/authorizations`, options)
  const state = parseState(body, undefined, workspaceId)
  if (state.status !== 'WAITING_AUTH' || !state.launchUrl) throw invalidResponse(true)
  return state
}

export async function getNaverAuthorization(attemptId: string, signal?: AbortSignal): Promise<NaverAuthorization> {
  validateAttempt(attemptId)
  return parseState(await request('GET', `/api/integrations/naver/authorizations/${encodeURIComponent(attemptId)}`, undefined, signal), attemptId)
}

export async function reissueNaverAuthorization(state: NaverAuthorization): Promise<NaverAuthorization> {
  const next = parseState(await request('POST', `${attemptPath(state)}/launch-ticket`), state.attemptId, state.workspaceId)
  if (next.status !== 'WAITING_AUTH' || !next.launchUrl) throw invalidResponse(true)
  return next
}

export async function completeNaverAuthorization(state: NaverAuthorization, idempotencyKey: string): Promise<NaverAuthorization> {
  if (state.status !== 'REVIEW_REQUIRED' || !positiveInteger(state.reviewRevision) || !idempotencyKey) {
    throw new NaverAuthorizationError('연결 정보를 다시 확인해 주세요.', 400)
  }
  return parseState(await request('POST', `${attemptPath(state)}/complete`, {
    reviewRevision: state.reviewRevision,
  }, undefined, { 'Idempotency-Key': idempotencyKey }), state.attemptId, state.workspaceId)
}

export async function cancelNaverAuthorization(state: NaverAuthorization): Promise<NaverAuthorization> {
  return parseState(await request('POST', `${attemptPath(state)}/cancel`), state.attemptId, state.workspaceId)
}

export function trustedNaverLaunchUrl(value: string): string {
  const url = new URL(value, window.location.origin)
  if (url.origin !== window.location.origin || url.username || url.password
    || url.pathname !== '/open-api/integrations/naver/launch' || !url.searchParams.get('ticket') || url.hash) {
    throw new NaverAuthorizationError('인증 창 주소가 올바르지 않습니다. 연결 상태를 다시 확인해 주세요.')
  }
  return url.href
}

export function validNaverAttemptId(value: string | null): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(value)
}

async function request(method: 'GET' | 'POST', url: string, data?: unknown, signal?: AbortSignal, headers?: Record<string, string>): Promise<unknown> {
  let response
  try {
    // The browser-binding cookie is required for writes. Resolve every status
    // here to prevent the shared interceptor from refreshing/replaying a POST.
    response = await http.request<unknown>({ method, url, data, signal, headers,
      withCredentials: true, validateStatus: () => true, timeout: method === 'POST' ? 90_000 : 15_000 })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new NaverAuthorizationError(method === 'POST'
      ? '요청 결과를 확인할 수 없습니다. 연결 상태를 조회해 주세요.'
      : '연결 상태를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.', undefined, method === 'POST')
  }
  const payload = record(response.data)
  const result = record(payload?.result)
  if (response.status >= 200 && response.status < 300 && typeof result?.resultCode === 'number'
    && result.resultCode >= 200 && result.resultCode < 300 && payload && 'body' in payload) return payload.body
  const uncertain = method === 'POST' && (response.status < 400 || response.status === 408 || response.status >= 500)
  const description = [result?.resultMessage, result?.resultDescription].find((item) => typeof item === 'string' && item.trim() && !['에러', '잘못된 요청입니다', '성공'].includes(item))
  throw new NaverAuthorizationError(response.status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 연결 상태를 확인해 주세요.'
    : uncertain ? '요청 결과를 확인할 수 없습니다. 다시 연결을 확정하지 말고 현재 상태를 조회해 주세요.'
      : typeof description === 'string' ? description : '네이버 연결 요청을 처리할 수 없습니다.', response.status, uncertain)
}

function parseState(value: unknown, attemptId?: string, workspaceId?: number): NaverAuthorization {
  const body = record(value)
  const seller = record(body?.seller)
  const subscription = record(body?.subscription)
  if (!body || !validNaverAttemptId(typeof body.attemptId === 'string' ? body.attemptId : null)
    || (attemptId !== undefined && body.attemptId !== attemptId) || !positiveInteger(body.workspaceId)
    || (workspaceId !== undefined && body.workspaceId !== workspaceId)
    || !NAVER_AUTHORIZATION_STATUSES.includes(body.status as NaverAuthorization['status'])
    || (body.reviewRevision !== null && body.reviewRevision !== undefined && !(typeof body.reviewRevision === 'number' && Number.isSafeInteger(body.reviewRevision) && body.reviewRevision >= 0))
    || typeof body.expiresAt !== 'string' || !Number.isFinite(Date.parse(body.expiresAt))
    || !nullableString(body.launchUrl) || !nullableString(body.nextAction) || !nullableString(body.errorMessage)
    || (body.connectionId !== null && body.connectionId !== undefined && !positiveInteger(body.connectionId))
    || (body.seller != null && (!seller || typeof seller.name !== 'string' || !nullableString(seller.storeUrl)))
    || (body.subscription != null && (!subscription || typeof subscription.requiresApproval !== 'boolean'
      || !nullableString(subscription.planName) || !nullableString(subscription.billingDescription)))) throw invalidResponse(true)
  if (body.status === 'REVIEW_REQUIRED' && (!seller?.name || !subscription || !positiveInteger(body.reviewRevision))) throw invalidResponse(true)
  if (body.status === 'CONNECTED' && !positiveInteger(body.connectionId)) throw invalidResponse(true)
  return body as NaverAuthorization
}
function base(workspaceId: number): string {
  if (!positiveInteger(workspaceId)) throw new NaverAuthorizationError('워크스페이스를 다시 선택해 주세요.', 400)
  return `/api/workspaces/${workspaceId}/connections/naver`
}
function attemptPath(state: NaverAuthorization): string {
  validateAttempt(state.attemptId)
  return `${base(state.workspaceId)}/authorizations/${encodeURIComponent(state.attemptId)}`
}
function validateAttempt(value: string): void {
  if (!validNaverAttemptId(value)) throw new NaverAuthorizationError('올바르지 않은 연결 요청입니다.', 400)
}
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function positiveInteger(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 }
function nullableString(value: unknown): boolean { return value == null || typeof value === 'string' }
function invalidResponse(unknown = false): NaverAuthorizationError { return new NaverAuthorizationError('네이버 연결 응답을 확인할 수 없습니다. 현재 연결 상태를 다시 조회해 주세요.', undefined, unknown) }
