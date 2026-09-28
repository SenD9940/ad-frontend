import { useState, type FormEvent } from 'react'
import type { Page, Workspace } from './types'
import { useResource } from './useResource'
import { Empty, Field, Pagination, ResourceState, Status } from './ui'

export default function SupportWorkspacePicker({ selectedId, initialOwnerId, disabled, onSelect }: {
  selectedId: number | null
  initialOwnerId: number | null
  disabled: boolean
  onSelect: (id: number) => void
}) {
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState({ query: '', page: 0, ownerId: initialOwnerId })
  const params = new URLSearchParams({ page: String(search.page), size: '6' })
  if (search.query) params.set('q', search.query)
  if (search.ownerId !== null) params.set('ownerId', String(search.ownerId))
  const result = useResource<Page<Workspace>>(`/workspaces?${params}`)

  function submit(event: FormEvent) {
    event.preventDefault()
    setSearch(current => ({ ...current, query: draft.trim(), page: 0 }))
  }

  return <div className="oa-workspace-picker">
    <form className="oa-workspace-search" role="search" aria-label="지원할 워크스페이스 검색" onSubmit={submit}>
      <Field label="워크스페이스 검색">
        <input type="search" value={draft} onChange={event => setDraft(event.target.value)} disabled={disabled}
          maxLength={200} placeholder="워크스페이스 이름 또는 소유자 이메일" />
      </Field>
      <button className="oa-button oa-secondary" disabled={disabled}>검색</button>
      {search.query && <button type="button" className="oa-button oa-secondary" disabled={disabled} onClick={() => {
        setDraft(''); setSearch(current => ({ ...current, query: '', page: 0 }))
      }}>검색 초기화</button>}
    </form>
    {search.ownerId !== null && <div className="oa-workspace-scope">
      <span>회원 상세에서 선택한 고객이 소유한 워크스페이스를 표시합니다.</span>
      <button type="button" className="oa-button oa-secondary" disabled={disabled} onClick={() => {
        setDraft(''); setSearch({ query: '', page: 0, ownerId: null })
      }}>전체 워크스페이스 보기</button>
    </div>}
    <ResourceState loading={result.loading} error={result.error} reload={result.reload} />
    {result.data && (result.data.items.length ? <fieldset className="oa-workspace-options" disabled={disabled}>
      <legend className="oa-visually-hidden">지원할 워크스페이스 선택</legend>
      {result.data.items.map(workspace => {
        const available = Number.isSafeInteger(workspace.ownerId) && workspace.ownerId > 0 && workspace.ownerStatus === 'REGISTERED'
        return <label key={workspace.id} className={`oa-workspace-option${selectedId === workspace.id ? ' oa-selected' : ''}${available ? '' : ' oa-unavailable'}`}>
          <input type="radio" name="supportWorkspaceChoice" value={workspace.id} checked={selectedId === workspace.id}
            disabled={!available} onChange={() => onSelect(workspace.id)}
            aria-label={`${workspace.name} · ${workspace.ownerEmail || '소유자 없음'}`} />
          <span className="oa-workspace-option-copy"><strong>{workspace.name}</strong><small>{workspace.ownerEmail || '소유자 없음'}</small></span>
          <span className="oa-workspace-option-meta">
            {!available ? <Status value={workspace.ownerStatus || '소유자 없음'} /> : selectedId === workspace.id ? <span className="oa-badge oa-good">선택됨</span> : <span>선택</span>}
          </span>
        </label>
      })}
    </fieldset> : <Empty text={search.query ? '검색어를 바꾸거나 검색을 초기화해 주세요.' : search.ownerId !== null ? '이 고객이 소유한 워크스페이스가 없습니다. 전체 목록에서 지원할 공간을 선택할 수 있습니다.' : '고객이 워크스페이스를 만들면 이곳에서 선택할 수 있습니다.'} />)}
    <fieldset className="oa-workspace-paging" disabled={disabled}>
      <Pagination data={result.data} onChange={page => setSearch(current => ({ ...current, page }))} />
    </fieldset>
  </div>
}
