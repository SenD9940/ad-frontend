import { useId, useMemo, useState } from 'react'
import styled from 'styled-components'
import type {
  MetaAdAccountSummary, MetaAdDailyAverage, MetaAdMetrics, MetaCampaign, MetaCampaignPerformance,
} from '../../types/metaAds'
import { DetailBadge, DetailPanel, PanelHeading } from './WorkspaceDetailUI'

type DisplayMode = 'total' | 'daily'
type MetricKey = keyof MetaAdMetrics
type MetricKind = 'money' | 'number' | 'percent' | 'ratio'

const METRICS: { key: MetricKey; label: string; kind: MetricKind; description: string }[] = [
  { key: 'spend', label: '지출', kind: 'money', description: '광고 계정 통화로 표시한 지출액입니다.' },
  { key: 'purchaseValue', label: '구매 전환 금액', kind: 'money', description: 'Meta가 조회 기간의 기여 설정에 따라 보고한 구매 전환 금액입니다. 쇼핑몰 전체 매출과 다릅니다.' },
  { key: 'roas', label: 'ROAS', kind: 'ratio', description: '전체 기간의 구매 전환 금액 ÷ 지출입니다. 3.5배는 350%를 의미합니다.' },
  { key: 'impressions', label: '노출', kind: 'number', description: '광고가 표시된 횟수입니다.' },
  { key: 'clicks', label: '전체 클릭', kind: 'number', description: 'Meta의 전체 클릭 수이며 링크 클릭만을 의미하지 않습니다.' },
  { key: 'ctr', label: 'CTR', kind: 'percent', description: '전체 기간의 총 클릭 ÷ 총 노출 × 100입니다.' },
  { key: 'cpc', label: 'CPC', kind: 'money', description: '전체 기간의 총 지출 ÷ 총 클릭입니다.' },
  { key: 'cpm', label: 'CPM', kind: 'money', description: '전체 기간의 총 지출 ÷ 총 노출 × 1,000입니다.' },
]

export function PerformanceSummary({ metrics, dailyAverage, currency, days, mode }: {
  metrics: MetaAdMetrics
  dailyAverage: MetaAdDailyAverage
  currency: string
  days: number
  mode: DisplayMode
}) {
  const unit = currencyLabel(currency)
  return (
    <Summary aria-label={`${unit} 성과 ${mode === 'daily' ? '일평균' : '합계'}`}>
      <MetricGrid>
        {METRICS.map((metric) => {
          const value = displayedMetric(metric.key, metrics, dailyAverage, mode)
          const title = metricValueTitle(value, metric.kind, currency)
          return (
            <MetricCard key={metric.key}>
              <MetricLabel title={metric.description}>{metric.label}<span>{metric.kind === 'money' ? unit : metric.kind === 'percent' ? '%' : metric.kind === 'ratio' ? '배' : '회'}</span></MetricLabel>
              <MetricValue title={title} aria-label={`${metric.label} ${title}`}>{formatNumber(value)}</MetricValue>
              <MetricBasis>{isDailyMetric(metric.key) ? mode === 'daily' ? `${formatNumber(days)}일 기준 일평균` : '조회 기간 합계' : metric.key === 'purchaseValue' ? '조회 기간 합계' : '전체 기간 기준 비율'}</MetricBasis>
            </MetricCard>
          )
        })}
      </MetricGrid>
      <SummaryNote>{mode === 'daily' ? `지출·노출·전체 클릭의 일평균은 집행하지 않은 날을 포함한 ${formatNumber(days)}일로 나눈 값입니다. ` : ''}구매 전환 금액은 조회 기간 합계이며, ROAS·CTR·CPC·CPM은 전체 기간 기준입니다. —는 계산할 수 없는 값입니다. 구매 전환 금액은 Meta 보고 기준으로 쇼핑몰 전체 매출과 다르며, ROAS 0배는 구매 추적·전환 가치 설정에 따라 표시될 수 있습니다.</SummaryNote>
    </Summary>
  )
}

