export const NAVER_AUTHORIZATION_STATUSES = [
  'WAITING_AUTH', 'VALIDATING', 'REVIEW_REQUIRED', 'APPROVING', 'RECONCILING',
  'VERIFYING_CONNECTION', 'CONNECTED', 'FAILED', 'CANCELLED', 'EXPIRED',
] as const
export type NaverAuthorizationStatus = typeof NAVER_AUTHORIZATION_STATUSES[number]
export type NaverCapabilities = {
  mode: 'SOLUTION_OAUTH'
  ready: boolean
  reason: string | null
  manualConnectionAllowed: boolean
}
export type NaverAuthorization = {
  attemptId: string
  workspaceId: number
  status: NaverAuthorizationStatus
  reviewRevision: number | null
  seller: { name: string; storeUrl: string | null } | null
  subscription: { requiresApproval: boolean; planName: string | null; billingDescription: string | null } | null
  connectionId: number | null
  nextAction: string | null
  expiresAt: string
  launchUrl: string | null
  errorMessage: string | null
}
