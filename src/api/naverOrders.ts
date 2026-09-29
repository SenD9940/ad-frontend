import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { NaverOrder, NaverOrderActionRequest, NaverOrderActionResult, NaverOrderClaim, NaverOrderDetail, NaverOrderOption, NaverOrderOptions, NaverOrderQuery, NaverOrders, NaverSettlements } from '../types/naverOrder'

export class NaverOrderWriteError extends ApiError {
  readonly outcomeUnknown: boolean
  constructor(message: string, unknown = false, status?: number) { super(message, undefined, status); this.name = 'NaverOrderWriteError'; this.outcomeUnknown = unknown }
}
export async function getNaverOrderOptions(workspaceId: number, assetId: number, signal?: AbortSignal): Promise<NaverOrderOptions> {
  const value = await read<NaverOrderOptions>(`${base(workspaceId, assetId)}/order-options`, signal)
  if (!value || ![value.rangeTypes, value.statuses, value.deliveryMethods, value.carriers].every(options)
    || !value.rangeTypes.length || typeof value.settlementAvailable !== 'boolean' || !nullableText(value.settlementUnavailableReason)) throw invalid()
  return value
}
export async function getNaverOrders(workspaceId: number, assetId: number, query: NaverOrderQuery, signal?: AbortSignal): Promise<NaverOrders> {
  const value = await read<NaverOrders>(`${base(workspaceId, assetId)}/orders`, signal, { date: query.date, range_type: query.rangeType, ...(query.status ? { status: query.status } : {}), page: query.page, size: 20 })
  if (!value || !page(value, assetId, query.page) || value.date !== query.date || value.rangeType !== query.rangeType
    || (value.status || '') !== query.status || !Array.isArray(value.items) || !value.items.every(order)
    || new Set(value.items.map(item => item.productOrderId)).size !== value.items.length) throw invalid()
  return value
}
export async function getNaverOrderDetail(workspaceId: number, assetId: number, productOrderId: string, signal?: AbortSignal): Promise<NaverOrderDetail> {
  validateOrderId(productOrderId)
  const value = await read<NaverOrderDetail>(`${base(workspaceId, assetId)}/orders/${productOrderId}`, signal)
  if (!value || value.assetId !== assetId || !numericId(value.channelNo) || !order(value.order) || value.order.productOrderId !== productOrderId
    || !nullableText(value.paymentMeans) || !nullableTime(value.paymentDueDate) || !nullableTime(value.shippingDueDate) || !nullableText(value.shippingMemo)
    || (value.recipient !== null && (!value.recipient || !['name', 'tel1', 'tel2', 'zipCode', 'baseAddress', 'detailedAddress', 'country'].every(key => nullableText(value.recipient![key as keyof typeof value.recipient]))))
    || (value.delivery !== null && (!value.delivery || !['method', 'company', 'trackingNumber', 'status'].every(key => nullableText(value.delivery![key as keyof typeof value.delivery]))
      || ![value.delivery.sendDate, value.delivery.pickupDate, value.delivery.deliveredDate].every(nullableTime) || !(value.delivery.wrongTrackingNumber === null || typeof value.delivery.wrongTrackingNumber === 'boolean')))
    || !Array.isArray(value.currentClaims) || !value.currentClaims.every(claim) || !Array.isArray(value.completedClaims) || !value.completedClaims.every(claim)
    || typeof value.version !== 'string' || !/^[a-f0-9]{64}$/.test(value.version) || !Array.isArray(value.actions)
    || !value.actions.every(action => action && ['CONFIRM', 'DISPATCH', 'APPROVE_CANCEL', 'APPROVE_RETURN'].includes(action.code) && text(action.label) && typeof action.description === 'string')
    || !nullableText(value.actionNotice) || !timestamp(value.fetchedAt)) throw invalid()
  return value
}
export async function applyNaverOrderAction(workspaceId: number, assetId: number, productOrderId: string, request: NaverOrderActionRequest): Promise<NaverOrderActionResult> {
  validateOrderId(productOrderId)
  let response
  try {
    // A provider mutation must never be replayed by the shared 401 refresh interceptor.
    response = await http.post<Api<NaverOrderActionResult>>(`${base(workspaceId, assetId)}/orders/${productOrderId}/actions`, request, { timeout: 180_000, validateStatus: () => true })
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 403) throw new NaverOrderWriteError(error.message, false, error.status)
    throw new NaverOrderWriteError('처리 결과를 확인하지 못했습니다. 다시 요청하기 전에 스마트스토어 판매자센터에서 주문 상태를 확인해 주세요.', true)
  }
  const result = response.data?.result, value = response.data?.body
  if (response.status >= 200 && response.status < 300 && result && result.resultCode >= 200 && result.resultCode < 300) {
    if (value && value.productOrderId === productOrderId && value.action === request.action && value.status === 'ACCEPTED' && text(value.notice)) return value
    throw new NaverOrderWriteError('처리 응답을 확인하지 못했습니다. 스마트스토어 판매자센터에서 주문 상태를 확인해 주세요.', true)
  }
  const unknown = response.status < 400 || response.status === 408 || response.status >= 500
  const message = [result?.resultMessage, result?.resultDescription].find(item => text(item) && !['성공', '에러', '잘못된 요청입니다'].includes(item))
  throw new NaverOrderWriteError(response.status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 주문 상태를 확인해 주세요.' : message || '주문을 처리하지 못했습니다. 최신 상태를 다시 조회해 주세요.', unknown, response.status)
}
export async function getNaverSettlements(workspaceId: number, assetId: number, since: string, until: string, pageNumber: number, signal?: AbortSignal): Promise<NaverSettlements> {
  const value = await read<NaverSettlements>(`${base(workspaceId, assetId)}/settlements`, signal, { since, until, page: pageNumber, size: 20 })
  if (!value || !page(value, assetId, pageNumber) || value.since !== since || value.until !== until || value.basis !== 'SETTLEMENT_EXPECTED'
    || !Array.isArray(value.items) || !value.items.every(item => item && [item.settleBasisStartDate, item.settleBasisEndDate, item.settleExpectDate, item.settleCompleteDate].every(nullableDate)
      && nullableText(item.settleMethodType) && [item.settleAmount, item.paySettleAmount, item.commissionSettleAmount, item.benefitSettleAmount, item.deductionRestoreSettleAmount].every(nullableSignedMoney))) throw invalid()
  return value
}
async function read<T>(url: string, signal?: AbortSignal, params?: object): Promise<T> { const { data } = await http.get<Api<T>>(url, { signal, params, timeout: 60_000 }); return data?.body }
function base(workspaceId: number, assetId: number): string { if (![workspaceId, assetId].every(value => Number.isSafeInteger(value) && value > 0)) throw invalid(); return `/api/workspaces/${workspaceId}/naver/stores/${assetId}` }
function invalid() { return new ApiError('스마트스토어 주문 응답을 확인할 수 없습니다. 다시 조회해 주세요.') }
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
function nullableText(value: unknown): boolean { return value === null || typeof value === 'string' }
function numericId(value: unknown): boolean { return typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) }
function validateOrderId(value: string): void { if (!numericId(value)) throw new ApiError('상품 주문 번호를 1~20자리 숫자로 입력해 주세요.') }
function timestamp(value: unknown): boolean { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function nullableTime(value: unknown): boolean { return value === null || timestamp(value) }
function nullableDate(value: unknown): boolean { if (value === null) return true; return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && timestamp(value) && new Date(value).toISOString().slice(0, 10) === value }
function nullableSignedMoney(value: unknown): boolean { return value === null || (typeof value === 'number' && Number.isFinite(value)) }
function nullableMoney(value: unknown): boolean { return nullableSignedMoney(value) && (value === null || (value as number) >= 0) }
function nullableQuantity(value: unknown): boolean { return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) }
function options(value: NaverOrderOption[]): boolean { return Array.isArray(value) && value.every(item => item && text(item.code) && text(item.label)) && new Set(value.map(item => item.code)).size === value.length }
function order(value: NaverOrder): boolean { return Boolean(value && numericId(value.productOrderId)
  && ['orderId', 'productName', 'productOption', 'status', 'placeOrderStatus', 'claimStatus', 'deliveryStatus'].every(key => nullableText(value[key as keyof NaverOrder]))
  && [value.orderDate, value.paymentDate].every(nullableTime) && [value.initialQuantity, value.remainingQuantity].every(nullableQuantity)
  && [value.initialPaymentAmount, value.remainingPaymentAmount].every(nullableMoney)) }
function claim(value: NaverOrderClaim): boolean { return Boolean(value && ['type', 'claimId', 'status', 'reason', 'collectStatus', 'holdbackStatus', 'holdbackReason', 'refundStandbyStatus'].every(key => nullableText(value[key as keyof NaverOrderClaim]))
  && nullableQuantity(value.quantity) && [value.requestedAt, value.completedAt, value.refundExpectedDate].every(nullableTime)) }
function page(value: NaverOrders | NaverSettlements, assetId: number, pageNumber: number): boolean { return value.assetId === assetId && numericId(value.channelNo) && value.page === pageNumber && value.size === 20 && typeof value.hasNext === 'boolean' && timestamp(value.fetchedAt) && typeof value.notice === 'string' }
