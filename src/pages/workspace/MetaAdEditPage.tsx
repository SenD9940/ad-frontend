import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ApiError } from '../../api/http'
import { listSavedMetaAdAccounts } from '../../api/metaAds'
import { MetaAdUpdateError, updateMetaAdObject } from '../../api/metaAdUpdates'
import type { SavedMetaAdAccount } from '../../types/metaAds'
import type { MetaAdObjectType, MetaAdUpdatePatch, MetaAdUpdateStatus } from '../../types/metaAdUpdate'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead,
  DetailPage, DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

type Changes = { changeName: boolean; name: string; changeStatus: boolean; status: '' | MetaAdUpdateStatus; changeBudget: boolean; budget: string }
type Errors = Partial<Record<'account' | 'type' | 'objectId' | 'name' | 'status' | 'budget' | 'changes', string>>
type Review = { assetId: number; accountName: string; accountId: string; type: MetaAdObjectType; objectId: string; patch: MetaAdUpdatePatch }
type Failure = { message: string; unknown: boolean }
const LABELS: Record<MetaAdObjectType, string> = { ad: '광고', 'ad-set': '광고세트', campaign: '캠페인' }
const emptyChanges = (): Changes => ({ changeName: false, name: '', changeStatus: false, status: '', changeBudget: false, budget: '' })
const isObjectType = (value: string): value is MetaAdObjectType => value === 'ad' || value === 'ad-set' || value === 'campaign'

export default function MetaAdEditPage() {
  const { workspaceId } = useParams()
  const [params] = useSearchParams()
  const id = Number(workspaceId)
  if (!Number.isSafeInteger(id) || id <= 0) return <DetailPage><DetailPanel><DetailEmpty><h1>워크스페이스를 찾을 수 없습니다</h1><DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink></DetailEmpty></DetailPanel></DetailPage>
  return <EditWorkspaceAd key={`${workspaceId}:${params.toString()}`} workspaceId={id} initialAccount={params.get('assetId') ?? ''} initialType={params.get('type') ?? 'ad'} initialObjectId={params.get('objectId') ?? ''} />
}

