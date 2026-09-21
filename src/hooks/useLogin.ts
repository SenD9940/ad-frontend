import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/http'
import { loginUser } from '../api/users'
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
  const formId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  const [formError, setFormError] = useState('')
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
    setFormError('')
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
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    setFormError('')

    const invalidField = firstErrorField(nextErrors)
    if (invalidField) {
      document.getElementById(fieldId(invalidField))?.focus()
      return
    }

    setSubmitting(true)
    try {
      const tokens = await loginUser({
        email: values.email.trim(),
        password: values.password,
      })
      setSession(tokens)
      navigate(nextPathAfterLogin(location.state), { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      setFormError(message)
      requestAnimationFrame(() => {
        document.getElementById(`${formId}-form-error`)?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        })
      })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formId,
    fieldId,
    errorId,
    values,
    errors,
    formError,
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
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return '/workspaces'
  }
  return from
}

