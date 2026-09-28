import http, { ApiError } from './http'
import type {
  MetaAdCreateRequest, MetaAdCreateResult,
  MetaCampaignCreateRequest, MetaCampaignCreateResult,
} from '../types/metaAdCreation'

const META_CREATE_TIMEOUT = 120_000
const UNKNOWN_MESSAGE = '생성 결과를 확인할 수 없습니다. 다시 요청하기 전에 Meta 광고 관리자에서 생성된 항목을 확인해 주세요.'

export class MetaAdCreationError extends ApiError {
  outcome: MetaAdCreateResult | null
  outcomeUnknown: boolean

  constructor(
    message: string,
    outcome: MetaAdCreateResult | null = null,
    outcomeUnknown = false,
    resultCode?: number,
    status?: number,
  ) {
    super(message, resultCode, status)
    this.name = 'MetaAdCreationError'
    this.outcome = outcome
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function createMetaAd(
  workspaceId: number,
  assetId: number,
  request: MetaAdCreateRequest,
): Promise<MetaAdCreateResult> {
  validateIds(workspaceId, assetId)
  const response = await postCreation(`/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/ads`, request)
  const payload = asRecord(response.data)
  const result = asRecord(payload?.result)
  const parsed = parseOutcome(payload?.body)
  const outcome = parsed?.outcome ?? null
  const validOutcome = parsed?.valid && outcome?.assetId === assetId
  const successfulHttp = isSuccess(response.status)

  if (successfulHttp && isSuccess(result?.resultCode) && validOutcome && outcome.status === 'CREATED'
    && outcome.failedStep === null && outcome.campaignId && outcome.adSetId && outcome.creativeId && outcome.adId) {
    return outcome
  }

  // A rejection can still contain IDs created by earlier steps. Keep those IDs
  // even when the HTTP status is an error, or a malformed success is uncertain.
  const outcomeUnknown = successfulHttp
    || !validOutcome && uncertainHttpStatus(response.status)
    || Boolean(outcome && (!validOutcome || outcome.status !== 'FAILED'))
  throw new MetaAdCreationError(
    responseMessage(payload, outcome, outcomeUnknown), outcome, outcomeUnknown,
    numericCode(result?.resultCode), response.status,
  )
}

export async function createMetaCampaign(
  workspaceId: number,
  assetId: number,
  request: MetaCampaignCreateRequest,
): Promise<MetaCampaignCreateResult> {
  validateIds(workspaceId, assetId)
  const response = await postCreation(`/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/campaigns`, request)
  const payload = asRecord(response.data)
  const result = asRecord(payload?.result)
  const body = asRecord(payload?.body)
  if (isSuccess(response.status) && isSuccess(result?.resultCode) && nonemptyString(body?.id)) {
    return { id: body.id }
  }

  const outcomeUnknown = isSuccess(response.status) || uncertainHttpStatus(response.status)
  throw new MetaAdCreationError(
    responseMessage(payload, null, outcomeUnknown), null, outcomeUnknown,
    numericCode(result?.resultCode), response.status,
  )
}

async function postCreation(path: string, request: MetaAdCreateRequest | MetaCampaignCreateRequest) {
  try {
    // Handling every HTTP status here bypasses the shared client's automatic
    // 401 refresh/replay. A create request must only be sent once.
    return await http.post<unknown>(path, request, {
      timeout: META_CREATE_TIMEOUT,
      validateStatus: () => true,
    })
  } catch (caught) {
    // A transport error does not tell us whether Meta already created objects.
    throw new MetaAdCreationError(
      UNKNOWN_MESSAGE, null, true,
      caught instanceof ApiError ? caught.resultCode : undefined,
      caught instanceof ApiError ? caught.status : undefined,
    )
  }
}

function validateIds(workspaceId: number, assetId: number): void {
  if (!positiveId(workspaceId) || !positiveId(assetId)) {
    throw new MetaAdCreationError('워크스페이스와 저장된 광고 계정을 다시 선택해 주세요.', null, false, 400, 400)
  }
}

function parseOutcome(value: unknown): { outcome: MetaAdCreateResult; valid: boolean } | null {
  const body = asRecord(value)
  if (!body || !positiveId(body.assetId) || !nonemptyString(body.adAccountId)) return null
  const validStatus = body.status === 'CREATED' || body.status === 'FAILED' || body.status === 'UNKNOWN'
  const validStep = body.failedStep === null || body.failedStep === 'CAMPAIGN' || body.failedStep === 'AD_SET'
    || body.failedStep === 'CREATIVE' || body.failedStep === 'AD'
  const ids = [body.campaignId, body.adSetId, body.creativeId, body.adId]
  return {
    outcome: {
      assetId: body.assetId,
      adAccountId: body.adAccountId,
      campaignId: nonemptyString(body.campaignId) ? body.campaignId : null,
      adSetId: nonemptyString(body.adSetId) ? body.adSetId : null,
      creativeId: nonemptyString(body.creativeId) ? body.creativeId : null,
      adId: nonemptyString(body.adId) ? body.adId : null,
      status: validStatus ? body.status as MetaAdCreateResult['status'] : 'UNKNOWN',
      failedStep: validStep ? body.failedStep as MetaAdCreateResult['failedStep'] : null,
      message: nonemptyString(body.message) ? body.message : UNKNOWN_MESSAGE,
    },
    valid: validStatus && validStep && ids.every((id) => id === null || nonemptyString(id)) && nonemptyString(body.message),
  }
}

function responseMessage(
  payload: Record<string, unknown> | null,
  outcome: MetaAdCreateResult | null,
  unknown: boolean,
): string {
  if (outcome && nonemptyString(outcome.message)) return outcome.message
  const result = asRecord(payload?.result)
  for (const value of [result?.resultMessage, result?.resultDescription]) {
    if (nonemptyString(value) && value !== '에러' && value !== '잘못된 요청입니다' && value !== '성공') return value
  }
  return unknown ? UNKNOWN_MESSAGE : '등록 요청이 거절되었습니다. 입력 정보와 계정 권한을 확인해 주세요.'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function positiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function nonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function numericCode(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isSuccess(status: unknown): boolean {
  return typeof status === 'number' && status >= 200 && status < 300
}

function uncertainHttpStatus(status: number): boolean {
  return status < 400 || status >= 500 || status === 408
}
