import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { getNaverOrderDetail, getNaverOrderOptions, getNaverOrders } from '../../api/naverOrders'
import { useNaverOrderResource } from '../../hooks/useNaverOrderResource'
import type { NaverStore } from '../../types/naverStore'
import type { NaverOrderQuery } from '../../types/naverOrder'
import { NaverOrderFilters, NaverOrderSearch } from './NaverOrderFilters'
import { NaverOrderDetails } from './NaverOrderDetails'
import { NaverSettlementPanel } from './NaverSettlementPanel'
import { naverClaimLabels, naverOrderLabel, naverOrderMoney, naverOrderStatusLabels, naverOrderTime, validateNaverOrderDate } from './naverOrderModel'
import { koreaToday } from './naverPerformanceDates'
import { OrderActions, OrderGrid, OrderMuted, OrderPagination, OrderScrollHint, OrderStack, OrderTable, OrderTablePanel, OrderTableRegion } from './NaverOrderStyles'
import { DetailAlert, DetailBadge, DetailEmpty, DetailPanel, DetailSecondaryButton, DetailStatus, PanelHeading } from './WorkspaceDetailUI'

export function NaverOrderWorkspace({ workspaceId, store, onBusy }: { workspaceId: number; store: NaverStore; onBusy: (value: boolean) => void }) {
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [defaultDate] = useState(koreaToday)
  const query: NaverOrderQuery = { date: params.get('date') ?? defaultDate, rangeType: params.get('rangeType') ?? 'PAYED_DATETIME', status: params.get('status') ?? '', page: Number(params.get('page') ?? 1) }
  const orderId = params.get('orderId') ?? ''
  const loadOptions = useCallback((signal: AbortSignal) => getNaverOrderOptions(workspaceId, store.assetId, signal), [workspaceId, store.assetId])
  const options = useNaverOrderResource(`${workspaceId}:${store.assetId}`, loadOptions)
  const queryError = validateNaverOrderDate(query.date) || (!Number.isSafeInteger(query.page) || query.page < 1 ? '페이지 번호가 올바르지 않습니다.' : '')
    || (options.data && !options.data.rangeTypes.some(item => item.code === query.rangeType) ? '조회 기준을 다시 선택해 주세요.' : '')
    || (options.data && query.status && !options.data.statuses.some(item => item.code === query.status) ? '주문 상태를 다시 선택해 주세요.' : '')
  const { date, rangeType, status, page } = query
  const loadOrders = useCallback(async (signal: AbortSignal) => {
    const value = await getNaverOrders(workspaceId, store.assetId, { date, rangeType, status, page }, signal)
    if (value.channelNo !== store.channelNo) throw new ApiError('선택한 스토어의 주문 응답이 아닙니다.')
    return value
  }, [workspaceId, store.assetId, store.channelNo, date, rangeType, status, page])
  const orders = useNaverOrderResource(options.data && !queryError ? JSON.stringify([workspaceId, store.assetId, date, rangeType, status, page]) : null, loadOrders)
  const orderIdError = orderId && !/^[1-9]\d{0,19}$/.test(orderId) ? '상품 주문 번호가 올바르지 않습니다.' : ''
  const loadDetail = useCallback(async (signal: AbortSignal) => {
    const value = await getNaverOrderDetail(workspaceId, store.assetId, orderId, signal)
    if (value.channelNo !== store.channelNo) throw new ApiError('선택한 스토어의 주문 상세 응답이 아닙니다.')
    return value
  }, [workspaceId, store.assetId, store.channelNo, orderId])
  const detail = useNaverOrderResource(orderId && !orderIdError ? JSON.stringify([workspaceId, store.assetId, orderId]) : null, loadDetail)
  function setQuery(next: Partial<NaverOrderQuery>) {
    if (busy) return
    setParams(current => { const result = new URLSearchParams(current); Object.entries(next).forEach(([key, value]) => value === '' ? result.delete(key) : result.set(key, String(value))); return result })
  }
  function openOrder(id: string) { if (busy) return; setParams(current => { const next = new URLSearchParams(current); next.set('orderId', id); return next }); requestAnimationFrame(() => document.getElementById('naver-order-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  function busyChanged(value: boolean) { setBusy(value); onBusy(value) }
  return <>
    {notice && <DetailAlert $success role="status">{notice} 최신 주문 상태를 확인해 주세요.</DetailAlert>}
    <OrderGrid>
      <DetailPanel><PanelHeading><div><h2>날짜별 주문 조회</h2><p>선택한 날짜에 해당하는 상품 주문</p></div></PanelHeading><OrderStack>
        {options.loading ? <DetailStatus role="status">주문 조회 설정을 불러오는 중…</DetailStatus> : options.error ? <><DetailAlert role="alert">{options.error}</DetailAlert><DetailSecondaryButton onClick={options.reload}>설정 다시 조회</DetailSecondaryButton></> : options.data && <NaverOrderFilters key={`${date}:${rangeType}:${status}`} value={query} rangeTypes={options.data.rangeTypes} statuses={options.data.statuses} busy={busy} onApply={value => setQuery({ ...value, page: 1 })} />}
      </OrderStack></DetailPanel>
      <DetailPanel><PanelHeading><div><h2>주문 번호로 조회</h2><p>상품 주문 번호를 알고 있는 경우</p></div></PanelHeading><OrderStack><NaverOrderSearch busy={busy} onOpen={openOrder} /></OrderStack></DetailPanel>
    </OrderGrid>
    {queryError && <DetailAlert role="alert">{queryError}</DetailAlert>}
    {options.data && !queryError && <OrderTablePanel>
      <PanelHeading><div><h2>상품 주문 목록</h2><p>{date} · {options.data.rangeTypes.find(item => item.code === rangeType)?.label}</p></div><DetailSecondaryButton disabled={orders.loading || busy} onClick={orders.reload}>목록 새로고침</DetailSecondaryButton></PanelHeading>
      {orders.loading ? <DetailStatus role="status">주문을 불러오는 중…</DetailStatus> : orders.error ? <DetailEmpty><DetailAlert role="alert">{orders.error}</DetailAlert><DetailSecondaryButton onClick={orders.reload}>주문 다시 조회</DetailSecondaryButton></DetailEmpty> : orders.data && <>
        {orders.data.items.length ? <><OrderScrollHint>표를 좌우로 이동해 결제 내역과 처리 상태를 확인하세요. 금액은 상품 주문 기준이며 배송비는 별도입니다.</OrderScrollHint><OrderTableRegion tabIndex={0} role="region" aria-label="상품 주문 목록"><OrderTable><caption>선택한 날짜의 상품 주문별 결제 금액과 배송·취소·반품 상태</caption><thead><tr><th>상품 주문</th><th>주문 / 결제</th><th>상품 결제액</th><th>상태</th><th>관리</th></tr></thead><tbody>{orders.data.items.map(item => <tr key={item.productOrderId}>
          <th scope="row"><strong>{item.productName || '상품명 미제공'}</strong>{item.productOption && <small>{item.productOption}</small>}<small>상품 주문 {item.productOrderId}</small><small>최초 수량 {item.initialQuantity ?? '—'} · 잔여 수량 {item.remainingQuantity ?? '—'}</small></th>
          <td>{naverOrderTime(item.orderDate)}<small>결제 {naverOrderTime(item.paymentDate)}</small></td>
          <td><strong>{naverOrderMoney(item.initialPaymentAmount)}</strong><small>잔여 {naverOrderMoney(item.remainingPaymentAmount)}</small></td>
          <td><DetailBadge>{naverOrderLabel(item.status, naverOrderStatusLabels)}</DetailBadge>{item.claimStatus && <small>{naverOrderLabel(item.claimStatus, naverClaimLabels)}</small>}</td>
          <td><DetailSecondaryButton disabled={busy} onClick={() => openOrder(item.productOrderId)} aria-label={`${item.productName || item.productOrderId} 상세`}>상세</DetailSecondaryButton></td>
        </tr>)}</tbody></OrderTable></OrderTableRegion></> : <DetailEmpty><p>{orders.data.hasNext ? '이 페이지에 선택한 스토어의 주문이 없습니다. 다음 페이지를 확인해 주세요.' : page > 1 ? '이 페이지에 주문이 없습니다. 이전 페이지를 확인해 주세요.' : '선택한 날짜와 조건에 해당하는 상품 주문이 없습니다.'}</p></DetailEmpty>}
        <OrderPagination><DetailSecondaryButton disabled={page <= 1 || busy} onClick={() => setQuery({ page: page - 1 })}>이전</DetailSecondaryButton><span aria-live="polite">{page}페이지</span><DetailSecondaryButton disabled={!orders.data.hasNext || busy} onClick={() => setQuery({ page: page + 1 })}>다음</DetailSecondaryButton></OrderPagination>
        <OrderStack><OrderMuted>{orders.data.notice} · 조회 시각 {naverOrderTime(orders.data.fetchedAt)}</OrderMuted></OrderStack>
      </>}
    </OrderTablePanel>}
    {orderId && <section id="naver-order-detail" aria-label="상품 주문 상세" style={{ scrollMarginTop: 24 }}>
      <OrderActions><h2>상품 주문 상세</h2><DetailSecondaryButton disabled={busy || detail.loading} onClick={detail.reload}>상세 새로고침</DetailSecondaryButton><DetailSecondaryButton disabled={busy} onClick={() => setParams(current => { const next = new URLSearchParams(current); next.delete('orderId'); return next })}>상세 닫기</DetailSecondaryButton></OrderActions>
      {orderIdError ? <DetailAlert role="alert">{orderIdError}</DetailAlert> : detail.loading ? <DetailPanel><DetailStatus role="status">주문 상세를 불러오는 중…</DetailStatus></DetailPanel> : detail.error ? <DetailPanel><DetailEmpty><DetailAlert role="alert">{detail.error}</DetailAlert><DetailSecondaryButton onClick={detail.reload}>상세 다시 조회</DetailSecondaryButton></DetailEmpty></DetailPanel> : detail.data && <NaverOrderDetails key={orderId} workspaceId={workspaceId} data={detail.data} options={options.data} onBusy={busyChanged} onNotice={setNotice} onReload={() => { detail.reload(); orders.reload() }} />}
    </section>}
    {options.data && <NaverSettlementPanel workspaceId={workspaceId} store={store} options={options.data} busy={busy} />}
  </>
}
