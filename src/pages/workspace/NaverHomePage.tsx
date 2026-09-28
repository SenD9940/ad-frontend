import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { listSavedNaverStores } from '../../api/naverStores'
import {
  DetailActionLink, DetailAlert, DetailEmpty, DetailPage, DetailPanel,
  DetailSecondaryButton, DetailStatus,
} from './WorkspaceDetailUI'

export default function NaverHomePage() {
  const { workspaceId } = useParams()
  return <NaverHomeContent key={workspaceId} workspaceId={Number(workspaceId)} />
}

function NaverHomeContent({ workspaceId }: { workspaceId: number }) {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ hasStores: boolean | null; error: string }>({ hasStores: null, error: '' })
  const selectingChannels = new URLSearchParams(location.search).has('connectionId')
  const assetsPath = `/workspaces/${workspaceId}/connections/naver/assets`

  useEffect(() => {
    if (selectingChannels) return
    const controller = new AbortController()
    listSavedNaverStores(workspaceId, controller.signal).then((stores) => {
      if (!controller.signal.aborted) setResult({ hasStores: stores.length > 0, error: '' })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ hasStores: null, error: error instanceof ApiError ? error.message : '저장된 스마트스토어를 확인하지 못했습니다.' })
    })
    return () => controller.abort()
  }, [attempt, selectingChannels, workspaceId])

  if (selectingChannels) return <Navigate to={`${assetsPath}${location.search}`} replace />
  if (result.hasStores !== null) return <Navigate to={result.hasStores ? `/workspaces/${workspaceId}/naver/performance${location.search}` : assetsPath} replace />

  return <DetailPage><DetailPanel>
    {result.error ? <DetailEmpty>
      <h1>스마트스토어를 확인할 수 없습니다</h1>
      <DetailAlert role="alert">{result.error}</DetailAlert>
      <DetailSecondaryButton type="button" onClick={() => { setResult({ hasStores: null, error: '' }); setAttempt((current) => current + 1) }}>다시 시도</DetailSecondaryButton>
      <DetailActionLink to={assetsPath}>자산 편집</DetailActionLink>
    </DetailEmpty> : <DetailStatus role="status">저장된 스마트스토어를 확인하는 중…</DetailStatus>}
  </DetailPanel></DetailPage>
}
