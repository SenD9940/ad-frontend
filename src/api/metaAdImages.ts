import http, { ApiError } from './http'

export type MetaAdImageUploadResponse = {
  imageKey: string
  imageUrl: string
  expiresAt: string
  contentType: 'image/jpeg' | 'image/png'
  size: number
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export class MetaAdImageFileError extends ApiError {
  constructor(message: string) {
    super(message, 400, 400)
    this.name = 'MetaAdImageFileError'
  }
}

export async function uploadMetaAdImage(
  workspaceId: number,
  assetId: number,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<MetaAdImageUploadResponse> {
  if (![workspaceId, assetId].every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new ApiError('워크스페이스와 저장된 광고 계정을 다시 선택해 주세요.', 400, 400)
  }
  await validateImage(file)
  if (signal?.aborted) throw new ApiError('이미지 업로드가 취소되었습니다.')
  const form = new FormData()
  form.append('file', file)

  // The browser supplies the multipart boundary. Handle HTTP errors here so
  // the shared client's token refresh cannot replay a non-idempotent upload.
  const response = await http.post<unknown>(
    `/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/images`, form,
    {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
      signal,
      validateStatus: () => true,
      onUploadProgress: (event) => {
        if (event.total && event.total > 0) {
          onProgress?.(Math.min(100, Math.max(0, Math.round(event.loaded / event.total * 100))))
        }
      },
    },
  )

  const payload = record(response.data)
  const result = record(payload?.result)
  const body = record(payload?.body)
  const scopePrefix = `workspaces/${workspaceId}/meta/ad-accounts/${assetId}/images/`
  if (success(response.status) && success(result?.resultCode) && body
    && typeof body.imageKey === 'string' && body.imageKey.trim().length > 0 && body.imageKey.length <= 1024
    && (body.imageKey.startsWith(scopePrefix) || body.imageKey.includes(`/${scopePrefix}`))
    && validHttpsUrl(body.imageUrl)
    && typeof body.expiresAt === 'string' && Number.isFinite(Date.parse(body.expiresAt))
    && (body.contentType === 'image/jpeg' || body.contentType === 'image/png')
    && body.contentType === file.type && body.size === file.size) {
    return {
      imageKey: body.imageKey, imageUrl: body.imageUrl, expiresAt: body.expiresAt,
      contentType: body.contentType, size: body.size,
    }
  }

  const message = response.status === 401 ? '로그인이 만료되었습니다. 다시 로그인한 뒤 이미지를 업로드해 주세요.'
    : response.status === 413 ? '이미지 파일은 10MiB 이하로 선택해 주세요.'
      : success(response.status) ? '이미지 업로드 응답을 확인할 수 없습니다. 다시 업로드해 주세요.'
        : resultMessage(result) || '이미지를 업로드하지 못했습니다. 계정 권한을 확인하고 다시 시도해 주세요.'
  throw new ApiError(message, typeof result?.resultCode === 'number' ? result.resultCode : undefined, response.status)
}

async function validateImage(file: File): Promise<void> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new MetaAdImageFileError('JPEG 또는 PNG 이미지 파일을 선택해 주세요.')
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new MetaAdImageFileError(file.size === 0 ? '비어 있는 파일은 업로드할 수 없습니다.' : '이미지 파일은 10MiB 이하로 선택해 주세요.')
  }
  let signature: Uint8Array
  try {
    signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  } catch {
    throw new MetaAdImageFileError('파일을 읽을 수 없습니다. 이미지를 다시 선택해 주세요.')
  }
  const validSignature = file.type === 'image/png'
    ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)
    : signature[0] === 255 && signature[1] === 216 && signature[2] === 255
  if (!validSignature) throw new MetaAdImageFileError('파일 내용이 JPEG 또는 PNG 이미지 형식과 일치하지 않습니다.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new MetaAdImageFileError('이미지를 열 수 없습니다. 정상적인 JPEG 또는 PNG 파일을 선택해 주세요.'))
      image.src = objectUrl
    })
    if (dimensions.width === 0 || dimensions.height === 0) {
      throw new MetaAdImageFileError('이미지 크기를 확인할 수 없습니다. 다른 파일을 선택해 주세요.')
    }
    if (dimensions.width > 10_000 || dimensions.height > 10_000 || dimensions.width * dimensions.height > 25_000_000) {
      throw new MetaAdImageFileError('가로·세로 각각 10,000px 이하, 총 2,500만 픽셀 이하의 이미지를 선택해 주세요.')
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function success(value: unknown): boolean {
  return typeof value === 'number' && value >= 200 && value < 300
}

function validHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

function resultMessage(result: Record<string, unknown> | null): string | null {
  for (const value of [result?.resultMessage, result?.resultDescription]) {
    if (typeof value === 'string' && value.trim() && !['에러', '잘못된 요청입니다', '성공'].includes(value)) return value
  }
  return null
}
