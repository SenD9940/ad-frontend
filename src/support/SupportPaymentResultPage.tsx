import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import http from '../api/http'
import { readAccessToken } from '../auth/session'
import { Card, Heading, Loading, Notice } from '../admin/ui'
import { getPaymentState, paymentMessage, supportPath, type PaymentState } from './api'
import './support.css'
import '../admin/admin.css'

// StrictMode remounts must share the same approval request. A later retry only reads status.
const confirmations = new Map<string, Promise<PaymentState>>()
function confirmOnce(workspaceId: string, ticketId: string, orderId: string, paymentKey: string, amount: number) {
  const key = `${readAccessToken()}:${workspaceId}:${ticketId}:${orderId}`
  let promise = confirmations.get(key)
  if (!promise) {
    promise = http.post<{ body: PaymentState }>(`${supportPath(workspaceId, ticketId)}/payment-confirm`, { orderId, paymentKey, amount }).then(({ data }) => data.body)
    confirmations.set(key, promise)
  }
  return promise
}

export default function SupportPaymentResultPage() {
  const { workspaceId = '', ticketId = '', outcome = '' } = useParams()
  return <PaymentResult key={`${workspaceId}:${ticketId}:${outcome}`} workspaceId={workspaceId} ticketId={ticketId} outcome={outcome} />
}

function PaymentResult({ workspaceId, ticketId, outcome }: { workspaceId: string; ticketId: string; outcome: string }) {
  const [callback] = useState(() => new URLSearchParams(window.location.search))
  const orderId = callback.get('orderId') || ''
  const [state, setState] = useState<PaymentState>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(true)
  const refreshing = useRef(false)
  const validIds = /^[1-9]\d*$/.test(workspaceId) && /^[1-9]\d*$/.test(ticketId)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        if (!validIds || !['success', 'fail'].includes(outcome)) throw new Error('결제 결과 경로를 확인해 주세요.')
        if (orderId && !/^[A-Za-z0-9_-]{6,64}$/.test(orderId)) throw new Error('결제 주문번호를 확인해 주세요.')
        const paymentKey = callback.get('paymentKey')
        const amount = callback.get('amount')
        let result: PaymentState
        if (outcome === 'success' && paymentKey) {
          if (!orderId || paymentKey.length > 200 || amount !== '9900') throw new Error('결제 정보가 요청한 금액과 일치하지 않습니다. 결제 상태를 확인해 주세요.')
          result = await confirmOnce(workspaceId, ticketId, orderId, paymentKey, 9900)
        } else {
          result = await getPaymentState(workspaceId, ticketId, orderId || undefined)
        }
        if (alive) setState(result)
      } catch (caught) {
        if (alive) setError(caught instanceof Error ? caught.message : '결제 결과를 확인하지 못했습니다. 다시 결제하지 말고 상태를 확인해 주세요.')
      } finally {
        if (alive) {
          setPending(false)
          // Provider error text and payment keys are not retained in the visible URL.
          const query = orderId && /^[A-Za-z0-9_-]{6,64}$/.test(orderId) ? `?orderId=${encodeURIComponent(orderId)}` : ''
          window.history.replaceState(window.history.state, '', `${window.location.pathname}${query}`)
        }
      }
    }
    void load()
    return () => { alive = false }
  }, [workspaceId, ticketId, outcome, callback, orderId, validIds])

  return <>
    <Heading eyebrow="WORKSPACE · SUPPORT" title={state?.status === 'PAID' ? '기술 지원 결제 완료' : '기술 지원 결제 확인'} description="토스페이먼츠의 결제 결과를 확인합니다." />
    <Card><div className="oa-card-body">
      {pending ? <Loading /> : <>
        {error && <Notice error>{error}</Notice>}
        {state && <Notice>{paymentMessage(state)}</Notice>}
        {state?.status === 'PAID' && <p className="oa-muted">추가 승인이나 입금 확인 요청 없이 운영자가 지원을 시작할 수 있습니다. 취소하거나 동의 기간이 지난 요청은 접근이 허용되지 않습니다.</p>}
      </>}
      <div className="oa-actions" style={{ marginTop: 20 }}>
        <Link className="oa-button" to={`/workspaces/${workspaceId}/support`}>내 지원 요청으로</Link>
        {state?.status !== 'PAID' && validIds && <button className="oa-button oa-secondary" disabled={pending} onClick={async () => {
          if (refreshing.current) return
          refreshing.current = true; setPending(true); setError('')
          try { setState(await getPaymentState(workspaceId, ticketId, orderId || undefined)) }
          catch (caught) { setError(caught instanceof Error ? caught.message : '결제 상태를 확인하지 못했습니다.') }
          finally { refreshing.current = false; setPending(false) }
        }}>결제 상태 다시 확인</button>}
      </div>
    </div></Card>
  </>
}
