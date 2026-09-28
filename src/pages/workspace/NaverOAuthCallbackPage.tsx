import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ApiError } from '../../api/http'
import { getMyWorkspace, listMyWorkspaces } from '../../api/workspaces'
import { getMe } from '../../api/users'
import { validNaverAttemptId } from '../../api/naverAuthorizations'
import { useNaverAuthorization } from '../../hooks/useNaverAuthorization'
import { useNaverAuthorizationEntry } from '../../hooks/useNaverAuthorizationEntry'
import type { WorkspaceResponse } from '../../types/workspace'
import type { NaverAuthorization } from '../../types/naverAuthorization'
import { NAVER_WINDOW_MESSAGE, naverAuthorizationPath } from './naverAuthorizationWindow'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint,
  DetailLead, DetailPage, DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton,
  DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

const LABELS: Record<NaverAuthorization['status'], string> = {
  WAITING_AUTH: '네이버 인증 대기', VALIDATING: '판매자 정보 확인 중', REVIEW_REQUIRED: '연결 정보 확인',
  APPROVING: '구독 승인 처리 중', RECONCILING: '승인 결과 확인 중', VERIFYING_CONNECTION: '스마트스토어 연결 중',
  CONNECTED: '스마트스토어 연결 완료', FAILED: '연결을 완료하지 못했어요', CANCELLED: '연결 요청 취소됨', EXPIRED: '인증 시간이 만료되었어요',
}
export default function NaverOAuthCallbackPage() {
  const [params] = useSearchParams()
  const attemptId = params.get('attempt_id')
  const receipt = params.get('marketplace_receipt')
  if (validNaverAttemptId(attemptId)) return <AuthorizationResult key={attemptId} attemptId={attemptId} />
  if (receipt && /^[A-Za-z0-9_-]{16,128}$/.test(receipt)) return <MarketplaceWorkspacePicker receipt={receipt} />
  return <CallbackPage><DetailPanel><DetailEmpty><DetailTitle>연결 요청을 확인할 수 없어요</DetailTitle><p>네이버 연결 화면에서 인증을 다시 시작해 주세요.</p><DetailActionLink to="/workspaces">워크스페이스로 이동</DetailActionLink></DetailEmpty></DetailPanel></CallbackPage>
}

