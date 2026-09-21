export const WORKSPACE_NAME_MAX_LENGTH = 80
export const INVITE_EMAILS_MAX = 50
export const INVITE_EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateWorkspaceName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) {
    return '워크스페이스 이름을 입력하세요.'
  }
  if (trimmed.length > WORKSPACE_NAME_MAX_LENGTH) {
    return `이름은 ${WORKSPACE_NAME_MAX_LENGTH}자 이하로 입력하세요.`
  }
  return undefined
}

export function inviteEmailInputError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return '이메일을 입력하세요.'
  }
  if (trimmed.length > INVITE_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmed)) {
    return '올바른 이메일을 입력하세요.'
  }
  return undefined
}

export function parseInviteEmail(value: string): string | undefined {
  if (inviteEmailInputError(value)) {
    return undefined
  }
  return value.trim().toLowerCase()
}

export function parseUserId(value: string): number | undefined {
  const trimmed = value.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return undefined
  }
  const id = Number(trimmed)
  if (!Number.isSafeInteger(id)) {
    return undefined
  }
  return id
}

export const INVITE_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^[A-Za-z0-9_-]{43}$/
