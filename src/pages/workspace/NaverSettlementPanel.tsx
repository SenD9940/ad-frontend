import { useCallback, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/http'
import { getNaverSettlements } from '../../api/naverOrders'
import { useNaverOrderResource } from '../../hooks/useNaverOrderResource'
import type { NaverOrderOptions } from '../../types/naverOrder'
import type { NaverStore } from '../../types/naverStore'
import { naverPresetPeriod } from './naverPerformanceDates'
import { naverOrderMoney, naverOrderTime } from './naverOrderModel'
import { OrderActions, OrderField, OrderForm, OrderGrid, OrderMuted, OrderPagination, OrderScrollHint, OrderStack, OrderTable, OrderTablePanel, OrderTableRegion } from './NaverOrderStyles'
import { DetailAlert, DetailEmpty, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, PanelHeading } from './WorkspaceDetailUI'

export function NaverSettlementPanel({ workspaceId, store, options, busy }: { workspaceId: number; store: NaverStore; options: NaverOrderOptions; busy: boolean }) {
  const [draft, setDraft] = useState(() => naverPresetPeriod('7d'))
  const [query, setQuery] = useState<{ since: string; until: string; page: number } | null>(null)
  const [error, setError] = useState('')
  const since = query?.since ?? '', until = query?.until ?? '', page = query?.page ?? 1
  const load = useCallback(async (signal: AbortSignal) => {
    const value = await getNaverSettlements(workspaceId, store.assetId, since, until, page, signal)
    if (value.channelNo !== store.channelNo) throw new ApiError('선택한 스토어의 정산 응답이 아닙니다.')
    return value
  }, [workspaceId, store.assetId, store.channelNo, since, until, page])
  const result = useNaverOrderResource(options.settlementAvailable && query ? JSON.stringify([workspaceId, store.assetId, since, until, page]) : null, load)
  function submit(event: FormEvent) {
    event.preventDefault()
    const start = parseDate(draft.since), end = parseDate(draft.until)
    const message = !Number.isFinite(start) || !Number.isFinite(end) ? '정산 조회 기간을 올바르게 입력해 주세요.' : start > end ? '종료일은 시작일 이후여야 합니다.' : (end - start) / 86_400_000 + 1 > 28 ? '정산 조회 기간은 시작일과 종료일을 포함해 최대 28일입니다.' : ''
    setError(message)
    if (!message) { if (since === draft.since && until === draft.until && page === 1) result.reload(); else setQuery({ ...draft, page: 1 }) }
  }
  return <OrderTablePanel><PanelHeading><div><h2>정산 내역</h2><p>정산 예정일 기준 · 최대 28일</p></div></PanelHeading>
    {!options.settlementAvailable ? <OrderStack><OrderMuted>{options.settlementUnavailableReason || '현재 연결에서는 스토어별 정산을 구분할 수 없어 정산 조회를 지원하지 않습니다.'}</OrderMuted></OrderStack> : <>
      <OrderStack><OrderForm onSubmit={submit} noValidate><OrderGrid>
        <OrderField>정산 시작일<input type="date" value={draft.since} disabled={busy} onChange={event => { setDraft(current => ({ ...current, since: event.target.value })); setError('') }} /></OrderField>
        <OrderField>정산 종료일<input type="date" value={draft.until} disabled={busy} onChange={event => { setDraft(current => ({ ...current, until: event.target.value })); setError('') }} /></OrderField>
      </OrderGrid><OrderActions><DetailPrimaryButton type="submit" disabled={busy || result.loading}>정산 조회</DetailPrimaryButton></OrderActions>{error && <DetailAlert role="alert">{error}</DetailAlert>}</OrderForm><OrderMuted>조회 기간은 정산 예정일 기준이며 미래 예정 내역도 조회할 수 있습니다. 페이지에 표시된 개별 정산 금액이며 기간 전체 합계가 아닙니다.</OrderMuted></OrderStack>
      {result.loading ? <DetailStatus role="status">정산 내역을 불러오는 중…</DetailStatus> : result.error ? <DetailEmpty><DetailAlert role="alert">{result.error}</DetailAlert><DetailSecondaryButton onClick={result.reload}>정산 다시 조회</DetailSecondaryButton></DetailEmpty> : result.data && <>
        {result.data.items.length ? <><OrderScrollHint>표를 좌우로 이동해 결제·수수료·혜택 정산 금액을 확인하세요. 미제공 금액은 —로 표시합니다.</OrderScrollHint><OrderTableRegion role="region" aria-label="정산 내역 표" tabIndex={0}><OrderTable><caption>정산 예정일 기준 개별 정산 내역. 기간 전체 합계가 아닙니다.</caption><thead><tr><th>정산 예정일</th><th>정산금액</th><th>결제 정산</th><th>수수료 정산</th><th>혜택 정산</th><th>공제·환급 정산</th></tr></thead><tbody>{result.data.items.map((item, index) => <tr key={`${item.settleExpectDate}:${item.settleMethodType}:${index}`}>
          <th scope="row"><strong>{item.settleExpectDate || '—'}</strong><small>완료 {item.settleCompleteDate || '—'}</small><small>기준 {item.settleBasisStartDate || '—'} ~ {item.settleBasisEndDate || '—'}</small><small>{item.settleMethodType || '방식 미제공'}</small></th><td>{naverOrderMoney(item.settleAmount)}</td><td>{naverOrderMoney(item.paySettleAmount)}</td><td>{naverOrderMoney(item.commissionSettleAmount)}</td><td>{naverOrderMoney(item.benefitSettleAmount)}</td><td>{naverOrderMoney(item.deductionRestoreSettleAmount)}</td>
        </tr>)}</tbody></OrderTable></OrderTableRegion></> : <DetailEmpty><p>이 페이지에 정산 내역이 없습니다.</p></DetailEmpty>}
        <OrderPagination><DetailSecondaryButton disabled={page <= 1 || busy} onClick={() => setQuery({ since, until, page: page - 1 })}>이전 정산</DetailSecondaryButton><span>{page}페이지</span><DetailSecondaryButton disabled={!result.data.hasNext || busy} onClick={() => setQuery({ since, until, page: page + 1 })}>다음 정산</DetailSecondaryButton></OrderPagination>
        <OrderStack><OrderMuted>{result.data.notice} · 조회 시각 {naverOrderTime(result.data.fetchedAt)}</OrderMuted></OrderStack>
      </>}
    </>}
  </OrderTablePanel>
}

function parseDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN; const time = Date.parse(`${value}T00:00:00Z`); return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN }
