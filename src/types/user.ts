export type UserRegisterRequest = {
  email: string
  password: string
  name: string
  phone: string
  zipCode?: string
  address?: string
  addressDetail?: string
}

export type UserProfileResponse = {
  id: number
  name: string
  phone: string
  zipCode?: string | null
  address?: string | null
  addressDetail?: string | null
  status: string
  mailNotificationEnabled: boolean
}

export type UserResponse = {
  id: number
  email: string
  role: string
  status: string
  registeredAt: string | null
  updatedAt: string | null
  unRegisteredAt: string | null
  lastLoginAt: string | null
  userProfileResponse?: UserProfileResponse | null
}
