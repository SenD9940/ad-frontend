import styled from 'styled-components'
import type { NaverProducts, NaverSales } from '../../types/naverStore'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailHint, DetailPanel, DetailPanelBody,
  DetailSecondaryButton, DetailStatus, PanelHeading,
} from './WorkspaceDetailUI'

export function NaverSalesOverview({ data, onReload }: { data: NaverSales; onReload: () => void }) {
  const { summary } = data
  const daily = [...data.daily].sort((a, b) => a.date.localeCompare(b.date))
  const maximum = Math.max(1, ...daily.map((item) => item.paymentAmount))
  return <>
    <SummarySection aria-label="판매 성과 요약">
      <MetricGrid>
        <Metric><dt>최초 결제금액 <span>원</span></dt><dd>{format(summary.paymentAmount)}</dd><p>취소·반품 주문을 포함한 최초 결제</p></Metric>
        <Metric><dt>현재 잔여 결제금액 <span>원</span></dt><dd>{format(summary.remainingPaymentAmount)}</dd><p>{summary.remainingPaymentAmount === null ? '제공되지 않은 잔여 금액이 있어 표시 불가' : '조회 시점에 남아 있는 결제 금액'}</p></Metric>
        <Metric><dt>결제 주문 수 <span>건</span></dt><dd>{format(summary.paidOrderCount)}</dd><p>상품 주문 {format(summary.productOrderCount)}건</p></Metric>
        <Metric><dt>최초 판매 수량 <span>개</span></dt><dd>{format(summary.quantity)}</dd><p>취소·반품 전 주문 수량</p></Metric>
        <Metric><dt>평균 주문금액 <span>원 / 주문</span></dt><dd>{summary.paidOrderCount ? format(summary.averageOrderAmount) : '—'}</dd><p>{summary.paidOrderCount ? '최초 결제금액 ÷ 결제 주문 수' : '결제 주문이 없어 계산하지 않습니다'}</p></Metric>
        <Metric><dt>취소·반품 상품 주문 <span>건</span></dt><dd>{format(summary.canceledProductOrderCount + summary.returnedProductOrderCount)}</dd><p>취소 {format(summary.canceledProductOrderCount)} · 반품 {format(summary.returnedProductOrderCount)} (현재 상태)</p></Metric>
      </MetricGrid>
      <BasisNote>{data.notice || '결제일이 조회 기간에 속하는 주문을 집계합니다. 취소·반품 상태는 조회 시점 기준이며 정산 매출과 다릅니다.'} 잔여 금액이 제공되지 않은 경우 —로 표시합니다.</BasisNote>
    </SummarySection>
    <DetailPanel>
      <PanelHeading><div><h2>일별 결제 흐름</h2><p>{data.since} — {data.until} · 최초 결제금액 (원)</p></div><DetailSecondaryButton type="button" onClick={onReload}>성과 새로고침</DetailSecondaryButton></PanelHeading>
      <DetailPanelBody>
        {summary.paidOrderCount === 0 ? <TrendEmpty>선택한 기간에 결제된 주문이 없습니다.</TrendEmpty> : <ChartFrame role="img" aria-label={`${data.since}부터 ${data.until}까지 일별 최초 결제금액. 정확한 수치는 아래 일별 상세에서 확인할 수 있습니다.`}>
          <ChartTop><span>최고 {format(maximum)}원</span><span>취소·반품 포함</span></ChartTop>
          <Bars>{daily.map((item) => <BarColumn key={item.date} title={`${item.date}: ${format(item.paymentAmount)}원 · ${format(item.paidOrderCount)}건`}><Bar $height={item.paymentAmount / maximum * 100} /><BarLabel>{item.date.slice(5)}</BarLabel></BarColumn>)}</Bars>
        </ChartFrame>}
        <DailyDetails><summary>일별 상세 보기</summary><TableRegion role="region" aria-label="일별 판매 성과 표" tabIndex={0}>
          <DataTable><caption>한국 시간 결제일별 최초 결제금액, 현재 잔여 결제금액, 결제 주문 수, 최초 수량</caption><thead><tr><th scope="col">결제일</th><th scope="col">최초 결제금액</th><th scope="col">현재 잔여 결제금액</th><th scope="col">결제 주문 수</th><th scope="col">최초 수량</th></tr></thead><tbody>{daily.map((item) => <tr key={item.date}><th scope="row">{item.date}</th><td>{format(item.paymentAmount)}원</td><td>{money(item.remainingPaymentAmount)}</td><td>{format(item.paidOrderCount)}건</td><td>{format(item.quantity)}개</td></tr>)}</tbody></DataTable>
        </TableRegion></DailyDetails>
        <Updated>조회 시각 {updatedAt(data.fetchedAt)} · 한국 시간</Updated>
      </DetailPanelBody>
    </DetailPanel>
    <TablePanel>
      <PanelHeading><div><h2>상품별 판매 성과</h2><p>조회 기간 최초 결제금액 기준 상위 상품</p></div><DetailBadge>{data.topProducts.length}개 표시</DetailBadge></PanelHeading>
      {data.topProducts.length ? <><ScrollHint>표를 좌우로 이동해 모든 수치를 확인하세요.</ScrollHint><TableRegion role="region" aria-label="상품별 판매 성과 표" tabIndex={0}>
        <DataTable><caption>결제일 기준 상품별 판매 성과. 최초 금액과 수량에는 취소·반품이 포함됩니다.</caption><thead><tr><th scope="col">상품</th><th scope="col">최초 결제금액</th><th scope="col">현재 잔여 결제금액</th><th scope="col">상품 주문 수</th><th scope="col">최초 수량</th></tr></thead><tbody>{data.topProducts.map((item) => <tr key={item.productId}><NameCell scope="row"><strong>{item.name || '상품명 없음'}</strong><small>상품 번호 {item.productId}</small></NameCell><td>{money(item.paymentAmount)}</td><td>{money(item.remainingPaymentAmount)}</td><td>{format(item.productOrderCount)}건</td><td>{format(item.quantity)}개</td></tr>)}</tbody></DataTable>
      </TableRegion></> : <TableEmpty>선택한 기간에 결제된 상품이 없습니다.</TableEmpty>}
    </TablePanel>
  </>
}

