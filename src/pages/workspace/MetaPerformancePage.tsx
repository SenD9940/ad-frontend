import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useMetaAdPerformance } from '../../hooks/useMetaAdPerformance'
import type { DateRange } from '../../types/metaAds'
import { AccountPerformanceTable, CampaignPerformanceTable, PerformanceSummary } from './MetaPerformanceUI'
import { getPresetPeriod, validatePerformancePeriod, type PerformancePreset } from './metaPerformanceDates'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader,
  DetailHint, DetailLead, DetailPage, DetailPanel, DetailPrimaryButton,
  DetailSecondaryButton, DetailStatus, DetailTitle,
} from './WorkspaceDetailUI'

const presets: { value: PerformancePreset; label: string }[] = [
  { value: 'today', label: '오늘' }, { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' }, { value: 'month', label: '이번 달' },
]

export default function MetaPerformancePage() {
  const { workspaceId } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawAssetId = searchParams.get('assetId')
  const assetId = rawAssetId === null ? null : /^\d+$/.test(rawAssetId) && Number.isSafeInteger(Number(rawAssetId)) && Number(rawAssetId) > 0 ? Number(rawAssetId) : -1
  const [period, setPeriod] = useState<DateRange>(() => getPresetPeriod('7d'))
  const [draft, setDraft] = useState<DateRange>(period)
  const [formError, setFormError] = useState('')
  const [mode, setMode] = useState<'total' | 'daily'>('total')
  const [currency, setCurrency] = useState('')
  const sinceInput = useRef<HTMLInputElement>(null)
  const data = useMetaAdPerformance(Number(workspaceId), assetId, period)
  const connectionsPath = `/workspaces/${workspaceId}/connections/meta/assets`
  const savedNotice = Boolean((location.state as { metaAssetsSaved?: boolean } | null)?.metaAssetsSaved)
  const selectedAccount = data.accounts.find((account) => account.assetId === assetId)
  const group = data.workspacePerformance?.totalsByCurrency.find((total) => total.currency === currency) ?? data.workspacePerformance?.totalsByCurrency[0]
  const isDraftChanged = draft.since !== period.since || draft.until !== period.until

  function selectAccount(id: number | null) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (id === null) next.delete('assetId')
      else next.set('assetId', String(id))
      return next
    }, { replace: true })
  }

  function applyPeriod(next: DateRange) {
    const validation = validatePerformancePeriod(next)
    setFormError(validation)
    if (validation) {
      sinceInput.current?.focus()
      return
    }
    setDraft(next)
    if (next.since === period.since && next.until === period.until) {
      data.reloadPerformance()
      if (assetId !== null) data.reloadCampaigns()
    } else setPeriod(next)
  }

  function submitPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyPeriod(draft)
  }

  return (
    <DetailPage>
      <DetailHeader>
        <div>
          <DetailEyebrow>성과 분석 / Meta</DetailEyebrow>
          <DetailTitle>Meta 광고 성과</DetailTitle>
          <DetailLead>연결된 광고 계정의 캠페인과 성과를 확인하고, 전체 흐름을 비교하세요.</DetailLead>
        </div>
        <ManageLink to={connectionsPath}>자산 편집 <span aria-hidden="true">↗</span></ManageLink>
      </DetailHeader>

      {savedNotice ? <DetailAlert $success role="status">자산을 저장했습니다. 저장된 광고 계정의 성과를 확인하세요.</DetailAlert> : null}

      {data.accountsLoading ? <DetailPanel><DetailStatus role="status">저장된 광고 계정을 불러오는 중…</DetailStatus></DetailPanel> : data.accountsError ? (
        <Feedback>
          <DetailAlert role="alert">{data.accountsError}</DetailAlert>
          <Actions><DetailSecondaryButton onClick={data.reloadAccounts}>광고 계정 다시 불러오기</DetailSecondaryButton><ManageLink to={connectionsPath}>자산 편집</ManageLink></Actions>
        </Feedback>
      ) : data.accounts.length === 0 ? (
        <DetailPanel><DetailEmpty>
          <DetailBadge $tone="primary">성과 분석 시작하기</DetailBadge>
          <h2>저장된 Meta 광고 계정이 없습니다</h2>
          <p>자산 편집 화면에서 광고 계정을 선택하고 저장하면 캠페인과 성과를 바로 확인할 수 있습니다.</p>
          <DetailActionLink to={connectionsPath}>광고 계정 연결·선택</DetailActionLink>
        </DetailEmpty></DetailPanel>
      ) : (
        <>
          <Filters aria-label="성과 조회 조건">
            <FilterForm onSubmit={submitPeriod} noValidate>
              <AccountField>
                <span>광고 계정</span>
                <select value={assetId === null ? 'all' : String(assetId)} onChange={(event) => selectAccount(event.target.value === 'all' ? null : Number(event.target.value))}>
                  <option value="all">전체 광고 계정</option>
                  {assetId !== null && !selectedAccount ? <option value={String(assetId)} disabled>계정을 다시 선택해 주세요</option> : null}
                  {data.accounts.map((account) => <option value={String(account.assetId)} key={account.assetId}>{account.name} · {account.externalId} · {account.connectionName}{account.requiresReauth ? ' (재인증 필요)' : ''}</option>)}
                </select>
              </AccountField>
              <DateFields>
                <Field><span>시작일</span><input ref={sinceInput} type="date" value={draft.since} onChange={(event) => { setDraft({ ...draft, since: event.target.value }); setFormError('') }} aria-invalid={Boolean(formError)} aria-describedby={formError ? 'period-error' : 'period-hint'} /></Field>
                <Field><span>종료일</span><input type="date" value={draft.until} onChange={(event) => { setDraft({ ...draft, until: event.target.value }); setFormError('') }} aria-invalid={Boolean(formError)} aria-describedby={formError ? 'period-error' : 'period-hint'} /></Field>
                <DetailPrimaryButton type="submit">성과 조회</DetailPrimaryButton>
              </DateFields>
            </FilterForm>
            <FilterFooter>
              <Actions role="group" aria-label="빠른 기간 선택">{presets.map((preset) => {
                const candidate = getPresetPeriod(preset.value)
                const active = period.since === candidate.since && period.until === candidate.until
                return <PresetButton type="button" key={preset.value} $active={active} aria-pressed={active} onClick={() => applyPeriod(candidate)}>{preset.label}</PresetButton>
              })}</Actions>
              <DetailHint id="period-hint">{isDraftChanged ? '변경한 기간을 적용하려면 성과 조회를 눌러 주세요.' : '시작일과 종료일 포함 · 최대 366일'}</DetailHint>
            </FilterFooter>
            <DetailHint>빠른 기간 선택은 내 기기의 날짜를, 성과 조회는 각 광고 계정의 시간대를 기준으로 합니다.</DetailHint>
            {formError ? <DetailAlert role="alert" id="period-error">{formError}</DetailAlert> : null}
          </Filters>

          {selectedAccount?.requiresReauth ? <DetailAlert role="status">이 광고 계정은 재인증이 필요합니다. 조회에 실패하면 워크스페이스 소유자가 <Link to={connectionsPath}>Meta 연결을 갱신</Link>해 주세요.</DetailAlert> : null}

          <ResultsHeader>
            <div><h2>{assetId === null ? '전체 광고 성과' : selectedAccount?.name || '광고 계정 성과'}</h2><DetailHint>{period.since} — {period.until}</DetailHint></div>
            <ModeSwitch role="group" aria-label="성과 표시 방식">
              <ModeButton type="button" aria-pressed={mode === 'total'} onClick={() => setMode('total')}>기간 합계</ModeButton>
              <ModeButton type="button" aria-pressed={mode === 'daily'} onClick={() => setMode('daily')}>일평균</ModeButton>
            </ModeSwitch>
          </ResultsHeader>

          {data.performanceLoading ? <DetailPanel><DetailStatus role="status">{assetId === null ? '전체 광고 계정의 성과를 집계하는 중…' : '광고 계정의 성과를 불러오는 중…'}</DetailStatus></DetailPanel> : data.performanceError ? (
            <Feedback>
              <DetailAlert role="alert">{data.performanceError}</DetailAlert>
              <Actions><DetailSecondaryButton onClick={data.reloadPerformance}>성과 다시 조회</DetailSecondaryButton><ManageLink to={connectionsPath}>연결·접근 권한 확인</ManageLink></Actions>
            </Feedback>
          ) : assetId === null && data.workspacePerformance ? (
            group ? <>
              <CurrencyBar>
                <Actions><DetailBadge $tone="primary">전체 {data.workspacePerformance.accountCount}개 광고 계정</DetailBadge><DetailHint>동일한 광고 계정은 한 번만 집계합니다.</DetailHint></Actions>
                <CurrencyField><span>표시 통화</span><select value={group.currency} onChange={(event) => setCurrency(event.target.value)}>{data.workspacePerformance.totalsByCurrency.map((total) => <option key={total.currency} value={total.currency}>{total.currency} · {total.accountCount}개 계정</option>)}</select></CurrencyField>
              </CurrencyBar>
              <PerformanceSummary metrics={group.metrics} dailyAverage={group.dailyAverage} currency={group.currency} days={data.workspacePerformance.days} mode={mode} />
              <DetailHint>선택한 통화의 계정만 표시하며, 다른 통화의 금액은 합산하지 않습니다. CTR·CPC·CPM·ROAS는 각 계정의 비율을 단순 평균하지 않고 전체 합계 기준으로 계산합니다.</DetailHint>
              <AccountPerformanceTable accounts={data.workspacePerformance.accounts.filter((account) => account.currency === group.currency)} mode={mode} onSelect={selectAccount} />
              <DetailHint>각 광고 계정의 시간대를 기준으로 조회한 성과입니다. 광고 계정을 선택하면 캠페인별 상세 성과를 확인할 수 있습니다.</DetailHint>
            </> : <DetailPanel><DetailEmpty><h2>집계할 광고 계정이 없습니다</h2><p>저장된 광고 계정을 다시 확인해 주세요.</p><DetailSecondaryButton onClick={data.reloadAccounts}>광고 계정 다시 불러오기</DetailSecondaryButton></DetailEmpty></DetailPanel>
          ) : data.accountPerformance ? (
            <>
              <CurrencyBar><DetailBadge $tone="primary">{data.accountPerformance.account.currency}</DetailBadge><DetailHint>{data.accountPerformance.account.adAccountId} · {data.accountPerformance.account.timezoneName || '계정 시간대 미제공'} · {data.accountPerformance.days}일</DetailHint></CurrencyBar>
              <PerformanceSummary metrics={data.accountPerformance.account.metrics} dailyAverage={data.accountPerformance.account.dailyAverage} currency={data.accountPerformance.account.currency} days={data.accountPerformance.days} mode={mode} />
              <DetailHint>CTR·CPC·CPM·ROAS는 기간 합계 기준이며, 클릭은 전체 클릭 수입니다. 구매 전환 금액은 광고 계정의 통화로 표시합니다.</DetailHint>
            </>
          ) : null}

          {assetId !== null && selectedAccount ? <>
            {data.campaignsError ? <Feedback><DetailAlert role="alert">{data.campaignsError}</DetailAlert><Actions><DetailSecondaryButton onClick={data.reloadCampaigns}>캠페인 다시 조회</DetailSecondaryButton></Actions></Feedback> : null}
            {data.campaignsLoading || data.performanceLoading ? <DetailPanel><DetailStatus role="status">캠페인 목록과 성과를 확인하는 중…</DetailStatus></DetailPanel> : !data.campaignsError || data.accountPerformance ? <>
              <CampaignPerformanceTable campaigns={data.campaigns} performance={data.accountPerformance?.campaigns ?? null} currency={data.accountPerformance?.account.currency ?? null} mode={mode} listUnavailable={Boolean(data.campaignsError)} />
              <DetailHint>계정 성과와 캠페인 성과는 각각 조회되므로 캠페인 행의 합계가 계정 성과와 다를 수 있습니다. 캠페인 상태는 현재 상태이며, 성과는 선택한 기간 기준입니다.</DetailHint>
            </> : null}
          </> : null}
        </>
      )}
    </DetailPage>
  )
}

