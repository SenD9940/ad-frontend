import axios, { isAxiosError } from 'axios'
import { keysToCamelCase, keysToSnakeCase } from './case'
import type { Api, ApiResult } from '../types/api'

export class ApiError extends Error {
  resultCode?: number
  status?: number

  constructor(message: string, resultCode?: number, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.resultCode = resultCode
    this.status = status
  }
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  if (config.data && shouldTransform(config.data)) {
    config.data = keysToSnakeCase(config.data)
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    response.data = keysToCamelCase(response.data)
    return response
  },
  (error: unknown) => Promise.reject(toApiError(error)),
)

function shouldTransform(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !(data instanceof FormData)
}

function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return new ApiError('요청 처리 중 오류가 발생했습니다.')
  }

  if (!error.response) {
    return new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  const payload = asApiPayload(keysToCamelCase(error.response.data))
  return new ApiError(
    getResultMessage(payload?.result) ?? '요청을 처리할 수 없습니다.',
    payload?.result?.resultCode,
    error.response.status,
  )
}

function asApiPayload(data: unknown): Api<unknown> | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const record = data as Record<string, unknown>
  const rawResult = record.result
  if (typeof rawResult !== 'object' || rawResult === null) {
    return undefined
  }

  const resultRecord = rawResult as Record<string, unknown>
  return {
    result: {
      resultCode: Number(resultRecord.resultCode ?? resultRecord.result_code),
      resultMessage: String(resultRecord.resultMessage ?? resultRecord.result_message ?? ''),
      resultDescription: String(
        resultRecord.resultDescription ?? resultRecord.result_description ?? '',
      ),
    },
    body: record.body,
  }
}

function getResultMessage(result?: ApiResult): string | undefined {
  const message = result?.resultMessage?.trim()
  const description = result?.resultDescription?.trim()

  if (message && message !== '에러' && message !== '잘못된 요청입니다') {
    return message
  }
  if (description && description !== '에러') {
    return description
  }
  return message || description
}

export default http