export function AccountPerformanceTable({ accounts, mode, onSelect }: {
  accounts: MetaAdAccountSummary[]
  mode: DisplayMode
  onSelect: (assetId: number) => void
}) {
  const id = useId()
  return (
    <TablePanel aria-labelledby={`${id}-title`}>
      <PanelHeading>
        <div><h2 id={`${id}-title`}>광고 계정별 성과</h2><p>계정을 선택하면 캠페인별 성과를 볼 수 있어요.</p></div>
        <DetailBadge>{formatNumber(accounts.length)}개 계정</DetailBadge>
      </PanelHeading>
      {accounts.length > 0 ? <ScrollHint>표가 잘리면 좌우로 스크롤해 모든 지표를 확인하세요.</ScrollHint> : null}
      {accounts.length === 0 ? <TableEmpty>조회할 광고 계정 성과가 없습니다.</TableEmpty> : (
        <TableRegion role="region" aria-label="광고 계정별 성과 표, 좌우로 이동 가능" tabIndex={0}>
          <DataTable>
            <caption>광고 계정별 {mode === 'daily' ? '지출·노출·전체 클릭의 일평균, 구매 전환 금액의 기간 합계와 전체 기간 비율' : '기간 합계와 비율'}. 계정별 통화와 현지 시간대를 기준으로 합니다.</caption>
            <thead><tr><th scope="col">광고 계정</th><th scope="col">통화 / 시간대</th>{METRICS.map((metric) => <MetricHeader key={metric.key} scope="col" title={metric.description}>{metric.label}{mode === 'daily' && isDailyMetric(metric.key) ? ' / 일' : mode === 'daily' && metric.key === 'purchaseValue' ? ' (합계)' : ''}</MetricHeader>)}</tr></thead>
            <tbody>{accounts.map((account) => (
              <tr key={account.assetId}>
                <NameCell as="th" scope="row"><AccountButton type="button" onClick={() => onSelect(account.assetId)} aria-label={`${account.name || account.adAccountId} 캠페인 성과 보기`}><strong>{account.name || '이름 없는 광고 계정'}</strong><span>{account.adAccountId}<b aria-hidden="true">↗</b></span></AccountButton></NameCell>
                <AccountContext><strong>{currencyLabel(account.currency)}</strong><span>{account.timezoneName || '시간대 정보 없음'}</span></AccountContext>
                {METRICS.map((metric) => <PerformanceCell key={metric.key} value={displayedMetric(metric.key, account.metrics, account.dailyAverage, mode)} kind={metric.kind} currency={account.currency} />)}
              </tr>
            ))}</tbody>
          </DataTable>
        </TableRegion>
      )}
      <TableFootnote>{mode === 'daily' ? '구매 전환 금액은 기간 합계, ROAS를 포함한 비율 지표는 전체 기간 기준입니다. ' : ''}계정별 통화로 표시하며 환산하지 않습니다. 서로 다른 시간대의 계정은 각자의 현지 날짜 범위를 기준으로 집계됩니다.</TableFootnote>
    </TablePanel>
  )
}

