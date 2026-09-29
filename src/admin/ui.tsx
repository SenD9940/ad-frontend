import { useRef, useState, type ReactNode } from 'react'
import Modal from '../components/common/Modal'
import { number } from './format'
import type { Page } from './types'

const labels: Record<string, string> = { REGISTERED: '이용 중', SUSPENDED: '이용 정지', UNREGISTERED: '탈퇴', ADMIN: '운영자', CUSTOMER: '고객', REQUESTED: '승인 대기', APPROVED: '고객 승인', IN_PROGRESS: '지원 중', COMPLETED: '완료', CANCELLED: '취소', UNPAID: '미수납', PAID: '수납 확인', WAIVED: '무료 지원', READ_ONLY: '조회만', OPERATE: '조회 및 조작', OWNER: '소유자', MEMBER: '멤버' }
export function Status({ value, label }: { value: string; label?: string }) { return <span className={`oa-badge ${['REGISTERED', 'APPROVED', 'PAID', 'COMPLETED'].includes(value) ? 'oa-good' : ['SUSPENDED', 'CANCELLED', 'UNPAID'].includes(value) ? 'oa-warn' : ''}`}>{label || labels[value] || value}</span> }
export function Heading({ eyebrow = '운영 관리', title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) { return <div className="oa-heading"><div><p className="oa-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="oa-actions">{children}</div></div> }
export function Card({ title, children, extra }: { title?: string; children: ReactNode; extra?: ReactNode }) { return <section className="oa-card">{title && <div className="oa-card-head"><h2>{title}</h2>{extra}</div>}{children}</section> }
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) { return <div className={`oa-notice ${error ? 'oa-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div> }
export function Loading() { return <div className="oa-loading" role="status"><span />데이터를 불러오고 있습니다.</div> }
export function Empty({ text = '조건에 맞는 데이터가 없습니다.' }: { text?: string }) { return <div className="oa-empty"><span aria-hidden="true">≡</span><h3>표시할 데이터가 없습니다</h3><p>{text}</p></div> }
export function ResourceState({ loading, error, reload }: { loading: boolean; error?: string; reload: () => void }) { return loading ? <Loading /> : error ? <Notice error>{error} <button className="oa-button oa-secondary" onClick={reload}>다시 조회</button></Notice> : null }
export function Pagination({ data, onChange }: { data?: Page<unknown>; onChange: (page: number) => void }) { if (!data) return null; return <div className="oa-pagination"><span>총 {number(data.totalElements)}건 · {data.totalPages ? data.page + 1 : 0} / {data.totalPages} 페이지</span><div><button className="oa-button oa-secondary" disabled={data.page === 0} onClick={() => onChange(data.page - 1)}>이전</button><button className="oa-button oa-secondary" disabled={data.page + 1 >= data.totalPages} onClick={() => onChange(data.page + 1)}>다음</button></div></div> }
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="oa-table-scroll"><table className="oa-table"><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div> }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="oa-field"><span>{label}</span>{children}</label> }
export type ActionField = { name: string; label: string; value?: string | number; type?: 'number' | 'text'; required?: boolean; maxLength?: number; options?: { value: string; label: string }[] }
export function ActionButton({ label, title, description, fields = [], action, onDone, danger = false }: { label: string; title?: string; description: string; fields?: ActionField[]; action: (values: Record<string, string>) => Promise<unknown>; onDone: () => void; danger?: boolean }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  return <><button className={`oa-button ${danger ? 'oa-danger' : 'oa-secondary'}`} onClick={() => { setDone(false); setOpen(true) }}>{label}</button>{done && <span className="oa-success" role="status">처리했습니다.</span>}{open && <ActionDialog title={title || label} description={description} fields={fields} action={action} danger={danger} close={() => setOpen(false)} done={() => { setOpen(false); setDone(true); onDone() }} />}</>
}
function ActionDialog({ title, description, fields, action, close, done, danger }: { title: string; description: string; fields: ActionField[]; action: (values: Record<string, string>) => Promise<unknown>; close: () => void; done: () => void; danger: boolean }) {
  const pendingRef = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  return <Modal open title={title} description={description} variant="confirm" busy={pending} onClose={close}><form onSubmit={async event => {
    event.preventDefault(); if (pendingRef.current) return; const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    if (values.reason?.trim()) values.reason = values.reason.trim()
    else delete values.reason
    pendingRef.current = true; setPending(true); setError('')
    try { await action(values); done() } catch (caught) { setError(caught instanceof Error ? caught.message : '처리하지 못했습니다.') } finally { pendingRef.current = false; setPending(false) }
  }}>{fields.map(field => <Field key={field.name} label={field.label}>{field.options ? <select aria-label={field.label} name={field.name} defaultValue={field.value} required={field.required !== false}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={field.name} type={field.type || 'text'} defaultValue={field.value} required={field.required !== false} maxLength={field.maxLength ?? 200} min={field.type === 'number' ? 1 : undefined} step="1" />}</Field>)}<details className="oa-action-memo"><summary>메모 추가 (선택)</summary><Field label="메모"><textarea name="reason" maxLength={500} rows={3} placeholder="추가로 남길 내용이 있을 때만 입력하세요." /></Field></details>{error && <Notice error>{error}</Notice>}<div className="oa-dialog-actions"><button type="button" className="oa-button oa-secondary" disabled={pending} onClick={close}>취소</button><button className={`oa-button${danger ? ' oa-danger' : ''}`} disabled={pending}>{pending ? '처리 중…' : title}</button></div></form></Modal>
}
