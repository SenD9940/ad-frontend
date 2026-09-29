import type { NaverOrderClaim, NaverOrderDetail, NaverOrderOptions } from '../../types/naverOrder'
import { NaverOrderActionForm } from './NaverOrderActionForm'
import { OrderFacts, OrderGrid, OrderMuted, OrderStack } from './NaverOrderStyles'
import { naverClaimLabels, naverClaimReasonLabels, naverCollectLabels, naverDeliveryLabels, naverHoldbackLabels, naverOrderLabel, naverOrderMoney, naverOrderStatusLabels, naverOrderTime } from './naverOrderModel'
import { DetailAlert, DetailBadge, DetailPanel, PanelHeading } from './WorkspaceDetailUI'

export function NaverOrderDetails({ workspaceId, data, options, onBusy, onReload, onNotice }: {
  workspaceId: number; data: NaverOrderDetail; options: NaverOrderOptions | null; onBusy: (value: boolean) => void; onReload: () => void; onNotice: (value: string) => void
}) {
  const { order, delivery, recipient } = data
  const optionLabel = (code: string | null, values: NaverOrderOptions['carriers'] | undefined) => code ? values?.find(item => item.code === code)?.label || code : '—'
  return <div style={{ display: 'grid', gap: 20, marginTop: 18 }}>
    <DetailPanel><PanelHeading><div><h2>{order.productName || '상품명 미제공'}</h2><p>상품 주문 {order.productOrderId} · 주문 {order.orderId || '—'}</p></div><DetailBadge>{naverOrderLabel(order.status, naverOrderStatusLabels)}</DetailBadge></PanelHeading><OrderStack>
      <OrderFacts>
        <div><dt>상품 옵션</dt><dd>{order.productOption || '—'}</dd></div><div><dt>발주 상태</dt><dd>{naverOrderLabel(order.placeOrderStatus, { NOT_YET: '발주 미확인', OK: '발주 확인', CANCEL: '발주 확인 해제' })}</dd></div>
        <div><dt>최초 수량 / 잔여 수량</dt><dd>{order.initialQuantity ?? '—'} / {order.remainingQuantity ?? '—'}</dd></div><div><dt>주문일</dt><dd>{naverOrderTime(order.orderDate)}</dd></div>
      </OrderFacts>
    </OrderStack></DetailPanel>
    <OrderGrid>
      <DetailPanel><PanelHeading><h2>결제 내역</h2><DetailBadge>상품 주문 기준</DetailBadge></PanelHeading><OrderStack><OrderFacts>
        <div><dt>상품 최초 결제액</dt><dd>{naverOrderMoney(order.initialPaymentAmount)}</dd></div><div><dt>상품 잔여 결제액</dt><dd>{naverOrderMoney(order.remainingPaymentAmount)}</dd></div>
        <div><dt>결제 수단</dt><dd>{data.paymentMeans || '—'}</dd></div><div><dt>결제일</dt><dd>{naverOrderTime(order.paymentDate)}</dd></div>
        <div><dt>결제 기한</dt><dd>{naverOrderTime(data.paymentDueDate)}</dd></div>
      </OrderFacts><OrderMuted>배송비는 별도입니다. 최초·잔여 결제액 차이는 구매자에게 실제 입금된 환불액을 뜻하지 않습니다. 제공되지 않은 정보는 —로 표시합니다.</OrderMuted></OrderStack></DetailPanel>
      <DetailPanel><PanelHeading><h2>배송 상태</h2><DetailBadge>{naverOrderLabel(delivery?.status ?? order.deliveryStatus, naverDeliveryLabels)}</DetailBadge></PanelHeading><OrderStack><OrderFacts>
        <div><dt>배송 방법</dt><dd>{optionLabel(delivery?.method ?? null, options?.deliveryMethods)}</dd></div><div><dt>택배사</dt><dd>{optionLabel(delivery?.company ?? null, options?.carriers)}</dd></div>
        <div><dt>송장 번호</dt><dd>{delivery?.trackingNumber || '—'}</dd></div><div><dt>발송 기한</dt><dd>{naverOrderTime(data.shippingDueDate)}</dd></div>
        <div><dt>발송일 / 집하일</dt><dd>{naverOrderTime(delivery?.sendDate ?? null)}<br />{naverOrderTime(delivery?.pickupDate ?? null)}</dd></div><div><dt>배송 완료일</dt><dd>{naverOrderTime(delivery?.deliveredDate ?? null)}</dd></div>
      </OrderFacts>{delivery?.wrongTrackingNumber && <DetailAlert role="alert">네이버에서 송장 번호 오류를 알려왔습니다. 판매자센터에서 확인해 주세요.</DetailAlert>}</OrderStack></DetailPanel>
    </OrderGrid>
    <DetailPanel><PanelHeading><h2>배송지</h2><p>주문 이행에 필요한 수령 정보</p></PanelHeading><OrderStack><OrderFacts>
      <div><dt>수령인</dt><dd>{recipient?.name || '—'}</dd></div><div><dt>연락처</dt><dd>{[recipient?.tel1, recipient?.tel2].filter(Boolean).join(' / ') || '—'}</dd></div>
      <div><dt>배송 주소</dt><dd>{[recipient?.zipCode && `(${recipient.zipCode})`, recipient?.baseAddress, recipient?.detailedAddress, recipient?.country].filter(Boolean).join(' ') || '—'}</dd></div><div><dt>배송 메모</dt><dd>{data.shippingMemo || '—'}</dd></div>
    </OrderFacts></OrderStack></DetailPanel>
    <DetailPanel><PanelHeading><h2>취소·반품·교환</h2><p>네이버 처리 상태 및 환불 예정 정보</p></PanelHeading><OrderStack>
      {data.currentClaims.length ? data.currentClaims.map((claim, index) => <ClaimDetails key={claim.claimId || index} claim={claim} />) : <OrderMuted>현재 진행 중인 취소·반품·교환 내역이 없습니다.</OrderMuted>}
      {data.completedClaims.length > 0 && <details><summary>완료된 처리 내역 {data.completedClaims.length}건</summary><div style={{ display: 'grid', gap: 20, marginTop: 20 }}>{data.completedClaims.map((claim, index) => <ClaimDetails key={claim.claimId || index} claim={claim} />)}</div></details>}
      <OrderMuted>승인과 환불 입금 완료는 다릅니다. 실제 환불 시점은 네이버 처리 결과와 결제 수단에 따라 달라집니다.</OrderMuted>
    </OrderStack></DetailPanel>
    <NaverOrderActionForm workspaceId={workspaceId} data={data} options={options} onBusy={onBusy} onReload={onReload} onNotice={onNotice} />
    <OrderMuted>조회 시각 {naverOrderTime(data.fetchedAt)} · 한국 시간</OrderMuted>
  </div>
}