function EditWorkspaceAd({ workspaceId, initialAccount, initialType, initialObjectId }: { workspaceId: number; initialAccount: string; initialType: string; initialObjectId: string }) {
  const [accounts, setAccounts] = useState<SavedMetaAdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [accountId, setAccountId] = useState(initialAccount)
  const [objectType, setObjectType] = useState(initialType)
  const [objectId, setObjectId] = useState(initialObjectId)
  const [changes, setChanges] = useState(emptyChanges)
  const [errors, setErrors] = useState<Errors>({})
  const [review, setReview] = useState<Review | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [checkedResult, setCheckedResult] = useState(false)
  const pending = useRef(false)
  const active = useRef(true)
  const title = useRef<HTMLHeadingElement>(null)
  const selected = accounts.find((account) => String(account.assetId) === accountId)
  const typeLabel = isObjectType(objectType) ? LABELS[objectType] : '대상'
  const assetsPath = `/workspaces/${workspaceId}/connections/meta/assets`
  const performancePath = `/workspaces/${workspaceId}/meta/performance${selected ? `?assetId=${selected.assetId}` : ''}`

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    listSavedMetaAdAccounts(workspaceId, controller.signal).then((items) => {
      if (!controller.signal.aborted) setAccounts(items)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : '저장된 광고 계정을 불러오지 못했습니다.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [workspaceId, attempt])

  function changeFields(patch: Partial<Changes>) {
    setChanges((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  function focusSummary() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    title.current?.focus()
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || success || review || failure?.unknown) return
    const next: Errors = {}
    if (!selected) next.account = '저장된 광고 계정을 선택해 주세요.'
    else if (selected.requiresReauth) next.account = 'Meta 계정을 재인증한 뒤 수정해 주세요.'
    if (!isObjectType(objectType)) next.type = '수정할 대상 유형을 선택해 주세요.'
    const id = objectId.trim()
    if (!/^[0-9]{1,32}$/.test(id) || /^0+$/.test(id)) next.objectId = 'Meta에 표시된 숫자 ID를 1~32자리로 입력해 주세요.'
    const patch: MetaAdUpdatePatch = {}
    if (changes.changeName) {
      if (!changes.name.trim() || changes.name.trim().length > 255) next.name = '공백만 있는 이름은 사용할 수 없습니다. 이름을 1~255자로 입력해 주세요.'
      else patch.name = changes.name.trim()
    }
    if (changes.changeStatus) {
      if (changes.status !== 'ACTIVE' && changes.status !== 'PAUSED') next.status = '활성 또는 일시정지 상태를 선택해 주세요.'
      else patch.status = changes.status
    }
    if (changes.changeBudget && objectType !== 'ad') {
      const amount = Number(changes.budget)
      if (!/^[0-9]+$/.test(changes.budget) || !Number.isSafeInteger(amount) || amount <= 0) next.budget = '일 예산을 입력 가능한 범위의 양의 정수로 입력해 주세요.'
      else patch.dailyBudget = amount
    }
    if (!changes.changeName && !changes.changeStatus && !(changes.changeBudget && objectType !== 'ad')) next.changes = '변경할 항목을 하나 이상 선택해 주세요.'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) {
      requestAnimationFrame(() => document.getElementById(`ad-edit-${first}`)?.focus())
      return
    }
    if (!selected || !isObjectType(objectType)) return
    setReview({ assetId: selected.assetId, accountName: selected.name, accountId: selected.externalId, type: objectType, objectId: id, patch })
    setFailure(null)
    setCheckedResult(false)
    focusSummary()
  }

  async function applyChanges() {
    if (!review || pending.current || success || failure) return
    pending.current = true
    setBusy(true)
    try {
      await updateMetaAdObject(workspaceId, review.assetId, review.type, review.objectId, review.patch)
      if (active.current) setSuccess(true)
    } catch (error: unknown) {
      if (active.current) setFailure({ message: error instanceof ApiError ? error.message : '변경 결과를 확인하지 못했습니다. Meta 광고 관리자에서 확인해 주세요.', unknown: error instanceof MetaAdUpdateError ? error.outcomeUnknown : true })
    } finally {
      pending.current = false
      if (active.current) { setBusy(false); focusSummary() }
    }
  }

  function returnToInputs() {
    if (pending.current || (failure?.unknown && !checkedResult)) return
    setReview(null)
    setFailure(null)
    setCheckedResult(false)
  }

  return <DetailPage>
    <DetailHeader>
      <div><DetailEyebrow>Meta / 광고 수정</DetailEyebrow><DetailTitle ref={title} tabIndex={-1}>Meta 광고 수정</DetailTitle><DetailLead>광고·광고세트·캠페인에서 바꿀 항목을 선택하고 변경 내용을 확인하세요.</DetailLead></div>
      {!busy && <BackLink to={performancePath}>성과로 돌아가기</BackLink>}
    </DetailHeader>
    {loading ? <DetailPanel><DetailStatus role="status">저장된 광고 계정을 불러오는 중…</DetailStatus></DetailPanel> : loadError ? <DetailPanel><DetailEmpty><DetailAlert role="alert">{loadError}</DetailAlert><DetailSecondaryButton type="button" onClick={() => { setLoading(true); setLoadError(''); setAttempt((current) => current + 1) }}>광고 계정 다시 조회</DetailSecondaryButton></DetailEmpty></DetailPanel> : accounts.length === 0 ? <DetailPanel><DetailEmpty><h2>광고 계정을 먼저 저장해 주세요</h2><p>Meta 연결에서 사용할 광고 계정을 저장하면 수정할 수 있습니다.</p><DetailActionLink to={assetsPath}>자산 편집</DetailActionLink></DetailEmpty></DetailPanel> : review ? <>
      <DetailPanel><PanelHeading><h2>{success ? '변경 요청 완료' : failure?.unknown ? '변경 결과 확인 필요' : failure ? '변경 요청 실패' : '변경 내용 확인'}</h2><DetailBadge $tone={success ? 'success' : failure ? 'warning' : 'primary'}>{LABELS[review.type]} 수정</DetailBadge></PanelHeading><StackBody>
        {success ? <DetailAlert $success role="status">Meta가 수정 요청에 성공으로 응답했습니다. 실제 게재는 심사와 광고·상위 광고세트·캠페인의 상태에 따라 결정됩니다.</DetailAlert> : failure ? <DetailAlert role="alert">{failure.message}</DetailAlert> : <DetailHint>아래에 표시된 항목만 변경합니다. 선택하지 않은 항목은 기존 값을 유지합니다.</DetailHint>}
        <ReviewList>
          <div><dt>광고 계정</dt><dd>{review.accountName}<small>{review.accountId}</small></dd></div>
          <div><dt>수정 대상</dt><dd>{LABELS[review.type]} · <code>{review.objectId}</code></dd></div>
          {review.patch.name !== undefined ? <div><dt>변경할 이름</dt><dd>{review.patch.name}</dd></div> : null}
          {review.patch.status ? <div><dt>변경할 상태</dt><dd>{review.patch.status === 'ACTIVE' ? '활성 (ACTIVE)' : '일시정지 (PAUSED)'}</dd></div> : null}
          {review.patch.dailyBudget !== undefined ? <div><dt>변경할 일 예산</dt><dd>{review.patch.dailyBudget?.toLocaleString('ko-KR')} (광고 계정 통화의 Meta 금액 단위)</dd></div> : null}
        </ReviewList>
        {review.patch.status && !success ? <ScopeNote type={review.type} activate={review.patch.status === 'ACTIVE'} /> : null}
        {review.patch.dailyBudget !== undefined && !success ? <BudgetNote type={review.type} /> : null}
        {failure?.unknown ? <>
          <DetailHint>오류 응답이 와도 상태나 예산이 변경되었을 수 있습니다. Meta 광고 관리자에서 결과를 확인한 뒤 다음 변경을 진행해 주세요.</DetailHint>
          <ExternalLink href="https://adsmanager.facebook.com/" target="_blank" rel="noopener noreferrer">Meta 광고 관리자에서 결과 확인 ↗</ExternalLink>
          <CheckLabel><input type="checkbox" checked={checkedResult} onChange={(event) => setCheckedResult(event.target.checked)} />Meta 광고 관리자에서 변경 결과를 확인했습니다.</CheckLabel>
          <DetailSecondaryButton type="button" disabled={!checkedResult} onClick={returnToInputs}>입력으로 돌아가기</DetailSecondaryButton>
        </> : success ? <Actions><DetailActionLink to={performancePath}>캠페인·성과 확인</DetailActionLink><ExternalLink href="https://adsmanager.facebook.com/" target="_blank" rel="noopener noreferrer">Meta 광고 관리자 열기 ↗</ExternalLink><DetailSecondaryButton type="button" onClick={() => { setSuccess(false); setReview(null); setChanges(emptyChanges()) }}>다른 항목 수정</DetailSecondaryButton></Actions> : <>
          {busy ? <DetailStatus role="status">변경 요청을 처리하는 중…</DetailStatus> : null}
          <Actions><DetailSecondaryButton type="button" disabled={busy} onClick={returnToInputs}>입력 수정</DetailSecondaryButton><DetailPrimaryButton type="button" disabled={busy || Boolean(failure)} onClick={() => void applyChanges()}>{busy ? '적용 중…' : review.patch.status === 'ACTIVE' ? '활성 상태로 변경' : '변경 적용'}</DetailPrimaryButton></Actions>
        </>}
      </StackBody></DetailPanel>
    </> : <Form onSubmit={prepare} noValidate>
      <DetailPanel><PanelHeading><h2>수정 대상</h2><DetailBadge>한 번에 한 대상</DetailBadge></PanelHeading><StackBody>
        <Field htmlFor="ad-edit-account">광고 계정<select id="ad-edit-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setObjectId(''); setChanges(emptyChanges()); setErrors({}) }} aria-invalid={Boolean(errors.account)} aria-describedby={errors.account ? 'ad-edit-account-error' : undefined}>
          <option value="">광고 계정을 선택해 주세요</option>{accountId && !selected ? <option value={accountId} disabled>저장되지 않은 광고 계정입니다</option> : null}
          {accounts.map((account) => <option key={account.assetId} value={account.assetId}>{account.name} · {account.connectionName} · {account.externalId}</option>)}
        </select></Field>
        <ErrorText id="account" message={errors.account} />
        {selected?.requiresReauth ? <DetailAlert role="alert">Meta 계정 재인증이 필요합니다. <Link to={assetsPath}>자산 편집·재인증</Link></DetailAlert> : null}
        <FieldGrid>
          <div><Field htmlFor="ad-edit-type">대상 유형<select id="ad-edit-type" value={objectType} onChange={(event) => { setObjectType(event.target.value); setObjectId(''); setChanges(emptyChanges()); setErrors({}) }} aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? 'ad-edit-type-error' : undefined}>
            {!isObjectType(objectType) ? <option value={objectType} disabled>지원하지 않는 대상 유형</option> : null}<option value="ad">광고</option><option value="ad-set">광고세트</option><option value="campaign">캠페인</option>
          </select></Field><ErrorText id="type" message={errors.type} /></div>
          <div><Field htmlFor="ad-edit-objectId">Meta {typeLabel} ID<input id="ad-edit-objectId" value={objectId} inputMode="numeric" maxLength={32} placeholder="Meta에 표시된 숫자 ID" onChange={(event) => { setObjectId(event.target.value); setErrors({}) }} aria-invalid={Boolean(errors.objectId)} aria-describedby="ad-edit-objectId-hint ad-edit-objectId-error" /></Field><ErrorText id="objectId" message={errors.objectId} /></div>
        </FieldGrid>
        <DetailHint id="ad-edit-objectId-hint">광고 등록 결과 또는 Meta 광고 관리자에 표시된 ID를 입력하세요. 성과 표의 캠페인 수정 버튼을 사용하면 대상이 자동으로 선택됩니다.</DetailHint>
      </StackBody></DetailPanel>
      <DetailPanel><PanelHeading><h2>변경할 항목</h2><DetailHint>선택한 항목만 적용합니다.</DetailHint></PanelHeading><StackBody>
        <ChangeFields id="ad-edit-changes" tabIndex={-1} aria-describedby={errors.changes ? 'ad-edit-changes-error' : undefined}>
          <ChangeRow><CheckLabel><input type="checkbox" checked={changes.changeName} onChange={(event) => changeFields({ changeName: event.target.checked })} />이름 변경</CheckLabel>{changes.changeName ? <><Field htmlFor="ad-edit-name">새 이름<input id="ad-edit-name" value={changes.name} maxLength={255} onChange={(event) => changeFields({ name: event.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'ad-edit-name-error' : undefined} /></Field><ErrorText id="name" message={errors.name} /></> : null}</ChangeRow>
          <ChangeRow><CheckLabel><input type="checkbox" checked={changes.changeStatus} onChange={(event) => changeFields({ changeStatus: event.target.checked })} />상태 변경</CheckLabel>{changes.changeStatus ? <><Field htmlFor="ad-edit-status">새 상태<select id="ad-edit-status" value={changes.status} onChange={(event) => changeFields({ status: event.target.value as Changes['status'] })} aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? 'ad-edit-status-error' : undefined}><option value="">상태를 선택해 주세요</option><option value="ACTIVE">활성 (ACTIVE)</option><option value="PAUSED">일시정지 (PAUSED)</option></select></Field><ErrorText id="status" message={errors.status} />{isObjectType(objectType) && changes.status ? <ScopeNote type={objectType} activate={changes.status === 'ACTIVE'} /> : null}</> : null}</ChangeRow>
          {objectType !== 'ad' && isObjectType(objectType) ? <ChangeRow><CheckLabel><input type="checkbox" checked={changes.changeBudget} onChange={(event) => changeFields({ changeBudget: event.target.checked })} />일 예산 변경</CheckLabel>{changes.changeBudget ? <><Field htmlFor="ad-edit-budget">새 일 예산<input id="ad-edit-budget" value={changes.budget} inputMode="numeric" maxLength={19} placeholder="양의 정수" onChange={(event) => changeFields({ budget: event.target.value })} aria-invalid={Boolean(errors.budget)} aria-describedby="ad-edit-budget-hint ad-edit-budget-error" /></Field><ErrorText id="budget" message={errors.budget} /><DetailHint id="ad-edit-budget-hint">광고 계정 통화의 Meta 금액 단위 그대로 입력하세요. 통화 변환은 하지 않습니다.</DetailHint><BudgetNote type={objectType} /></> : null}</ChangeRow> : null}
        </ChangeFields>
        <ErrorText id="changes" message={errors.changes} />
      </StackBody></DetailPanel>
      <SubmitBar><DetailHint>다음 화면에서 대상과 변경 내용을 확인합니다.</DetailHint><DetailPrimaryButton type="submit" disabled={!selected || selected.requiresReauth}>변경 내용 확인</DetailPrimaryButton></SubmitBar>
    </Form>}
  </DetailPage>
}

function ScopeNote({ type, activate }: { type: MetaAdObjectType; activate: boolean }) {
  return <DetailHint>{activate ? '활성화 후 심사·게재 조건을 충족하면 광고비가 발생할 수 있습니다. ' : ''}{type === 'ad' ? '광고의 상태만 변경합니다. 상위 광고세트·캠페인이 일시정지 상태이면 광고를 활성화해도 게재되지 않습니다.' : type === 'ad-set' ? '이 광고세트 아래의 다른 광고에도 영향을 줍니다. 캠페인이 일시정지 상태이면 게재되지 않습니다.' : '이 캠페인 아래의 광고세트·광고에도 영향을 줍니다.'} 하위·상위 대상의 상태를 자동으로 함께 변경하지 않습니다.</DetailHint>
}

function BudgetNote({ type }: { type: MetaAdObjectType }) {
  return <DetailHint>{type === 'ad-set' ? '같은 광고세트의 광고들이 예산을 공유합니다. 캠페인이 예산을 관리하면 광고세트 예산 변경은 거부됩니다.' : '이미 캠페인에서 일 예산을 관리하는 경우에만 변경할 수 있습니다.'} 기존 일 예산 금액만 변경할 수 있으며 총 예산을 일 예산으로 바꾸거나 예산 관리 단계를 전환하지 않습니다.</DetailHint>
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? <FieldError id={`ad-edit-${id}-error`} role="alert">{message}</FieldError> : null
}

const Form = styled.form`display:grid;gap:1.5rem;min-width:0;`
const StackBody = styled(DetailPanelBody)`display:grid;gap:1rem;min-width:0;`
const Field = styled.label`display:grid;gap:.6rem;font-size:.8125rem;font-weight:600;min-width:0;input,select{width:100%;min-width:0;font-size:.8125rem;}`
const FieldGrid = styled.div`display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:1rem;@media(max-width:600px){grid-template-columns:minmax(0,1fr);}`
const ChangeFields = styled.div`display:grid;gap:1rem;min-width:0;`
const ChangeRow = styled.div`display:grid;gap:.8rem;padding:1rem;border:1px solid ${({ theme }) => theme.colors.border};border-radius:.625rem;min-width:0;`
const CheckLabel = styled.label`display:flex;align-items:center;gap:.625rem;font-size:.8125rem;font-weight:600;line-height:1.7;input{width:1rem;height:1rem;min-height:0;flex-shrink:0;}`
const FieldError = styled.p`color:#b33434;font-size:.8125rem;line-height:1.7;`
const Actions = styled.div`display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;`
const BackLink = styled(Link)`display:inline-flex;align-items:center;justify-content:center;min-height:2.625rem;padding:.625rem .875rem;border:1px solid ${({ theme }) => theme.colors.border};border-radius:.5rem;background:white;color:${({ theme }) => theme.colors.textSecondary};font-size:.8125rem;font-weight:600;text-decoration:none;`
const ExternalLink = styled.a`font-size:.8125rem;line-height:1.75;overflow-wrap:anywhere;`
const SubmitBar = styled.div`display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap;`
const ReviewList = styled.dl`display:grid;gap:0;min-width:0;margin:0;>div{display:grid;grid-template-columns:9rem minmax(0,1fr);gap:.75rem;padding:.875rem 0;border-bottom:1px solid ${({ theme }) => theme.colors.border};}dt{color:${({ theme }) => theme.colors.textMuted};font-size:.75rem;}dd{margin:0;font-size:.8125rem;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;}small{display:block;color:${({ theme }) => theme.colors.textMuted};}@media(max-width:600px){>div{grid-template-columns:minmax(0,1fr);gap:.25rem;}}`
