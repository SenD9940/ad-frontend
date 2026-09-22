import http, { ApiError } from './http'
import type { Api } from '../types/api'
import type { PlatformConnectionResponse } from '../types/platform'
import type {
  DateRange, MetaAdAccountPerformanceResponse, MetaAdAccountSummary, MetaAdCurrencyPerformance,
  MetaAdDailyAverage, MetaAdMetrics, MetaAdWorkspacePerformanceResponse, MetaCampaign,
  MetaCampaignPerformance, SavedMetaAdAccount,
} from '../types/metaAds'
import { validatePerformancePeriod } from '../pages/workspace/metaPerformanceDates'

// Meta paginates each list with a 30-second server budget. Workspace performance
// reads several accounts in sequence, so it needs more than the normal 15 seconds.
const META_READ_TIMEOUT = 120_000

export async function listSavedMetaAdAccounts(
  workspaceId: number,
  signal?: AbortSignal,
): Promise<SavedMetaAdAccount[]> {
  validateId(workspaceId, '워크스페이스')
  const { data } = await http.get<Api<PlatformConnectionResponse[]>>(
    `/api/workspaces/${workspaceId}/connections`, { signal },
  )
  if (!Array.isArray(data?.body)) throw invalidResponse('저장된 광고 계정 목록')
  const accounts: SavedMetaAdAccount[] = []
  for (const connection of data.body) {
    if (!connection || connection.providerType !== 'META') continue
    if (!positiveId(connection.id) || !Array.isArray(connection.assets)) throw invalidResponse('저장된 광고 계정 목록')
    for (const asset of connection.assets) {
      if (!asset || asset.platformType !== 'FACEBOOK' || asset.assetType !== 'AD_ACCOUNT') continue
      if (!positiveId(asset.id) || typeof asset.externalId !== 'string') throw invalidResponse('저장된 광고 계정 목록')
      // Keep every saved asset ID. The workspace endpoint chooses a usable token
      // when several Meta connections refer to the same external ad account.
      accounts.push({
        assetId: asset.id,
        connectionId: connection.id,
        externalId: asset.externalId,
        name: asset.name || asset.externalId,
        connectionName: connection.accountName || 'Meta 계정',
        requiresReauth: Boolean(connection.requiresReauth),
      })
    }
  }
  return accounts
}

export async function getMetaCampaigns(
  workspaceId: number,
  assetId: number,
  signal?: AbortSignal,
): Promise<MetaCampaign[]> {
  validateId(workspaceId, '워크스페이스')
  validateId(assetId, '광고 계정 자산')
  const { data } = await http.get<Api<MetaCampaign[]>>(
    `/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/campaigns`,
    { signal, timeout: META_READ_TIMEOUT },
  )
  if (!Array.isArray(data?.body) || !data.body.every(isCampaign)) throw invalidResponse('캠페인 목록')
  return data.body
}

export async function getMetaAdAccountPerformance(
  workspaceId: number,
  assetId: number,
  period: DateRange,
  signal?: AbortSignal,
): Promise<MetaAdAccountPerformanceResponse> {
  validateId(workspaceId, '워크스페이스')
  validateId(assetId, '광고 계정 자산')
  validatePeriod(period)
  const { data } = await http.get<Api<MetaAdAccountPerformanceResponse>>(
    `/api/workspaces/${workspaceId}/meta/ad-accounts/${assetId}/insights`,
    { signal, params: { since: period.since, until: period.until }, timeout: META_READ_TIMEOUT },
  )
  const body = data?.body
  if (!body || !matchesPeriod(body, period) || !isAccountSummary(body.account)
    || body.account.assetId !== assetId || !Array.isArray(body.campaigns)
    || !body.campaigns.every(isCampaignPerformance)) throw invalidResponse('광고 계정 성과')
  return body
}