export function NaverProductList({ data, loading, error, onReload, onPage, createPath }: {
  data: NaverProducts | null; loading: boolean; error: string; onReload: () => void; onPage: (page: number) => void; createPath?: string
}) {
  return <TablePanel aria-label="판매 중인 상품">
    <PanelHeading><div><h2>판매 중인 상품</h2><p>현재 판매 상태 기준 · 위의 판매 성과 조회 기간과 무관합니다.</p></div><ProductActions>{data && data.totalElements !== null && <DetailBadge>{format(data.totalElements)}개</DetailBadge>}<DetailSecondaryButton type="button" onClick={onReload} disabled={loading}>상품 새로고침</DetailSecondaryButton>{createPath && <DetailActionLink to={createPath}>상품 등록</DetailActionLink>}</ProductActions></PanelHeading>
    {loading ? <DetailStatus role="status">판매 중인 상품을 불러오는 중…</DetailStatus> : error ? <DetailEmpty><h3>상품을 불러오지 못했습니다</h3><DetailAlert role="alert">{error}</DetailAlert><p>상품 조회 권한과 연결 상태를 확인해 주세요. 판매 성과는 별도로 조회됩니다.</p><DetailSecondaryButton type="button" onClick={onReload}>상품 다시 조회</DetailSecondaryButton></DetailEmpty> : data && <>
      {data.items.length ? <><ScrollHint>표를 좌우로 이동해 가격과 재고를 확인하세요.</ScrollHint><TableRegion role="region" aria-label="판매 중인 상품 목록" tabIndex={0}>
        <DataTable><caption>판매 중인 상품의 현재 판매가와 재고</caption><thead><tr><th scope="col">상품</th><th scope="col">판매가</th><th scope="col">재고</th><th scope="col">판매 상태</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.productId}><NameCell scope="row"><ProductName>{safeImage(item.imageUrl) ? <Thumbnail src={safeImage(item.imageUrl)!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true }} /> : <ImagePlaceholder aria-hidden="true">N</ImagePlaceholder>}<div><strong>{item.name}</strong><small>상품 번호 {item.productId}</small></div></ProductName></NameCell><td>{item.discountedPrice !== null ? <Price><strong>{money(item.discountedPrice)}</strong><small>할인 전 {money(item.salePrice)}</small></Price> : money(item.salePrice)}</td><td>{item.stockQuantity === null ? '—' : `${format(item.stockQuantity)}개`}</td><td><DetailBadge $tone={item.status === 'SALE' ? 'success' : undefined}>{item.status === 'SALE' ? '판매 중' : item.status}</DetailBadge></td></tr>)}</tbody></DataTable>
      </TableRegion></> : <TableEmpty>{data.hasNext ? '이 페이지에 해당 채널의 판매 상품이 없습니다. 다음 페이지를 확인해 주세요.' : data.page > 1 ? '이 페이지에 표시할 상품이 없습니다. 이전 페이지를 확인해 주세요.' : '현재 판매 중인 상품이 없습니다.'}</TableEmpty>}
      <Pagination><DetailSecondaryButton type="button" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>이전</DetailSecondaryButton><span aria-live="polite">{data.page}페이지</span><DetailSecondaryButton type="button" disabled={!data.hasNext} onClick={() => onPage(data.page + 1)}>다음</DetailSecondaryButton></Pagination>
      <ProductNote><DetailHint>판매가는 현재 등록된 상품 기준입니다. 옵션 가격·할인·배송비는 실제 주문 금액과 다를 수 있습니다. 재고를 확인할 수 없으면 —로 표시합니다.</DetailHint><Updated>조회 시각 {updatedAt(data.fetchedAt)} · 한국 시간</Updated></ProductNote>
    </>}
  </TablePanel>
}

