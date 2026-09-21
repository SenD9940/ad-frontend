import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { TokenResponse, UserLoginRequest } from '../types/token'
import type { UserRegisterRequest, UserResponse } from '../types/user'

export async function registerUser(request: UserRegisterRequest): Promise<UserResponse> {
  const { data } = await http.post<Api<UserResponse>>(
    '/open-api/users/register',
    omitBlank(request),
  )
  if (!data?.body) {
    throw new ApiError('회원가입 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function loginUser(request: UserLoginRequest): Promise<TokenResponse> {
  const { data } = await http.post<Api<TokenResponse>>(
    '/open-api/users/login',
    request,
  )
  if (!data?.body?.accessToken) {
    throw new ApiError('로그인 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function existsUserByEmail(email: string): Promise<boolean> {
  const { data } = await http.post<Api<boolean>>('/api/users/exists', { email })
  if (typeof data?.body !== 'boolean') {
    throw new ApiError('사용자 조회 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function getMe(): Promise<UserResponse> {
  const { data } = await http.get<Api<UserResponse>>('/api/users/me')
  if (!data?.body?.id) {
    throw new ApiError('사용자 정보 응답이 올바르지 않습니다.')
  }
  return data.body
}

function omitBlank(request: UserRegisterRequest): UserRegisterRequest {
  return Object.fromEntries(
    Object.entries(request).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false
      }
      if (typeof value === 'string') {
        return value.trim() !== ''
      }
      return true
    }),
  ) as UserRegisterRequest
}
