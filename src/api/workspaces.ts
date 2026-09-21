import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { WorkspaceRegisterRequest, WorkspaceResponse } from '../types/workspace'

export async function listMyWorkspaces(): Promise<WorkspaceResponse[]> {
  const { data } = await http.get<Api<WorkspaceResponse[]>>('/api/workspaces/me')
  if (!Array.isArray(data?.body)) {
    throw new ApiError('워크스페이스 목록 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function getMyWorkspace(workspaceId: number): Promise<WorkspaceResponse> {
  const { data } = await http.get<Api<WorkspaceResponse>>(
    `/api/workspaces/${workspaceId}`,
  )
  if (!isWorkspace(data?.body)) {
    throw new ApiError('워크스페이스 조회 응답이 올바르지 않습니다.')
  }
  return data.body
}

export async function registerWorkspace(
  request: WorkspaceRegisterRequest,
): Promise<WorkspaceResponse> {
  const { data } = await http.post<Api<WorkspaceResponse>>(
    '/api/workspaces/register',
    request,
  )
  if (!isWorkspace(data?.body)) {
    throw new ApiError('워크스페이스 생성 응답이 올바르지 않습니다.')
  }
  return data.body
}

function isWorkspace(value: WorkspaceResponse | undefined): value is WorkspaceResponse {
  return Boolean(value?.id)
}
