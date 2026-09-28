import http, { ApiError } from './http'
import type { MetaAdObjectType, MetaAdUpdatePatch, MetaAdUpdateResult } from '../types/metaAdUpdate'

const META_UPDATE_TIMEOUT = 120_000
const UNKNOWN_MESSAGE = '수정 결과를 확인할 수 없습니다. 다시 요청하기 전에 Meta 광고 관리자에서 현재 이름, 상태와 예산을 확인해 주세요.'
const OBJECT_PATHS: Record<MetaAdObjectType, string> = {
  ad: 'ads',
  'ad-set': 'ad-sets',
  campaign: 'campaigns',
}

export class MetaAdUpdateError extends ApiError {
  outcomeUnknown: boolean

  constructor(message: string, outcomeUnknown = false, resultCode?: number, status?: number) {
    super(message, resultCode, status)
    this.name = 'MetaAdUpdateError'
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function updateMetaAdObject(
  workspaceId: number,
  assetId: number,
  objectType: MetaAdObjectType,
  objectId: string,
  patch: MetaAdUpdatePatch,
): Promise<MetaAdUpdateResult> {
  if (!positiveInteger(workspaceId) || !positiveInteger(assetId)) {
    throw invalidRequest('워크스페이스와 저장된 광고 계정을 다시 선택해 주세요.')
  }
  if (!Object.hasOwn(OBJECT_PATHS, objectType) || typeof objectId !== 'string' || !/^[0-9]{1,32}$/.test(objectId)) {
    throw invalidRequest('수정할 대상 유형과 Meta 객체 ID를 확인해 주세요.')
  }
  const request = validatePatch(objectType, patch)
  const path = `/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/${OBJECT_PATHS[objectType]}/${objectId}`
  const response = await patchOnce(path, request)
  const payload = asRecord(response.data)
  const result = asRecord(payload?.result)
  const body = asRecord(payload?.body)
  if (isSuccess(response.status) && isSuccess(result?.resultCode) && body?.id === objectId && body.success === true) {
    return { id: objectId, success: true }
  }

  // A transport failure, server error or invalid acknowledgement can happen
  // after Meta accepted the write. Do not assume the old values were preserved.
  const outcomeUnknown = response.status < 400 || response.status === 408 || response.status >= 500
  throw new MetaAdUpdateError(
    outcomeUnknown ? UNKNOWN_MESSAGE : rejectionMessage(result, response.status),
    outcomeUnknown,
    typeof result?.resultCode === 'number' ? result.resultCode : undefined,
    response.status,
  )
}

async function patchOnce(path: string, request: MetaAdUpdatePatch) {
  try {
    // Resolve every HTTP status here so the shared 401 handler cannot refresh
    // and replay a state/budget update. Each submission sends exactly one PATCH.
    return await http.patch<unknown>(path, request, {
      timeout: META_UPDATE_TIMEOUT,
      validateStatus: () => true,
    })
  } catch (caught) {
    throw new MetaAdUpdateError(
      UNKNOWN_MESSAGE, true,
      caught instanceof ApiError ? caught.resultCode : undefined,
      caught instanceof ApiError ? caught.status : undefined,
    )
  }
}

function validatePatch(objectType: MetaAdObjectType, patch: MetaAdUpdatePatch): MetaAdUpdatePatch {
  const fields = asRecord(patch)
  const allowedFields = objectType === 'ad' ? ['name', 'status'] : ['name', 'status', 'dailyBudget']
  if (!fields || Object.keys(fields).some((field) => !allowedFields.includes(field))) {
    throw invalidRequest('지원하지 않는 수정 항목입니다.')
  }
  const request: MetaAdUpdatePatch = {}
  if (fields.name !== null && fields.name !== undefined) {
    if (typeof fields.name !== 'string' || !fields.name.trim() || fields.name.trim().length > 255) {
      throw invalidRequest('이름은 공백이 아닌 255자 이내로 입력해 주세요.')
    }
    request.name = fields.name.trim()
  }
  if (fields.status !== null && fields.status !== undefined) {
    if (fields.status !== 'ACTIVE' && fields.status !== 'PAUSED') {
      throw invalidRequest('상태는 활성 또는 일시정지만 선택할 수 있습니다.')
    }
    request.status = fields.status
  }
  if (fields.dailyBudget !== null && fields.dailyBudget !== undefined) {
    if (!positiveInteger(fields.dailyBudget)) {
      throw invalidRequest('일 예산은 1 이상, 9,007,199,254,740,991 이하의 정수로 입력해 주세요.')
    }
    request.dailyBudget = fields.dailyBudget
  }
  if (Object.keys(request).length === 0) {
    throw invalidRequest('수정할 항목을 하나 이상 선택해 주세요.')
  }
  return request
}

function rejectionMessage(result: Record<string, unknown> | null, status: number): string {
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인한 뒤 수정 내용을 확인해 주세요.'
  for (const value of [result?.resultMessage, result?.resultDescription]) {
    if (typeof value === 'string' && value.trim() && !['에러', '잘못된 요청입니다', '성공'].includes(value.trim())) {
      return value
    }
  }
  return '수정 요청이 거절되었습니다. 입력 정보와 계정 권한을 확인해 주세요.'
}

function invalidRequest(message: string): MetaAdUpdateError {
  return new MetaAdUpdateError(message, false, 400, 400)
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function isSuccess(value: unknown): boolean {
  return typeof value === 'number' && value >= 200 && value < 300
}
