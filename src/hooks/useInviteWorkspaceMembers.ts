import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { existsUserByEmail } from '../api/users'
import { getMyWorkspace } from '../api/workspaces'
import { inviteWorkspaceMembers } from '../api/workspaceMembers'
import { useModal } from '../components/common/useModal'
import { useErrorModal } from '../components/common/useErrorModal'
import {
  INVITE_EMAILS_MAX,
  inviteEmailInputError,
  parseInviteEmail,
} from '../pages/workspace/workspaceValidation'
import type { WorkspaceMemberInviteResponse, WorkspaceResponse } from '../types/workspace'

export function useInviteWorkspaceMembers() {
  const modal = useModal()
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const formId = useId()
  const { workspaceId: workspaceIdParam } = useParams()
  const workspaceId = Number(workspaceIdParam)
  const isValidWorkspaceId = Number.isSafeInteger(workspaceId) && workspaceId > 0
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(isValidWorkspaceId)
  const [workspaceError, setWorkspaceError] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [inputError, setInputError] = useState('')
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<WorkspaceMemberInviteResponse[]>([])
  useErrorModal(workspaceError, '워크스페이스 조회 실패')

  const busy = adding || submitting

  useEffect(() => {
    if (!isValidWorkspaceId) {
      return
    }

    let cancelled = false

    getMyWorkspace(workspaceId)
      .then((item) => {
        if (!cancelled) {
          setWorkspace(item)
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setWorkspace(null)
          setWorkspaceError(
            caught instanceof ApiError
              ? caught.message
              : '워크스페이스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWorkspaceLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isValidWorkspaceId, workspaceId])

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setEmailInput(event.target.value)
    setInputError('')
    setFormError('')
  }

  async function addEmail() {
    if (pending.current) return
    const returnFocus = document.getElementById(`${formId}-email`)
    const formatError = inviteEmailInputError(emailInput)
    if (formatError) {
      setInputError(formatError)
      return
    }

    const email = parseInviteEmail(emailInput)
    if (!email) {
      setInputError('올바른 이메일을 입력하세요.')
      return
    }
    if (emails.includes(email)) {
      setInputError('이미 추가한 이메일입니다.')
      return
    }
    if (emails.length >= INVITE_EMAILS_MAX) {
      setInputError(`한 번에 ${INVITE_EMAILS_MAX}명까지 초대할 수 있습니다.`)
      return
    }

    pending.current = true; setAdding(true)
    setInputError('')
    setFormError('')
    try {
      const exists = await existsUserByEmail(email)
      if (!active.current) return
      if (!exists) {
        setInputError('가입된 사용자가 없습니다.')
        return
      }
      setEmails((current) => {
        if (current.includes(email) || current.length >= INVITE_EMAILS_MAX) {
          return current
        }
        return [...current, email]
      })
      setEmailInput('')
    } catch (caught) {
      const message = caught instanceof ApiError
          ? caught.message
          : '사용자를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) { setInputError(message); void modal.error({ title: '초대할 사용자 조회 실패', message, returnFocus }) }
    } finally {
      pending.current = false
      if (active.current) setAdding(false)
    }
  }

  function removeEmail(email: string) {
    setEmails((current) => current.filter((item) => item !== email))
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const returnFocus = document.getElementById(`${formId}-email`)
    if (!isValidWorkspaceId) {
      setFormError('워크스페이스 정보가 올바르지 않습니다.')
      return
    }
    if (emails.length === 0) {
      setInputError('초대할 이메일을 추가하세요.')
      document.getElementById(`${formId}-email`)?.focus()
      return
    }

    pending.current = true; setSubmitting(true)
    setFormError('')
    try {
      const inviteResults = await inviteWorkspaceMembers({
        workspaceId,
        emails,
      })
      if (!active.current) return
      setResults(inviteResults)
      const succeeded = new Set(
        inviteResults
          .filter((item) => item.success)
          .map((item) => item.email.trim().toLowerCase()),
      )
      setEmails((current) => current.filter((item) => !succeeded.has(item)))
      const message = `${succeeded.size}명에게 초대 메일을 보냈습니다.${inviteResults.length > succeeded.size ? ` ${inviteResults.length - succeeded.size}명은 발송하지 못했습니다. 화면의 초대 결과를 확인해 주세요.` : ''}`
      void (succeeded.size === inviteResults.length ? modal.success : modal.info)({ title: '멤버 초대 결과', message, returnFocus })
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : '초대를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) { setFormError(message); void modal.error({ title: '멤버 초대 실패', message, returnFocus }) }
    } finally {
      pending.current = false
      if (active.current) setSubmitting(false)
    }
  }

  return {
    formId,
    workspaceId,
    isValidWorkspaceId,
    workspace,
    workspaceLoading,
    workspaceError,
    emailInput,
    emails,
    inputError,
    formError,
    adding,
    submitting,
    busy,
    results,
    handleInputChange,
    addEmail,
    removeEmail,
    handleSubmit,
  }
}
