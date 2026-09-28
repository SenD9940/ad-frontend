import { useState, type FormEvent } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useNaverStorePerformance } from '../../hooks/useNaverStorePerformance'
import { NaverProductList, NaverSalesOverview } from './NaverPerformanceUI'
import { koreaToday, naverPresetPeriod, validateNaverPeriod, type NaverDateRange, type NaverPeriodPreset } from './naverPerformanceDates'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader,
  DetailLead, DetailPage, DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton,
  DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

export default function NaverPerformancePage() {
  const { workspaceId } = useParams()
  return <NaverPerformanceContent key={workspaceId} workspaceId={Number(workspaceId)} />
}

function NaverPerformanceContent({ workspaceId }: { workspaceId: number }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [defaultPeriod] = useState(() => naverPresetPeriod('7d'))
  const assetId = params.has('assetId') ? Number(params.get('assetId')) : null
  const period = { since: params.get('since') ?? defaultPeriod.since, until: params.get('until') ?? defaultPeriod.until }
  const [pagination, setPagination] = useState({ assetId, page: 1 })
  const page = pagination.assetId === assetId ? pagination.page : 1
  const model = useNaverStorePerformance(workspaceId, assetId, period, page)
  const assetsPath = `/workspaces/${workspaceId}/connections/naver/assets`
  const savedNotice = Boolean((location.state as { naverChannelsSaved?: boolean } | null)?.naverChannelsSaved)

  function selectStore(value: string) {
    setPagination({ assetId: Number(value), page: 1 })
    setParams((current) => { const next = new URLSearchParams(current); next.set('assetId', value); return next })
  }

  function applyPeriod(value: NaverDateRange) {
    setParams((current) => { const next = new URLSearchParams(current); next.set('since', value.since); next.set('until', value.until); return next })
  }

  const inventoryReady = !model.storesLoading && !model.storesError
  const canShowStore = inventoryReady && Boolean(model.selected) && !model.selectionError
  const ready = canShowStore && !model.selected?.requiresReauth

  return <DetailPage>
    <DetailHeader>
      <div><DetailEyebrow>네이버 / 스마트스토어</DetailEyebrow><DetailTitle>상품 및 판매 성과</DetailTitle><DetailLead>저장한 스마트스토어의 판매 중인 상품과 결제 기준 성과를 확인하세요.</DetailLead></div>
      <EditLink to={assetsPath}>자산 편집 <span aria-hidden="true">↗</span></EditLink>
    </DetailHeader>
    {savedNotice && <DetailAlert $success role="status">스마트스토어 채널을 저장했습니다. 상품과 판매 성과를 확인할 수 있어요.</DetailAlert>}
    {model.storesLoading ? <DetailPanel><DetailStatus role="status">저장된 스마트스토어를 불러오는 중…</DetailStatus></DetailPanel> : model.storesError ? <RequestError title="스마트스토어를 불러오지 못했습니다" message={model.storesError} onRetry={model.reloadStores} /> : !model.stores.length ? <DetailPanel><DetailEmpty>
      <EmptyMark aria-hidden="true">N</EmptyMark><h2>먼저 스마트스토어 채널을 저장해 주세요</h2><p>스토어를 연결하고 사용할 채널을 저장하면 상품과 판매 성과가 표시됩니다.</p><DetailActionLink to={assetsPath}>스마트스토어 연결 및 자산 선택</DetailActionLink>
    </DetailEmpty></DetailPanel> : <>
      <SelectionPanel>
        <StoreField>스마트스토어 채널<select aria-label="스마트스토어 채널" value={model.selected?.assetId ?? ''} onChange={(event) => selectStore(event.target.value)}>
          {!model.selected && <option value="" disabled>채널을 선택해 주세요</option>}
          {model.stores.map((store) => <option key={store.assetId} value={store.assetId}>{store.name || `스마트스토어 ${store.channelNo}`}{store.requiresReauth ? ' · 재연결 필요' : ''}</option>)}
        </select></StoreField>
        {model.selected && <StoreContext><DetailBadge $tone={model.selected.requiresReauth ? 'warning' : 'success'}>{model.selected.requiresReauth ? '재연결 필요' : '연결됨'}</DetailBadge><span>{model.selected.connectionName || '네이버 판매자 계정'} · 채널 {model.selected.channelNo}</span></StoreContext>}
      </SelectionPanel>
      {model.selectionError && <DetailAlert role="alert">{model.selectionError}</DetailAlert>}
      {canShowStore && model.selected?.requiresReauth && <DetailPanel><DetailEmpty><h2>네이버 계정을 다시 연결해 주세요</h2><p>저장된 채널은 유지됩니다. 워크스페이스 소유자가 자산 편집에서 판매자 권한을 다시 확인하면 상품과 판매 성과를 조회할 수 있습니다.</p><DetailActionLink to={assetsPath}>자산 편집에서 재연결</DetailActionLink></DetailEmpty></DetailPanel>}
      {ready && <>
        <DetailPanel>
          <PanelHeading><div><h2>판매 성과</h2><p>한국 시간 · 결제일 기준 · 최대 31일</p></div><DetailBadge>결제 기준</DetailBadge></PanelHeading>
          <DetailPanelBody><PeriodForm key={`${period.since}:${period.until}`} period={period} onApply={applyPeriod} loading={model.salesLoading} /></DetailPanelBody>
        </DetailPanel>
        {model.salesLoading ? <DetailPanel><DetailStatus role="status">기간 내 결제 주문을 집계하는 중…</DetailStatus></DetailPanel> : model.salesError ? <RequestError title="판매 성과를 확인할 수 없습니다" message={model.salesError} onRetry={validateNaverPeriod(period) ? undefined : model.reloadSales} hint="상품 목록은 별도로 조회됩니다. 주문 조회 권한이 없으면 애플리케이션의 주문 권한을 확인해 주세요." /> : model.sales && <NaverSalesOverview data={model.sales} onReload={model.reloadSales} />}
        <NaverProductList data={model.products} loading={model.productsLoading} error={model.productsError} onReload={model.reloadProducts} onPage={(nextPage) => setPagination({ assetId, page: nextPage })} />
      </>}
    </>}
  </DetailPage>
}