const ManageLink = styled(Link)`display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 2.625rem; padding: .625rem .875rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: .5rem; background: white; color: ${({ theme }) => theme.colors.textSecondary}; font-size: .8125rem; font-weight: 600; text-decoration: none; &:hover { color: ${({ theme }) => theme.colors.primary}; border-color: #c9c7e0; }`
const Filters = styled(DetailPanel)`display: grid; gap: 1rem; padding: 1.25rem 1.5rem; @media(max-width: 600px) { padding: 1.125rem; }`
const FilterForm = styled.form`display: flex; align-items: end; gap: 1rem; flex-wrap: wrap; min-width: 0;`
const Field = styled.label`display: grid; gap: .5rem; min-width: 0; font-size: .75rem; font-weight: 600; color: ${({ theme }) => theme.colors.textSecondary}; input, select { width: 100%; min-width: 0; min-height: 2.625rem; padding: .55rem .65rem; border-radius: .5rem; background: white; font-size: .8125rem; color: ${({ theme }) => theme.colors.text}; }`
const AccountField = styled(Field)`flex: 1 1 18rem; max-width: 100%;`
const DateFields = styled.div`display: flex; align-items: end; gap: .625rem; min-width: 0; > label { flex: 1; } @media(max-width: 600px) { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); width: 100%; > button { grid-column: 1 / -1; } } @media(max-width: 380px) { grid-template-columns: minmax(0, 1fr); }`
const FilterFooter = styled.div`display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap;`
const Actions = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; min-width: 0;`
const PresetButton = styled(DetailSecondaryButton)<{ $active: boolean }>`min-height: 2rem; padding: .3rem .6rem; font-size: .75rem; ${({ $active }) => $active && 'border-color: #d8d4ff; color: #635bff; background: #f5f3ff;'};`
const Feedback = styled.div`display: grid; gap: .75rem;`
const ResultsHeader = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; h2 { font-size: 1.0625rem; letter-spacing: -.02em; overflow-wrap: anywhere; }`
const ModeSwitch = styled.div`display: inline-flex; gap: .25rem; padding: .25rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: .625rem; background: #eeeff4;`
const ModeButton = styled.button`min-height: 2.125rem; padding: .4rem .875rem; border-radius: .375rem; font-size: .75rem; font-weight: 600; color: ${({ theme }) => theme.colors.textMuted}; background: transparent; &[aria-pressed='true'] { color: ${({ theme }) => theme.colors.primary}; background: white; box-shadow: 0 1px 3px rgb(24 31 55 / 8%); } &:hover:not(:disabled), &:active:not(:disabled) { background: white; color: ${({ theme }) => theme.colors.primary}; }`
const CurrencyBar = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .875rem;`
const CurrencyField = styled(Field)`display: flex; align-items: center; gap: .75rem; > span { white-space: nowrap; } select { width: auto; max-width: 14rem; min-height: 2.25rem; }`