export function CampaignPerformanceTable({ campaigns, performance, currency, mode, listUnavailable = false }: {
  campaigns: MetaCampaign[]
  performance: MetaCampaignPerformance[] | null
  currency: string | null
  mode: DisplayMode
  listUnavailable?: boolean
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const joined = new Map<string, { id: string; campaign?: MetaCampaign; insight?: MetaCampaignPerformance }>()
    campaigns.forEach((campaign) => joined.set(campaign.id, { id: campaign.id, campaign }))
    performance?.forEach((insight) => joined.set(insight.campaignId, { ...joined.get(insight.campaignId), id: insight.campaignId, insight }))
    return [...joined.values()].map((row) => ({ ...row, name: row.campaign?.name || row.insight?.campaignName || '이름 없는 캠페인' }))
  }, [campaigns, performance])
  const visibleRows = rows.filter((row) => `${row.name} ${row.id}`.toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR')))
  const noPerformanceReason = performance === null ? '성과를 불러오지 못해 표시할 수 없습니다.' : '선택한 기간에 반환된 캠페인 성과가 없습니다.'

  return (
    <TablePanel aria-labelledby={`${id}-title`}>
      <PanelHeading>
        <div><h2 id={`${id}-title`}>캠페인별 성과</h2><p>{listUnavailable ? '조회된 성과를 기준으로 캠페인을 표시합니다.' : '캠페인 목록과 조회 기간에 반환된 성과를 함께 표시합니다.'}</p></div>
        <DetailBadge>표시 중 {formatNumber(rows.length)}개</DetailBadge>
      </PanelHeading>
      <TableToolbar>
        <SearchField><span>캠페인 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="캠페인 이름 또는 ID" /></SearchField>
        <TableUnit>{mode === 'daily' ? '지출·노출·전체 클릭: 일평균' : '조회 기간 합계'}{mode === 'daily' && <span>구매 전환 금액: 기간 합계 · ROAS: 전체 기간</span>}<span>금액 단위: {currencyLabel(currency)}</span></TableUnit>
      </TableToolbar>
      {visibleRows.length > 0 ? <ScrollHint>표가 잘리면 좌우로 스크롤해 모든 지표를 확인하세요.</ScrollHint> : null}
      {visibleRows.length === 0 ? <TableEmpty>{query.trim() ? '검색 조건에 맞는 캠페인이 없습니다.' : listUnavailable ? '현재 표시할 캠페인 성과가 없습니다.' : '조회된 캠페인이 없습니다.'}</TableEmpty> : (
        <TableRegion role="region" aria-label="캠페인별 성과 표, 좌우로 이동 가능" tabIndex={0}>
          <DataTable>
            <caption>캠페인별 {mode === 'daily' ? '지출·노출·전체 클릭의 일평균, 구매 전환 금액의 기간 합계와 전체 기간 비율' : '기간 합계와 비율'}. 금액 단위는 {currencyLabel(currency)}입니다. 성과가 없거나 계산할 수 없는 값은 대시로 표시합니다.</caption>
            <thead><tr><th scope="col">캠페인 / 목표</th><th scope="col">상태</th>{METRICS.map((metric) => <MetricHeader key={metric.key} scope="col" title={metric.description}>{metric.label}{mode === 'daily' && isDailyMetric(metric.key) ? ' / 일' : mode === 'daily' && metric.key === 'purchaseValue' ? ' (합계)' : ''}</MetricHeader>)}</tr></thead>
            <tbody>{visibleRows.map((row) => {
              const status = row.campaign?.effectiveStatus || row.campaign?.status
              const objective = row.campaign?.objective
              return (
                <tr key={row.id}>
                  <NameCell as="th" scope="row"><CampaignName>{row.name}</CampaignName><CampaignMeta>{row.id}</CampaignMeta><Objective title={objective || undefined}>{objective ? objectiveLabel(objective) : '목표 정보 없음'}</Objective></NameCell>
                  <td><StatusPill $tone={statusTone(status)} title={status || '캠페인 목록에서 상태를 확인할 수 없습니다.'}>{status ? statusLabel(status) : '상태 정보 없음'}</StatusPill></td>
                  {METRICS.map((metric) => <PerformanceCell key={metric.key} value={row.insight ? displayedMetric(metric.key, row.insight.metrics, row.insight.dailyAverage, mode) : undefined} kind={metric.kind} currency={currency} missingReason={noPerformanceReason} />)}
                </tr>
              )
            })}</tbody>
          </DataTable>
        </TableRegion>
      )}
      <TableFootnote>{mode === 'daily' ? '구매 전환 금액은 기간 합계, ROAS를 포함한 비율 지표는 전체 기간 기준입니다. ' : ''}{performance === null ? '성과 조회 실패를 0으로 표시하지 않습니다. ' : '기간 성과가 없는 캠페인의 수치는 —로 표시합니다. '}계정 합계는 별도로 조회하므로 캠페인별 수치의 합계와 다를 수 있습니다.</TableFootnote>
    </TablePanel>
  )
}

