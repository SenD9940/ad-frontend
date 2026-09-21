import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type {
  WorkspaceMemberAcceptRequest,
  WorkspaceMemberInviteRequest,
  WorkspaceMemberInviteResponse,
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
