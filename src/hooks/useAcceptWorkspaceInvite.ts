import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { acceptWorkspaceInvite } from '../api/workspaceMembers'
import { INVITE_TOKEN_PATTERN } from '../pages/workspace/workspaceValidation'
import type { WorkspaceMemberResponse } from '../types/workspace'

export function useAcceptWorkspaceInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [accepted, setAccepted] = useState<WorkspaceMemberResponse | null>(null)
  const isValidToken = INVITE_TOKEN_PATTERN.test(token)

  async function handleAccept() {
    if (!isValidToken) {
      setFormError('초대 링크가 올바르지 않습니다.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const member = await acceptWorkspaceInvite({ token })
      setAccepted(member)
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : '초대를 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      setFormError(message)
    } finally {
      setSubmitting(false)
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
