import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { adminDelete, adminWrite } from './api'
import { useResource } from './useResource'
import { StudioEmpty, StudioNotice, StudioResourceState } from '../studio/StudioUI'
import type { StudioCategory } from '../studio/types'

export const studioCategoriesPath = '/ai-studio/categories'

export default function StudioCategoriesPage() {
  const categories = useResource<StudioCategory[]>(studioCategoriesPath)
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const inFlight = useRef(false)
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !name.trim()) return
    inFlight.current = true; setPending(true); setError(''); setMessage('')
    try {
      const category = await adminWrite<StudioCategory>(studioCategoriesPath, { name: name.trim() })
      setName(''); setMessage(`“${category.name}” 카테고리를 등록했습니다.`); categories.reload()
    } catch (caught) { setError(caught instanceof Error ? caught.message : '카테고리를 등록하지 못했습니다.') }
    finally { inFlight.current = false; setPending(false) }
  }
  return <div className="studio"><header className="studio-heading"><div><p className="studio-eyebrow">AI STUDIO / CATEGORIES</p><h1>카테고리 관리</h1><p>샘플을 분류할 카테고리를 만들고 이름을 관리하세요.</p></div><Link className="studio-button studio-secondary" to="/admin/studio">샘플 목록</Link></header>
    <section className="studio-panel"><h2>새 카테고리</h2><form className="studio-category-create" onSubmit={create}><label className="studio-field"><span>카테고리 이름</span><input name="categoryName" aria-label="새 카테고리 이름" value={name} onChange={event => setName(event.target.value)} maxLength={80} required disabled={pending} placeholder="예: 뷰티, 패션, 식품" /></label><button className="studio-button" disabled={pending || !name.trim()}>{pending ? '등록 중…' : '카테고리 등록'}</button></form><p className="studio-note">이름 변경은 연결된 모든 샘플에 반영됩니다. 샘플에서 사용 중인 카테고리는 삭제할 수 없습니다.</p></section>
    {error && <StudioNotice error>{error}</StudioNotice>}{message && <StudioNotice>{message}</StudioNotice>}
    <StudioResourceState {...categories} />{categories.data && (categories.data.length ? <section className="studio-panel"><div className="studio-inline end"><h2>등록된 카테고리</h2><span className="studio-count">총 {categories.data.length}개</span></div><div className="studio-category-list">{categories.data.map(category => <CategoryRow key={`${category.id}:${category.name}`} category={category} onChange={categories.reload} />)}</div></section> : <StudioEmpty title="등록된 카테고리가 없습니다" description="첫 카테고리를 등록한 후 샘플에서 선택해 주세요." />)}
  </div>
}
function CategoryRow({ category, onChange }: { category: StudioCategory; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(category.name)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  async function mutate(remove = false) {
    if (inFlight.current || (!remove && !name.trim())) return
    inFlight.current = true; setPending(true); setError('')
    try {
      if (remove) await adminDelete(`${studioCategoriesPath}/${category.id}`)
      else await adminWrite(`${studioCategoriesPath}/${category.id}`, { name: name.trim() }, 'patch')
      onChange()
    } catch (caught) { setError(caught instanceof Error ? caught.message : '카테고리를 변경하지 못했습니다.'); if (remove) setDeleting(false) }
    finally { inFlight.current = false; setPending(false) }
  }
  return <div className="studio-category-row">
    <div className="studio-category-row-main">{editing ? <form className="studio-category-rename" onSubmit={event => { event.preventDefault(); void mutate() }}><input aria-label={`${category.name} 새 이름`} value={name} onChange={event => setName(event.target.value)} required maxLength={80} disabled={pending} autoFocus /><button className="studio-button" disabled={pending || !name.trim()}>{pending ? '저장 중…' : '이름 저장'}</button><button className="studio-button studio-secondary" type="button" disabled={pending} onClick={() => { setEditing(false); setName(category.name); setError('') }}>취소</button></form> : <><strong>{category.name}</strong><div className="studio-actions"><button className="studio-button studio-secondary" disabled={pending || deleting} onClick={() => { setEditing(true); setError('') }}>이름 변경<span className="studio-sr-only">: {category.name}</span></button><button className="studio-button studio-secondary" disabled={pending || deleting} onClick={() => { setDeleting(true); setError('') }}>삭제<span className="studio-sr-only">: {category.name}</span></button></div></>}</div>
    {deleting && <div className="studio-category-confirm" role="group" aria-label={`${category.name} 삭제 확인`}><p>“{category.name}” 카테고리를 삭제할까요?</p><div className="studio-actions"><button className="studio-button studio-danger" disabled={pending} onClick={() => void mutate(true)}>{pending ? '삭제 중…' : '삭제 확인'}</button><button className="studio-button studio-secondary" disabled={pending} onClick={() => setDeleting(false)}>취소</button></div></div>}{error && <StudioNotice error>{error}</StudioNotice>}
  </div>
}
