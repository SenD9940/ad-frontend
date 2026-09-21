import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ApiError } from '../../api/http'
import { getMyWorkspace } from '../../api/workspaces'
import AppShell from './AppShell'

export default function WorkspaceAppLayout() {
  const { workspaceId } = useParams()
  return <WorkspaceContent key={workspaceId} workspaceId={workspaceId || ''} />
}

function WorkspaceContent({ workspaceId }: { workspaceId: string }) {
  const id = Number(workspaceId)
  const valid = Number.isSafeInteger(id) && id > 0
  const [name, setName] = useState('')
  const [error, setError] = useState(valid ? '' : '워크스페이스를 찾을 수 없습니다.')
  const [loading, setLoading] = useState(valid)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    getMyWorkspace(id).then((workspace) => {
      if (!cancelled) setName(workspace.name)
    }).catch((caught: unknown) => {
      if (!cancelled) setError(caught instanceof ApiError ? caught.message : '워크스페이스를 불러오지 못했습니다.')
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, valid, attempt])

  return <AppShell workspaceId={valid ? workspaceId : undefined} workspaceName={name}>
    {loading ? <State role="status"><LoadingMark /><h1>워크스페이스를 열고 있어요</h1><p>팀과 연결된 공간을 불러오는 중입니다.</p></State> : error ? <State role="alert"><h1>워크스페이스를 열 수 없습니다</h1><p>{error}</p><Actions>{valid && <button type="button" onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1) }}>다시 시도</button>}<Link to="/workspaces">워크스페이스 목록으로</Link></Actions></State> : <Outlet />}
  </AppShell>
}

const State = styled.section`display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 360px; padding: 32px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 14px; background: white; text-align: center; h1 { font-size: 22px; } p { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 14px; }`
const LoadingMark = styled.span`width: 42px; height: 42px; border: 4px solid #eeecff; border-top-color: #635bff; border-radius: 50%; @keyframes workspace-spin { to { transform: rotate(360deg); } } animation: workspace-spin .8s linear infinite;`
const Actions = styled.div`display: flex; align-items: center; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 8px; a { font-size: 13px; }`
