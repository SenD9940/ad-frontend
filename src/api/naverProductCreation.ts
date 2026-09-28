import http, { ApiError } from './http'
import { keysToSnakeCase } from './case'
import type { Api } from '../types/api'
import type { NaverProductCreateRequest, NaverProductCreateResult, NaverProductCreationOptions, NaverProductNotices } from '../types/naverProductCreation'

const UNKNOWN = '상품 등록 결과를 확인하지 못했습니다. 다시 등록하기 전에 스마트스토어 판매자센터에서 생성 여부를 확인해 주세요.'

export class NaverProductCreationError extends ApiError {
  outcomeUnknown: boolean
  constructor(message: string, outcomeUnknown: boolean, status?: number) {
    super(message, undefined, status)
    this.name = 'NaverProductCreationError'
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function getNaverProductCreationOptions(workspaceId: number, assetId: number, signal?: AbortSignal): Promise<NaverProductCreationOptions> {
  const { data } = await http.get<Api<NaverProductCreationOptions>>(`${base(workspaceId, assetId)}/product-creation/options`, { signal, timeout: 120_000 })
  const value = data?.body
  if (!value || !Array.isArray(value.categories) || !value.categories.every((item) => item && text(item.id) && text(item.name))
    || !Array.isArray(value.origins) || !value.origins.every((item) => item && text(item.code) && text(item.name))
    || !Array.isArray(value.addresses) || !value.addresses.every((item) => item && text(item.id) && typeof item.name === 'string'
      && typeof item.address === 'string' && ['RELEASE', 'REFUND_OR_EXCHANGE'].includes(item.type) && typeof item.overseas === 'boolean')
    || !Array.isArray(value.deliveryCompanies) || !value.deliveryCompanies.every((item) => item && text(item.code) && text(item.name))) {
    throw new ApiError('상품 등록에 필요한 정보를 확인하지 못했습니다. 다시 조회해 주세요.')
  }
  return value
}

export async function getNaverProductNotices(workspaceId: number, assetId: number, categoryId: string, signal?: AbortSignal): Promise<NaverProductNotices> {
  const { data } = await http.get<Api<NaverProductNotices>>(`${base(workspaceId, assetId)}/product-creation/notices`, { params: { categoryId }, signal, timeout: 60_000 })
  const value = data?.body
  if (!value || !Array.isArray(value.types) || !value.types.every((item) => item && text(item.type) && text(item.name)
    && Array.isArray(item.fields) && item.fields.every((field) => field && /^[a-z][a-z0-9_]*$/.test(field.key)
      && text(field.label) && (field.description === null || typeof field.description === 'string') && Number.isSafeInteger(field.maxLength)
      && field.maxLength >= 0 && (field.type !== 'TEXT' || field.maxLength > 0) && typeof field.required === 'boolean' && ['TEXT', 'BOOLEAN', 'NUMBER'].includes(field.type)
      && Array.isArray(field.options) && field.options.every((option) => option && typeof option.value === 'string' && text(option.label))))) {
    throw new ApiError('상품 정보 제공 고시 항목을 확인하지 못했습니다. 다시 조회해 주세요.')
  }
  return value
}

export async function createNaverProduct(workspaceId: number, assetId: number, request: NaverProductCreateRequest, images: File[]): Promise<NaverProductCreateResult> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify(keysToSnakeCase(request))], { type: 'application/json' }))
  images.forEach((file) => form.append('images', file))
  let response
  try {
    // Accept every HTTP response here so shared 401 refresh/replay cannot repeat a product write.
    response = await http.post<Api<NaverProductCreateResult>>(`${base(workspaceId, assetId)}/products`, form, {
      headers: { 'Content-Type': undefined }, timeout: 180_000, validateStatus: () => true,
    })
  } catch {
    throw new NaverProductCreationError(UNKNOWN, true)
  }
  const body = response.data?.body
  const result = response.data?.result
  const success = response.status >= 200 && response.status < 300
  if (success && body?.status === 'CREATED' && numericId(body.originProductNo) && numericId(body.smartstoreChannelProductNo) && text(body.message)) return body
  const unknown = success || response.status >= 500 || response.status === 408 || body?.status === 'UNKNOWN'
  const message = [body?.message, result?.resultMessage, result?.resultDescription].find((value) => text(value) && !['에러', '잘못된 요청입니다', '성공'].includes(value))
  throw new NaverProductCreationError(message || (unknown ? UNKNOWN : '상품을 등록하지 못했습니다. 입력 항목과 연결 권한을 확인해 주세요.'), unknown, response.status)
}

function base(workspaceId: number, assetId: number): string {
  if (![workspaceId, assetId].every((id) => Number.isSafeInteger(id) && id > 0)) throw new NaverProductCreationError('워크스페이스와 스마트스토어를 다시 선택해 주세요.', false, 400)
  return `/api/workspaces/${workspaceId}/naver/stores/${assetId}`
}
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
function numericId(value: unknown): value is string { return typeof value === 'string' && /^[1-9]\d*$/.test(value) }
