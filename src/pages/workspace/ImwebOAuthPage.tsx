import { useCallback, useState } from 'react'
import { useErrorModal } from '../../components/common/useErrorModal'
import { useSearchParams } from 'react-router-dom'
import { listPlatformConnections } from '../../api/platformConnections'
import { getMe } from '../../api/users'
import { listMyWorkspaces } from '../../api/workspaces'
import { useImwebResource } from '../../hooks/useImwebResource'
import { readSupportSession } from '../../support/session'
import { ImwebAuthorizationForm } from './ImwebConnectionUI'
import { Actions, Field, Label, Select, StackBody } from './NaverProductFormUI'
import { DetailActionLink, DetailAlert, DetailEyebrow, DetailHeader, DetailHint, DetailLead, DetailPage, DetailPanel, DetailSecondaryButton, DetailStatus, DetailTitle } from './WorkspaceDetailUI'

export default function ImwebOAuthPage({ entry = false }: { entry?: boolean }) {
  if (readSupportSession()) return <DetailAlert role="alert">아임웹 연결은 일반 사용자 계정에서 이용해 주세요.</DetailAlert>
  return entry ? <Entry /> : <Callback />
}
function Entry() {
  const [params] = useSearchParams()
  const siteCode = params.get('siteCode') || ''
  const createState = /^S[A-Za-z0-9]{5,99}$/.test(siteCode) ? { imwebSiteCode: siteCode } : undefined
  const [selection, setSelection] = useState('')
  const load = useCallback(async () => { const [workspaces, user] = await Promise.all([listMyWorkspaces(), getMe()]); return workspaces.filter(item => item.userId === user.id) }, [])
  const state = useImwebResource('owned-workspaces', load)
  const selected = state.data?.find(item => String(item.id) === selection) || (state.data?.length === 1 ? state.data[0] : null)
  return <DetailPage style={{ maxWidth: 800 }}><DetailHeader><div><DetailEyebrow>아임웹 앱 연결</DetailEyebrow><DetailTitle>연결할 워크스페이스 선택</DetailTitle><DetailLead>소유한 워크스페이스를 선택하고 아임웹 인증을 계속하세요.</DetailLead></div></DetailHeader><DetailPanel><StackBody>
    {state.loading ? <DetailStatus role="status">워크스페이스 조회 중…</DetailStatus> : state.error ? <><DetailAlert role="alert">{state.error}</DetailAlert><Actions><DetailSecondaryButton onClick={state.reload}>다시 조회</DetailSecondaryButton></Actions></> : !state.data?.length ? <><DetailHint>소유한 워크스페이스가 없습니다. 먼저 워크스페이스를 만들어 주세요.</DetailHint><DetailActionLink to="/workspaces/new" state={createState}>워크스페이스 만들기</DetailActionLink></> : <Field><Label htmlFor="imweb-workspace">워크스페이스</Label><Select id="imweb-workspace" value={selected?.id ?? ''} onChange={event => setSelection(event.target.value)}><option value="">워크스페이스 선택</option>{state.data.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>}
  </StackBody></DetailPanel>{selected && <ImwebAuthorizationForm key={`${selected.id}:${siteCode}`} workspaceId={selected.id} initialSiteCode={siteCode} />}<DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink></DetailPage>
}
function Callback() {
  const [params] = useSearchParams()
  const workspaceId = Number(params.get('workspace_id'))
  const connectionId = Number(params.get('connection_id'))
  const valid = [workspaceId, connectionId].every(value => Number.isSafeInteger(value) && value > 0)
  const requestedSuccess = params.get('status') === 'success' && valid
  useErrorModal(requestedSuccess ? '' : '아임웹 인증이 취소되었거나 연결을 완료하지 못했습니다. 연결 화면에서 다시 시작해 주세요.', '아임웹 연결 실패')
  const load = useCallback(async () => {
    const connections = await listPlatformConnections(workspaceId)
    const saved = connections.find(item => item.id === connectionId && item.providerType === 'IMWEB' && !item.requiresReauth)
    if (!saved) throw new Error('저장된 아임웹 연결을 확인하지 못했습니다. 연결 화면에서 현재 상태를 조회해 주세요.')
    return saved
  }, [workspaceId, connectionId])
  const state = useImwebResource(requestedSuccess ? `${workspaceId}:${connectionId}` : null, load)
  return <DetailPage style={{ maxWidth: 800 }}><DetailHeader><div><DetailEyebrow>아임웹 연결</DetailEyebrow><DetailTitle>{state.data ? '아임웹 연결 완료' : requestedSuccess ? '연결 상태 확인' : '연결을 완료하지 못했어요'}</DetailTitle></div></DetailHeader><DetailPanel><StackBody>
    {state.loading ? <DetailStatus role="status">저장된 연결 확인 중…</DetailStatus> : state.data ? <><DetailAlert $success role="status">{state.data.accountName || '아임웹 사이트'} 연결을 저장했습니다. 사용할 스토어를 선택해 주세요.</DetailAlert><DetailActionLink to={`/workspaces/${workspaceId}/connections/imweb/assets?connectionId=${connectionId}`}>스토어 선택</DetailActionLink></> : <><DetailAlert role="alert">{state.error || '아임웹 인증이 취소되었거나 연결을 완료하지 못했습니다. 사이트 권한을 확인하고 연결 화면에서 다시 시작해 주세요.'}</DetailAlert>{requestedSuccess && <Actions><DetailSecondaryButton onClick={state.reload}>저장된 연결 다시 조회</DetailSecondaryButton></Actions>}<DetailActionLink to={Number.isSafeInteger(workspaceId) && workspaceId > 0 ? `/workspaces/${workspaceId}/connections/imweb/assets` : '/workspaces'}>연결 화면으로 돌아가기</DetailActionLink></>}
  </StackBody></DetailPanel></DetailPage>
}
