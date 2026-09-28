import http, { ApiError } from '../api/http'
import type { Api } from '../types/api'
import type { StudioGenerationRequest, StudioOutput } from './types'

export function studioPath(workspaceId: string | number) {
  return `/api/workspaces/${workspaceId}/ai-studio`
}

export async function uploadStudioProductImage(workspaceId: string | number, file: File): Promise<{ imageKey: string; imageUrl: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<Api<{ imageKey: string; imageUrl: string }>>(`${studioPath(workspaceId)}/images`, form, { headers: { 'Content-Type': undefined }, timeout: 60_000 })
  if (!data?.body?.imageKey || !data?.body?.imageUrl) throw new ApiError('상품 이미지 업로드 결과를 확인하지 못했습니다.')
  return data.body
}

export async function getStudioOutput(workspaceId: string | number, outputId: string | number): Promise<StudioOutput> {
  const { data } = await http.get<Api<StudioOutput>>(`${studioPath(workspaceId)}/outputs/${outputId}`)
  if (!data?.body || data.body.id !== Number(outputId) || data.body.workspaceId !== Number(workspaceId)
    || !['PENDING', 'SUCCEEDED', 'FAILED'].includes(data.body.status)) {
    throw new ApiError('생성 결과를 확인할 수 없습니다.')
  }
  return data.body
}

export async function downloadStudioImage(workspaceId: string | number, outputId: string | number): Promise<File> {
  const { data } = await http.get<Blob>(`${studioPath(workspaceId)}/outputs/${outputId}/image`, { responseType: 'blob', timeout: 60_000 })
  const type = data instanceof Blob ? data.type.split(';')[0] : ''
  if (!(data instanceof Blob) || !['image/png', 'image/jpeg'].includes(type) || data.size === 0 || data.size > 10 * 1024 * 1024) {
    throw new ApiError('생성 이미지를 다운로드하지 못했습니다. 결과를 다시 조회해 주세요.')
  }
  return new File([data], `studio-${outputId}.${type === 'image/jpeg' ? 'jpg' : 'png'}`, { type })
}

export class StudioGenerationError extends ApiError {
  readonly outcomeUnknown: boolean

  constructor(message: string, outcomeUnknown: boolean, status?: number) {
    super(message, undefined, status)
    this.outcomeUnknown = outcomeUnknown
  }
}

export async function createStudioGeneration(workspaceId: string | number, request: StudioGenerationRequest): Promise<StudioOutput> {
  let response
  try {
    // Generation is a paid external operation: the shared 401 interceptor must not replay it.
    response = await http.post<Api<StudioOutput>>(`${studioPath(workspaceId)}/generations`, request, {
      timeout: 180_000,
      validateStatus: () => true,
    })
  } catch {
    throw new StudioGenerationError('생성 결과를 아직 확인하지 못했습니다. 내 결과를 먼저 확인해 주세요. 요청을 자동으로 다시 보내지 않습니다.', true)
  }
  const { status, data } = response
  if (status >= 200 && status < 300 && Number.isSafeInteger(data?.body?.id) && data.body.id > 0
    && data.body.workspaceId === Number(workspaceId) && data.body.templateId === request.templateId
    && ['PENDING', 'SUCCEEDED', 'FAILED'].includes(data.body.status)) return data.body
  const uncertain = status < 400 || status === 408 || status === 409 || status >= 500
  const message = [data?.result?.resultDescription, data?.result?.resultMessage]
    .find(value => typeof value === 'string' && value.trim() && !['에러', '잘못된 요청입니다', '성공'].includes(value))
  throw new StudioGenerationError(status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 내 결과를 확인해 주세요.'
    : message || (uncertain ? '생성 결과를 아직 확인하지 못했습니다. 내 결과를 먼저 확인해 주세요.' : '생성 요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.'), uncertain, status)
}
