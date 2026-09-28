import { Link, useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useResource } from './useResource'
import { Card, Empty, Field, Heading, Pagination, ResourceState, Table } from './ui'
import type { Page } from './types'

export type Column<T> = { label: string; render: (row: T) => ReactNode }
type Filter = { name: string; label: string; placeholder?: string; options?: [string, string][]; initial?: string }
export default function ListPage<T extends { id: number }>({ title, description, path, columns, filters = [], extra }: { title: string; description: string; path: string; columns: Column<T>[]; filters?: Filter[]; extra?: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const query = new URLSearchParams(params)
  filters.forEach(filter => { if (filter.initial && !query.has(filter.name)) query.set(filter.name, filter.initial) })
  query.set('size', '20')
  const resource = useResource<Page<T>>(`${path}?${query}`)
  return <><Heading title={title} description={description}>{extra}<button className="oa-button oa-secondary" onClick={resource.reload}>새로고침</button></Heading><Card>
    {filters.length > 0 && <form key={params.toString()} className="oa-toolbar" onSubmit={event => { event.preventDefault(); const next = new URLSearchParams(); new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim() || filters.some(f => f.name === key && f.initial)) next.set(key, String(value).trim()) }); next.set('page', '0'); setParams(next) }}>
      {filters.map(filter => <Field key={filter.name} label={filter.label}>{filter.options ? <select aria-label={filter.label} name={filter.name} defaultValue={query.get(filter.name) ?? ''}>{filter.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <input name={filter.name} defaultValue={params.get(filter.name) ?? ''} placeholder={filter.placeholder} maxLength={200} />}</Field>)}<button className="oa-button">조회</button><button type="button" className="oa-button oa-secondary" onClick={() => setParams({})}>초기화</button>
    </form>}
    <ResourceState {...resource} />
    {resource.data && (resource.data.items.length ? <Table headers={columns.map(column => column.label)}>{resource.data.items.map(row => <tr key={row.id}>{columns.map(column => <td key={column.label}>{column.render(row)}</td>)}</tr>)}</Table> : <Empty />)}
    <Pagination data={resource.data} onChange={page => { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next) }} />
  </Card></>
}
export function UserLink({ id, children }: { id: number; children?: ReactNode }) { return <Link to={`/admin/users/${id}`}>{children || `회원 #${id}`}</Link> }
export function WorkspaceLink({ id, children }: { id: number; children?: ReactNode }) { return <Link to={`/admin/workspaces/${id}`}>{children || `워크스페이스 #${id}`}</Link> }