function AuthorizationResult({ attemptId }: { attemptId: string }) {
  const flow = useNaverAuthorization(attemptId)
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null)
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const workspaceId = flow.state?.workspaceId
  useEffect(() => {
    if (!workspaceId) return
    let active = true
    void getMyWorkspace(workspaceId).then((value) => {
      if (active && value.id === workspaceId) { setWorkspace(value); setWorkspaceError('') }
    }).catch((caught) => { if (active) setWorkspaceError(caught instanceof ApiError ? caught.message : '워크스페이스를 확인하지 못했습니다.') })
    return () => { active = false }
  }, [workspaceId, workspaceVersion])
  useEffect(() => {
    // A message only asks the original window to read its authenticated state.
    // Never pass provider proofs, connection data or a success assertion.
    if (window.opener) window.opener.postMessage({ type: NAVER_WINDOW_MESSAGE, attemptId }, window.location.origin)
  }, [attemptId])
  const state = flow.state
  const workspaceName = workspace && workspace.id === workspaceId ? workspace.name : null
  const returnPath = workspaceId ? `/workspaces/${workspaceId}/connections/naver/assets` : '/workspaces'
  const preApproval = state && ['WAITING_AUTH', 'VALIDATING', 'REVIEW_REQUIRED'].includes(state.status)
  return (
    <CallbackPage>
      <DetailHeader><div><DetailEyebrow>플랫폼 연결 / Naver</DetailEyebrow><DetailTitle>{state ? LABELS[state.status] : '네이버 연결 확인'}</DetailTitle><DetailLead>{workspaceName ? `${workspaceName} 워크스페이스` : '연결 요청과 판매자 정보를 확인합니다.'}</DetailLead></div>{state && <DetailBadge $tone={state.status === 'CONNECTED' ? 'success' : 'primary'}>{LABELS[state.status]}</DetailBadge>}</DetailHeader>
      {flow.error && <DetailAlert role="alert">{flow.error}</DetailAlert>}
      {flow.authRequired ? <DetailPanel><DetailEmpty><h2>다시 로그인해 주세요</h2><p>인증을 시작한 계정으로 로그인하면 진행 중인 연결을 확인할 수 있습니다.</p><DetailActionLink to="/login" state={{ from: naverAuthorizationPath(attemptId) }}>로그인하고 연결 이어가기</DetailActionLink></DetailEmpty></DetailPanel> : <>
        {flow.loading && !state && <DetailStatus role="status">연결 상태를 확인하는 중…</DetailStatus>}
        {!state && !flow.loading && <DetailSecondaryButton onClick={() => void flow.reload()}>연결 상태 다시 조회</DetailSecondaryButton>}
        {state && <DetailPanel>
          <PanelHeading><div><h2>{LABELS[state.status]}</h2><p>네이버 계정 연결을 진행하고 있습니다.</p></div></PanelHeading>
          <Content>
            {state.status === 'WAITING_AUTH' && <><DetailHint>열린 네이버 창에서 솔루션 신청과 판매자 인증을 진행해 주세요. 인증 후 연결할 스토어와 워크스페이스를 확인합니다.</DetailHint>{flow.popupClosed && <DetailHint>인증 창이 닫혔습니다. 현재 상태를 조회하거나 인증 창을 다시 열 수 있습니다.</DetailHint>}<DetailSecondaryButton disabled={flow.busy} onClick={() => void flow.reopen()}>네이버 인증 창 다시 열기</DetailSecondaryButton></>}
            {state.status === 'VALIDATING' && <DetailStatus role="status">네이버에서 받은 판매자 정보를 확인하고 있습니다.</DetailStatus>}
            {state.status === 'REVIEW_REQUIRED' && <>
              {workspaceError && <><DetailAlert role="alert">{workspaceError}</DetailAlert><DetailSecondaryButton onClick={() => setWorkspaceVersion((value) => value + 1)}>워크스페이스 다시 조회</DetailSecondaryButton></>}
              <ConnectionReview key={`${state.attemptId}:${state.reviewRevision}`} state={state} workspaceName={workspaceName} disabled={flow.busy || flow.unknown || !workspaceName} onConfirm={flow.complete} />
            </>}
            {['APPROVING', 'RECONCILING', 'VERIFYING_CONNECTION'].includes(state.status) && <><DetailStatus role="status">{state.status === 'RECONCILING' ? '구독 승인 결과를 확인하고 있습니다. 잠시 후 상태를 다시 조회해 주세요.' : '연결을 처리하고 있습니다. 페이지를 새로 열어도 이 요청의 상태를 확인할 수 있습니다.'}</DetailStatus><DetailHint>결과가 확인될 때까지 새로운 연결 요청을 만들지 않아도 됩니다.</DetailHint></>}
            {state.status === 'CONNECTED' && <><DetailAlert $success role="status">스마트스토어 연결을 저장했습니다. 사용할 채널을 선택해 주세요.</DetailAlert><DetailActionLink to={`${returnPath}?connectionId=${state.connectionId}`}>스마트스토어 채널 선택</DetailActionLink></>}
            {['FAILED', 'CANCELLED', 'EXPIRED'].includes(state.status) && <><DetailHint>{state.errorMessage || (state.status === 'CANCELLED' ? '연결 요청을 취소했습니다.' : state.status === 'EXPIRED' ? '인증 기한이 지나 연결할 수 없습니다. 네이버 연결 화면에서 다시 시작해 주세요.' : '판매자 신청 상태와 권한을 확인하고 다시 연결해 주세요.')}</DetailHint><DetailActionLink to={returnPath}>네이버 연결 화면으로</DetailActionLink></>}
            {flow.unknown && <DetailAlert role="status">요청 결과가 아직 확인되지 않았습니다. 연결을 다시 확정하기 전에 현재 상태를 조회해 주세요.</DetailAlert>}
            {flow.paused && <DetailHint>자동 상태 확인을 멈췄습니다. 아래 버튼으로 최신 상태를 확인할 수 있습니다.</DetailHint>}
            {state.status !== 'CONNECTED' && <Actions><DetailSecondaryButton disabled={flow.busy} onClick={() => void flow.reload()}>{flow.loading ? '상태 확인 중…' : '현재 상태 조회'}</DetailSecondaryButton>{preApproval && <DetailSecondaryButton disabled={flow.busy || flow.unknown} onClick={() => void flow.cancel()}>연결 요청 취소</DetailSecondaryButton>}</Actions>}
          </Content>
        </DetailPanel>}
      </>}
      {!flow.busy && <BackLink to={returnPath}>{workspaceId ? '네이버 연결로 돌아가기' : '워크스페이스 목록'}</BackLink>}
    </CallbackPage>
  )
}

function ConnectionReview({ state, workspaceName, disabled, onConfirm }: {
  state: NaverAuthorization; workspaceName: string | null; disabled: boolean; onConfirm: () => Promise<void>
}) {
  const [confirmed, setConfirmed] = useState(false)
  const url = safeStoreUrl(state.seller?.storeUrl)
  return <>
    <Summary>
      <div><dt>워크스페이스</dt><dd>{workspaceName || '워크스페이스 확인 중…'}</dd></div>
      <div><dt>스마트스토어</dt><dd>{state.seller?.name}</dd></div>
      {url && <div><dt>스토어 주소</dt><dd><a href={url} target="_blank" rel="noopener noreferrer">{url} ↗</a></dd></div>}
      <div><dt>신청 요금제</dt><dd>{state.subscription?.planName || '네이버 신청 내역에서 확인'}</dd></div>
      <div><dt>구독 승인</dt><dd>{state.subscription?.requiresApproval ? '연결 확정 시 사용 시작 승인' : '현재 구독 상태를 확인하여 연결'}</dd></div>
    </Summary>
    <DetailHint>{state.subscription?.billingDescription || '요금과 결제 조건은 네이버에서 신청한 내역을 확인해 주세요. 금액이 표시되지 않아도 무료를 의미하지 않습니다.'}</DetailHint>
    <Consent><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={disabled} /><span>스토어, 워크스페이스와 구독 요금제·결제 조건을 확인했습니다.</span></Consent>
    <DetailPrimaryButton disabled={disabled || !confirmed} onClick={() => void onConfirm()}>이 워크스페이스에 연결</DetailPrimaryButton>
  </>
}