function ClaimDetails({ claim }: { claim: NaverOrderClaim }) {
  return <div><DetailBadge $tone="warning">{naverOrderLabel(claim.type, naverClaimLabels)} · {naverOrderLabel(claim.status, naverClaimLabels)}</DetailBadge><OrderFacts style={{ marginTop: 16 }}>
    <div><dt>사유</dt><dd>{naverOrderLabel(claim.reason, naverClaimReasonLabels)}</dd></div><div><dt>요청 수량</dt><dd>{claim.quantity ?? '—'}</dd></div>
    <div><dt>요청일 / 처리 완료일</dt><dd>{naverOrderTime(claim.requestedAt)}<br />{naverOrderTime(claim.completedAt)}</dd></div><div><dt>수거 상태</dt><dd>{naverOrderLabel(claim.collectStatus, naverCollectLabels)}</dd></div>
    <div><dt>환불 대기 상태 / 예정일</dt><dd>{claim.refundStandbyStatus || '—'}<br />{naverOrderTime(claim.refundExpectedDate)}</dd></div><div><dt>보류 상태 / 사유</dt><dd>{[claim.holdbackStatus, claim.holdbackReason].filter(Boolean).map(value => naverOrderLabel(value, naverHoldbackLabels)).join(' / ') || '—'}</dd></div>
  </OrderFacts></div>
}