function PerformanceCell({ value, kind, currency, missingReason }: {
  value: number | null | undefined
  kind: MetricKind
  currency: string | null
  missingReason?: string
}) {
  const title = value === undefined ? missingReason || '성과 정보가 없습니다.' : metricValueTitle(value, kind, currency)
  return <NumericCell title={title}><span aria-label={title}>{formatNumber(value)}{value !== null && value !== undefined && Number.isFinite(value) ? kind === 'percent' ? '%' : kind === 'ratio' ? '배' : '' : ''}</span></NumericCell>
}

function displayedMetric(key: MetricKey, metrics: MetaAdMetrics, dailyAverage: MetaAdDailyAverage, mode: DisplayMode): number | null {
  if (mode === 'daily' && isDailyMetric(key)) return dailyAverage[key]
  return metrics[key]
}

function isDailyMetric(key: MetricKey): key is keyof MetaAdDailyAverage {
  return key === 'spend' || key === 'impressions' || key === 'clicks'
}

function formatNumber(value: number | null | undefined, exact = false): string {
  return value === null || value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('ko-KR', { maximumFractionDigits: exact ? 6 : 2 })
}

function currencyLabel(currency: string | null): string {
  return currency?.trim() || '통화 정보 없음'
}

function metricValueTitle(value: number | null | undefined, kind: MetricKind, currency: string | null): string {
  if (value === null && kind === 'ratio') return '지출이 0이어서 ROAS를 계산할 수 없습니다.'
  if (value === null || value === undefined || !Number.isFinite(value)) return '분모가 0이거나 값이 없어 계산할 수 없습니다.'
  const amount = formatNumber(value, true)
  return kind === 'money' ? `${amount} ${currencyLabel(currency)}` : kind === 'percent' ? `${amount}%` : kind === 'ratio' ? `${amount}배` : `${amount}회`
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = { ACTIVE: '진행 중', PAUSED: '일시 중지', ARCHIVED: '보관됨', DELETED: '삭제됨', CAMPAIGN_PAUSED: '캠페인 중지', ADSET_PAUSED: '광고 세트 중지', IN_PROCESS: '처리 중', WITH_ISSUES: '확인 필요', DISAPPROVED: '승인 거절', PENDING_REVIEW: '검토 중', PREAPPROVED: '사전 승인', PENDING_BILLING_INFO: '결제 정보 필요' }
  return labels[status] || status
}

function statusTone(status: string | null | undefined): 'success' | 'warning' | undefined {
  if (status === 'ACTIVE') return 'success'
  if (status && ['WITH_ISSUES', 'DISAPPROVED', 'PENDING_REVIEW', 'PENDING_BILLING_INFO'].includes(status)) return 'warning'
  return undefined
}

function objectiveLabel(objective: string): string {
  const labels: Record<string, string> = {
    OUTCOME_AWARENESS: '인지도', OUTCOME_TRAFFIC: '트래픽', OUTCOME_ENGAGEMENT: '참여', OUTCOME_LEADS: '잠재 고객', OUTCOME_APP_PROMOTION: '앱 홍보', OUTCOME_SALES: '판매',
    BRAND_AWARENESS: '브랜드 인지도', REACH: '도달', TRAFFIC: '트래픽', LINK_CLICKS: '링크 클릭', ENGAGEMENT: '참여', POST_ENGAGEMENT: '게시물 참여', PAGE_LIKES: '페이지 좋아요', EVENT_RESPONSES: '이벤트 응답', APP_INSTALLS: '앱 설치', VIDEO_VIEWS: '동영상 조회', LEAD_GENERATION: '잠재 고객 확보', MESSAGES: '메시지', CONVERSIONS: '전환', PRODUCT_CATALOG_SALES: '카탈로그 판매', STORE_VISITS: '매장 방문',
  }
  return labels[objective] || objective
}

