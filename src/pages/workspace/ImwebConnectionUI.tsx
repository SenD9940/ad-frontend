import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useModal } from '../../components/common/useModal'
import { authorizeImweb, getImwebCapabilities } from '../../api/imweb'
import { useImwebResource } from '../../hooks/useImwebResource'
import { Actions, ExternalLink, StackBody } from './NaverProductFormUI'
import { DetailAlert, DetailHint, DetailPanel, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, PanelHeading } from './WorkspaceDetailUI'

export function ImwebAuthorizationForm({ workspaceId, initialSiteCode = '', owner = true, reconnect = false, siteName = '아임웹 사이트' }: { workspaceId: number; initialSiteCode?: string; owner?: boolean; reconnect?: boolean; siteName?: string }) {
  const modal = useModal()
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const siteCode = initialSiteCode.trim()
  const validSite = /^S[A-Za-z0-9]{5,99}$/.test(siteCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const load = useCallback((signal: AbortSignal) => getImwebCapabilities(workspaceId, signal), [workspaceId])
  const capability = useImwebResource(owner ? String(workspaceId) : null, load)
  async function start(event: FormEvent) {
    event.preventDefault()
    if (!owner || !capability.data?.enabled || !validSite || pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { const url = await authorizeImweb(workspaceId, siteCode); if (active.current) window.location.assign(url) }
    catch (caught) {
      pending.current = false
      if (active.current) {
        const message = caught instanceof Error ? caught.message : '아임웹 인증을 시작하지 못했습니다.'
        setError(message); setBusy(false)
        void modal.error({ title: '아임웹 연결 실패', message })
      }
    }
  }
  return <DetailPanel><PanelHeading><div><h2>{reconnect ? `${siteName} 다시 연결` : '아임웹 사이트 연결'}</h2><p>아임웹에서 권한을 승인하고 사용할 스토어를 선택하세요.</p></div></PanelHeading><StackBody>
    {!owner ? <DetailHint>워크스페이스 소유자만 사이트를 연결할 수 있습니다. 연결된 사이트의 스토어는 멤버도 선택할 수 있습니다.</DetailHint>
      : capability.loading ? <DetailStatus role="status">아임웹 연결 가능 여부 확인 중…</DetailStatus>
        : capability.error ? <><DetailAlert role="alert">{capability.error}</DetailAlert><Actions><DetailSecondaryButton onClick={capability.reload}>다시 확인</DetailSecondaryButton></Actions></>
          : !capability.data?.enabled ? <DetailHint>{capability.data?.disabledReason || '아임웹 간편 연결을 준비 중입니다. 연결 설정이 완료되면 사용할 수 있습니다.'}</DetailHint>
            : !validSite ? <>
              {siteCode && <DetailAlert role="alert">아임웹에서 전달된 사이트 정보를 확인하지 못했습니다. 아임웹에서 연결을 다시 시작해 주세요.</DetailAlert>}
              <DetailHint>아임웹에서 사용할 사이트에 앱을 추가해 주세요. 사이트를 선택하고 접근 권한에 동의하면 이 서비스로 돌아와 연결을 완료할 수 있습니다.</DetailHint>
              <Actions><ExternalLink href="https://imweb.me/appstore" target="_blank" rel="noopener noreferrer">아임웹 앱스토어 열기 ↗</ExternalLink></Actions>
            </>
            : <form onSubmit={event => void start(event)} style={{ display: 'grid', gap: 18 }}>
              <DetailHint>{reconnect ? '저장된 사이트의 연결 권한을 아임웹에서 다시 확인합니다.' : '아임웹에서 선택한 사이트 정보를 받았습니다. 아임웹 인증을 계속해 연결을 완료하세요.'}</DetailHint>
              {error && <DetailAlert role="alert">{error}</DetailAlert>}<Actions><DetailPrimaryButton disabled={busy}>{busy ? '아임웹 인증으로 이동 중…' : reconnect ? '아임웹으로 다시 연결' : '아임웹으로 연결'}</DetailPrimaryButton></Actions>
            </form>}
  </StackBody></DetailPanel>
}
