import { useCallback, useEffect, useId, useState } from 'react'
import { ApiError } from '../api/http'
import { getMe } from '../api/users'
import { kickWorkspaceMember, listWorkspaceMembers } from '../api/workspaceMembers'
import type { UserResponse } from '../types/user'
import type { WorkspaceMemberResponse } from '../types/workspace'

type Options = {
  workspaceId: number
  isValidWorkspaceId: boolean
  ownerUserId?: number
}

export function useKickWorkspaceMember({
  workspaceId,
  isValidWorkspaceId,
  ownerUserId,
}: Options) {
  const sectionId = useId()
  const [me, setMe] = useState<UserResponse | null>(null)
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([])
  const [loading, setLoading] = useState(isValidWorkspaceId)
  const [error, setError] = useState('')
  const [kickError, setKickError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null)
  const [kickingUserId, setKickingUserId] = useState<number | null>(null)

  const isOwner = Boolean(ownerUserId && me?.id === ownerUserId)

  const loadMembers = useCallback(async () => {
    const items = await listWorkspaceMembers(workspaceId)
    setMembers(items)
  }, [workspaceId])

  useEffect(() => {
    if (!isValidWorkspaceId) {
      return
    }

    let cancelled = false

    Promise.allSettled([getMe(), listWorkspaceMembers(workspaceId)])
      .then(([userResult, membersResult]) => {
        if (cancelled) {
          return
        }
        if (membersResult.status === 'rejected') {
          setMe(userResult.status === 'fulfilled' ? userResult.value : null)
          setMembers([])
          const caught = membersResult.reason
          setError(
            caught instanceof ApiError
              ? caught.message
              : '멤버 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
          return
        }
        setMembers(membersResult.value)
        setMe(userResult.status === 'fulfilled' ? userResult.value : null)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isValidWorkspaceId, workspaceId])

  function requestKick(userId: number) {
    if (!isOwner || userId === ownerUserId) {
      return
    }
    setConfirmingUserId(userId)
    setKickError('')
    setSuccessMessage('')
  }

  function cancelKick() {
    setConfirmingUserId(null)
    setKickError('')
  }

  async function confirmKick(userId: number) {
    if (!isValidWorkspaceId || !isOwner) {
      setKickError('멤버를 추방할 권한이 없습니다.')
      return
    }
    if (ownerUserId && userId === ownerUserId) {
      setKickError('워크스페이스 소유자는 추방할 수 없습니다.')
      setConfirmingUserId(null)
      return
    }

    setKickingUserId(userId)
    setKickError('')
    setSuccessMessage('')
    try {
      await kickWorkspaceMember({ workspaceId, userId })
      await loadMembers()
      setSuccessMessage(`사용자 ${userId}를 추방했습니다.`)
      setConfirmingUserId(null)
    } catch (caught) {
      setKickError(
        caught instanceof ApiError
          ? caught.message
          : '멤버를 추방하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setKickingUserId(null)
    }
  }

  return {
    sectionId,
    isOwner,
    members,
    loading,
    error,
    kickError,
    successMessage,
    confirmingUserId,
    kickingUserId,
    requestKick,
    cancelKick,
    confirmKick,
  }
}
