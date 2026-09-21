export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const NAME_MAX_LENGTH = 50
export const ZIP_CODE_MAX_LENGTH = 20
export const ADDRESS_MAX_LENGTH = 200
export const ADDRESS_DETAIL_MAX_LENGTH = 100

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^01[016789]-[0-9]{3,4}-[0-9]{4}$/

export type SignupFormValues = {
  email: string
  password: string
  passwordConfirm: string
  name: string
  phone: string
  zipCode: string
  address: string
  addressDetail: string
}

export type SignupField = keyof SignupFormValues
export type SignupFieldErrors = Partial<Record<SignupField, string>>

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export function validateSignupForm(values: SignupFormValues): SignupFieldErrors {
  const errors: SignupFieldErrors = {}
  const email = values.email.trim()
  const name = values.name.trim()
  const phone = values.phone.trim()

  if (!email) {
    errors.email = '이메일을 입력하세요.'
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = '올바른 이메일을 입력하세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력하세요.'
  } else if (
    values.password.length < PASSWORD_MIN_LENGTH ||
    values.password.length > PASSWORD_MAX_LENGTH ||
    utf8ByteLength(values.password) > PASSWORD_MAX_LENGTH
  ) {
    errors.password = '비밀번호는 8자 이상, 72자 이하로 입력하세요.'
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호를 한 번 더 입력하세요.'
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  if (!name) {
    errors.name = '이름을 입력하세요.'
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = '이름은 50자 이하로 입력하세요.'
  }

  if (!phone) {
    errors.phone = '휴대폰 번호를 입력하세요.'
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = '휴대폰 번호 형식(010-0000-0000)으로 입력하세요.'
  }

  if (values.zipCode.length > ZIP_CODE_MAX_LENGTH) {
    errors.zipCode = '우편번호가 너무 깁니다.'
  }
  if (values.address.length > ADDRESS_MAX_LENGTH) {
    errors.address = '주소가 너무 깁니다.'
  }
  if (values.addressDetail.length > ADDRESS_DETAIL_MAX_LENGTH) {
    errors.addressDetail = '상세 주소가 너무 깁니다.'
  }

  return errors
}

export function firstErrorField(errors: SignupFieldErrors): SignupField | undefined {
  const order: SignupField[] = [
    'email',
    'password',
    'passwordConfirm',
    'name',
    'phone',
    'zipCode',
    'address',
    'addressDetail',
  ]
  return order.find((field) => errors[field])
}
