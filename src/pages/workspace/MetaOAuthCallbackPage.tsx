import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import styled from 'styled-components'
import {
  DetailActionLink, DetailBadge, DetailEmpty, DetailEyebrow, DetailIcon,
  DetailIconTile, DetailPage, DetailPanel, DetailTitle,
} from './WorkspaceDetailUI'

export default function MetaOAuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = params.get('status')
  const workspaceId = params.get('workspace_id')
  const connectionId = params.get('connection_id')
  const errorCode = params.get('error_code')
  const validWorkspaceId = Boolean(workspaceId && /^\d+$/.test(workspaceId) && Number.isSafeInteger(Number(workspaceId)) && Number(workspaceId) > 0)
  const succeeded = status === 'success' && validWorkspaceId
  const returnPath = validWorkspaceId ? `/workspaces/${workspaceId}/connections/meta` : '/workspaces'

  useEffect(() => {
    if (succeeded) {
      const search = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : ''
      navigate(`${returnPath}${search}`, { replace: true, state: { metaConnected: true } })
    }
  }, [connectionId, navigate, returnPath, succeeded])

  return (
    <CallbackPage>
      <DetailPanel>
        <DetailEmpty role={succeeded ? 'status' : undefined}>
          <ResultIcon $success={succeeded}><DetailIcon name={succeeded ? 'check' : 'link'} size={26} /></ResultIcon>
          <DetailEyebrow>플랫폼 연결 / Meta</DetailEyebrow>
          <DetailTitle>{succeeded ? 'Meta 계정이 연결되었습니다' : 'Meta 연결을 완료하지 못했어요'}</DetailTitle>
          <p>{succeeded ? '연결이 저장되었습니다. 사용할 자산을 선택하는 화면으로 이동합니다.' : `${callbackErrorMessage(errorCode)} 연결 페이지에서 다시 시도해 주세요.`}</p>
          {!succeeded && errorCode ? <DetailBadge>오류 코드 {errorCode}</DetailBadge> : null}
          <DetailActionLink to={returnPath}>{validWorkspaceId ? 'Meta 연결 페이지로' : '워크스페이스 목록'}<DetailIcon name="arrow" size={16} /></DetailActionLink>
        </DetailEmpty>
      </DetailPanel>
    </CallbackPage>
  )
}

function callbackErrorMessage(errorCode: string | null): string {
  if (errorCode === '3403') return '워크스페이스 소유자만 Meta 계정을 연결할 수 있습니다.'
  if (errorCode === '400') return '연결 요청이 만료되었거나 올바르지 않습니다.'
  return '계정 인증 중 문제가 발생했습니다.'
}

const CallbackPage = styled(DetailPage)`max-width: 36rem; padding-block: clamp(1rem, 5vw, 3rem);`
const ResultIcon = styled(DetailIconTile)<{ $success: boolean }>`width: 3.75rem; height: 3.75rem; margin-bottom: 0.5rem; background: ${({ $success }) => $success ? '#eaf8f1' : '#fff5df'}; border-color: ${({ $success }) => $success ? '#ccebdd' : '#f2e5c5'}; color: ${({ $success }) => $success ? '#167853' : '#96600d'};`