const Summary = styled.section`min-width: 0;`
const MetricGrid = styled.dl`display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0; @media (max-width: 1100px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }`
const MetricCard = styled.div`min-width: 0; padding: 19px 17px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px; background: white; @media (max-width: 580px) { padding: 15px 12px; }`
const MetricLabel = styled.dt`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; font-weight: 600; span { color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 500; overflow-wrap: anywhere; }`
const MetricValue = styled.dd`margin: 13px 0 8px; color: ${({ theme }) => theme.colors.text}; font-size: clamp(21px, 2vw, 26px); font-weight: 700; line-height: 1.25; letter-spacing: -.65px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere;`
const MetricBasis = styled.dd`margin: 0; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; word-break: keep-all; overflow-wrap: anywhere;`
const SummaryNote = styled.p`margin-top: 12px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.8; word-break: keep-all; overflow-wrap: anywhere;`
const TablePanel = styled(DetailPanel)`width: 100%; min-width: 0; overflow: hidden;`
const ScrollHint = styled.p`display: block; padding: 10px 18px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px;`
const TableRegion = styled.div`width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; &:focus-visible { outline-offset: -3px; }`
const DataTable = styled.table`width: 100%; min-width: 1280px; border-collapse: collapse; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; caption { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; } thead { background: #f8f9fc; } th, td { padding: 15px 18px; text-align: left; vertical-align: middle; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; } thead th { color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; font-weight: 600; white-space: nowrap; } tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; } tbody tr:hover { background: #fcfbff; }`
const MetricHeader = styled.th`&& { text-align: right; }`
const NameCell = styled.td`min-width: 220px; max-width: 320px; font-weight: 400;`
const NumericCell = styled.td`&& { text-align: right; } white-space: nowrap; font-variant-numeric: tabular-nums; color: ${({ theme }) => theme.colors.text};`
const AccountButton = styled.button`&& { display: block; width: 100%; min-height: 44px; padding: 4px 0; border: 0; border-radius: 4px; background: transparent; color: ${({ theme }) => theme.colors.primary}; text-align: left; white-space: normal; } &&:hover:not(:disabled), &&:active:not(:disabled) { background: transparent; color: ${({ theme }) => theme.colors.primaryHover}; } strong { display: block; font-size: 12px; font-weight: 650; overflow-wrap: anywhere; } span { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 400; overflow-wrap: anywhere; } b { font-size: 13px; font-weight: 400; color: ${({ theme }) => theme.colors.primary}; }`
const AccountContext = styled.td`min-width: 155px; strong { display: block; font-size: 11px; font-weight: 600; overflow-wrap: anywhere; } span { display: block; margin-top: 5px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; overflow-wrap: anywhere; }`
const TableToolbar = styled.div`display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 18px 24px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; @media (max-width: 600px) { padding: 16px 18px; }`
const SearchField = styled.label`display: grid; gap: 7px; width: min(100%, 300px); min-width: 0; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; font-weight: 600; input { width: 100%; min-width: 0; font-size: 12px; font-weight: 400; }`
const TableUnit = styled.p`color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.8; span { display: block; }`
const CampaignName = styled.span`display: block; color: ${({ theme }) => theme.colors.text}; font-weight: 650; overflow-wrap: anywhere;`
const CampaignMeta = styled.span`display: block; margin-top: 4px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; overflow-wrap: anywhere;`
const Objective = styled.span`display: inline-block; margin-top: 7px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 10px; overflow-wrap: anywhere;`
const StatusPill = styled(DetailBadge)`max-width: 150px; white-space: normal; overflow-wrap: anywhere;`
const TableEmpty = styled.p`padding: 48px 20px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 13px; line-height: 1.8; text-align: center;`
const TableFootnote = styled.p`padding: 14px 24px; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.8; word-break: keep-all; overflow-wrap: anywhere; @media (max-width: 600px) { padding-inline: 18px; }`
