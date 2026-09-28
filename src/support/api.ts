import { useCallback, useEffect, useState } from 'react'
import http from '../api/http'

export type SupportOffer = {
  enabled: boolean
  amountKrw: number
  termsVersion: string
  termsText: string
}
export type PaymentState = {
  orderId: string
  ticketId: number
  amount: number
  status: 'READY' | 'CONFIRMING' | 'UNKNOWN' | 'WAITING_FOR_DEPOSIT' | 'PAID' | 'FAILED' | 'ABORTED' | 'EXPIRED' | 'CANCELED' | 'PARTIAL_CANCELED'
}
export type PaymentOrder = PaymentState & { orderName: string; clientKey: string; customerKey: string }

export function supportPath(workspaceId: string | number, ticketId?: string | number) {
  return `/api/workspaces/${workspaceId}/support${ticketId === undefined ? '' : `/tickets/${ticketId}`}`
}

export function useSupportResource<T>(path: string) {
  const [revision, setRevision] = useState(0)
  const key = `${path}|${revision}`
  const [state, setState] = useState<{ key: string; path: string; data?: T; error?: string }>({ key: '', path: '' })
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    http.get<{ body: T }>(path, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ key, path, data: data.body })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState(previous => ({ key, path, data: previous.path === path ? previous.data : undefined, error: error instanceof Error ? error.message : '기술 지원 정보를 불러오지 못했습니다.' }))
    })
    return () => controller.abort()
  }, [path, key])
  return { data: state.key === key && !state.error ? state.data : undefined, staleData: state.path === path ? state.data : undefined, error: state.key === key ? state.error : undefined, loading: state.key !== key, reload }
}

export async function getPaymentState(workspaceId: string | number, ticketId: string | number, orderId?: string) {
  const { data } = await http.get<{ body: PaymentState }>(`${supportPath(workspaceId, ticketId)}/payment`, { params: orderId ? { orderId } : undefined })
  return data.body
}

export function paymentMessage(payment: PaymentState) {
  const messages: Record<PaymentState['status'], string> = {
    READY: '결제를 준비했습니다. 결제하기 버튼으로 이어서 진행할 수 있습니다.',
    CONFIRMING: '결제 결과를 확인하고 있습니다. 중복 결제하지 말고 결제 상태를 다시 조회해 주세요.',
    UNKNOWN: '결제 결과를 아직 확인하지 못했습니다. 중복 결제하지 말고 결제 상태 확인으로 기존 주문을 조회해 주세요.',
    WAITING_FOR_DEPOSIT: '입금 대기 중입니다. 발급받은 입금 안내를 확인해 주세요. 새로 결제하지 않아도 됩니다.',
    PAID: '결제가 완료되었습니다. 운영자가 요청 내용을 확인하고 기술 지원을 시작할 수 있습니다.',
    FAILED: '결제가 완료되지 않았습니다. 동의 기간 내에 결제를 다시 진행할 수 있습니다.',
    ABORTED: '결제가 중단되었습니다. 동의 기간 내에 결제를 다시 진행할 수 있습니다.',
    EXPIRED: '결제 주문이 만료되었습니다. 동의 기간 내에 결제를 다시 진행할 수 있습니다.',
    CANCELED: '결제가 취소되었습니다. 추가 지원이 필요하면 새 요청을 신청해 주세요.',
    PARTIAL_CANCELED: '결제 금액의 일부가 취소되었습니다. 나머지 환불은 운영자에게 확인해 주세요.',
  }
  return messages[payment.status] || '결제 상태를 확인하지 못했습니다. 중복 결제하지 말고 다시 조회해 주세요.'
}
