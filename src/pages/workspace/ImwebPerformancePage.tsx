import { useState, type FormEvent } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useImwebStorePerformance } from '../../hooks/useImwebStorePerformance'
import { readSupportSession } from '../../support/session'
import type { ImwebProducts, ImwebSales } from '../../types/imweb'
import { koreaToday, naverPresetPeriod, validateNaverPeriod, type NaverDateRange, type NaverPeriodPreset } from './naverPerformanceDates'
import { Actions, Field, Input, Label, Select, StackBody } from './NaverProductFormUI'
import { DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead, DetailPage, DetailPanel, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading } from './WorkspaceDetailUI'

export default function ImwebPerformancePage() {
  const { workspaceId } = useParams()
  if (readSupportSession()) return <DetailAlert role="alert">아임웹 성과는 일반 사용자 계정에서 이용해 주세요.</DetailAlert>
  return <Performance key={workspaceId} workspaceId={Number(workspaceId)} />
}
function Performance({ workspaceId }: { workspaceId: number }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [defaultPeriod] = useState(() => naverPresetPeriod('7d'))
  const assetId = params.has('assetId') ? Number(params.get('assetId')) : null
  const period = { since: params.get('since') ?? defaultPeriod.since, until: params.get('until') ?? defaultPeriod.until }
  const [pagination, setPagination] = useState({ assetId, page: 1 })
  const page = pagination.assetId === assetId ? pagination.page : 1
  const model = useImwebStorePerformance(workspaceId, assetId, period, page)
  const assetsPath = `/workspaces/${workspaceId}/connections/imweb/assets`
  function applyPeriod(value: NaverDateRange) { setParams(current => { const next = new URLSearchParams(current); next.set('since', value.since); next.set('until', value.until); return next }) }
  return <DetailPage>
    <DetailHeader><div><DetailEyebrow>아임웹 / 스토어</DetailEyebrow><DetailTitle>상품 및 판매 성과</DetailTitle><DetailLead>판매 중인 상품과 주문 생성일 기준 결제·환불 현황을 확인하세요.</DetailLead></div><DetailActionLink to={assetsPath}>자산 편집</DetailActionLink></DetailHeader>
    {(location.state as { imwebUnitsSaved?: boolean } | null)?.imwebUnitsSaved && <DetailAlert $success role="status">선택한 스토어를 저장했습니다. 상품과 판매 성과를 확인하세요.</DetailAlert>}
    {model.inventory.loading ? <DetailStatus role="status">저장된 아임웹 스토어 조회 중…</DetailStatus> : model.inventory.error ? <LoadError message={model.inventory.error} retry={model.inventory.reload} /> : !model.stores.length ? <DetailPanel><DetailEmpty><h2>아임웹 스토어를 먼저 저장해 주세요</h2><p>아임웹 사이트를 연결하고 사용할 스토어를 선택하면 상품과 판매 성과가 표시됩니다.</p><DetailActionLink to={assetsPath}>아임웹 연결 및 스토어 선택</DetailActionLink></DetailEmpty></DetailPanel> : <>
      <DetailPanel><StackBody><Field><Label htmlFor="imweb-performance-store">아임웹 스토어</Label><Select id="imweb-performance-store" value={model.selected?.assetId ?? ''} onChange={event => { setPagination({ assetId: Number(event.target.value), page: 1 }); setParams(current => { const next = new URLSearchParams(current); next.set('assetId', event.target.value); return next }) }}>
        {!model.selected && <option value="">스토어 선택</option>}{model.stores.map(store => <option key={store.assetId} value={store.assetId}>{store.name} · {store.currency}{store.requiresReauth ? ' · 재연결 필요' : ''}</option>)}
      </Select></Field>{model.selected && <Actions><DetailBadge $tone={model.selected.requiresReauth ? 'warning' : 'success'}>{model.selected.requiresReauth ? '재연결 필요' : '연결됨'}</DetailBadge><DetailHint>{model.selected.connectionName} · {model.selected.unitCode}</DetailHint></Actions>}</StackBody></DetailPanel>
      {model.selectionError && <DetailAlert role="alert">{model.selectionError}</DetailAlert>}
      {model.selected?.requiresReauth && <DetailPanel><DetailEmpty><h2>아임웹 사이트를 다시 연결해 주세요</h2><p>워크스페이스 소유자가 같은 사이트를 다시 연결하면 저장된 스토어에서 조회를 계속할 수 있습니다.</p><DetailActionLink to={assetsPath}>자산 편집에서 재연결</DetailActionLink></DetailEmpty></DetailPanel>}
      {model.ready && <>
        <DetailPanel><PanelHeading><div><h2>판매 성과</h2><p>한국 시간 · 주문 생성일 기준 · 최대 31일</p></div><DetailBadge>주문 생성일 기준</DetailBadge></PanelHeading><StackBody>
          <PeriodPicker key={`${period.since}:${period.until}`} period={period} apply={applyPeriod} />
          <Actions><DetailHint>기간 합계 · {model.selected?.currency}</DetailHint><DetailActionLink to={`/workspaces/${workspaceId}/imweb/products/new?assetId=${model.selected!.assetId}`}>상품 등록</DetailActionLink><DetailSecondaryButton disabled={model.sales.loading || Boolean(model.periodError)} onClick={model.sales.reload}>성과 새로고침</DetailSecondaryButton></Actions>
          {model.periodError ? <DetailAlert role="alert">{model.periodError}</DetailAlert> : model.sales.loading ? <DetailStatus role="status">전체 기간의 주문과 환불 현황 조회 중…</DetailStatus> : model.sales.error ? <LoadError message={model.sales.error} retry={model.sales.reload} /> : model.sales.data && <SalesOverview sales={model.sales.data} />}
        </StackBody></DetailPanel>
        <DetailPanel><PanelHeading><div><h2>판매 중인 상품</h2><p>선택한 스토어의 현재 상품 목록</p></div><DetailSecondaryButton disabled={model.products.loading} onClick={model.products.reload}>상품 새로고침</DetailSecondaryButton></PanelHeading><StackBody>
          {model.products.loading ? <DetailStatus role="status">판매 중인 상품 조회 중…</DetailStatus> : model.products.error ? <LoadError message={model.products.error} retry={model.products.reload} /> : model.products.data && <ProductList products={model.products.data} currency={model.selected!.currency} changePage={next => setPagination({ assetId, page: next })} />}
        </StackBody></DetailPanel>
      </>}
    </>}
  </DetailPage>
}
function PeriodPicker({ period, apply }: { period: NaverDateRange; apply: (value: NaverDateRange) => void }) {
  const [draft, setDraft] = useState(period)
  const [error, setError] = useState('')
  function submit(event: FormEvent) { event.preventDefault(); const message = validateNaverPeriod(draft); setError(message); if (!message) apply(draft) }
  return <form onSubmit={submit}><DateFields><Field><Label htmlFor="imweb-since">시작일</Label><Input id="imweb-since" type="date" value={draft.since} max={koreaToday()} onChange={event => setDraft(current => ({ ...current, since: event.target.value }))} required /></Field><Field><Label htmlFor="imweb-until">종료일</Label><Input id="imweb-until" type="date" value={draft.until} max={koreaToday()} onChange={event => setDraft(current => ({ ...current, until: event.target.value }))} required /></Field><DetailSecondaryButton type="submit">기간 적용</DetailSecondaryButton></DateFields><Actions style={{ marginTop: 12 }}>{([['today', '오늘'], ['7d', '최근 7일'], ['30d', '최근 30일'], ['month', '이번 달']] as Array<[NaverPeriodPreset, string]>).map(([preset, label]) => <DetailSecondaryButton key={preset} type="button" onClick={() => apply(naverPresetPeriod(preset))}>{label}</DetailSecondaryButton>)}</Actions>{error && <DetailAlert role="alert" style={{ marginTop: 12 }}>{error}</DetailAlert>}</form>
}
function SalesOverview({ sales }: { sales: ImwebSales }) {
  const value = sales.summary
  return <>
    <Metrics>{[['결제액', money(value.paymentAmount, sales.currency)], ['환불액', money(value.refundedAmount, sales.currency)], ['환불 차감 결제액', money(value.remainingPaymentAmount, sales.currency)], ['결제 주문 수', `${value.paidOrderCount.toLocaleString('ko-KR')}건`], ['전체 주문 수', `${value.orderCount.toLocaleString('ko-KR')}건`], ['평균 결제액', money(value.averageOrderAmount, sales.currency)]].map(([label, amount]) => <Metric key={label}><dt>{label}</dt><dd>{amount}</dd></Metric>)}</Metrics>
    <DetailHint>{sales.notice || '조회 기간에 생성된 주문의 결제·환불 현황입니다. 실제 결제일 기준 매출과 다를 수 있습니다.'}</DetailHint>
    <TableScroll><Table><caption>일별 판매 성과 · 주문 생성일 기준</caption><thead><tr><th scope="col">주문 생성일</th><th scope="col">결제액</th><th scope="col">환불액</th><th scope="col">환불 차감</th><th scope="col">결제 주문</th><th scope="col">전체 주문</th></tr></thead><tbody>{sales.daily.map(row => <tr key={row.date}><th scope="row">{row.date}</th><td>{money(row.paymentAmount, sales.currency)}</td><td>{money(row.refundedAmount, sales.currency)}</td><td>{money(row.remainingPaymentAmount, sales.currency)}</td><td>{row.paidOrderCount.toLocaleString('ko-KR')}</td><td>{row.orderCount.toLocaleString('ko-KR')}</td></tr>)}</tbody></Table></TableScroll>
    <DetailHint>조회 시각: {new Date(sales.fetchedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</DetailHint>
  </>
}
function ProductList({ products, currency, changePage }: { products: ImwebProducts; currency: string; changePage: (page: number) => void }) {
  return <>{!products.items.length ? <DetailHint>현재 판매 중인 상품이 없습니다.</DetailHint> : <ProductGrid>{products.items.map(product => <ProductCard key={product.productId}>{safeImage(product.imageUrl) ? <img src={safeImage(product.imageUrl)!} alt={product.name} loading="lazy" referrerPolicy="no-referrer" /> : <div className="no-image">이미지 없음</div>}<div><DetailBadge $tone="success">판매 중</DetailBadge><h3>{product.name}</h3><strong>{money(product.salePrice, currency)}</strong>{product.originalPrice !== null && product.originalPrice !== product.salePrice && <DetailHint>정상가 {money(product.originalPrice, currency)}</DetailHint>}<DetailHint>재고 {product.stockQuantity === null ? '정보 없음' : `${product.stockQuantity.toLocaleString('ko-KR')}개`} · 상품 {product.productId}</DetailHint></div></ProductCard>)}</ProductGrid>}
    <Actions><DetailSecondaryButton disabled={products.page <= 1} onClick={() => changePage(products.page - 1)}>이전</DetailSecondaryButton><DetailHint>{products.page}페이지{products.totalElements === null ? '' : ` · 총 ${products.totalElements.toLocaleString('ko-KR')}개`}</DetailHint><DetailSecondaryButton disabled={!products.hasNext} onClick={() => changePage(products.page + 1)}>다음</DetailSecondaryButton></Actions>
  </>
}
function LoadError({ message, retry }: { message: string; retry: () => void }) { return <div style={{ display: 'grid', gap: 12 }}><DetailAlert role="alert">{message}</DetailAlert><Actions><DetailSecondaryButton onClick={retry}>다시 조회</DetailSecondaryButton></Actions></div> }
function money(value: number | null, currency: string): string { return value === null ? '정보 없음' : new Intl.NumberFormat('ko-KR', { style: 'currency', currency, maximumFractionDigits: currency === 'KRW' ? 0 : 2 }).format(value) }
function safeImage(value: string | null): string | null { try { const url = new URL(value || ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null } }
const DateFields = styled.div`display: flex; gap: 12px; align-items: end; flex-wrap: wrap; > div { flex: 1; min-width: 150px; }`
const Metrics = styled.dl`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0; @media(max-width: 650px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
const Metric = styled.div`padding: 18px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px; min-width: 0; dt { color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; } dd { margin: 10px 0 0; font-size: clamp(17px, 2vw, 24px); font-weight: 750; overflow-wrap: anywhere; }`
const TableScroll = styled.div`width: 100%; overflow-x: auto;`
const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 12px; white-space: nowrap; caption { text-align: left; padding-bottom: 12px; font-weight: 650; } th, td { padding: 12px 14px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: right; } th:first-child { text-align: left; } thead { background: #f7f8fc; }`
const ProductGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px;`
const ProductCard = styled.article`min-width: 0; overflow: hidden; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 12px; > img, > .no-image { width: 100%; aspect-ratio: 4/3; object-fit: contain; background: #f7f8fc; } > .no-image { display: grid; place-items: center; color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; } > div:not(.no-image) { display: grid; gap: 10px; padding: 16px; } h3 { font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; } strong { font-size: 18px; }`
