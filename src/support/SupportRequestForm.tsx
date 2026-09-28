import { useRef, useState, type FormEvent } from 'react'
import http, { ApiError } from '../api/http'
import { number } from '../admin/format'
import type { SupportTicket } from '../admin/types'
import { Card, Field, Notice } from '../admin/ui'
import { supportPath, type SupportOffer } from './api'

type Props = { workspaceId: string; offer: SupportOffer; disabled?: boolean; onCreated: (ticket: SupportTicket) => void; onTermsChanged: () => void }

export default function SupportRequestForm({ workspaceId, offer, disabled = false, onCreated, onTermsChanged }: Props) {
  const [mode, setMode] = useState<'READ_ONLY' | 'OPERATE'>('READ_ONLY')
  const [consentedScope, setConsentedScope] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const pendingRef = useRef(false)
  const scope = `${offer.termsVersion}:${offer.amountKrw}:${mode}`
  const consent = consentedScope === scope

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pendingRef.current || disabled || !offer.enabled || !consent) return
    const fields = new FormData(event.currentTarget)
    const title = String(fields.get('title') || '').trim()
    const description = String(fields.get('description') || '').trim()
    if (!title || !description) { setError('지원 제목과 도움이 필요한 내용을 입력해 주세요.'); return }
    pendingRef.current = true; setPending(true); setError('')
    try {
      const { data } = await http.post<{ body: SupportTicket }>(`${supportPath(workspaceId)}/tickets`, {
        title, description, accessMode: mode, termsVersion: offer.termsVersion, acceptedTerms: true,
      })
      onCreated(data.body)
    } catch (caught) {
      setConsentedScope(null)
      setError(caught instanceof Error ? caught.message : '지원 요청을 등록하지 못했습니다.')
      if (caught instanceof ApiError && caught.status === 409) onTermsChanged()
    }
    finally { pendingRef.current = false; setPending(false) }
  }

  return <Card title="새 기술 지원 신청"><form className="oa-card-body" onSubmit={submit}>
    <div className="support-price-summary"><div><strong>도움이 필요한 작업을 알려주세요</strong><p>현재 워크스페이스의 작업 1건을 지원합니다. 광고 집행 비용과 상품 구매 대금은 포함하지 않습니다.</p></div><div><strong>{number(offer.amountKrw)}원</strong><span>토스페이먼츠 결제</span></div></div>
    {!offer.enabled && <Notice>결제 준비 중입니다. 결제 설정이 완료되면 기술 지원을 신청할 수 있습니다.</Notice>}
    <fieldset className="support-request-fields" disabled={pending || disabled || !offer.enabled}>
      <Field label="지원 제목"><input name="title" required maxLength={150} placeholder="예: 메타 광고의 예산과 운영 상태를 점검하고 싶어요" /></Field>
      <Field label="도움이 필요한 내용"><textarea name="description" required maxLength={1000} rows={4} placeholder="대상 채널과 현재 상황, 원하는 작업을 알려주세요. 비밀번호·인증 토큰·카드 정보는 입력하지 마세요." /></Field>
      <div className="support-mode-options" role="group" aria-label="허용할 접근 범위">
        {([{ value: 'READ_ONLY', title: '조회만', description: '연결된 자산, 광고 성과, 상품과 판매 성과 확인' }, { value: 'OPERATE', title: '조회 및 조작', description: '조회와 함께 광고 수정·등록, 자산 편집, 상품 등록' }] as const).map(option => <label key={option.value} className={`support-mode-option ${mode === option.value ? 'selected' : ''}`}><input type="radio" name="accessMode" value={option.value} checked={mode === option.value} onChange={() => { setMode(option.value); setConsentedScope(null) }} /><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}
      </div>
      {mode === 'OPERATE' && <Notice>조회 및 조작은 실제 광고 집행과 판매에 영향을 줄 수 있습니다. 신청한 작업에 필요한 범위의 접근만 허용합니다.</Notice>}
      <details className="support-terms"><summary>기술 지원 이용 및 화면 접근 동의 내용 확인</summary><p className="oa-muted">약관 버전: {offer.termsVersion}</p><div className="support-terms-text">{offer.termsText}</div></details>
      <label className="support-consent"><input type="checkbox" checked={consent} onChange={event => setConsentedScope(event.target.checked ? scope : null)} /><span>기술 지원 이용 조건과 지원료 {number(offer.amountKrw)}원을 확인했으며, 선택한 {mode === 'OPERATE' ? '조회 및 조작' : '조회'} 범위의 화면 접근에 동의합니다. 결제 확인 후 운영자가 별도 승인 요청 없이 지원을 시작할 수 있습니다.</span></label>
      <p className="oa-muted">접근 동의는 신청부터 7일간, 개별 접속은 최대 15분간 유효합니다. 지원 요청을 취소하면 이후 접근이 차단됩니다.</p>
    </fieldset>
    {error && <Notice error>{error}</Notice>}
    <div className="oa-actions" style={{ marginTop: 20 }}><button className="oa-button" disabled={pending || disabled || !offer.enabled || !consent}>{pending ? '신청 중…' : `신청하고 ${number(offer.amountKrw)}원 결제`}</button></div>
  </form></Card>
}
