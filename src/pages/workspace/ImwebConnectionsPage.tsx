import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getMe } from '../../api/users'
import { getMyWorkspace } from '../../api/workspaces'
import { listPlatformConnections } from '../../api/platformConnections'
import { getImwebUnits, ImwebWriteError, saveImwebUnits } from '../../api/imweb'
import { useImwebResource } from '../../hooks/useImwebResource'
import { useModal } from '../../components/common/useModal'
import { readSupportSession } from '../../support/session'
import type { PlatformConnectionResponse } from '../../types/platform'
import type { ImwebUnit } from '../../types/imweb'
import { ImwebAuthorizationForm } from './ImwebConnectionUI'
import { Actions, CheckLabel, ExternalLink, StackBody } from './NaverProductFormUI'
import { DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead, DetailPage, DetailPanel, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading } from './WorkspaceDetailUI'

export default function ImwebConnectionsPage() {
  const { workspaceId } = useParams()
  if (readSupportSession()) return <DetailAlert role="alert">아임웹 연결은 일반 사용자 계정에서 이용해 주세요.</DetailAlert>
  return <Connections key={workspaceId} workspaceId={Number(workspaceId)} />
}
function Connections({ workspaceId }: { workspaceId: number }) {
  const [params] = useSearchParams()
  const load = useCallback(async () => { const [user, workspace, connections] = await Promise.all([getMe(), getMyWorkspace(workspaceId), listPlatformConnections(workspaceId)]); return { owner: user.id === workspace.userId, connections: connections.filter(item => item.providerType === 'IMWEB') } }, [workspaceId])
  const state = useImwebResource(String(workspaceId), load)
  return <DetailPage>
    <DetailHeader><div><DetailEyebrow>아임웹 / 자산 편집</DetailEyebrow><DetailTitle>아임웹 연결 및 스토어 선택</DetailTitle><DetailLead>연결한 사이트에서 사용할 스토어를 저장하면 상품과 판매 성과가 표시됩니다.</DetailLead></div><DetailActionLink to={`/workspaces/${workspaceId}/imweb/performance`}>상품 및 판매 성과</DetailActionLink></DetailHeader>
    {state.loading ? <DetailStatus role="status">연결 정보 조회 중…</DetailStatus> : state.error ? <><DetailAlert role="alert">{state.error}</DetailAlert><Actions><DetailSecondaryButton onClick={state.reload}>다시 조회</DetailSecondaryButton></Actions></> : state.data && <>
      <ImwebAuthorizationForm key={params.get('siteCode') || ''} workspaceId={workspaceId} owner={state.data.owner} initialSiteCode={params.get('siteCode') || ''} />
      {state.data.connections.length === 0 ? <DetailPanel><DetailEmpty><h2>아직 연결한 사이트가 없습니다</h2><p>아임웹 사이트를 연결한 뒤 사용할 스토어를 선택해 주세요.</p></DetailEmpty></DetailPanel> : state.data.connections.map(connection => <Connection key={connection.id} workspaceId={workspaceId} connection={connection} owner={Boolean(state.data?.owner)} />)}
    </>}
  </DetailPage>
}
function Connection({ workspaceId, connection, owner }: { workspaceId: number; connection: PlatformConnectionResponse; owner: boolean }) {
  const load = useCallback((signal: AbortSignal) => getImwebUnits(workspaceId, connection.id, signal), [workspaceId, connection.id])
  const state = useImwebResource(connection.requiresReauth ? null : String(connection.id), load)
  if (connection.requiresReauth) return <ImwebAuthorizationForm workspaceId={workspaceId} owner={owner} initialSiteCode={connection.externalAccountId} siteName={connection.accountName || '아임웹 사이트'} reconnect />
  return <DetailPanel><PanelHeading><div><h2>{connection.accountName || '아임웹 사이트'}</h2><p>아임웹에서 인증한 사이트입니다.</p></div><DetailBadge $tone="success">연결됨</DetailBadge></PanelHeading><StackBody>
    {state.loading ? <DetailStatus role="status">사용 가능한 스토어 조회 중…</DetailStatus> : state.error ? <><DetailAlert role="alert">{state.error}</DetailAlert><Actions><DetailSecondaryButton onClick={state.reload}>스토어 다시 조회</DetailSecondaryButton></Actions></> : state.data && <UnitSelection key={JSON.stringify(state.data)} units={state.data} workspaceId={workspaceId} connectionId={connection.id} reload={state.reload} />}
  </StackBody></DetailPanel>
}
function UnitSelection({ units, workspaceId, connectionId, reload }: { units: ImwebUnit[]; workspaceId: number; connectionId: number; reload: () => void }) {
  const modal = useModal()
  const [selected, setSelected] = useState(() => units.filter(unit => unit.selected).map(unit => unit.unitCode))
  const saved = units.filter(unit => unit.selected)
  const available = units.filter(unit => !unit.selected)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unknown, setUnknown] = useState(false)
  const pending = useRef(false)
  const saveButton = useRef<HTMLButtonElement>(null)
  const reloadButton = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  async function save() {
    if (pending.current || !selected.length || selected.length > 100 || unknown) return
    pending.current = true; setBusy(true); setError('')
    try {
      const stores = await saveImwebUnits(workspaceId, connectionId, selected)
      navigate(`/workspaces/${workspaceId}/imweb/performance${stores[0] ? `?assetId=${stores[0].assetId}` : ''}`, { state: { imwebUnitsSaved: true } })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '선택한 스토어를 저장하지 못했습니다.'
      const uncertain = caught instanceof ImwebWriteError && caught.outcomeUnknown
      setError(message); setUnknown(uncertain)
      void modal.error({ title: uncertain ? '스토어 저장 결과 확인 필요' : '스토어 저장 실패', message, returnFocus: uncertain ? reloadButton.current : saveButton.current })
    }
    finally { pending.current = false; setBusy(false) }
  }
  if (!units.length) return <DetailHint>연결된 사이트에 선택할 수 있는 스토어가 없습니다.</DetailHint>
  return <>
    <DetailHint>이미 저장한 스토어는 유지됩니다. 사용할 스토어를 추가로 선택해 주세요.</DetailHint>
    <Actions><DetailSecondaryButton disabled={busy || unknown || !available.length} onClick={() => setSelected([...saved, ...available.slice(0, Math.max(0, 100 - saved.length))].map(item => item.unitCode))}>{units.length > 100 ? '최대 100개 선택' : '전체 선택'}</DetailSecondaryButton><DetailSecondaryButton disabled={busy || unknown || selected.length === saved.length} onClick={() => setSelected(saved.map(unit => unit.unitCode))}>추가 선택 해제</DetailSecondaryButton><DetailHint>저장됨 {saved.length}개 · 추가 선택 {selected.length - saved.length}개 / 총 최대 100개</DetailHint></Actions>
    <div style={{ display: 'grid', gap: 14 }}>{units.map(unit => <div key={unit.unitCode} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><CheckLabel><input type="checkbox" disabled={unit.selected || busy || unknown || (selected.length >= 100 && !selected.includes(unit.unitCode))} checked={unit.selected || selected.includes(unit.unitCode)} onChange={event => setSelected(current => event.target.checked ? current.length < 100 ? [...current, unit.unitCode] : current : current.filter(code => code !== unit.unitCode))} /><span><strong>{unit.name}</strong><DetailHint as="span"> · {unit.currency} · {unit.unitCode}{unit.selected ? ' · 저장됨' : ''}</DetailHint></span></CheckLabel>{safeUrl(unit.storeUrl) && <ExternalLink href={safeUrl(unit.storeUrl)!} target="_blank" rel="noopener noreferrer">스토어 보기 ↗</ExternalLink>}</div>)}</div>
    {error && <DetailAlert role="alert">{error}</DetailAlert>}{unknown && <DetailHint>저장이 완료되었을 수 있습니다. 목록을 다시 조회하여 현재 선택 상태를 확인해 주세요.</DetailHint>}
    <Actions><DetailPrimaryButton ref={saveButton} disabled={busy || unknown || !selected.length || selected.length > 100} onClick={() => void save()}>{busy ? '저장 중…' : '저장하고 성과 보기'}</DetailPrimaryButton><DetailSecondaryButton ref={reloadButton} disabled={busy} onClick={reload}>저장된 상태 다시 조회</DetailSecondaryButton></Actions>
  </>
}
function safeUrl(value: string | null): string | null { try { const url = new URL(value || ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null } }
