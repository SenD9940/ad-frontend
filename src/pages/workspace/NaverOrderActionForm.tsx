import { useEffect, useRef, useState, type FormEvent } from 'react'
import { applyNaverOrderAction, NaverOrderWriteError } from '../../api/naverOrders'
import Modal from '../../components/common/Modal'
import { useErrorModal } from '../../components/common/useErrorModal'
import type { NaverOrderActionCode, NaverOrderActionRequest, NaverOrderDetail, NaverOrderOptions } from '../../types/naverOrder'
import { OrderActions, OrderCheck, OrderExternalLink, OrderFacts, OrderField, OrderForm, OrderGrid, OrderMuted, OrderStack } from './NaverOrderStyles'
import { naverActionLabels, naverOrderTime } from './naverOrderModel'
import { DetailAlert, DetailBadge, DetailPanel, DetailPrimaryButton, DetailSecondaryButton, PanelHeading } from './WorkspaceDetailUI'

function koreaNow() { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).replace(' ', 'T') }

export function NaverOrderActionForm({ workspaceId, data, options, onBusy, onReload, onNotice }: {
  workspaceId: number; data: NaverOrderDetail; options: NaverOrderOptions | null; onBusy: (value: boolean) => void; onReload: () => void; onNotice: (value: string) => void
}) {
  const [action, setAction] = useState<NaverOrderActionCode | ''>('')
  const [method, setMethod] = useState('DELIVERY')
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [dispatchDate, setDispatchDate] = useState(koreaNow)
  const [received, setReceived] = useState(false)
  const [review, setReview] = useState<NaverOrderActionRequest | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [failure, setFailure] = useState<{ message: string; unknown: boolean } | null>(null)
  useErrorModal(failure?.message, failure?.unknown ? '주문 처리 결과 확인 필요' : '주문 처리 실패')
  const [checked, setChecked] = useState(false)
  const active = useRef(true), pending = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const selected = data.actions.find(item => item.code === action)
  const reviewedClaims = data.currentClaims.filter(item => item.type === (review?.action === 'APPROVE_CANCEL' ? 'CANCEL' : review?.action === 'APPROVE_RETURN' ? 'RETURN' : ''))
  const panelHeading = useRef<HTMLHeadingElement>(null)
  function prepare(event: FormEvent) {
    event.preventDefault()
    if (pending.current || !selected || review || failure) return
    let message = ''
    const request: NaverOrderActionRequest = { action: selected.code, expectedVersion: data.version, requestId: crypto.randomUUID() }
    if (action === 'DISPATCH') {
      if (!options?.deliveryMethods.some(item => item.code === method)) message = '배송 방법을 선택해 주세요.'
      else if (!dispatchDate || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dispatchDate) || !Number.isFinite(Date.parse(`${dispatchDate}:00+09:00`)) || Date.parse(`${dispatchDate}:00+09:00`) > Date.now()) message = '발송 일시를 한국 시간 기준 현재 이전으로 입력해 주세요.'
      else if (method === 'DELIVERY' && !options.carriers.some(item => item.code === carrier)) message = '택배사를 선택해 주세요.'
      else if (method === 'DELIVERY' && (!tracking.trim() || tracking.trim().length > 100)) message = '송장 번호를 1~100자로 입력해 주세요.'
      request.deliveryMethod = method; request.dispatchDate = `${dispatchDate}:00+09:00`
      if (method === 'DELIVERY') { request.deliveryCompanyCode = carrier; request.trackingNumber = tracking.trim() }
    }
    if (action === 'APPROVE_RETURN') { if (!received) message = '반품 상품을 실제로 수령했는지 확인해 주세요.'; request.returnReceived = true }
    setError(message)
    if (!message) { onNotice(''); setReview(request); setFailure(null) }
  }
  function closeReview() {
    if (pending.current || failure) return
    setReview(null); setError('')
  }
  async function apply() {
    if (!review || pending.current || failure) return
    pending.current = true; setBusy(true); onBusy(true)
    let requiresReconciliation = false
    try {
      const result = await applyNaverOrderAction(workspaceId, data.assetId, data.order.productOrderId, review)
      if (active.current) { onNotice(result.notice); onBusy(false); onReload() }
    } catch (caught: unknown) {
      requiresReconciliation = caught instanceof NaverOrderWriteError ? caught.outcomeUnknown : true
      if (active.current) {
        setFailure({ message: caught instanceof Error ? caught.message : '처리 결과를 확인하지 못했습니다.', unknown: requiresReconciliation })
        requestAnimationFrame(() => panelHeading.current?.focus())
      }
    } finally { pending.current = false; if (active.current) { setBusy(false); onBusy(requiresReconciliation) } }
  }
  if (!data.actions.length) return <DetailPanel><PanelHeading><h2>주문 처리</h2></PanelHeading><OrderStack><OrderMuted>{data.actionNotice || '현재 상태에서 처리할 수 있는 작업이 없습니다.'}</OrderMuted><OrderExternalLink href="https://sell.smartstore.naver.com/" target="_blank" rel="noopener noreferrer">스마트스토어 판매자센터 열기 ↗</OrderExternalLink></OrderStack></DetailPanel>
  const reviewSummary = review && <>
      <OrderFacts><div><dt>상품 주문</dt><dd>{data.order.productName || '상품명 미제공'}<br />{data.order.productOrderId}</dd></div><div><dt>처리할 작업</dt><dd>{naverActionLabels[review.action]}</dd></div>
        {reviewedClaims.map((claim, index) => <div key={claim.claimId || index}><dt>승인할 {review.action === 'APPROVE_CANCEL' ? '취소' : '반품'} 요청 / 수량</dt><dd>요청 {claim.claimId || '—'} · {claim.quantity ?? '—'}개</dd></div>)}
        {review.action === 'DISPATCH' && <><div><dt>발송할 잔여 수량</dt><dd>{data.order.remainingQuantity ?? '—'}개</dd></div><div><dt>배송 방법 / 택배사</dt><dd>{options?.deliveryMethods.find(item => item.code === review.deliveryMethod)?.label}{review.deliveryCompanyCode ? ` / ${options?.carriers.find(item => item.code === review.deliveryCompanyCode)?.label}` : ''}</dd></div><div><dt>송장 번호 / 발송 일시</dt><dd>{review.trackingNumber || '해당 없음'}<br />{naverOrderTime(review.dispatchDate ?? null)}</dd></div></>}
      </OrderFacts>
      <OrderMuted>{data.actions.find(item => item.code === review.action)?.description}</OrderMuted>
      {(review.action === 'APPROVE_CANCEL' || review.action === 'APPROVE_RETURN') && <DetailAlert>승인하면 네이버 취소·반품 절차에 따라 결제가 환불 처리됩니다. 실제 구매자 환불 입금 시점은 결제 수단에 따라 다릅니다.{review.action === 'APPROVE_RETURN' && ' 반품 상품 수령을 확인했습니다. 네이버 정책에 따라 같은 주문의 다른 반품 환불이 함께 처리될 수 있습니다.'}</DetailAlert>}
    </>
  return <DetailPanel><PanelHeading><h2 ref={panelHeading} tabIndex={-1}>{failure ? failure.unknown ? '처리 결과 확인 필요' : '주문 처리 확인 필요' : '주문 처리'}</h2><DetailBadge>상품 주문 한 건</DetailBadge></PanelHeading><OrderStack>
    {failure ? <>
        {reviewSummary}
        <DetailAlert role="alert">{failure.message}</DetailAlert>
        {failure.unknown ? <><OrderMuted>요청이 반영되었을 수 있으므로 같은 작업을 다시 실행하지 마세요. 판매자센터에서 처리 결과를 확인한 뒤 최신 주문 상태를 조회해 주세요.</OrderMuted><OrderExternalLink href="https://sell.smartstore.naver.com/" target="_blank" rel="noopener noreferrer">판매자센터에서 결과 확인 ↗</OrderExternalLink><OrderCheck><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />판매자센터에서 이 상품 주문의 처리 결과를 확인했습니다.</OrderCheck><DetailSecondaryButton disabled={!checked} onClick={() => { onBusy(false); onReload() }}>확인 후 최신 상태 조회</DetailSecondaryButton></> : <DetailSecondaryButton onClick={onReload}>최신 상태 다시 조회</DetailSecondaryButton>}
    </> : <OrderForm onSubmit={prepare} noValidate>
      <OrderField>처리할 작업<select aria-label="처리할 작업" value={action} onChange={event => { setAction(event.target.value as NaverOrderActionCode | ''); setError(''); setReceived(false) }}><option value="">작업을 선택해 주세요</option>{data.actions.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></OrderField>
      {selected && <OrderMuted>{selected.description}</OrderMuted>}
      {action === 'DISPATCH' && <OrderGrid>
        <OrderField>배송 방법<select aria-label="배송 방법" value={method} onChange={event => { setMethod(event.target.value); setError('') }}>{!options?.deliveryMethods.some(item => item.code === method) && <option value="">배송 방법을 선택해 주세요</option>}{options?.deliveryMethods.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></OrderField>
        <OrderField>발송 일시 (한국 시간)<input type="datetime-local" value={dispatchDate} max={koreaNow()} onChange={event => { setDispatchDate(event.target.value); setError('') }} /></OrderField>
        {method === 'DELIVERY' && <><OrderField>택배사<select aria-label="택배사" value={carrier} onChange={event => { setCarrier(event.target.value); setError('') }}><option value="">택배사를 선택해 주세요</option>{options?.carriers.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></OrderField><OrderField>송장 번호<input value={tracking} maxLength={100} onChange={event => { setTracking(event.target.value); setError('') }} placeholder="송장에 표시된 번호" /></OrderField></>}
      </OrderGrid>}
      {action === 'APPROVE_RETURN' && <><OrderMuted>네이버 정책에 따라 같은 주문의 다른 반품 환불이 함께 처리될 수 있습니다.</OrderMuted><OrderCheck><input type="checkbox" checked={received} onChange={event => { setReceived(event.target.checked); setError('') }} />반품 상품을 실제로 수령했고 배송비·추가 비용을 확인했습니다.</OrderCheck></>}
      {data.actionNotice && <OrderMuted>{data.actionNotice}</OrderMuted>}
      {error && <DetailAlert role="alert">{error}</DetailAlert>}
      <OrderActions><DetailPrimaryButton disabled={!selected || (action === 'DISPATCH' && !options)} type="submit">처리 내용 확인</DetailPrimaryButton></OrderActions>
    </OrderForm>}
  </OrderStack>
    <Modal open={!!review && !failure} title="처리 내용 확인" variant="confirm" busy={busy} onClose={closeReview} footer={review && !failure && <OrderActions><DetailSecondaryButton disabled={busy} onClick={closeReview}>입력 수정</DetailSecondaryButton><DetailPrimaryButton disabled={busy} onClick={() => void apply()}>{busy ? '처리 중…' : `${naverActionLabels[review.action]} 적용`}</DetailPrimaryButton></OrderActions>}>
      {!failure && <OrderForm as="div">{reviewSummary}</OrderForm>}
    </Modal>
  </DetailPanel>
}