function format(value: number | null): string { return value === null ? '—' : value.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) }
function money(value: number | null): string { return value === null ? '—' : `${format(value)}원` }
function updatedAt(value: string): string { return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
function safeImage(value: string | null): string | null {
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}

const SummarySection = styled.section`min-width: 0;`
const MetricGrid = styled.dl`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; @media(max-width: 620px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
const Metric = styled.div`padding: 20px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 12px; background: white; min-width: 0; dt { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 5px; font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary}; font-weight: 600; span { font-size: 10px; font-weight: 400; color: ${({ theme }) => theme.colors.textMuted}; } } dd { margin: 14px 0 10px; font-size: clamp(22px, 2.3vw, 29px); font-weight: 750; letter-spacing: -.8px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; } p { color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; line-height: 1.6; word-break: keep-all; overflow-wrap: anywhere; } @media(max-width: 620px) { padding: 15px 12px; }`
const BasisNote = styled.p`margin-top: 12px; font-size: 11px; line-height: 1.8; color: ${({ theme }) => theme.colors.textMuted}; word-break: keep-all;`
const ChartFrame = styled.div`min-width: 0;`
const ChartTop = styled.div`display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; font-size: 10px; color: ${({ theme }) => theme.colors.textMuted};`
const Bars = styled.div`display: flex; align-items: flex-end; gap: 8px; width: 100%; min-width: 0; height: 175px; padding-bottom: 25px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; @media(max-width: 600px) { gap: 3px; }`
const BarColumn = styled.div`position: relative; display: flex; flex: 1; align-items: flex-end; justify-content: center; height: 100%; min-width: 0;`
const Bar = styled.div<{ $height: number }>`width: 100%; max-width: 56px; height: ${({ $height }) => $height ? Math.max(2, $height) : 1}%; border-radius: 5px 5px 0 0; background: ${({ $height }) => $height ? '#03a95b' : '#e6eeeb'};`
const BarLabel = styled.span`position: absolute; bottom: -21px; left: 50%; transform: translateX(-50%); font-size: 9px; white-space: nowrap; color: ${({ theme }) => theme.colors.textMuted}; ${BarColumn}:not(:first-child):not(:last-child):not(:nth-child(7n)) & { display: none; }`
const TrendEmpty = styled.p`padding: 40px 10px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 13px; text-align: center;`
const DailyDetails = styled.details`margin-top: 20px; summary { width: fit-content; padding: 8px 0; cursor: pointer; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; font-weight: 600; }`
const Updated = styled.p`margin-top: 12px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; line-height: 1.6;`
const TablePanel = styled(DetailPanel)`width: 100%; overflow: hidden;`
const TableRegion = styled.div`width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; &:focus-visible { outline-offset: -3px; }`
const DataTable = styled.table`width: 100%; min-width: 670px; border-collapse: collapse; font-size: 12px; caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; } thead { background: #f8faf9; } th, td { padding: 16px 22px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: right; white-space: nowrap; vertical-align: middle; font-variant-numeric: tabular-nums; } th:first-child { text-align: left; } thead th { color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; font-weight: 600; } tbody th { font-weight: 500; } tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; } tbody tr:hover { background: #fcfdfc; }`
const NameCell = styled.th`min-width: 235px; max-width: 380px; && { white-space: normal; } strong { display: block; font-size: 12px; font-weight: 650; overflow-wrap: anywhere; } small { display: block; margin-top: 6px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; overflow-wrap: anywhere; }`
const ProductName = styled.div`display: flex; align-items: center; gap: 12px;`
const Thumbnail = styled.img`width: 48px; height: 48px; flex-shrink: 0; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; object-fit: cover; &[hidden] { display: none; }`
const ImagePlaceholder = styled.span`display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 8px; color: #9cb5a8; background: #f0f5f2; font-size: 18px; font-weight: 800;`
const ScrollHint = styled.p`padding: 10px 22px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px;`
const TableEmpty = styled.p`padding: 48px 20px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 13px; line-height: 1.8; text-align: center;`
const ProductActions = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 12px;`
const Pagination = styled.div`display: flex; justify-content: center; align-items: center; gap: 18px; padding: 18px; border-top: 1px solid ${({ theme }) => theme.colors.border}; font-size: 12px; color: ${({ theme }) => theme.colors.textSecondary};`
const ProductNote = styled.div`padding: 0 22px 20px;`

const Price = styled.span`strong { display: block; font-weight: 600; } small { display: block; margin-top: 5px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; }`
