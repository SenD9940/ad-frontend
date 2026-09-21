import { useEffect, useState } from 'react'
import { ApiError } from '../api/http'
import { listJoinedWorkspaces, listMyWorkspaces } from '../api/workspaces'
import type { WorkspaceResponse } from '../types/workspace'

export function useMyWorkspaces() {
  const [owned, setOwned] = useState<WorkspaceResponse[]>([])
  const [joined, setJoined] = useState<WorkspaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [ownedItems, joinedItems] = await Promise.all([
          listMyWorkspaces(),
          listJoinedWorkspaces(),
        ])
        if (!cancelled) {
          setOwned(ownedItems)
          setJoined(joinedItems)
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

  return { owned, joined, loading, error }
}