function PeriodForm({ period, onApply, loading }: { period: NaverDateRange; onApply: (value: NaverDateRange) => void; loading: boolean }) {
  const [draft, setDraft] = useState(period)
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const validation = validateNaverPeriod(draft)
    setError(validation)
    if (!validation) onApply(draft)
  }
  function preset(value: NaverPeriodPreset) {
    const range = naverPresetPeriod(value)
    setDraft(range)
    setError('')
    onApply(range)
  }
  return <PeriodContainer onSubmit={submit}>
    <Presets aria-label="판매 성과 조회 기간">{([['today', '오늘'], ['7d', '최근 7일'], ['30d', '최근 30일'], ['month', '이번 달']] as const).map(([value, label]) => {
      const range = naverPresetPeriod(value)
      return <PresetButton key={value} type="button" aria-pressed={period.since === range.since && period.until === range.until} onClick={() => preset(value)}>{label}</PresetButton>
    })}</Presets>
    <DateRow>
      <DateField>시작일<input type="date" max={koreaToday()} value={draft.since} onChange={(event) => { setDraft((value) => ({ ...value, since: event.target.value })); setError('') }} required /></DateField>
      <DateField>종료일<input type="date" max={koreaToday()} value={draft.until} onChange={(event) => { setDraft((value) => ({ ...value, until: event.target.value })); setError('') }} required /></DateField>
      <DetailPrimaryButton type="submit" disabled={loading && period.since === draft.since && period.until === draft.until}>기간 적용</DetailPrimaryButton>
    </DateRow>
    {error && <DetailAlert role="alert">{error}</DetailAlert>}
  </PeriodContainer>
}

function RequestError({ title, message, hint, onRetry }: { title: string; message: string; hint?: string; onRetry?: () => void }) {
  return <DetailPanel><DetailEmpty><h2>{title}</h2><DetailAlert role="alert">{message}</DetailAlert>{hint && <p>{hint}</p>}{onRetry && <DetailSecondaryButton type="button" onClick={onRetry}>다시 조회</DetailSecondaryButton>}</DetailEmpty></DetailPanel>
}

const EditLink = styled(DetailActionLink)`background: white; color: ${({ theme }) => theme.colors.textSecondary}; border: 1px solid ${({ theme }) => theme.colors.border}; &:hover { background: #f7f8fc; color: ${({ theme }) => theme.colors.text}; }`
const EmptyMark = styled.span`display: grid; place-items: center; width: 48px; height: 48px; border-radius: 13px; color: #03a95b; background: #eaf8f1; font-size: 27px; font-weight: 900;`
const SelectionPanel = styled(DetailPanel)`display: flex; align-items: center; flex-wrap: wrap; gap: 20px; padding: 22px 24px; @media(max-width: 600px) { padding: 18px; }`
const StoreField = styled.label`display: grid; gap: 8px; min-width: 0; width: min(100%, 420px); color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; font-weight: 650; select { width: 100%; min-width: 0; min-height: 44px; padding: 10px 12px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; background: white; color: ${({ theme }) => theme.colors.text}; font: inherit; }`
const StoreContext = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-width: 0; font-size: 11px; color: ${({ theme }) => theme.colors.textMuted}; span { overflow-wrap: anywhere; }`
const PeriodContainer = styled.form`display: flex; flex-direction: column; gap: 18px;`
const Presets = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`
const PresetButton = styled(DetailSecondaryButton)`min-height: 36px; padding: 7px 12px; font-size: 12px; &[aria-pressed=true] { border-color: #03a95b; background: #eaf8f1; color: #167853; }`
const DateRow = styled.div`display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; @media(max-width: 420px) { display: grid; grid-template-columns: minmax(0, 1fr); }`
const DateField = styled.label`display: grid; gap: 7px; min-width: 0; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; font-weight: 600; input { min-width: 0; width: 100%; min-height: 42px; max-width: 100%; font-size: 12px; }`
