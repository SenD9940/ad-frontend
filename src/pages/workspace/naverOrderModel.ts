import { koreaToday } from './naverPerformanceDates'

export const naverOrderRangeLabels: Record<string, string> = {
  PAYED_DATETIME: '결제일', ORDERED_DATETIME: '주문일', DISPATCHED_DATETIME: '발송 처리일',
  CLAIM_REQUESTED_DATETIME: '취소·반품 요청일', CLAIM_COMPLETED_DATETIME: '취소·반품 완료일',
  PURCHASE_DECIDED_DATETIME: '구매 확정일', COLLECT_COMPLETED_DATETIME: '수거 완료일',
  GIFT_RECEIVED_DATETIME: '선물 수락일', HOPE_DELIVERY_INFO_CHANGED_DATETIME: '배송 희망일 변경일',
}
export const naverOrderStatusLabels: Record<string, string> = {
  PAYMENT_WAITING: '결제 대기', PAYED: '결제 완료', DELIVERING: '배송 중', DELIVERED: '배송 완료',
  PURCHASE_DECIDED: '구매 확정', EXCHANGED: '교환', CANCELED: '취소', RETURNED: '반품', CANCELED_BY_NOPAYMENT: '미결제 취소',
}
export const naverClaimLabels: Record<string, string> = {
  CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환', CANCEL_REQUEST: '취소 요청', CANCELING: '취소 처리 중',
  CANCEL_DONE: '취소 완료', CANCEL_REJECT: '취소 철회', RETURN_REQUEST: '반품 요청', EXCHANGE_REQUEST: '교환 요청',
  COLLECTING: '수거 중', COLLECT_DONE: '수거 완료', EXCHANGE_REDELIVERING: '교환 재배송 중', RETURN_DONE: '반품 완료',
  EXCHANGE_DONE: '교환 완료', RETURN_REJECT: '반품 철회', EXCHANGE_REJECT: '교환 철회', PURCHASE_DECISION_HOLDBACK: '구매 확정 보류',
  PURCHASE_DECISION_REQUEST: '구매 확정 요청', PURCHASE_DECISION_HOLDBACK_RELEASE: '구매 확정 보류 해제',
  ADMIN_CANCELING: '직권 취소 중', ADMIN_CANCEL_DONE: '직권 취소 완료', ADMIN_CANCEL_REJECT: '직권 취소 철회',
}
export const naverActionLabels: Record<string, string> = {
  CONFIRM: '발주 확인', DISPATCH: '발송 처리', APPROVE_CANCEL: '취소 승인', APPROVE_RETURN: '반품 승인',
}
export const naverDeliveryLabels: Record<string, string> = {
  COLLECT_REQUEST: '수거 요청', COLLECT_WAIT: '수거 대기', COLLECT_CARGO: '집화', DELIVERY_COMPLETION: '배송 완료',
  DELIVERING: '배송 중', DELIVERY_FAIL: '배송 실패', WRONG_INVOICE: '오류 송장', COLLECT_CARGO_FAIL: '집화 실패', COLLECT_CARGO_CANCEL: '집화 취소', NOT_TRACKING: '배송 추적 없음',
}
export const naverCollectLabels: Record<string, string> = {
  NOT_REQUESTED: '수거 미요청', COLLECT_REQUEST_TO_AGENT: '수거 지시 완료', COLLECT_REQUEST_TO_DELIVERY_COMPANY: '수거 요청',
  COLLECT_WAITING: '택배사 수거 예정', DELIVERING: '수거 진행 중', DELIVERED: '수거 완료', DELIVERY_FAILED: '배송 실패', COLLECT_FAILED: '수거 실패', WRONG_INVOICE: '오류 송장', COLLECT_CANCELED: '수거 취소',
}
export const naverClaimReasonLabels: Record<string, string> = {
  INTENT_CHANGED: '구매 의사 취소', COLOR_AND_SIZE: '색상 및 사이즈 변경', WRONG_ORDER: '다른 상품 잘못 주문', PRODUCT_UNSATISFIED: '서비스 불만족',
  DELAYED_DELIVERY: '배송 지연', SOLD_OUT: '상품 품절', DROPPED_DELIVERY: '배송 누락', NOT_YET_DELIVERY: '미배송', BROKEN: '상품 파손', INCORRECT_INFO: '상품 정보 상이',
  WRONG_DELIVERY: '오배송', WRONG_OPTION: '색상 등 다른 상품 잘못 배송', SIMPLE_INTENT_CHANGED: '단순 변심', MISTAKE_ORDER: '주문 실수', ETC: '기타',
  DELAYED_DELIVERY_BY_PURCHASER: '배송 지연', INCORRECT_INFO_BY_PURCHASER: '상품 정보 상이', PRODUCT_UNSATISFIED_BY_PURCHASER: '서비스 불만족',
  NOT_YET_DISCUSSION: '상호 협의 미완료', OUT_OF_STOCK: '재고 부족', SALE_INTENT_CHANGED: '판매 의사 변경', NOT_YET_PAYMENT: '미결제', NOT_YET_RECEIVE: '상품 미수취',
  WRONG_DELAYED_DELIVERY: '오배송 및 지연', BROKEN_AND_BAD: '파손 및 불량', RECEIVING_DUE_DATE_OVER: '수락 기한 만료', RECEIVER_MISMATCHED: '수신인 불일치',
  GIFT_INTENT_CHANGED: '보내기 취소', GIFT_REFUSAL: '선물 거절', MINOR_RESTRICTED: '상품 수신 불가', RECEIVING_BLOCKED: '상품 수신 불가',
  UNDER_QUANTITY: '주문 수량 미달', ASYNC_FAIL_PAYMENT: '결제 승인 실패', ASYNC_LONG_WAIT_PAYMENT: '결제 승인 실패', FAMILY_PAY_REJECTED: '패밀리결제 거절',
}
export const naverHoldbackLabels: Record<string, string> = {
  HOLDBACK: '보류 중', RELEASED: '보류 해제', RETURN_DELIVERYFEE: '반품 배송비 청구', EXTRAFEEE: '추가 비용 청구', RETURN_DELIVERYFEE_AND_EXTRAFEEE: '반품 배송비 및 추가 비용 청구',
  RETURN_PRODUCT_NOT_DELIVERED: '반품 상품 미입고', ETC: '기타 사유', EXCHANGE_DELIVERYFEE: '교환 배송비 청구', EXCHANGE_EXTRAFEE: '추가 교환 비용 청구',
  EXCHANGE_PRODUCT_READY: '교환 상품 준비 중', EXCHANGE_PRODUCT_NOT_DELIVERED: '교환 상품 미입고', SELLER_CONFIRM_NEED: '판매자 확인 필요', PURCHASER_CONFIRM_NEED: '구매자 확인 필요', SELLER_REMIT: '판매자 직접 송금',
}
export function naverOrderLabel(value: string | null, labels: Record<string, string>): string { return value ? labels[value] || value : '—' }
export function naverOrderMoney(value: number | null): string { return value === null ? '—' : `${value.toLocaleString('ko-KR')}원` }
export function naverOrderTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date) : '—'
}
export function validateNaverOrderDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '조회할 날짜를 올바르게 입력해 주세요.'
  const time = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return '조회할 날짜를 올바르게 입력해 주세요.'
  return value > koreaToday() ? '한국 시간 기준 오늘까지 조회할 수 있습니다.' : ''
}
