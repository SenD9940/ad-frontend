export const EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginFormValues = {
  email: string
  password: string
}

export type LoginField = keyof LoginFormValues
export type LoginFieldErrors = Partial<Record<LoginField, string>>

export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = '이메일을 입력하세요.'
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = '올바른 이메일을 입력하세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력하세요.'
  }

  return errors
}

export function firstErrorField(errors: LoginFieldErrors): LoginField | undefined {
  const order: LoginField[] = ['email', 'password']
  return order.find((field) => errors[field])
}
