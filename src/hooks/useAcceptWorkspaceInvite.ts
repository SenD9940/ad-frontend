import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { acceptWorkspaceInvite } from '../api/workspaceMembers'
import { useModal } from '../components/common/useModal'
import { INVITE_TOKEN_PATTERN } from '../pages/workspace/workspaceValidation'
import type { WorkspaceMemberResponse } from '../types/workspace'

export function useAcceptWorkspaceInvite() {
  const modal = useModal()
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [accepted, setAccepted] = useState<WorkspaceMemberResponse | null>(null)
  const isValidToken = INVITE_TOKEN_PATTERN.test(token)

  async function handleAccept() {
    if (pending.current || accepted) return
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!isValidToken) {
      setFormError('초대 링크가 올바르지 않습니다.')
      return
    }

    pending.current = true; setSubmitting(true)
    setFormError('')
    try {
      const member = await acceptWorkspaceInvite({ token })
      if (!active.current) return
      setAccepted(member)
      void modal.success({ title: '초대를 수락했습니다', message: '워크스페이스에 참여했습니다. 이제 팀과 함께 연결된 채널과 자산을 관리할 수 있습니다.' })
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : '초대를 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) { setFormError(message); void modal.error({ title: '초대 수락 실패', message, returnFocus }) }
    } finally {
      pending.current = false
      if (active.current) setSubmitting(false)
    }
  }

  return {
    token,
    isValidToken,
    submitting,
    formError,
    accepted,
    handleAccept,
  }
}
