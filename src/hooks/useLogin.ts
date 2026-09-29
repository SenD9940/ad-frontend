import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/http'
import { loginUser } from '../api/users'
import { useModal } from '../components/common/useModal'
import {
  firstErrorField,
  validateLoginForm,
  type LoginField,
  type LoginFieldErrors,
  type LoginFormValues,
} from '../pages/login/loginValidation'

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
}

export function useLogin() {
  const modal = useModal()
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const formId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fieldId = (name: LoginField) => `${formId}-${name}`
  const errorId = (name: LoginField) => `${formId}-${name}-error`

  function updateField<K extends LoginField>(name: K, value: LoginFormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) {
        return current
      }
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    updateField(name as LoginField, value)
  }

  function togglePassword() {
    setShowPassword((current) => !current)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const returnFocus = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    const invalidField = firstErrorField(nextErrors)
    if (invalidField) {
      document.getElementById(fieldId(invalidField))?.focus()
      return
    }

    pending.current = true; setSubmitting(true)
    try {
      const tokens = await loginUser({
        email: values.email.trim(),
        password: values.password,
      })
      if (!active.current) return
      setSession(tokens)
      navigate(nextPathAfterLogin(location.state), { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) void modal.error({ title: '로그인 실패', message, returnFocus })
    } finally {
      pending.current = false
      if (active.current) setSubmitting(false)
    }
  }

  return {
    formId,
    fieldId,
    errorId,
    values,
    errors,
    submitting,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
  }
}

function nextPathAfterLogin(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return '/workspaces'
  }
  const from = (state as { from?: unknown }).from
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || /[\\\r\n]/.test(from)) {
    return '/workspaces'
  }
  return from
}
