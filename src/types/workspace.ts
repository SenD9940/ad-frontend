export type WorkspaceRegisterRequest = {
  name: string
}

export type WorkspaceResponse = {
  id: number
  name: string
  userId: number
  registeredAt: string | null
  updatedAt: string | null
}

export type WorkspaceMemberInviteRequest = {
  workspaceId: number
  emails: string[]
}

export type WorkspaceMemberInviteResponse = {
  email: string
  success: boolean
  message: string
}

export type WorkspaceMemberAcceptRequest = {
  token: string
}

export type WorkspaceMemberResponse = {
  workspaceId: number
  userId: number
  role: string
  registeredAt: string | null
  updatedAt: string | null
}
