import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type {
  WorkspaceMemberAcceptRequest,
  WorkspaceMemberInviteRequest,
  WorkspaceMemberInviteResponse,
  WorkspaceMemberKickRequest,
  WorkspaceMemberResponse,
} from '../types/workspace'

export async function inviteWorkspaceMembers(
  request: WorkspaceMemberInviteRequest,
): Promise<WorkspaceMemberInviteResponse[]> {
  const { data } = await http.post<Api<WorkspaceMemberInviteResponse[]>>(
    '/api/workspace-members/invite',
    request,
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('초대 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function acceptWorkspaceInvite(
  request: WorkspaceMemberAcceptRequest,
): Promise<WorkspaceMemberResponse> {
  const { data } = await http.post<Api<WorkspaceMemberResponse>>(
    '/api/workspace-members/accept',
    request,
  )
  if (!data?.body?.workspaceId) {
    throw new ApiError('초대 수락 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function listWorkspaceMembers(
  workspaceId: number,
): Promise<WorkspaceMemberResponse[]> {
  const { data } = await http.get<Api<WorkspaceMemberResponse[]>>(
    `/api/workspace-members/${workspaceId}`,
  )
  if (!Array.isArray(data?.body)) {
    throw new ApiError('멤버 목록 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function kickWorkspaceMember(
  request: WorkspaceMemberKickRequest,
): Promise<void> {
  const { data } = await http.post<Api<boolean>>(
    '/api/workspace-members/kick',
    request,
  )
  if (data?.body !== true) {
    throw new ApiError('멤버 추방 응답이 올바르지 않습니다.')
  }
}
