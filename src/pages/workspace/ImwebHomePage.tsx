import { useCallback } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { listImwebStores } from '../../api/imweb'
import { useImwebResource } from '../../hooks/useImwebResource'
import { readSupportSession } from '../../support/session'
import { DetailActionLink, DetailAlert, DetailPage, DetailPanel, DetailPanelBody, DetailSecondaryButton, DetailStatus } from './WorkspaceDetailUI'

export default function ImwebHomePage() {
  const { workspaceId } = useParams()
  if (readSupportSession()) return <DetailAlert role="alert">아임웹 연결은 일반 사용자 계정에서 이용해 주세요.</DetailAlert>
  return <Home key={workspaceId} workspaceId={Number(workspaceId)} />
}
function Home({ workspaceId }: { workspaceId: number }) {
  const location = useLocation()
  const selecting = new URLSearchParams(location.search).has('connectionId')
  const assets = `/workspaces/${workspaceId}/connections/imweb/assets`
  const load = useCallback((signal: AbortSignal) => listImwebStores(workspaceId, signal), [workspaceId])
  const state = useImwebResource(selecting ? null : String(workspaceId), load)
  if (selecting) return <Navigate to={`${assets}${location.search}`} replace />
  if (state.data) return <Navigate to={state.data.length ? `/workspaces/${workspaceId}/imweb/performance${location.search}` : assets} replace />
  return <DetailPage><DetailPanel>{state.error ? <DetailPanelBody style={{ display: 'grid', gap: 16 }}><DetailAlert role="alert">{state.error}</DetailAlert><DetailSecondaryButton onClick={state.reload}>다시 조회</DetailSecondaryButton><DetailActionLink to={assets}>자산 편집</DetailActionLink></DetailPanelBody> : <DetailStatus role="status">저장된 아임웹 스토어 확인 중…</DetailStatus>}</DetailPanel></DetailPage>
}
