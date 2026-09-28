import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { NaverProducts, NaverSales, NaverSalesSummary, NaverStore } from '../types/naverStore'
import type { NaverDateRange } from '../pages/workspace/naverPerformanceDates'

export async function listSavedNaverStores(workspaceId: number, signal?: AbortSignal): Promise<NaverStore[]> {
  const { data } = await http.get<Api<NaverStore[]>>(`/api/workspaces/${workspaceId}/naver/stores`, { signal })
  if (!Array.isArray(data?.body) || !data.body.every((item) => item && id(item.assetId) && id(item.connectionId)
    && textId(item.channelNo) && typeof item.name === 'string' && typeof item.requiresReauth === 'boolean'
    && nullableText(item.storeUrl) && nullableText(item.connectionName))) {
    throw new ApiError('저장된 스마트스토어 응답을 확인할 수 없습니다.')
  }
  return data.body
}

export async function getNaverProducts(workspaceId: number, assetId: number, page: number, signal?: AbortSignal): Promise<NaverProducts> {
  const { data } = await http.get<Api<NaverProducts>>(`/api/workspaces/${workspaceId}/naver/stores/${assetId}/products`, {
    params: { page, size: 20 }, signal, timeout: 60_000,
  })
  const body = data?.body
  if (!body || body.assetId !== assetId || !textId(body.channelNo) || body.page !== page || body.size !== 20
    || typeof body.hasNext !== 'boolean' || !nullableInteger(body.totalElements) || !timestamp(body.fetchedAt)
    || !Array.isArray(body.items) || !body.items.every((item) => item && textId(item.productId) && typeof item.name === 'string'
      && item.status === 'SALE' && nullableText(item.imageUrl) && number(item.salePrice) && nullableNumber(item.discountedPrice) && nullableInteger(item.stockQuantity))) {
    throw new ApiError('판매 중인 상품 응답을 확인할 수 없습니다.')
  }
  return body
}

export async function getNaverSales(workspaceId: number, assetId: number, period: NaverDateRange, signal?: AbortSignal): Promise<NaverSales> {
  const { data } = await http.get<Api<NaverSales>>(`/api/workspaces/${workspaceId}/naver/stores/${assetId}/sales`, {
    params: period, signal, timeout: 120_000,
  })
  const body = data?.body
  if (!body || body.assetId !== assetId || !textId(body.channelNo) || body.since !== period.since || body.until !== period.until
    || body.timeZone !== 'Asia/Seoul' || body.basis !== 'PAYMENT_DATE' || body.currency !== 'KRW' || body.complete !== true
    || !summary(body.summary) || !timestamp(body.fetchedAt) || typeof body.notice !== 'string'
    || !validDaily(body.daily, period)
    || !Array.isArray(body.topProducts) || !body.topProducts.every((item) => item && textId(item.productId)
      && typeof item.name === 'string' && integer(item.productOrderCount) && integer(item.quantity)
      && number(item.paymentAmount) && nullableNumber(item.remainingPaymentAmount))) {
    throw new ApiError('전체 기간의 판매 성과를 확인할 수 없습니다. 불완전한 합계는 표시하지 않습니다.')
  }
  return body
}

function number(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 }
function nullableNumber(value: unknown) { return value === null || number(value) }
function integer(value: unknown) { return number(value) && Number.isSafeInteger(value) }
function nullableInteger(value: unknown) { return value === null || integer(value) }
function nullableText(value: unknown) { return value === null || typeof value === 'string' }
function id(value: unknown) { return number(value) && Number.isSafeInteger(value) && value > 0 }
function textId(value: unknown) { return typeof value === 'string' && /^\d+$/.test(value) }
function timestamp(value: unknown) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function summary(value: NaverSalesSummary | undefined): boolean {
  return Boolean(value && number(value.paymentAmount) && nullableNumber(value.remainingPaymentAmount)
    && integer(value.paidOrderCount) && integer(value.productOrderCount) && integer(value.quantity)
    && number(value.averageOrderAmount) && integer(value.canceledProductOrderCount) && integer(value.returnedProductOrderCount))
}

function validDaily(rows: NaverSales['daily'], period: NaverDateRange): boolean {
  const expectedDays = (Date.parse(`${period.until}T00:00:00Z`) - Date.parse(`${period.since}T00:00:00Z`)) / 86_400_000 + 1
  return Array.isArray(rows) && rows.length === expectedDays && new Set(rows.map((row) => row?.date)).size === expectedDays
    && rows.every((row) => {
      if (!summary(row) || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || row.date < period.since || row.date > period.until) return false
      const date = Date.parse(`${row.date}T00:00:00Z`)
      return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === row.date
    })
}
