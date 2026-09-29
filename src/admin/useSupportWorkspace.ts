import { useErrorModal } from '../components/common/useErrorModal'
import { useEffect, useState } from 'react'
import { adminGet } from './api'
import type { AdminUser, Workspace } from './types'

type Selection = { workspace: Workspace; customer: AdminUser }

export function useSupportWorkspace(workspaceId: number | null) {
  const [revision, setRevision] = useState(0)
  const key = `${workspaceId}:${revision}`
  const [state, setState] = useState<{ key: string; data?: Selection; error?: string }>({ key: '' })

  useErrorModal(workspaceId !== null && state.key === key ? state.error : undefined, '지원 대상을 확인하지 못했습니다')
  useEffect(() => {
    if (workspaceId === null) return
    const controller = new AbortController()
    async function load() {
      try {
        const workspace = await adminGet<Workspace>(`/workspaces/${workspaceId}`, controller.signal)
        if (controller.signal.aborted) return
        if (workspace.id !== workspaceId || !Number.isSafeInteger(workspace.ownerId) || workspace.ownerId <= 0) {
          throw new Error('워크스페이스 소유자를 확인할 수 없습니다. 다른 공간을 선택해 주세요.')
        }
        if (workspace.ownerStatus !== 'REGISTERED') {
          throw new Error('이용 중인 소유자가 있는 워크스페이스만 지원을 등록할 수 있습니다.')
        }
        const customer = await adminGet<AdminUser>(`/users/${workspace.ownerId}`, controller.signal)
        if (controller.signal.aborted) return
        if (customer.id !== workspace.ownerId || customer.status !== 'REGISTERED') {
          throw new Error('고객 정보를 확인할 수 없습니다. 소유자 상태를 확인해 주세요.')
        }
        setState({ key, data: { workspace, customer } })
      } catch (caught) {
        if (!controller.signal.aborted) setState({ key, error: caught instanceof Error ? caught.message : '지원 대상을 확인하지 못했습니다.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [workspaceId, key])

  return {
    data: workspaceId !== null && state.key === key ? state.data : undefined,
    error: workspaceId !== null && state.key === key ? state.error : undefined,
    loading: workspaceId !== null && state.key !== key,
    reload: () => setRevision(value => value + 1),
  }
}
