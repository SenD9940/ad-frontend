import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { listSavedMetaAdAccounts } from '../../api/metaAds'
import {
  DetailActionLink, DetailAlert, DetailEmpty, DetailPage, DetailPanel,
  DetailSecondaryButton, DetailStatus,
} from './WorkspaceDetailUI'

/** The platform entry checks saved assets only; discovery belongs to the editor. */
export default function MetaHomePage() {
  const { workspaceId } = useParams()
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ hasAdAccounts: boolean | null; error: string }>({ hasAdAccounts: null, error: '' })
  const justConnected = Boolean((location.state as { metaConnected?: boolean } | null)?.metaConnected)
  const assetsPath = `/workspaces/${workspaceId}/connections/meta/assets`

  useEffect(() => {
    if (justConnected) return
    const controller = new AbortController()
    listSavedMetaAdAccounts(Number(workspaceId), controller.signal).then((accounts) => {
      if (!controller.signal.aborted) setResult({ hasAdAccounts: accounts.length > 0, error: '' })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ hasAdAccounts: null, error: error instanceof ApiError ? error.message : '저장된 광고 자산을 확인하지 못했습니다.' })
    })
    return () => controller.abort()
  }, [attempt, justConnected, workspaceId])

  if (justConnected) return <Navigate to={`${assetsPath}${location.search}`} state={location.state} replace />
  if (result.hasAdAccounts !== null) {
    return <Navigate to={result.hasAdAccounts ? `/workspaces/${workspaceId}/meta/performance${location.search}` : assetsPath} replace />
  }
  return (
    <DetailPage><DetailPanel>
      {result.error ? <DetailEmpty>
        <h1>Meta 자산을 확인할 수 없습니다</h1>
        <DetailAlert role="alert">{result.error}</DetailAlert>
        <DetailSecondaryButton type="button" onClick={() => { setResult({ hasAdAccounts: null, error: '' }); setAttempt((current) => current + 1) }}>다시 시도</DetailSecondaryButton>
        <DetailActionLink to={assetsPath}>자산 편집</DetailActionLink>
      </DetailEmpty> : <DetailStatus role="status">저장된 Meta 자산을 확인하는 중…</DetailStatus>}
    </DetailPanel></DetailPage>
  )
}
