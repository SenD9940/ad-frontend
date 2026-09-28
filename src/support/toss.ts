import { useEffect, useRef, useState } from 'react'
import http from '../api/http'
import { paymentMessage, supportPath, type PaymentOrder } from './api'

type PaymentWindow = { on: (event: 'paymentRequest' | 'cancel', callback: () => void) => void; destroy: () => Promise<void> | void }
type Widgets = {
  setAmount: (amount: { currency: 'KRW'; value: number }) => Promise<void>
  renderPaymentWindow: () => Promise<PaymentWindow>
  requestPayment: (request: { orderId: string; orderName: string; successUrl: string; failUrl: string }) => Promise<void>
}
type TossFactory = (clientKey: string) => { widgets: (options: { customerKey: string }) => Widgets }
declare global { interface Window { TossPayments?: TossFactory } }

let sdk: Promise<TossFactory> | undefined
function loadToss(): Promise<TossFactory> {
  if (window.TossPayments) return Promise.resolve(window.TossPayments)
  if (!sdk) sdk = new Promise<TossFactory>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.async = true
    const fail = () => { script.remove(); sdk = undefined; reject(new Error('결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')) }
    const timer = window.setTimeout(fail, 15000)
    script.onload = () => { window.clearTimeout(timer); if (window.TossPayments) resolve(window.TossPayments); else fail() }
    script.onerror = () => { window.clearTimeout(timer); fail() }
    document.head.appendChild(script)
  })
  return sdk
}

export function useTossSupportPayment(workspaceId: string, reload: () => void) {
  const [pendingTicketId, setPendingTicketId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const busy = useRef(false)
  const alive = useRef(false)
  const modal = useRef<PaymentWindow | null>(null)
  const dismiss = () => {
    const current = modal.current
    modal.current = null
    if (current) void Promise.resolve().then(() => current.destroy()).catch(() => undefined)
  }
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; dismiss() }
  }, [])

  async function start(ticketId: number) {
    if (busy.current) return
    busy.current = true; setPendingTicketId(ticketId); setMessage('')
    let finished = false
    const finish = (text = '') => {
      if (finished) return
      finished = true; dismiss(); busy.current = false
      if (alive.current) { setPendingTicketId(null); setMessage(text); reload() }
    }
    try {
      const { data } = await http.post<{ body: PaymentOrder }>(`${supportPath(workspaceId, ticketId)}/payment-order`)
      if (!alive.current) return
      const order = data.body
      if (order.status !== 'READY') { finish(paymentMessage(order)); return }
      if (order.amount !== 9900 || !order.clientKey || !order.customerKey || !/^[A-Za-z0-9_-]{6,64}$/.test(order.orderId)) throw new Error('결제 정보를 확인하지 못했습니다. 요청 목록을 새로고침해 주세요.')
      const toss = await loadToss()
      if (!alive.current) return
      const widgets = toss(order.clientKey).widgets({ customerKey: order.customerKey })
      await widgets.setAmount({ currency: 'KRW', value: order.amount })
      if (!alive.current) return
      const paymentWindow = await widgets.renderPaymentWindow()
      if (!alive.current) { void Promise.resolve().then(() => paymentWindow.destroy()).catch(() => undefined); return }
      modal.current = paymentWindow
      let requested = false
      paymentWindow.on('cancel', () => finish('결제창을 닫았습니다. 요청 목록에서 결제를 이어갈 수 있습니다.'))
      paymentWindow.on('paymentRequest', () => {
        if (requested || finished || !alive.current) return
        requested = true
        const base = `${window.location.origin}/workspaces/${workspaceId}/support/${ticketId}/payment`
        void widgets.requestPayment({ orderId: order.orderId, orderName: order.orderName,
          successUrl: `${base}/success`, failUrl: `${base}/fail?orderId=${encodeURIComponent(order.orderId)}`,
        }).catch(() => finish('결제를 진행하지 못했습니다. 요청 목록에서 결제 상태를 확인해 주세요.'))
      })
    } catch (caught) { finish(caught instanceof Error ? caught.message : '결제를 시작하지 못했습니다.') }
  }

  return { start, pendingTicketId, message }
}
