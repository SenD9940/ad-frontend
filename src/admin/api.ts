import axios, { isAxiosError } from 'axios'
import { keysToCamelCase, keysToSnakeCase } from '../api/case'
import { clearAdminSession, readAdminSession } from './session'

const client = axios.create({ baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL ?? '', timeout: 20000 })
client.interceptors.request.use(config => {
  const session = readAdminSession()
  if (session && config.url !== '/admin-api/auth/login') config.headers.Authorization = `Bearer ${session.accessToken}`
  if (config.data) config.data = keysToSnakeCase(config.data)
  return config
})
client.interceptors.response.use(response => { response.data = keysToCamelCase(response.data); return response }, (error: unknown) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 401 && error.config?.url !== '/admin-api/auth/login') clearAdminSession()
    const result = keysToCamelCase(error.response?.data)?.result
    return Promise.reject(new Error(result?.resultMessage || (error.response ? '요청을 처리하지 못했습니다.' : '서버에 연결하지 못했습니다. 변경 요청이었다면 최신 상태를 먼저 확인해 주세요.')))
  }
  return Promise.reject(new Error('요청을 처리하지 못했습니다.'))
})
export async function adminGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const { data } = await client.get<{ body: T }>(`/admin-api${path}`, { signal })
  return data.body
}
export async function adminWrite<T = unknown>(path: string, body: unknown = {}, method: 'post' | 'patch' = 'post'): Promise<T> {
  const { data } = await client[method]<{ body: T }>(`/admin-api${path}`, body)
  return data.body
}
