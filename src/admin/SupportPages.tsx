import { formatDate, number } from './format'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminWrite } from './api'
import ListPage, { UserLink, WorkspaceLink } from './ListPage'
import { readAdminSession } from './session'
import { useResource } from './useResource'
import type { Page, SupportAction, SupportGrant, SupportSession, SupportTicket } from './types'
import { ActionButton, Card, Empty, Heading, Notice, Pagination, ResourceState, Status, Table } from './ui'
import { localTime, startSupportSession } from '../support/session'

function TicketStatus({ ticket, value }: { ticket: SupportTicket; value: string }) {
  const labels: Record<string, string> = { APPROVED: '접수 완료', UNPAID: '결제 대기', PAID: '결제 완료' }
  return <Status value={value} label={ticket.requestSource === 'CUSTOMER' ? labels[value] : undefined} />
}

export function SupportListPage() {
  return <ListPage<SupportTicket>
    title="기술 지원"
    description="고객이 신청한 지원과 토스페이먼츠 결제 상태를 확인하고 지원을 시작합니다."
    path="/support/tickets"
    extra={<Link className="oa-button oa-secondary" to="/admin/support/new">관리자 대신 등록</Link>}
    filters={[
      { name: 'status', label: '진행 상태', options: [['', '전체'], ['REQUESTED', '승인 대기 · 관리자 등록'], ['APPROVED', '접수 / 승인 완료'], ['IN_PROGRESS', '지원 중'], ['COMPLETED', '완료'], ['CANCELLED', '취소']] },
      { name: 'customerUserId', label: '고객 ID' },
      { name: 'workspaceId', label: '워크스페이스 ID' },
    ]}
    columns={[
      { label: '지원 내용', render: t => <Link to={`/admin/support/${t.id}`}>{t.title}<small>{t.requestSource === 'CUSTOMER' ? '고객 신청' : '관리자 대신 등록'} · #{t.id} · {formatDate(t.createdAt)}</small></Link> },
      { label: '고객 / 공간', render: t => <><UserLink id={t.customerUserId} /><small><WorkspaceLink id={t.workspaceId} /></small></> },
      { label: '진행 상태', render: t => <TicketStatus ticket={t} value={t.status} /> },
      { label: '접근 범위', render: t => <Status value={t.accessMode} /> },
      { label: '지원료', render: t => <>{number(t.amountKrw)}원<small><TicketStatus ticket={t} value={t.paymentStatus} /></small>{t.requestSource === 'CUSTOMER' && t.status === 'CANCELLED' && t.paymentStatus === 'PAID' && <small className="oa-warn">환불 확인 필요</small>}</> },
    ]}
  />
}

export function SupportDetailPage() {
  const { id } = useParams()
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(timer) }, [])
  const ticket = useResource<SupportTicket>(`/support/tickets/${id}`)
  const [sessionPage, setSessionPage] = useState(0)
  const [actionPage, setActionPage] = useState(0)
  const sessions = useResource<Page<SupportSession>>(`/support/tickets/${id}/sessions?page=${sessionPage}&size=20`)
  const actions = useResource<Page<SupportAction>>(`/support/tickets/${id}/actions?page=${actionPage}&size=20`)
  const refresh = () => { ticket.reload(); sessions.reload(); actions.reload() }
  const t = ticket.data
  const customerRequest = t?.requestSource === 'CUSTOMER'
  const closed = t && ['COMPLETED', 'CANCELLED'].includes(t.status)
  const approved = Boolean(t && ['APPROVED', 'IN_PROGRESS'].includes(t.status) && t.approvedAt && t.approvalExpiresAt && localTime(t.approvalExpiresAt) > now)
  const assignedToSelf = t?.assignedAdminId === readAdminSession()?.user.id
  const mayClaim = customerRequest && t?.assignedAdminId === null
  const paid = customerRequest ? t?.paymentStatus === 'PAID' : t?.paymentStatus === 'PAID' || t?.paymentStatus === 'WAIVED'
  const canStart = approved && paid && (assignedToSelf || mayClaim)

  let startNotice = '고객 승인(7일 이내), 수납 확인, 담당 운영자 계정을 확인해 주세요.'
  if (customerRequest) {
    if (!approved) startNotice = '이 신청의 지원 동의가 만료되었거나 철회되었습니다.'
    else if (!paid) startNotice = '토스페이먼츠 결제가 완료되면 지원을 시작할 수 있습니다.'
    else startNotice = `담당 운영자 #${t?.assignedAdminId} 계정에서 지원을 시작할 수 있습니다.`
  }

  return <>
    <Link className="oa-back" to="/admin/support">← 기술 지원 목록</Link>
    <Heading title={t?.title || '기술 지원 상세'} description={`지원 요청 #${id} · ${customerRequest ? '고객의 신청과 결제 상태를 확인하고 지원을 시작합니다.' : '고객 승인과 수동 수납 내역을 확인하는 관리자 등록 요청입니다.'}`}>
      <button className="oa-button oa-secondary" onClick={refresh}>새로고침</button>
    </Heading>
    <ResourceState {...ticket} />
    {t && <>
      <div className="oa-status-strip">
        <TicketStatus ticket={t} value={t.status} />
        <Status value={t.accessMode} />
        <TicketStatus ticket={t} value={t.paymentStatus} />
        <span className="oa-muted">{mayClaim ? '지원 시작 시 자동 배정' : t.assignedAdminId === null ? '담당 운영자 미배정' : `담당 운영자 #${t.assignedAdminId}`}</span>
      </div>
      {customerRequest && t.status === 'CANCELLED' && t.paymentStatus === 'PAID' && <Notice>
        <strong>환불 확인 필요</strong><br />
        지원 요청 취소는 결제 취소로 이어지지 않습니다. 토스페이먼츠 상점관리자에서 결제 내역을 확인하고 환불을 처리해 주세요. 이 앱은 환불을 자동 처리하지 않습니다.
      </Notice>}
      <div className="oa-two">
        <Card title={customerRequest ? '신청 내용 및 약관 동의' : '작업 범위 및 고객 승인'}>
          <div className="oa-card-body">
            <dl className="oa-detail-grid">
              <div><dt>고객</dt><dd><UserLink id={t.customerUserId} /></dd></div>
              <div><dt>지원 워크스페이스</dt><dd><WorkspaceLink id={t.workspaceId} /></dd></div>
              <div><dt>{customerRequest ? '약관 동의 시각' : '승인 시각'}</dt><dd>{formatDate(t.approvedAt)}</dd></div>
              <div><dt>{customerRequest ? '지원 동의 만료' : '승인 만료'}</dt><dd>{formatDate(t.approvalExpiresAt)}</dd></div>
              {customerRequest && <div><dt>동의한 약관 버전</dt><dd>{t.termsVersion || '—'}</dd></div>}
            </dl>
            <p className="oa-note" style={{ marginTop: 22 }}>{t.description}</p>
            {customerRequest ? <>
              <p className="oa-muted" style={{ marginTop: 16 }}>고객이 신청할 때 선택한 접근 범위와 약관에 동의했습니다. 지원 동의는 7일간 유효하며 고객이 철회하면 접속이 종료됩니다.</p>
              {t.termsSnapshot && <details style={{ marginTop: 16 }}><summary>고객이 동의한 약관 원문</summary><p className="oa-note" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: 12 }}>{t.termsSnapshot}</p></details>}
            </> : <p className="oa-muted" style={{ marginTop: 16 }}>고객은 서비스의 워크스페이스 → 기술 지원에서 승인하거나 접근을 철회할 수 있습니다.</p>}
          </div>
        </Card>
        <Card title="기술 지원료">
          <div className="oa-card-body">
            <p style={{ fontSize: 30, fontWeight: 750, marginBottom: 15 }}>{number(t.amountKrw)}<small style={{ fontSize: 14 }}> 원</small></p>
            <TicketStatus ticket={t} value={t.paymentStatus} />
            {customerRequest ? <p className="oa-muted" style={{ margin: '15px 0' }}>토스페이먼츠 · 정액 지원료 9,900원<br />고객 결제가 확인되면 결제 완료로 표시됩니다.{t.paymentReference && <><br />결제 참조: {t.paymentReference}</>}</p> : <>
              <p className="oa-muted" style={{ margin: '15px 0' }}>관리자 대신 등록 · 수동 수납 확인<br />확인 번호: {t.paymentReference || '—'}</p>
              {['REQUESTED', 'APPROVED'].includes(t.status) && <ActionButton label="수납 상태 기록" description="실제 입금 내역을 확인한 뒤 수동으로 기록합니다. 결제 승인이나 환불이 실행되지는 않습니다." fields={[
                { name: 'paymentStatus', label: '수납 상태', value: t.paymentStatus, options: t.amountKrw === 0 ? [{ value: 'UNPAID', label: '미확인' }, { value: 'WAIVED', label: '무료 지원 확인' }] : [{ value: 'UNPAID', label: '미수납' }, { value: 'PAID', label: '입금 확인 완료' }] },
                { name: 'paymentReference', label: '입금 확인 번호 / 근거 (유료 입금 확인 시 필수)', value: t.paymentReference || '', required: false },
              ]} action={v => adminWrite(`/support/tickets/${id}/payment`, v)} onDone={refresh} />}
            </>}
          </div>
        </Card>
      </div>
      <Card title="고객 화면 지원">
        <div className="oa-card-body">
          <p className="oa-muted" style={{ marginBottom: 18 }}>{customerRequest ? '결제가 완료된 신청은 동의한 범위에서 지원을 시작할 수 있습니다. 미배정 요청은 시작한 운영자에게 자동 배정됩니다.' : '고객 승인과 수납 확인이 완료되면 담당 운영자가 접속할 수 있습니다.'} 한 번의 접속은 최대 15분이며, 요청별 작업 경로와 결과가 기록됩니다.</p>
          {!closed && !canStart && <Notice>{startNotice}</Notice>}
          <div className="oa-actions">
            {canStart && <ActionButton label="지원 시작" description={`워크스페이스 #${t.workspaceId}에 ${t.accessMode === 'OPERATE' ? '조회 및 조작' : '조회 전용'} 권한으로 최대 15분간 접속합니다. 같은 요청의 이전 지원 접속은 종료됩니다.${t.accessMode === 'OPERATE' ? ' 광고 활성화와 예산 변경, 상품 등록은 실제 고객 계정에 반영됩니다.' : ''}`} action={async v => {
              const grant = await adminWrite<SupportGrant>(`/support/tickets/${id}/sessions`, v)
              startSupportSession(grant)
              window.location.assign(`/workspaces/${grant.workspaceId}/connections/meta`)
            }} onDone={refresh} />}
            {!closed && <>
              {['APPROVED', 'IN_PROGRESS'].includes(t.status) && <ActionButton label="지원 완료" description="요청을 완료하고 모든 지원 접속을 종료합니다." action={v => adminWrite(`/support/tickets/${id}/complete`, v)} onDone={refresh} />}
              <ActionButton label="요청 취소" danger description={customerRequest ? '요청을 취소하고 모든 지원 접속을 종료합니다. 결제 완료 건의 환불은 토스페이먼츠 상점관리자에서 별도로 처리해야 합니다.' : '요청을 취소하고 모든 지원 접속을 종료합니다. 기록된 입금이 자동으로 환불되지는 않습니다.'} action={v => adminWrite(`/support/tickets/${id}/cancel`, v)} onDone={refresh} />
            </>}
          </div>
        </div>
      </Card>
    </>}
    <Card title="지원 접속 이력">
      <ResourceState {...sessions} />
      {sessions.data && (sessions.data.items.length ? <Table headers={['접속', '범위', '시작', '만료 / 종료', '관리']}>{sessions.data.items.map(s => <tr key={s.id}><td>#{s.id}<small>운영자 #{s.adminUserId}</small></td><td><Status value={s.accessMode} /></td><td>{formatDate(s.startedAt)}</td><td>{formatDate(s.endedAt || s.expiresAt)}<small>{s.active ? '유효 시간 내' : s.endedAt ? '종료됨' : '만료됨'}</small></td><td>{s.active && <ActionButton label="접속 종료" danger description={`지원 접속 #${s.id}를 즉시 무효화합니다.`} action={v => adminWrite(`/support/sessions/${s.id}/end`, v)} onDone={refresh} />}</td></tr>)}</Table> : <Empty text="고객 화면에 접속하면 이력이 표시됩니다." />)}
      <Pagination data={sessions.data} onChange={setSessionPage} />
    </Card>
    <Card title="고객 화면 작업 이력">
      <ResourceState {...actions} />
      {actions.data && (actions.data.items.length ? <Table headers={['시각', '접속 / 운영자', '요청', '결과']}>{actions.data.items.map(a => <tr key={a.id}><td>{formatDate(a.startedAt)}</td><td>#{a.sessionId} / #{a.actorUserId}</td><td className="oa-wrap"><strong>{a.httpMethod}</strong> {a.path}</td><td>{a.statusCode == null ? '결과 확인 필요' : `HTTP ${a.statusCode}`}<small>{a.statusCode != null && a.statusCode >= 200 && a.statusCode < 300 ? '응답 완료' : '상태 확인'}</small></td></tr>)}</Table> : <Empty text="지원 중 발생한 조회와 변경 요청이 기록됩니다." />)}
      <Pagination data={actions.data} onChange={setActionPage} />
    </Card>
  </>
}