export async function getMetaAdWorkspacePerformance(
  workspaceId: number,
  period: DateRange,
  signal?: AbortSignal,
): Promise<MetaAdWorkspacePerformanceResponse> {
  validateId(workspaceId, '워크스페이스')
  validatePeriod(period)
  const { data } = await http.get<Api<MetaAdWorkspacePerformanceResponse>>(
    `/api/workspaces/${workspaceId}/meta/insights`,
    { signal, params: { since: period.since, until: period.until }, timeout: META_READ_TIMEOUT },
  )
  const body = data?.body
  if (!body || !matchesPeriod(body, period) || !nonnegativeInteger(body.accountCount)
    || !Array.isArray(body.accounts) || !body.accounts.every(isAccountSummary)
    || body.accountCount !== body.accounts.length || !Array.isArray(body.totalsByCurrency)
    || !body.totalsByCurrency.every(isCurrencyPerformance)
    || body.totalsByCurrency.reduce((sum, group) => sum + group.accountCount, 0) !== body.accountCount) {
    throw invalidResponse('워크스페이스 광고 성과')
  }
  return body
}

function validatePeriod(period: DateRange): void {
  const error = validatePerformancePeriod(period)
  if (error) throw new ApiError(error, 400, 400)
}

function validateId(id: number, label: string): void {
  if (!positiveId(id)) throw new ApiError(`${label} 정보가 올바르지 않습니다.`, 400, 400)
}

function invalidResponse(label: string): ApiError {
  return new ApiError(`${label} 응답이 올바르지 않습니다. 다시 조회해 주세요.`)
}

function nonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function nonnegativeInteger(value: unknown): value is number {
  return nonnegativeNumber(value) && Number.isSafeInteger(value)
}

function positiveId(value: unknown): value is number {
  return nonnegativeInteger(value) && value > 0
}

function isMetrics(value: MetaAdMetrics): boolean {
  return Boolean(value && nonnegativeNumber(value.spend) && nonnegativeInteger(value.impressions)
    && nonnegativeInteger(value.clicks) && (value.ctr === null || nonnegativeNumber(value.ctr))
    && (value.cpc === null || nonnegativeNumber(value.cpc)) && (value.cpm === null || nonnegativeNumber(value.cpm))
    && nonnegativeNumber(value.purchaseValue) && (value.roas === null || nonnegativeNumber(value.roas)))
}

function isDailyAverage(value: MetaAdDailyAverage): boolean {
  return Boolean(value && nonnegativeNumber(value.spend) && nonnegativeNumber(value.impressions) && nonnegativeNumber(value.clicks))
}

function isCampaign(value: MetaCampaign): boolean {
  return Boolean(value && typeof value.id === 'string' && typeof value.name === 'string'
    && typeof value.status === 'string' && typeof value.effectiveStatus === 'string' && typeof value.objective === 'string')
}

function isCampaignPerformance(value: MetaCampaignPerformance): boolean {
  return Boolean(value && typeof value.campaignId === 'string' && typeof value.campaignName === 'string'
    && isMetrics(value.metrics) && isDailyAverage(value.dailyAverage))
}

function isAccountSummary(value: MetaAdAccountSummary): boolean {
  return Boolean(value && positiveId(value.assetId) && positiveId(value.connectionId)
    && typeof value.adAccountId === 'string' && typeof value.name === 'string'
    && typeof value.currency === 'string' && /^[A-Z]{3}$/.test(value.currency)
    && typeof value.timezoneName === 'string' && isMetrics(value.metrics) && isDailyAverage(value.dailyAverage))
}

function isCurrencyPerformance(value: MetaAdCurrencyPerformance): boolean {
  return Boolean(value && typeof value.currency === 'string' && /^[A-Z]{3}$/.test(value.currency)
    && positiveId(value.accountCount) && isMetrics(value.metrics) && isDailyAverage(value.dailyAverage))
}

function matchesPeriod(value: DateRange & { days: number }, period: DateRange): boolean {
  const days = (Date.parse(`${period.until}T00:00:00Z`) - Date.parse(`${period.since}T00:00:00Z`)) / 86_400_000 + 1
  return value.since === period.since && value.until === period.until && value.days === days
}
