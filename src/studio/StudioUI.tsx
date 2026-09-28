import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { StudioKind, StudioPage } from './types'
import { studioKindLabel } from './types'
import './studio.css'
import { safeStudioImageUrl } from './preview'

export function StudioFrame({ workspaceId, title, description, children, action }: { workspaceId: string; title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return <div className="studio"><header className="studio-heading"><div><p className="studio-eyebrow">CREATIVE WORKSPACE</p><h1>{title}</h1><p>{description}</p></div>{action}</header><nav className="studio-tabs" aria-label="AI 스튜디오 메뉴"><NavLink end to={`/workspaces/${workspaceId}/studio`}>템플릿 둘러보기</NavLink><NavLink to={`/workspaces/${workspaceId}/studio/outputs`}>내 결과</NavLink></nav>{children}</div>
}

export function StudioNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`studio-notice${error ? ' studio-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>
}

export function StudioResourceState({ loading, error, reload }: { loading: boolean; error?: string; reload: () => void }) {
  if (loading) return <div className="studio-state" role="status"><span className="studio-spinner" />불러오는 중입니다.</div>
  if (error) return <StudioNotice error>{error}<button className="studio-button studio-secondary" onClick={reload}>다시 조회</button></StudioNotice>
  return null
}

export function StudioEmpty({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <section className="studio-empty"><span aria-hidden="true">✧</span><h2>{title}</h2><p>{description}</p>{children}</section>
}

export function StudioImage({ src, title, kind }: { src?: string | null; title: string; kind: StudioKind }) {
  const imageUrl = safeStudioImageUrl(src)
  return <div className={`studio-image ${kind === 'DETAIL_PAGE' ? 'studio-detail-image' : ''}`}>{imageUrl ? <img src={imageUrl} alt={title} loading="lazy" referrerPolicy="no-referrer" /> : <div className="studio-image-placeholder"><span aria-hidden="true">{kind === 'AD_IMAGE' ? '▧' : '▤'}</span><small>{studioKindLabel[kind]}</small></div>}</div>
}

export function StudioPagination({ data, onChange }: { data?: StudioPage<unknown>; onChange: (page: number) => void }) {
  if (!data || data.totalPages < 2) return null
  return <div className="studio-pagination"><span>총 {data.totalElements.toLocaleString('ko-KR')}개 · {data.page + 1} / {data.totalPages}</span><div><button className="studio-button studio-secondary" disabled={data.page === 0} onClick={() => onChange(data.page - 1)}>이전</button><button className="studio-button studio-secondary" disabled={data.page + 1 >= data.totalPages} onClick={() => onChange(data.page + 1)}>다음</button></div></div>
}

export function StudioBack({ workspaceId }: { workspaceId: string }) {
  return <Link className="studio-back" to={`/workspaces/${workspaceId}/studio`}>← 템플릿으로 돌아가기</Link>
}
