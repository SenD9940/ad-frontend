import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ApiError } from '../api/http'
import { getMe } from '../api/users'
import { kickWorkspaceMember, listWorkspaceMembers } from '../api/workspaceMembers'
import { useModal } from '../components/common/useModal'
import { useErrorModal } from '../components/common/useErrorModal'
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
  const modal = useModal()
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const sectionId = useId()
  const [me, setMe] = useState<UserResponse | null>(null)
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([])
  const [loading, setLoading] = useState(isValidWorkspaceId)
  const [error, setError] = useState('')
  const [kickError, setKickError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null)
  const [kickingUserId, setKickingUserId] = useState<number | null>(null)
  useErrorModal(error, '멤버 목록 조회 실패')

  const isOwner = Boolean(ownerUserId && me?.id === ownerUserId)

  const loadMembers = useCallback(async () => {
    const items = await listWorkspaceMembers(workspaceId)
    if (active.current) setMembers(items)
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
    if (pending.current || !isOwner || userId === ownerUserId) {
      return
    }
    setConfirmingUserId(userId)
    setKickError('')
    setSuccessMessage('')
  }

  function cancelKick() {
    if (pending.current) return
    setConfirmingUserId(null)
    setKickError('')
  }

  async function confirmKick(userId: number) {
    if (pending.current || confirmingUserId !== userId) return
    if (!isValidWorkspaceId || !isOwner) {
      setKickError('멤버를 추방할 권한이 없습니다.')
      return
    }
    if (ownerUserId && userId === ownerUserId) {
      setKickError('워크스페이스 소유자는 추방할 수 없습니다.')
      setConfirmingUserId(null)
      return
    }

    pending.current = true; setKickingUserId(userId)
    setKickError('')
    setSuccessMessage('')
    let removed = false
    try {
      await kickWorkspaceMember({ workspaceId, userId })
      removed = true
      if (!active.current) return
      setMembers(current => current.filter(member => member.userId !== userId))
      await loadMembers()
      if (!active.current) return
      setSuccessMessage(`사용자 ${userId}를 추방했습니다.`)
      setConfirmingUserId(null)
      void modal.success({ title: '멤버를 내보냈습니다', message: `사용자 ${userId}는 더 이상 이 워크스페이스에 접근할 수 없습니다.`, returnFocus: document.getElementById(`${sectionId}-title`) })
    } catch (caught) {
      if (!active.current) return
      if (removed) {
        const message = '멤버를 내보냈지만 최신 목록을 조회하지 못했습니다. 페이지를 새로고침해 확인해 주세요.'
        setConfirmingUserId(null); setKickError(message)
        void modal.error({ title: '멤버 목록 확인 필요', message, returnFocus: document.getElementById(`${sectionId}-title`) })
        return
      }
      setKickError(
        caught instanceof ApiError
          ? caught.message
          : '멤버를 추방하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      pending.current = false
      if (active.current) setKickingUserId(null)
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
