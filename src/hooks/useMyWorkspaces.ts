import { useEffect, useState } from 'react'
import { ApiError } from '../api/http'
import { listMyWorkspaces } from '../api/workspaces'
import type { WorkspaceResponse } from '../types/workspace'

export function useMyWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const items = await listMyWorkspaces()
        if (!cancelled) {
          setWorkspaces(items)
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : '워크스페이스 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { workspaces, loading, error }
}
