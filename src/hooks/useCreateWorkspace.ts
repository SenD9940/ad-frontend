import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/http'
import { registerWorkspace } from '../api/workspaces'
import { useModal } from '../components/common/useModal'
import { validateWorkspaceName } from '../pages/workspace/workspaceValidation'

export function useCreateWorkspace() {
  const modal = useModal()
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const formId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedSiteCode: unknown = location.state?.imwebSiteCode
  const imwebSiteCode = typeof requestedSiteCode === 'string' && /^S[A-Za-z0-9]{5,99}$/.test(requestedSiteCode) ? requestedSiteCode : null
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
    setNameError('')
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const returnFocus = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')
    const error = validateWorkspaceName(name)
    setNameError(error ?? '')
    setFormError('')
    if (error) {
      document.getElementById(`${formId}-name`)?.focus()
      return
    }

    pending.current = true; setSubmitting(true)
    try {
      const workspace = await registerWorkspace({ name: name.trim() })
      if (active.current) {
        const destination = imwebSiteCode
          ? `/workspaces/${workspace.id}/connections/imweb/assets?siteCode=${encodeURIComponent(imwebSiteCode)}`
          : `/workspaces/${workspace.id}`
        navigate(destination, { replace: true })
      }
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : '워크스페이스를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) { setFormError(message); void modal.error({ title: '워크스페이스 생성 실패', message, returnFocus }) }
    } finally {
      pending.current = false
      if (active.current) setSubmitting(false)
    }
  }

  return {
    formId,
    name,
    nameError,
    formError,
    submitting,
    handleChange,
    handleSubmit,
  }
}
