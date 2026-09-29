import { useModal } from '../components/common/useModal'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import http, { ApiError } from '../api/http'
import { formatDate, number } from '../admin/format'
import type { Page, SupportTicket } from '../admin/types'
import { ActionButton, Card, Empty, Heading, Notice, Pagination, ResourceState, Status } from '../admin/ui'
import { getPaymentState, paymentMessage, supportPath, useSupportResource, type PaymentState, type SupportOffer } from './api'
import { localTime } from './session'
import SupportRequestForm from './SupportRequestForm'
import { useTossSupportPayment } from './toss'
import './support.css'
import '../admin/admin.css'

export default function CustomerSupportPage() {
  const { workspaceId = '' } = useParams()
  return <WorkspaceSupport key={workspaceId} workspaceId={workspaceId} />
}

function WorkspaceSupport({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(true)
  const [now, setNow] = useState(Date.now)
  const offer = useSupportResource<SupportOffer>(`${supportPath(workspaceId)}/offer`)
  const displayOffer = offer.data ?? offer.staleData
  const tickets = useSupportResource<Page<SupportTicket>>(`${supportPath(workspaceId)}/tickets?page=${page}&size=20`)
  const { reload: reloadOffer } = offer
  const { reload: reloadTickets } = tickets
  const reload = useCallback(() => { reloadOffer(); reloadTickets() }, [reloadOffer, reloadTickets])
  const payments = useTossSupportPayment(workspaceId, reload)
  useEffect(() => { const interval = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(interval) }, [])

  function created(ticket: SupportTicket) {
    setShowForm(false); setPage(0); reload()
    void payments.start(ticket.id)
  }

  return <>
    <Heading eyebrow="WORKSPACE · SUPPORT" title="기술 지원" description="도움이 필요한 작업을 신청하면 운영자가 이 워크스페이스에서 직접 지원합니다.">
      <button className="oa-button oa-secondary" onClick={reload}>새로고침</button>
      {!showForm && <button className="oa-button" disabled={payments.pendingTicketId !== null} onClick={() => setShowForm(true)}>새 지원 신청</button>}
    </Heading>
    <ResourceState loading={offer.loading} error={offer.error} reload={reloadOffer} />
    {displayOffer && showForm && <SupportRequestForm workspaceId={workspaceId} offer={displayOffer} disabled={offer.loading || !!offer.error || payments.pendingTicketId !== null} onCreated={created} onTermsChanged={reloadOffer} />}
    {payments.message && <Notice>{payments.message}</Notice>}
    <div className="support-section-heading"><h2>내 지원 요청</h2><p>신청 내용, 결제와 동의 기간을 확인하세요. 워크스페이스 소유자만 신청과 접근 동의를 관리할 수 있습니다.</p></div>
    <ResourceState loading={tickets.loading} error={tickets.error} reload={reloadTickets} />
    {tickets.data && (tickets.data.items.length ? tickets.data.items.map(ticket => <CustomerTicket key={`${ticket.id}:${ticket.updatedAt}`} ticket={ticket} now={now} offerEnabled={offer.data?.enabled === true} paymentPending={payments.pendingTicketId !== null} startPayment={payments.start} reload={reload} />) : <Card><Empty text="등록된 기술 지원 요청이 없습니다. 위에서 도움이 필요한 작업을 신청해 주세요." /></Card>)}
    <Pagination data={tickets.data} onChange={setPage} />
  </>
}

type TicketProps = { ticket: SupportTicket; now: number; offerEnabled: boolean; paymentPending: boolean; startPayment: (ticketId: number) => Promise<void>; reload: () => void }

function CustomerTicket({ ticket: t, now, offerEnabled, paymentPending, startPayment, reload }: TicketProps) {
  const modal = useModal()
  const [consent, setConsent] = useState(false)
  const [checking, setChecking] = useState(false)
  const checkingRef = useRef(false)
  const [payment, setPayment] = useState<PaymentState | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const customerRequest = t.requestSource === 'CUSTOMER'
  const closed = ['COMPLETED', 'CANCELLED'].includes(t.status)
  const consentValid = !!t.approvalExpiresAt && localTime(t.approvalExpiresAt) > now
  const retryablePayment = !payment || ['READY', 'FAILED', 'ABORTED', 'EXPIRED'].includes(payment.status)
  const canPay = customerRequest && !closed && ['APPROVED', 'IN_PROGRESS'].includes(t.status) && t.paymentStatus === 'UNPAID' && consentValid && offerEnabled && retryablePayment && !recoveryRequired

  async function checkPayment() {
    if (checkingRef.current) return
    checkingRef.current = true; setChecking(true); setPaymentNote('')
    try {
      const state = await getPaymentState(t.workspaceId, t.id)
      setPayment(state); setPaymentNote(paymentMessage(state)); setRecoveryRequired(false)
      void modal.info({ title: '결제 상태 확인', message: paymentMessage(state) })
      if (state.status === 'PAID' && t.paymentStatus !== 'PAID') reload()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setPayment(null); setRecoveryRequired(false); setPaymentNote('아직 생성된 결제 주문이 없습니다. 결제하기 버튼으로 진행해 주세요.')
        void modal.info({ title: '결제 주문 안내', message: '아직 생성된 결제 주문이 없습니다. 결제하기 버튼으로 진행해 주세요.' })
      } else {
        setRecoveryRequired(true)
        const message = `${caught instanceof Error ? caught.message : '결제 상태를 조회하지 못했습니다.'} 중복 결제하지 말고 결제 상태를 다시 확인해 주세요.`
        setPaymentNote(message)
        void modal.error({ title: '결제 상태 확인 필요', message })
      }
    } finally { checkingRef.current = false; setChecking(false) }
  }

  return <Card title={t.title} extra={<Status value={t.status} label={customerRequest && t.status === 'APPROVED' ? '지원 접수' : undefined} />}><div className="oa-card-body">
    <div className="oa-status-strip"><Status value={t.accessMode} /><Status value={t.paymentStatus} label={customerRequest ? (t.paymentStatus === 'PAID' ? '결제 완료' : t.paymentStatus === 'UNPAID' ? '결제 대기' : undefined) : undefined} /><span className="oa-muted">{t.assignedAdminId == null ? '운영자 배정 대기' : `담당 운영자 #${t.assignedAdminId}`} · 요청 #{t.id}</span></div>
    <dl className="oa-detail-grid"><div><dt>기술 지원료</dt><dd>{number(t.amountKrw)}원 · {customerRequest ? '토스페이먼츠 결제' : '수동 입금 확인'}</dd></div><div><dt>접근 동의 만료일</dt><dd>{formatDate(t.approvalExpiresAt)}</dd></div><div><dt>신청일</dt><dd>{formatDate(t.createdAt)}</dd></div><div><dt>접근 동의일</dt><dd>{formatDate(t.approvedAt)}</dd></div></dl>
    <p className="oa-note" style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>{t.description}</p>
    {customerRequest ? <>
      <p className="oa-muted" style={{ marginTop: 16 }}>신청할 때 선택한 접근 범위에 동의했습니다. 결제가 확인되면 운영자가 동의 기간 내에 지원을 시작할 수 있습니다.</p>
      {t.termsSnapshot && <button type="button" className="oa-button oa-secondary" onClick={() => void modal.info({ title: '신청 시 동의한 이용 조건', message: <><p>약관 버전: {t.termsVersion}</p><div className="support-terms-text">{t.termsSnapshot}</div></> })}>신청 시 동의한 이용 조건</button>}
      {t.paymentStatus === 'PAID' && !closed && consentValid && <Notice>{t.status === 'IN_PROGRESS' ? '운영자가 기술 지원을 진행 중입니다.' : '결제가 완료되었습니다. 운영자가 요청 내용을 확인하고 지원을 준비합니다.'}</Notice>}
      {t.status === 'CANCELLED' && t.paymentStatus === 'PAID' && <Notice>지원 요청이 취소되었습니다. 운영자가 작업 내역과 환불 여부를 확인합니다. 요청 취소만으로 결제가 자동 환불되지는 않습니다.</Notice>}
      {!closed && !consentValid && <Notice>접근 동의 기간이 만료되어 운영자가 추가로 접속할 수 없습니다. 지원이 필요하면 새 요청을 신청해 주세요.</Notice>}
      {!closed && t.paymentStatus === 'UNPAID' && !offerEnabled && <Notice>현재 결제를 준비 중입니다. 결제 설정이 완료되면 이어서 결제할 수 있습니다.</Notice>}
      {paymentNote && <Notice>{paymentNote}</Notice>}
      <div className="oa-actions" style={{ marginTop: 16 }}>
        {canPay && <button className="oa-button" disabled={paymentPending || checking} onClick={() => void startPayment(t.id)}>{paymentPending ? '결제 진행 중…' : `${number(t.amountKrw)}원 결제하기`}</button>}
        <button className="oa-button oa-secondary" disabled={checking || paymentPending} onClick={() => void checkPayment()}>{checking ? '결제 상태 확인 중…' : '결제 상태 확인'}</button>
      </div>
    </> : <>
      <p className="oa-muted" style={{ marginTop: 16 }}>{t.accessMode === 'OPERATE' ? '승인하면 이 워크스페이스의 Meta 광고·캠페인·광고세트 이름, 상태, 일 예산 변경과 광고 등록, 저장된 자산 편집, 스마트스토어 상품 등록을 운영자가 진행할 수 있습니다. 실제 광고 집행과 판매에 영향을 줄 수 있습니다.' : '승인하면 운영자가 이 워크스페이스의 연결된 자산, 광고 성과, 스마트스토어 상품과 판매 성과를 조회할 수 있습니다. 등록·수정 권한은 부여되지 않습니다.'} 계정 비밀번호나 워크스페이스 멤버 관리는 허용되지 않습니다.</p>
      {t.status === 'REQUESTED' && <><label className="support-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>지원 내용, 접근 범위, 지원료 {number(t.amountKrw)}원을 확인했으며 이 워크스페이스의 접근에 동의합니다. 승인은 결제를 실행하지 않습니다.</span></label>{consent && <ActionButton label="기술 지원 승인" description={`${t.title} · ${number(t.amountKrw)}원 · ${t.accessMode === 'OPERATE' ? '조회 및 조작' : '조회 전용'} 접근을 7일간 허용합니다.`} action={v => http.post(`${supportPath(t.workspaceId, t.id)}/approve`, v)} onDone={reload} />}</>}
    </>}
    {!closed && <div className="oa-actions" style={{ marginTop: 15 }}><ActionButton label={customerRequest ? '지원 요청 취소' : t.status === 'REQUESTED' ? '지원 요청 거절' : '지원 승인 철회'} danger description={`이 요청의 모든 지원 접속을 종료하고 이후 접근을 차단합니다. 이미 실행된 변경은 되돌려지지 않습니다. ${customerRequest && t.paymentStatus === 'PAID' ? '결제 후 취소 건은 운영자가 작업 내역과 환불 여부를 확인하며, 결제가 자동 환불되지는 않습니다.' : '요청 취소만으로 결제가 자동 환불되지는 않습니다.'}`} action={v => http.post(`${supportPath(t.workspaceId, t.id)}/revoke`, v)} onDone={reload} /></div>}
  </div></Card>
}
