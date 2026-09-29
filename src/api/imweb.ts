import http, { ApiError } from './http'
import { keysToSnakeCase } from './case'
import type { Api } from '../types/api'
import type { ImwebCapabilities, ImwebProductOptions, ImwebProductRequest, ImwebProductResult, ImwebProducts, ImwebSales, ImwebSalesSummary, ImwebStore, ImwebUnit } from '../types/imweb'
import type { NaverDateRange } from '../pages/workspace/naverPerformanceDates'

export class ImwebWriteError extends ApiError {
  readonly outcomeUnknown: boolean
  constructor(message: string, outcomeUnknown = false, status?: number) { super(message, undefined, status); this.name = 'ImwebWriteError'; this.outcomeUnknown = outcomeUnknown }
}
export async function getImwebCapabilities(workspaceId: number, signal?: AbortSignal): Promise<ImwebCapabilities> {
  const value = await read<ImwebCapabilities>(`${connectionBase(workspaceId)}/capabilities`, signal)
  if (!value || typeof value.enabled !== 'boolean' || !nullableText(value.disabledReason)) throw invalid('아임웹 연결 설정')
  return value
}
export async function authorizeImweb(workspaceId: number, siteCode: string): Promise<string> {
  if (!/^S[A-Za-z0-9]{5,99}$/.test(siteCode)) throw new ApiError('아임웹에서 전달된 사이트 정보를 확인하지 못했습니다. 아임웹에서 연결을 다시 시작해 주세요.')
  const value = await write<{ authorizationUrl: string }>(`${connectionBase(workspaceId)}/authorize`, { siteCode })
  try {
    const url = new URL(value.authorizationUrl)
    if (url.origin !== 'https://openapi.imweb.me' || url.pathname !== '/oauth2/authorize' || url.username || url.password || url.hash) throw new Error()
    return url.href
  } catch { throw invalid('아임웹 인증 주소') }
}
export async function getImwebUnits(workspaceId: number, connectionId: number, signal?: AbortSignal): Promise<ImwebUnit[]> {
  const value = await read<ImwebUnit[]>(unitsPath(workspaceId, connectionId), signal)
  if (!Array.isArray(value) || !value.every(item => item && text(item.unitCode) && text(item.name) && currency(item.currency) && nullableText(item.storeUrl) && typeof item.selected === 'boolean')
    || new Set(value.map(item => item.unitCode)).size !== value.length) throw invalid('아임웹 스토어 목록')
  return value
}
export async function saveImwebUnits(workspaceId: number, connectionId: number, unitCodes: string[]): Promise<ImwebStore[]> {
  if (!unitCodes.length || unitCodes.length > 100 || new Set(unitCodes).size !== unitCodes.length || !unitCodes.every(code => /^u[A-Za-z0-9]{5,99}$/.test(code))) throw new ApiError('사용할 아임웹 스토어를 1~100개 선택해 주세요.')
  const value = await write<ImwebStore[]>(unitsPath(workspaceId, connectionId), { unitCodes })
  if (!stores(value)) throw new ImwebWriteError('저장 결과를 확인하지 못했습니다. 자산 목록을 새로 조회해 주세요.', true)
  return value
}
export async function listImwebStores(workspaceId: number, signal?: AbortSignal): Promise<ImwebStore[]> {
  const value = await read<ImwebStore[]>(storeBase(workspaceId), signal)
  if (!stores(value)) throw invalid('저장된 아임웹 스토어')
  return value
}
export async function getImwebProducts(workspaceId: number, assetId: number, page: number, signal?: AbortSignal): Promise<ImwebProducts> {
  const value = await read<ImwebProducts>(`${storeBase(workspaceId, assetId)}/products`, signal, { page, size: 20 })
  if (!value || value.assetId !== assetId || !text(value.unitCode) || value.page !== page || value.size !== 20 || typeof value.hasNext !== 'boolean'
    || !nullableInteger(value.totalElements) || !timestamp(value.fetchedAt) || !Array.isArray(value.items)
    || !value.items.every(item => item && numericId(item.productId) && text(item.name) && text(item.status) && nullableText(item.imageUrl)
      && nullableNumber(item.salePrice) && nullableNumber(item.originalPrice) && nullableInteger(item.stockQuantity))) throw invalid('판매 중인 상품')
  return value
}
export async function getImwebSales(workspaceId: number, assetId: number, period: NaverDateRange, signal?: AbortSignal): Promise<ImwebSales> {
  const value = await read<ImwebSales>(`${storeBase(workspaceId, assetId)}/sales`, signal, period, 120_000)
  const expected = (Date.parse(`${period.until}T00:00:00Z`) - Date.parse(`${period.since}T00:00:00Z`)) / 86_400_000 + 1
  if (!value || value.assetId !== assetId || !text(value.unitCode) || value.since !== period.since || value.until !== period.until
    || value.timeZone !== 'Asia/Seoul' || value.basis !== 'ORDER_CREATED' || !currency(value.currency) || value.complete !== true
    || !summary(value.summary) || !timestamp(value.fetchedAt) || typeof value.notice !== 'string' || !Array.isArray(value.daily)
    || value.daily.length !== expected || new Set(value.daily.map(item => item?.date)).size !== expected
    || !value.daily.every(item => item && summary(item) && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.date >= period.since && item.date <= period.until
      && timestamp(`${item.date}T00:00:00Z`) && new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) === item.date)) {
    throw new ApiError('전체 기간의 아임웹 판매 성과를 확인하지 못했습니다. 불완전한 합계는 표시하지 않습니다.')
  }
  return value
}
export async function getImwebProductOptions(workspaceId: number, assetId: number, signal?: AbortSignal): Promise<ImwebProductOptions> {
  const value = await read<ImwebProductOptions>(`${storeBase(workspaceId, assetId)}/product-options`, signal)
  if (!value || !Array.isArray(value.categories) || !value.categories.every(item => item && text(item.code) && text(item.name))
    || !currency(value.currency) || !text(value.unitCode) || (value.enabled !== undefined && typeof value.enabled !== 'boolean')
    || (value.disabledReason !== undefined && !nullableText(value.disabledReason))) throw invalid('아임웹 상품 등록 정보')
  return value
}
export async function createImwebProduct(workspaceId: number, assetId: number, request: ImwebProductRequest, files: File[]): Promise<ImwebProductResult> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify(keysToSnakeCase(request))], { type: 'application/json' }))
  files.forEach(file => form.append('files', file))
  const value = await write<ImwebProductResult>(`${storeBase(workspaceId, assetId)}/products`, form, 180_000)
  if (!value || !numericId(value.productId) || !nullableText(value.productCode) || !['CREATED', 'DETAIL_PENDING'].includes(value.status)
    || typeof value.detailApplied !== 'boolean' || !text(value.notice)) throw new ImwebWriteError('상품 등록 결과를 확인할 수 없습니다. 아임웹 관리자에서 생성 여부를 확인해 주세요.', true)
  return value
}
async function read<T>(url: string, signal?: AbortSignal, params?: object, timeout = 60_000): Promise<T> {
  const { data } = await http.get<Api<T>>(url, { signal, params, timeout })
  if (!data?.body) throw invalid('아임웹')
  return data.body
}
async function write<T>(url: string, data: unknown, timeout = 90_000): Promise<T> {
  let response
  try {
    // Explicitly accept HTTP errors to prevent the shared interceptor from replaying writes on 401.
    response = await http.post<Api<T>>(url, data, { timeout, withCredentials: true, validateStatus: () => true,
      ...(data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {}) })
  } catch { throw new ImwebWriteError('요청 결과를 확인하지 못했습니다. 다시 요청하기 전에 아임웹 관리자와 저장된 목록을 확인해 주세요.', true) }
  const result = response.data?.result
  if (response.status >= 200 && response.status < 300 && result && result.resultCode >= 200 && result.resultCode < 300 && response.data.body != null) return response.data.body
  const unknown = response.status < 400 || response.status === 408 || response.status >= 500
  const message = [result?.resultMessage, result?.resultDescription].find(item => text(item) && !['성공', '에러', '잘못된 요청입니다'].includes(item))
  throw new ImwebWriteError(response.status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 현재 상태를 확인해 주세요.'
    : message || (unknown ? '요청 결과를 확인하지 못했습니다. 아임웹 관리자에서 처리 여부를 확인해 주세요.' : '아임웹 요청을 처리하지 못했습니다.'), unknown, response.status)
}
function stores(value: ImwebStore[]): boolean { return Array.isArray(value) && value.every(item => item && id(item.assetId) && id(item.connectionId) && text(item.siteCode) && text(item.unitCode) && text(item.name) && currency(item.currency) && nullableText(item.storeUrl) && nullableText(item.connectionName) && typeof item.requiresReauth === 'boolean') }
function summary(value: ImwebSalesSummary): boolean { return Boolean(value && number(value.paymentAmount) && number(value.refundedAmount) && number(value.remainingPaymentAmount) && integer(value.paidOrderCount) && integer(value.orderCount) && number(value.averageOrderAmount)) }
function connectionBase(workspaceId: number): string { validateId(workspaceId); return `/api/workspaces/${workspaceId}/connections/imweb` }
function unitsPath(workspaceId: number, connectionId: number): string { validateId(workspaceId); validateId(connectionId); return `/api/workspaces/${workspaceId}/connections/${connectionId}/imweb/units` }
function storeBase(workspaceId: number, assetId?: number): string { validateId(workspaceId); if (assetId !== undefined) validateId(assetId); return `/api/workspaces/${workspaceId}/imweb/stores${assetId === undefined ? '' : `/${assetId}`}` }
function validateId(value: number): void { if (!id(value)) throw new ApiError('워크스페이스와 스토어를 다시 선택해 주세요.') }
function invalid(label: string): ApiError { return new ApiError(`${label} 응답을 확인할 수 없습니다. 다시 조회해 주세요.`) }
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
function nullableText(value: unknown): boolean { return value === null || typeof value === 'string' }
function number(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 }
function integer(value: unknown): boolean { return number(value) && Number.isSafeInteger(value) }
function id(value: unknown): boolean { return integer(value) && (value as number) > 0 }
function numericId(value: unknown): boolean { return typeof value === 'string' && /^[1-9]\d*$/.test(value) }
function nullableNumber(value: unknown): boolean { return value === null || number(value) }
function nullableInteger(value: unknown): boolean { return value === null || integer(value) }
function currency(value: unknown): boolean { return typeof value === 'string' && /^[A-Z]{3}$/.test(value) }
function timestamp(value: unknown): boolean { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
