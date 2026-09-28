import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { adminGet, adminWrite } from './api'
import SupportWorkspacePicker from './SupportWorkspacePicker'
import type { SupportTicket, Workspace } from './types'
import { useSupportWorkspace } from './useSupportWorkspace'
import { Card, Field, Heading, Notice, ResourceState, Status } from './ui'

function positiveId(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

export default function SupportCreatePage() {
  const [params] = useSearchParams()
  const workspaceId = positiveId(params.get('workspaceId'))
  // A workspace link always resolves its current owner, even if an old customer ID remains in the URL.
  const ownerId = workspaceId === null ? positiveId(params.get('customerUserId')) : null
  return <SupportCreateForm key={`${workspaceId}:${ownerId}`} initialWorkspaceId={workspaceId} initialOwnerId={ownerId} />
}

function SupportCreateForm({ initialWorkspaceId, initialOwnerId }: { initialWorkspaceId: number | null; initialOwnerId: number | null }) {
  const navigate = useNavigate()
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId)
  const selected = useSupportWorkspace(workspaceId)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pendingRef.current) return
    const selection = selected.data
    if (!selection) { setError('지원할 워크스페이스를 선택하고 고객 정보가 조회될 때까지 기다려 주세요.'); return }
    const values = new FormData(event.currentTarget)
    pendingRef.current = true
    setPending(true); setError('')
    try {
      // Do not silently change the customer if ownership changed while the form was being filled.
      const latest = await adminGet<Workspace>(`/workspaces/${selection.workspace.id}`)
      if (latest.id !== selection.workspace.id || latest.ownerId !== selection.customer.id || latest.ownerStatus !== 'REGISTERED') {
        throw new Error('워크스페이스 소유자 또는 이용 상태가 변경되었습니다. 갱신된 고객 정보를 확인한 후 다시 등록해 주세요.')
      }
      const ticket = await adminWrite<SupportTicket>('/support/tickets', {
        workspaceId: selection.workspace.id,
        customerUserId: selection.customer.id,
        title: String(values.get('title') || '').trim(),
        description: String(values.get('description') || '').trim(),
        accessMode: values.get('accessMode'),
        amountKrw: Number(values.get('amountKrw')),
      })
      navigate(`/admin/support/${ticket.id}`, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '등록하지 못했습니다.')
      selected.reload()
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return <>
    <Link className="oa-back" to="/admin/support">← 기술 지원 목록</Link>
    <Heading title="관리자 대신 등록" description="고객과 협의한 지원 요청을 대신 등록합니다. 워크스페이스를 선택하면 현재 소유자가 지원 고객으로 설정됩니다." />
    <Notice>고객은 서비스의 기술 지원에서 직접 신청하고 9,900원을 토스페이먼츠로 결제할 수 있습니다. 이 화면에서 대신 등록하는 요청은 기존 방식에 따라 고객의 별도 승인과 수동 수납 확인이 필요합니다.</Notice>
    <Card title="지원할 워크스페이스">
      <SupportWorkspacePicker selectedId={workspaceId} initialOwnerId={initialOwnerId} disabled={pending} onSelect={id => {
        setWorkspaceId(id); setError('')
      }} />
      {workspaceId !== null && <div className="oa-workspace-customer">
        <ResourceState {...selected} />
        {selected.data && <>
          <div className="oa-workspace-customer-heading"><strong>선택한 지원 대상</strong><Status value="REGISTERED" /></div>
          <dl className="oa-detail-grid">
            <div><dt>워크스페이스</dt><dd>{selected.data.workspace.name}</dd></div>
            <div><dt>고객 · 워크스페이스 소유자</dt><dd>{selected.data.customer.name || selected.data.customer.email}
              <small>{selected.data.customer.email}</small></dd></div>
          </dl>
          <p className="oa-muted">이 고객에게 지원 승인을 요청합니다. 고객 정보는 선택한 워크스페이스의 현재 소유자를 기준으로 자동 설정됩니다.</p>
        </>}
      </div>}
    </Card>
    <Card title="지원 요청서">
      <form className="oa-card-body" onSubmit={submit}>
        <fieldset className="oa-support-form-fields oa-form-grid" disabled={pending}>
          <div className="oa-form-full">
            <Field label="지원 제목"><input name="title" required maxLength={150} placeholder="예: Meta 광고 등록 및 예산 설정 지원" /></Field>
            <Field label="고객에게 안내할 작업 내용"><textarea name="description" required maxLength={1000} rows={4} placeholder="확인할 문제와 실제로 변경할 항목을 구체적으로 안내해 주세요." /></Field>
          </div>
          <Field label="허용할 접근 범위"><select name="accessMode" aria-label="허용할 접근 범위" defaultValue="READ_ONLY">
            <option value="READ_ONLY">조회만 — 성과와 저장된 자산 확인</option>
            <option value="OPERATE">조회 및 조작 — 광고·상품 등록과 수정 포함</option>
          </select></Field>
          <Field label="기술 지원료 (원)"><input name="amountKrw" type="number" min="0" max="1000000000" step="1" required defaultValue="0" /><small>무료 지원은 0원으로 등록합니다.</small></Field>
        </fieldset>
        <p className="oa-muted">접근 범위와 금액은 등록 후 변경할 수 없습니다. 변경이 필요하면 기존 요청을 취소하고 새 요청을 등록하세요. 고객 승인은 7일, 한 번의 접속은 최대 15분간 유효합니다.</p>
        {!selected.data && !error && <p className="oa-muted" style={{ marginTop: 12 }}>위 목록에서 워크스페이스를 선택하면 지원을 등록할 수 있습니다.</p>}
        {error && <Notice error>{error}</Notice>}
        <div className="oa-dialog-actions">
          <Link className="oa-button oa-secondary" to="/admin/support">목록으로</Link>
          <button className="oa-button" disabled={pending || !selected.data}>{pending ? '등록 중…' : '고객 승인 요청 등록'}</button>
        </div>
      </form>
    </Card>
  </>
}
