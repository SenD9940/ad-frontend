import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { listSavedNaverStores } from '../../api/naverStores'
import { useNaverOrderResource } from '../../hooks/useNaverOrderResource'
import { useModal } from '../../components/common/useModal'
import { NaverOrderWorkspace } from './NaverOrderWorkspace'
import { OrderActions, OrderBackLink, OrderField, OrderStack } from './NaverOrderStyles'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader,
  DetailLead, DetailPage, DetailPanel, DetailSecondaryButton, DetailStatus, DetailTitle,
} from './WorkspaceDetailUI'

export default function NaverOrdersPage() {
  const { workspaceId } = useParams()
  const value = Number(workspaceId)
  if (!Number.isSafeInteger(value) || value <= 0) return <DetailPage><DetailAlert role="alert">워크스페이스 정보가 올바르지 않습니다.</DetailAlert></DetailPage>
  return <NaverOrdersContent key={value} workspaceId={value} />
}

function NaverOrdersContent({ workspaceId }: { workspaceId: number }) {
  const modal = useModal()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const load = useCallback((signal: AbortSignal) => listSavedNaverStores(workspaceId, signal), [workspaceId])
  const inventory = useNaverOrderResource(String(workspaceId), load)
  const stores = inventory.data ?? []
  const assetId = params.has('assetId') ? Number(params.get('assetId')) : null
  const selected = assetId === null ? stores[0] : stores.find(store => store.assetId === assetId)
  const assetsPath = `/workspaces/${workspaceId}/connections/naver/assets`
  const performancePath = `/workspaces/${workspaceId}/naver/performance${selected ? `?assetId=${selected.assetId}` : ''}`
  return <DetailPage>
    <DetailHeader><div><DetailEyebrow>네이버 / 스마트스토어</DetailEyebrow><DetailTitle>주문·배송·환불 관리</DetailTitle><DetailLead>주문별 결제 내역을 확인하고 발주 확인, 발송, 취소·반품 승인을 처리하세요.</DetailLead></div><OrderActions><DetailSecondaryButton disabled={busy} onClick={() => void modal.info({ title: '주문 관리 이용 안내', message: '날짜와 상태로 주문을 찾거나 상품 주문 번호를 직접 입력하세요. 주문을 선택하면 결제·배송 내역과 현재 가능한 작업을 확인할 수 있습니다.\n\n발주 확인, 발송, 취소·반품 승인은 처리 내용을 확인한 뒤 적용합니다. 취소·반품 승인은 접수된 요청에 한해 가능하며, 실제 환불 완료 시점은 결제 수단에 따라 다릅니다.\n\n정산 내역은 정산 예정일 기준입니다. 반품 보류나 교환 재배송 등 이 화면에서 지원하지 않는 작업은 스마트스토어 판매자센터에서 처리해 주세요.' })}>이용 안내</DetailSecondaryButton>{!busy && <OrderBackLink to={performancePath}>상품 및 판매 성과</OrderBackLink>}</OrderActions></DetailHeader>
    {inventory.loading ? <DetailPanel><DetailStatus role="status">저장된 스마트스토어를 불러오는 중…</DetailStatus></DetailPanel> : inventory.error ? <DetailPanel><DetailEmpty><DetailAlert role="alert">{inventory.error}</DetailAlert><DetailSecondaryButton onClick={inventory.reload}>스토어 다시 조회</DetailSecondaryButton></DetailEmpty></DetailPanel> : !stores.length ? <DetailPanel><DetailEmpty><h2>스마트스토어 채널을 먼저 저장해 주세요</h2><p>연결된 채널의 주문을 조회하고 처리할 수 있습니다.</p><DetailActionLink to={assetsPath}>스마트스토어 연결 및 자산 선택</DetailActionLink></DetailEmpty></DetailPanel> : <>
      <DetailPanel><OrderStack><OrderField>스마트스토어 채널<select aria-label="스마트스토어 채널" disabled={busy} value={selected?.assetId ?? ''} onChange={event => setParams(current => { const next = new URLSearchParams(current); next.set('assetId', event.target.value); next.delete('orderId'); next.delete('page'); return next })}>
        {!selected && <option value="" disabled>채널을 선택해 주세요</option>}{stores.map(store => <option key={store.assetId} value={store.assetId}>{store.name || `스마트스토어 ${store.channelNo}`}{store.requiresReauth ? ' · 재연결 필요' : ''}</option>)}
      </select></OrderField>{selected && <DetailBadge $tone={selected.requiresReauth ? 'warning' : 'success'}>{selected.requiresReauth ? '재연결 필요' : '연결됨'} · 채널 {selected.channelNo}</DetailBadge>}</OrderStack></DetailPanel>
      {!selected ? <DetailAlert role="alert">저장된 스마트스토어가 아닙니다. 채널을 다시 선택해 주세요.</DetailAlert> : selected.requiresReauth ? <DetailPanel><DetailEmpty><h2>네이버 계정을 다시 연결해 주세요</h2><p>판매자 권한을 다시 확인한 뒤 주문을 조회할 수 있습니다.</p><DetailActionLink to={assetsPath}>자산 편집에서 재연결</DetailActionLink></DetailEmpty></DetailPanel> : <NaverOrderWorkspace key={selected.assetId} workspaceId={workspaceId} store={selected} onBusy={setBusy} />}
    </>}
  </DetailPage>
}
