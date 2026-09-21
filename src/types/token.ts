export type TokenResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiredAt: string | null
  refreshTokenExpiredAt: string | null
}

export type UserLoginRequest = {
  email: string
  password: string
}
