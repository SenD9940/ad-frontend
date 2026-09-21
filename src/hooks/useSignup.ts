import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError } from '../api/http'
import { registerUser } from '../api/users'
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
  const formId = useId()
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<SignupFieldErrors>({})
  const [formError, setFormError] = useState('')
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
    setFormError('')
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
    try {
      await loadDaumPostcode()
      new window.daum!.Postcode({
        oncomplete: (data) => {
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
      setFormError('주소 검색을 불러오지 못했습니다. 직접 입력해 주세요.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    setFormError('')

    const invalidField = firstErrorField(nextErrors)
    if (invalidField) {
      document.getElementById(fieldId(invalidField))?.focus()
      return
    }

    setSubmitting(true)
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
      setCompletedEmail(user.email)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
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
      daumPostcodeLoading = undefined
      reject()
    }
    document.head.appendChild(script)
  })

  return daumPostcodeLoading
}
