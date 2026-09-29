import { useState, type FormEvent } from 'react'
import type { NaverOrderOption } from '../../types/naverOrder'
import { OrderActions, OrderField, OrderForm, OrderGrid, OrderMuted } from './NaverOrderStyles'
import { DetailAlert, DetailPrimaryButton, DetailSecondaryButton } from './WorkspaceDetailUI'
import { koreaToday } from './naverPerformanceDates'
import { validateNaverOrderDate } from './naverOrderModel'

export function NaverOrderFilters({ value, rangeTypes, statuses, busy, onApply }: {
  value: { date: string; rangeType: string; status: string }; rangeTypes: NaverOrderOption[]; statuses: NaverOrderOption[];
  busy: boolean; onApply: (value: { date: string; rangeType: string; status: string }) => void
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const message = validateNaverOrderDate(draft.date)
      || (!rangeTypes.some(item => item.code === draft.rangeType) ? '조회 기준을 선택해 주세요.' : '')
      || (draft.status && !statuses.some(item => item.code === draft.status) ? '주문 상태를 선택해 주세요.' : '')
    setError(message)
    if (!message) onApply(draft)
  }
  return <OrderForm onSubmit={submit} noValidate>
    <OrderGrid><OrderField>조회 날짜<input type="date" max={koreaToday()} value={draft.date} required disabled={busy} onChange={event => { setDraft(current => ({ ...current, date: event.target.value })); setError('') }} /></OrderField>
      <OrderField>조회 기준<select aria-label="조회 기준" value={draft.rangeType} disabled={busy} onChange={event => { setDraft(current => ({ ...current, rangeType: event.target.value })); setError('') }}>{!rangeTypes.some(item => item.code === draft.rangeType) && <option value={draft.rangeType} disabled>조회 기준을 선택해 주세요</option>}{rangeTypes.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></OrderField>
      <OrderField>주문 상태<select aria-label="주문 상태" value={draft.status} disabled={busy} onChange={event => { setDraft(current => ({ ...current, status: event.target.value })); setError('') }}><option value="">전체 상태</option>{draft.status && !statuses.some(item => item.code === draft.status) && <option value={draft.status} disabled>주문 상태를 선택해 주세요</option>}{statuses.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></OrderField>
    </OrderGrid>
    <OrderActions><DetailPrimaryButton type="submit" disabled={busy}>주문 조회</DetailPrimaryButton><DetailSecondaryButton type="button" disabled={busy} onClick={() => { const next = { ...draft, date: koreaToday() }; setDraft(next); setError(''); if (rangeTypes.some(item => item.code === next.rangeType) && (!next.status || statuses.some(item => item.code === next.status))) onApply(next) }}>오늘 조회</DetailSecondaryButton></OrderActions>
    <OrderMuted>한국 시간 00:00~23:59 기준으로 하루씩 조회합니다. 취소·반품 요청은 조회 기준을 요청일로 바꾸어 확인하세요.</OrderMuted>
    {error && <DetailAlert role="alert">{error}</DetailAlert>}
  </OrderForm>
}

export function NaverOrderSearch({ busy, onOpen }: { busy: boolean; onOpen: (id: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const id = value.trim()
    if (!/^[1-9]\d{0,19}$/.test(id)) { setError('상품 주문 번호를 숫자로 입력해 주세요.'); return }
    setError(''); onOpen(id)
  }
  return <OrderForm onSubmit={submit} noValidate><OrderField>상품 주문 번호<input inputMode="numeric" maxLength={20} placeholder="상품 주문 번호로 바로 조회" value={value} disabled={busy} onChange={event => { setValue(event.target.value); setError('') }} /></OrderField><OrderActions><DetailSecondaryButton type="submit" disabled={busy}>상품 주문 상세 조회</DetailSecondaryButton></OrderActions><OrderMuted>날짜와 상태 조건에 관계없이 선택한 스토어의 상품 주문 한 건을 조회합니다.</OrderMuted>{error && <DetailAlert role="alert">{error}</DetailAlert>}</OrderForm>
}