function MarketplaceWorkspacePicker({ receipt }: { receipt: string }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[] | null>(null)
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    void Promise.all([listMyWorkspaces(), getMe()]).then(([items, user]) => {
      if (active) { setWorkspaces(items.filter((item) => item.userId === user.id)); setError('') }
    }).catch((caught) => { if (active) setError(caught instanceof ApiError ? caught.message : '워크스페이스를 조회하지 못했습니다.') })
    return () => { active = false }
  }, [version])
  return <CallbackPage><DetailHeader><div><DetailEyebrow>네이버에서 시작한 연결</DetailEyebrow><DetailTitle>연결할 워크스페이스 선택</DetailTitle><DetailLead>소유한 워크스페이스를 선택하고 판매자 인증을 이어가세요.</DetailLead></div></DetailHeader><DetailPanel><Content>
    {error && <><DetailAlert role="alert">{error}</DetailAlert><DetailSecondaryButton onClick={() => setVersion((value) => value + 1)}>다시 조회</DetailSecondaryButton></>}
    {!workspaces && !error && <DetailStatus>워크스페이스 조회 중…</DetailStatus>}
    {workspaces?.length === 0 && <><DetailHint>소유한 워크스페이스가 없습니다. 워크스페이스를 만든 뒤 이 화면으로 돌아와 주세요.</DetailHint><DetailActionLink to="/workspaces/new">워크스페이스 만들기</DetailActionLink></>}
    {Boolean(workspaces?.length) && <><label htmlFor="naver-market-workspace">워크스페이스</label><WorkspaceSelect id="naver-market-workspace" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">워크스페이스 선택</option>{workspaces!.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</WorkspaceSelect>{selected && <MarketplaceStart key={selected} workspaceId={Number(selected)} receipt={receipt} />}</>}
    <BackLink to="/workspaces">워크스페이스 목록</BackLink>
  </Content></DetailPanel></CallbackPage>
}
function MarketplaceStart({ workspaceId, receipt }: { workspaceId: number; receipt: string }) {
  const flow = useNaverAuthorizationEntry(workspaceId, true)
  return <>
    {flow.loading && <DetailStatus>연결 가능 여부 확인 중…</DetailStatus>}
    {flow.error && <><DetailAlert role="alert">{flow.error}</DetailAlert><DetailSecondaryButton onClick={flow.reload}>다시 확인</DetailSecondaryButton></>}
    {flow.startError && <DetailAlert role="alert">{flow.startError}</DetailAlert>}
    {flow.capabilities?.ready ? <DetailPrimaryButton disabled={flow.starting} onClick={() => void flow.start(undefined, receipt)}>{flow.starting ? '인증 창 준비 중…' : '네이버 판매자 인증 계속하기'}</DetailPrimaryButton> : flow.capabilities && <DetailHint>네이버 간편 연결을 준비 중입니다. 연결 화면에서 애플리케이션 정보로 연결할 수 있습니다.</DetailHint>}
    <BackLink to={`/workspaces/${workspaceId}/connections/naver`}>네이버 연결 화면</BackLink>
  </>
}
function safeStoreUrl(value?: string | null): string | null {
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
const CallbackPage = styled(DetailPage)`max-width: 48rem; padding-block: 1rem;`
const Content = styled(DetailPanelBody)`display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; > p { width: 100%; }`
const Summary = styled.dl`width: 100%; margin: 0; display: flex; flex-direction: column; gap: 1rem; div { display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: 1rem; } dt { color: ${({ theme }) => theme.colors.textMuted}; font-size: .8125rem; } dd { margin: 0; font-size: .875rem; overflow-wrap: anywhere; } @media (max-width: 480px) { div { grid-template-columns: 1fr; gap: .375rem; } }`
const Consent = styled.label`display: flex; gap: .625rem; align-items: flex-start; font-size: .8125rem; line-height: 1.7; input { margin-top: .25rem; flex-shrink: 0; }`
const Actions = styled.div`display: flex; flex-wrap: wrap; gap: .625rem; width: 100%;`
const BackLink = styled(Link)`font-size: .8125rem; text-underline-offset: 3px;`
const WorkspaceSelect = styled.select`width: 100%; padding: .75rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: .5rem; background: white; color: ${({ theme }) => theme.colors.text};`
