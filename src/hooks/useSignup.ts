import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/http'
import { registerUser } from '../api/users'
import { useModal } from '../components/common/useModal'
import {
  firstErrorField,
  formatPhoneNumber,
  validateSignupForm,
  type SignupField,
  type SignupFieldErrors,
  type SignupFormValues,
} from '../pages/signup/signupValidation'

const INITIAL_VALUES: SignupFormValues = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
}

const DAUM_POSTCODE_SRC =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

export function useSignup() {
  const modal = useModal()
  const navigate = useNavigate(), location = useLocation()
  const active = useRef(true), pending = useRef(false), postcodePending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const formId = useId()
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<SignupFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [completedEmail, setCompletedEmail] = useState('')

  const fieldId = (name: SignupField) => `${formId}-${name}`
  const errorId = (name: SignupField) => `${formId}-${name}-error`

  function updateField<K extends SignupField>(name: K, value: SignupFormValues[K]) {
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
    if (name === 'phone') {
      updateField('phone', formatPhoneNumber(value))
      return
    }
    updateField(name as SignupField, value)
  }

  function togglePassword() {
    setShowPassword((current) => !current)
  }

  async function openPostcode() {
    if (postcodePending.current || pending.current) return
    postcodePending.current = true
    try {
      await loadDaumPostcode()
      if (!active.current) return
      new window.daum!.Postcode({
        oncomplete: (data) => {
          if (!active.current || pending.current) return
          setValues((current) => ({
            ...current,
            zipCode: data.zonecode,
            address: data.address,
          }))
          setErrors((current) => {
            const next = { ...current }
            delete next.zipCode
            delete next.address
            return next
          })
          document.getElementById(fieldId('addressDetail'))?.focus()
        },
      }).open()
    } catch {
      if (active.current) void modal.error({ title: '주소 검색을 열 수 없습니다', message: '주소 검색을 불러오지 못했습니다. 주소를 직접 입력하거나 주소 없이 가입할 수 있습니다.', returnFocus: document.getElementById(fieldId('zipCode')) })
    } finally { postcodePending.current = false }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || completedEmail) return
    const returnFocus = event.currentTarget.querySelector<HTMLButtonElement>('button[type="submit"]')
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)

    const invalidField = firstErrorField(nextErrors)
    if (invalidField) {
      document.getElementById(fieldId(invalidField))?.focus()
      return
    }

    pending.current = true; setSubmitting(true)
    try {
      const user = await registerUser({
        email: values.email.trim(),
        password: values.password,
        name: values.name.trim(),
        phone: values.phone.trim(),
        zipCode: values.zipCode.trim() || undefined,
        address: values.address.trim() || undefined,
        addressDetail: values.addressDetail.trim() || undefined,
      })
      if (!active.current) return
      setCompletedEmail(user.email)
      setValues(current => ({ ...current, password: '', passwordConfirm: '' }))
      if (await modal.success({ title: '회원가입이 완료되었습니다', message: `${user.email} 계정으로 가입했습니다. 로그인하고 시작해 주세요.`, confirmLabel: '로그인하기' }) && active.current) navigate('/login', { replace: true, state: location.state })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      if (active.current) void modal.error({ title: '회원가입 실패', message, returnFocus })
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
    completedEmail,
    handleChange,
    handleSubmit,
    openPostcode,
    togglePassword,
  }
}

let daumPostcodeLoading: Promise<void> | undefined

function loadDaumPostcode(): Promise<void> {
  if (window.daum?.Postcode) {
    return Promise.resolve()
  }
  if (daumPostcodeLoading) {
    return daumPostcodeLoading
  }

  daumPostcodeLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${DAUM_POSTCODE_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = DAUM_POSTCODE_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      daumPostcodeLoading = undefined
      reject()
    }
    document.head.appendChild(script)
  })

  return daumPostcodeLoading
}
