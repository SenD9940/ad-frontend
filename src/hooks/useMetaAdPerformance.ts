import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/http'
import {
  getMetaAdAccountPerformance, getMetaAdWorkspacePerformance,
  getMetaCampaigns, listSavedMetaAdAccounts,
} from '../api/metaAds'
import { validatePerformancePeriod } from '../pages/workspace/metaPerformanceDates'
import type {
  DateRange, MetaAdAccountPerformanceResponse, MetaAdWorkspacePerformanceResponse,
} from '../types/metaAds'

type Performance =
  | { mode: 'workspace'; data: MetaAdWorkspacePerformanceResponse }
  | { mode: 'account'; data: MetaAdAccountPerformanceResponse }

export function useMetaAdPerformance(workspaceId: number, assetId: number | null, period: DateRange) {
  const validWorkspace = Number.isSafeInteger(workspaceId) && workspaceId > 0
  const { since, until } = period
  const loadAccounts = useCallback((signal: AbortSignal) => listSavedMetaAdAccounts(workspaceId, signal), [workspaceId])
  const inventory = useReadRequest(validWorkspace ? String(workspaceId) : null, loadAccounts,
    '저장된 Meta 광고 계정을 불러오지 못했습니다. 다시 시도해 주세요.')
  const accounts = inventory.data ?? []
  const accountsError = validWorkspace ? inventory.error : '워크스페이스 정보가 올바르지 않습니다.'
  const inventoryReady = validWorkspace && inventory.data !== null && !inventory.loading && !accountsError
  const selectedAccountExists = assetId === null || accounts.some((account) => account.assetId === assetId)
  const validAssetId = assetId === null || (Number.isSafeInteger(assetId) && assetId > 0)
  const selectionError = !validAssetId || (inventoryReady && !selectedAccountExists)
    ? '저장된 Meta 광고 계정이 아닙니다. 목록에서 광고 계정을 다시 선택해 주세요.' : ''
  const periodError = validatePerformancePeriod({ since, until })
  const canRead = inventoryReady && accounts.length > 0 && !selectionError

  const loadPerformance = useCallback(async (signal: AbortSignal): Promise<Performance> => {
    if (assetId === null) {
      return { mode: 'workspace', data: await getMetaAdWorkspacePerformance(workspaceId, { since, until }, signal) }
    }
    return { mode: 'account', data: await getMetaAdAccountPerformance(workspaceId, assetId, { since, until }, signal) }
  }, [assetId, since, until, workspaceId])
  const performance = useReadRequest(
    canRead && !periodError ? JSON.stringify([workspaceId, assetId, since, until]) : null,
    loadPerformance,
    '광고 성과를 불러오지 못했습니다. 다시 시도해 주세요.',
  )

  // Campaign inventory has no date dimension. Period changes only reload Insights.
  const loadCampaigns = useCallback((signal: AbortSignal) => {
    if (assetId === null) return Promise.reject(new ApiError('광고 계정을 선택해 주세요.'))
    return getMetaCampaigns(workspaceId, assetId, signal)
  }, [assetId, workspaceId])
  const campaignInventory = useReadRequest(
    canRead && assetId !== null ? JSON.stringify([workspaceId, assetId]) : null,
    loadCampaigns,
    '캠페인 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
  )

  return {
    accounts,
    accountsLoading: inventory.loading,
    accountsError,
    reloadAccounts: inventory.reload,
    workspacePerformance: performance.data?.mode === 'workspace' ? performance.data.data : null,
    accountPerformance: performance.data?.mode === 'account' ? performance.data.data : null,
    performanceLoading: performance.loading,
    performanceError: selectionError || periodError || performance.error,
    reloadPerformance: performance.reload,
    campaigns: campaignInventory.data ?? [],
    campaignsLoading: campaignInventory.loading,
    campaignsError: assetId === null ? '' : selectionError || campaignInventory.error,
    reloadCampaigns: campaignInventory.reload,
  }
}

type RequestIdentity = { key: string | null; revision: number }
type ReadResult<T> = { request: RequestIdentity; data: T | null; error: string }

/** Results belong to a particular request identity, not just a URL. Switching
 * A → B → A starts a fresh request and cannot revive an earlier A response. */
function useReadRequest<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>, fallback: string) {
  const [revision, setRevision] = useState(0)
  const request = useMemo<RequestIdentity>(() => ({ key, revision }), [key, revision])
  const [result, setResult] = useState<ReadResult<T> | null>(null)

  useEffect(() => {
    if (request.key === null) return
    const controller = new AbortController()
    async function run() {
      try {
        const data = await load(controller.signal)
        if (!controller.signal.aborted) setResult({ request, data, error: '' })
      } catch (caught) {
        if (!controller.signal.aborted) {
          setResult({ request, data: null, error: caught instanceof ApiError ? caught.message : fallback })
        }
      }
    }
    void run()
    return () => controller.abort()
  }, [fallback, load, request])

  const current = request.key !== null && result?.request === request ? result : null
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return {
    data: current?.data ?? null,
    error: current?.error ?? '',
    loading: request.key !== null && current === null,
    reload,
  }
}
