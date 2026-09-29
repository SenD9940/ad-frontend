import { useCallback } from 'react'
import { getImwebProducts, getImwebSales, listImwebStores } from '../api/imweb'
import { validateNaverPeriod, type NaverDateRange } from '../pages/workspace/naverPerformanceDates'
import { useImwebResource } from './useImwebResource'

export function useImwebStorePerformance(workspaceId: number, assetId: number | null, period: NaverDateRange, page: number) {
  const loadStores = useCallback((signal: AbortSignal) => listImwebStores(workspaceId, signal), [workspaceId])
  const inventory = useImwebResource(String(workspaceId), loadStores)
  const stores = inventory.data ?? []
  const selected = assetId === null ? stores[0] : stores.find(item => item.assetId === assetId)
  const selectedId = selected?.assetId
  const unitCode = selected?.unitCode
  const currency = selected?.currency
  const ready = Boolean(selectedId) && !inventory.loading && !inventory.error && !selected?.requiresReauth
  const { since, until } = period
  const periodError = validateNaverPeriod(period)
  const loadProducts = useCallback(async (signal: AbortSignal) => {
    const data = await getImwebProducts(workspaceId, selectedId!, page, signal)
    if (data.unitCode !== unitCode) throw new Error('선택한 아임웹 스토어의 상품 응답이 아닙니다. 다시 조회해 주세요.')
    return data
  }, [workspaceId, selectedId, unitCode, page])
  const products = useImwebResource(ready ? JSON.stringify([workspaceId, selectedId, unitCode, page]) : null, loadProducts)
  const loadSales = useCallback(async (signal: AbortSignal) => {
    const data = await getImwebSales(workspaceId, selectedId!, { since, until }, signal)
    if (data.unitCode !== unitCode || data.currency !== currency) throw new Error('선택한 스토어와 통화의 판매 성과가 아닙니다. 다시 조회해 주세요.')
    return data
  }, [workspaceId, selectedId, unitCode, currency, since, until])
  const sales = useImwebResource(ready && !periodError ? JSON.stringify([workspaceId, selectedId, unitCode, currency, since, until]) : null, loadSales)
  return { inventory, stores, selected, ready, products, sales, periodError,
    selectionError: inventory.data && stores.length && !selected ? '저장된 아임웹 스토어가 아닙니다. 스토어를 다시 선택해 주세요.' : '' }
}
