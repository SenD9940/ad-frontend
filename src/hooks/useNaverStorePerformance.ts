import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/http'
import { getNaverProducts, getNaverSales, listSavedNaverStores } from '../api/naverStores'
import { validateNaverPeriod, type NaverDateRange } from '../pages/workspace/naverPerformanceDates'

export function useNaverStorePerformance(workspaceId: number, assetId: number | null, period: NaverDateRange, page: number) {
  const validWorkspace = Number.isSafeInteger(workspaceId) && workspaceId > 0
  const loadStores = useCallback((signal: AbortSignal) => listSavedNaverStores(workspaceId, signal), [workspaceId])
  const inventory = useRead(validWorkspace ? String(workspaceId) : null, loadStores, '저장된 스마트스토어를 불러오지 못했습니다.')
  const stores = inventory.data ?? []
  const selected = assetId === null ? stores[0] : stores.find((store) => store.assetId === assetId)
  const selectionError = inventory.data && stores.length && !selected ? '저장된 스마트스토어가 아닙니다. 채널을 다시 선택해 주세요.' : ''
  const selectedId = selected?.assetId
  const selectedChannel = selected?.channelNo
  const ready = validWorkspace && Boolean(selectedId) && !inventory.loading && !inventory.error && !selected?.requiresReauth
  const { since, until } = period
  const periodError = validateNaverPeriod(period)
  const loadProducts = useCallback(async (signal: AbortSignal) => {
    const data = await getNaverProducts(workspaceId, selectedId!, page, signal)
    if (data.channelNo !== selectedChannel) throw new ApiError('선택한 스마트스토어의 상품 응답이 아닙니다. 다시 조회해 주세요.')
    return data
  }, [workspaceId, selectedId, selectedChannel, page])
  const products = useRead(ready ? JSON.stringify([workspaceId, selectedId, selectedChannel, page]) : null, loadProducts, '판매 중인 상품을 불러오지 못했습니다.')
  const loadSales = useCallback(async (signal: AbortSignal) => {
    const data = await getNaverSales(workspaceId, selectedId!, { since, until }, signal)
    if (data.channelNo !== selectedChannel) throw new ApiError('선택한 스마트스토어의 판매 성과 응답이 아닙니다. 다시 조회해 주세요.')
    return data
  }, [workspaceId, selectedId, selectedChannel, since, until])
  const sales = useRead(ready && !periodError ? JSON.stringify([workspaceId, selectedId, selectedChannel, since, until]) : null, loadSales, '판매 성과를 불러오지 못했습니다.')
  return {
    stores, selected, selectionError,
    storesLoading: inventory.loading, storesError: validWorkspace ? inventory.error : '워크스페이스 정보가 올바르지 않습니다.', reloadStores: inventory.reload,
    products: products.data, productsLoading: products.loading, productsError: products.error, reloadProducts: products.reload,
    sales: sales.data, salesLoading: sales.loading, salesError: periodError || sales.error, reloadSales: sales.reload,
  }
}

type Identity = { key: string | null; revision: number }
type Result<T> = { identity: Identity; data: T | null; error: string }

function useRead<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>, fallback: string) {
  const [revision, setRevision] = useState(0)
  const identity = useMemo(() => ({ key, revision }), [key, revision])
  const [result, setResult] = useState<Result<T> | null>(null)
  useEffect(() => {
    if (identity.key === null) return
    const controller = new AbortController()
    load(controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ identity, data, error: '' })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ identity, data: null, error: error instanceof ApiError ? error.message : fallback })
    })
    return () => controller.abort()
  }, [identity, load, fallback])
  const current = result?.identity === identity && key !== null ? result : null
  return { data: current?.data ?? null, error: current?.error ?? '', loading: key !== null && !current, reload: useCallback(() => setRevision((value) => value + 1), []) }
}
