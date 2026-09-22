import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { useNaverConnections } from '../../hooks/useNaverConnections'
import { NAVER_CHANNEL_SELECT_MAX, type NaverConnectRequest } from '../../types/platform'
import { Field, FieldError, Hint, Input, Label, LabelRow, TogglePassword } from '../../components/auth/AuthFormUI'
import {
  DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint,
  DetailIcon, DetailLead, DetailPage, DetailPanel, DetailPanelBody, DetailPrimaryButton,
  DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

type FormTarget = { id?: number; name?: string }
type NaverTokenType = NaverConnectRequest['tokenType']

export default function NaverConnectionsPage() {
  const {
    isOwner, connections, loading, error, reload, channels, channelErrors, channelLoading,
    selected, connecting, connectError, connectMessage, connect, savingId, saveError,
    saveMessage, toggleChannel, selectAllChannels, clearChannelSelection, saveChannels,
    reloadChannels,
  } = useNaverConnections()
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const busy = connecting || savingId !== null

  async function handleConnect(request: NaverConnectRequest) {
    if (await connect(request)) setFormTarget(null)
  }

  return (
    <DetailPage>
      <DetailHeader>
        <div>
          <DetailEyebrow>플랫폼 연결 / Naver</DetailEyebrow>
          <DetailTitle>네이버 연결</DetailTitle>
          <DetailLead>스마트스토어를 연결하고 팀과 함께 사용할 채널을 선택하세요.</DetailLead>
        </div>
        {!loading && isOwner && !formTarget && (
          <ConnectButton type="button" onClick={() => setFormTarget({})} disabled={busy}>
            <DetailIcon name="plus" size={16} />
            {connections.length ? '네이버 계정 추가' : '네이버 계정 연결'}
          </ConnectButton>
        )}
      </DetailHeader>

      {connectMessage && <DetailAlert $success role="status">{connectMessage}</DetailAlert>}
      {connectError && !isOwner && <DetailAlert role="alert">{connectError}</DetailAlert>}
      {saveError && <DetailAlert role="alert">{saveError}</DetailAlert>}
      {saveMessage && <DetailAlert $success role="status">{saveMessage}</DetailAlert>}

      {formTarget && isOwner && (
        <NaverConnectForm
          key={formTarget.id ?? 'new'}
          target={formTarget}
          connecting={connecting}
          disabled={busy || loading}
          error={connectError}
          onSubmit={handleConnect}
          onCancel={() => setFormTarget(null)}
        />
      )}

      <ContentGrid>
        <DetailPanel>
          <PanelHeading>
            <PlatformIdentity><NaverMark aria-hidden="true">N</NaverMark><div><h2>연결된 네이버 계정</h2><p>네이버 커머스 API · 스마트스토어</p></div></PlatformIdentity>
            {!loading && !error && <DetailBadge $tone={connections.length ? 'success' : undefined}>{connections.length}개 연결</DetailBadge>}
          </PanelHeading>
          {loading ? <DetailStatus role="status">네이버 연결 정보를 불러오는 중…</DetailStatus> : error ? (
            <DetailEmpty><h2>연결 정보를 불러오지 못했어요</h2><DetailAlert role="alert">{error}</DetailAlert><DetailSecondaryButton type="button" onClick={reload} disabled={busy}>다시 시도</DetailSecondaryButton></DetailEmpty>
          ) : connections.length === 0 ? (
            <DetailEmpty>
              <EmptyMark aria-hidden="true">N</EmptyMark>
              <h2>첫 스마트스토어를 연결해 보세요</h2>
              <p>{isOwner ? '커머스 API에서 발급받은 애플리케이션 정보로 판매자 계정을 연결할 수 있어요.' : '워크스페이스 소유자가 네이버 계정을 연결하면 팀원도 채널을 조회하고 저장할 수 있어요.'}</p>
              {isOwner ? !formTarget && <ConnectButton type="button" onClick={() => setFormTarget({})} disabled={busy}>네이버 계정 연결</ConnectButton> : <DetailBadge>소유자의 연결을 기다리고 있어요</DetailBadge>}
            </DetailEmpty>
          ) : (
            <ConnectionList aria-label="연결된 네이버 계정">
              {connections.map((connection) => {
                const available = channels[connection.id] ?? []
                const chosen = new Set(selected[connection.id] ?? [])
                const selectedCount = available.filter((channel) => chosen.has(channel.channelNo)).length
                const saved = connection.assets.filter((asset) => asset.platformType === 'NAVER_SMART_STORE' && asset.assetType === 'STORE')
                const savedNos = new Set(saved.map((asset) => asset.externalId))
                const hasNewSelection = available.some((channel) => chosen.has(channel.channelNo) && !savedNos.has(String(channel.channelNo)))
                const channelError = channelErrors[connection.id]
                const fetching = channelLoading[connection.id]
                return (
                  <ConnectionCard key={connection.id}>
                    <ConnectionHeading>
                      <div><h3>{connection.accountName || '네이버 판매자 계정'}</h3><p>판매자 UID {connection.externalAccountId}</p></div>
                      <DetailBadge $tone={connection.requiresReauth ? 'warning' : 'success'}>{connection.requiresReauth ? '재연결 필요' : '연결됨'}</DetailBadge>
                    </ConnectionHeading>
                    <SavedSection>
                      <SectionLabel>저장된 스마트스토어 <span>{saved.length}</span></SectionLabel>
                      {saved.length ? <SavedList aria-label="저장된 스마트스토어">{saved.map((asset) => <li key={asset.id}><DetailIcon name="check" size={13} />{asset.name || asset.externalId}</li>)}</SavedList> : <DetailHint>사용할 채널을 선택하고 저장하면 여기에 표시됩니다.</DetailHint>}
                    </SavedSection>
                    {connection.requiresReauth ? (
                      <>
                        <DetailAlert role="status">네이버 계정을 다시 연결해야 합니다. {isOwner ? '발급받은 애플리케이션 정보와 판매자 권한을 확인해 주세요.' : '워크스페이스 소유자에게 재연결을 요청해 주세요.'}</DetailAlert>
                        {isOwner && <InlineConnect type="button" onClick={() => setFormTarget({ id: connection.id, name: connection.accountName })} disabled={busy}>네이버 계정 다시 연결</InlineConnect>}
                      </>
                    ) : (
                      <ChannelSection>
                        <SelectionHeading><h3>사용할 채널 선택</h3><DetailSecondaryButton type="button" onClick={() => reloadChannels(connection.id)} disabled={busy || fetching}>채널 새로고침</DetailSecondaryButton></SelectionHeading>
                        {fetching ? <DetailStatus role="status">스마트스토어 채널을 불러오는 중…</DetailStatus> : channelError ? (
                          <ChannelError>
                            <DetailAlert role="alert">{channelError}</DetailAlert>
                            <DetailHint>애플리케이션 권한과 허용 IP를 확인한 뒤 다시 조회해 주세요.{isOwner ? ' 인증 정보를 변경했다면 계정을 다시 연결할 수 있어요.' : ' 인증 문제는 워크스페이스 소유자에게 문의해 주세요.'}</DetailHint>
                            {isOwner && <DetailSecondaryButton type="button" onClick={() => setFormTarget({ id: connection.id, name: connection.accountName })} disabled={busy}>네이버 계정 다시 연결</DetailSecondaryButton>}
                          </ChannelError>
                        ) : available.length === 0 ? (
                          <ChannelEmpty><DetailIcon name="layers" size={24} /><DetailHint>조회 가능한 스마트스토어 채널이 없습니다. 연결한 판매자 계정의 채널과 접근 권한을 확인해 주세요.</DetailHint></ChannelEmpty>
                        ) : (
                          <>
                            <BulkActions>
                              <div role="group" aria-label={`${connection.accountName || '네이버 계정'} 채널 일괄 선택`}>
                                <DetailSecondaryButton type="button" onClick={() => selectAllChannels(connection.id)} disabled={busy || selectedCount === available.length}>전체 선택</DetailSecondaryButton>
                                <DetailSecondaryButton type="button" onClick={() => clearChannelSelection(connection.id)} disabled={busy || chosen.size === 0}>전체 해제</DetailSecondaryButton>
                              </div>
                              <span role="status">전체 {available.length}개 중 {selectedCount}개 선택 · 최대 {NAVER_CHANNEL_SELECT_MAX}개</span>
                            </BulkActions>
                            <ChannelList>
                              {available.map((channel) => {
                                const checkboxId = `naver-${connection.id}-${channel.channelNo}`
                                const url = safeStoreUrl(channel.url)
                                return (
                                  <ChannelRow key={channel.channelNo} $selected={chosen.has(channel.channelNo)}>
                                    <ChannelLabel htmlFor={checkboxId}>
                                      <input id={checkboxId} type="checkbox" checked={chosen.has(channel.channelNo)} onChange={() => toggleChannel(connection.id, channel.channelNo)} disabled={busy} />
                                      <ChannelText><strong>{channel.name || `스마트스토어 ${channel.channelNo}`}</strong><small>채널 번호 {channel.channelNo}</small></ChannelText>
                                    </ChannelLabel>
                                    {url && <StoreLink href={url} target="_blank" rel="noopener noreferrer" aria-label={`${channel.name || '스마트스토어'} 방문 (새 창)`}>스토어 방문 <span aria-hidden="true">↗</span></StoreLink>}
                                  </ChannelRow>
                                )
                              })}
                            </ChannelList>
                            <DetailHint>선택을 해제해도 이미 저장된 채널은 삭제되지 않습니다.</DetailHint>
                            <SaveRow>
                              <DetailHint>{hasNewSelection ? '선택한 채널을 저장하면 팀과 함께 사용할 수 있어요.' : selectedCount ? '선택한 채널은 이미 저장되어 있습니다.' : '저장할 채널을 선택해 주세요.'}</DetailHint>
                              <DetailPrimaryButton type="button" onClick={() => void saveChannels(connection.id)} disabled={busy || !selectedCount}>
                                {savingId === connection.id ? '채널 저장 중…' : '선택한 채널 저장'}
                              </DetailPrimaryButton>
                            </SaveRow>
                          </>
                        )}
                      </ChannelSection>
                    )}
                  </ConnectionCard>
                )
              })}
            </ConnectionList>
          )}
        </DetailPanel>
        <GuidePanel>
          <DetailPanelBody>
            <h2>스마트스토어 연결 안내</h2>
            <Steps>
              <li><span>1</span><div><h3>앱 정보 준비</h3><p>네이버 커머스API센터에서 발급받은 애플리케이션 ID와 시크릿을 준비하세요.</p></div></li>
              <li><span>2</span><div><h3>판매자 계정 연결</h3><p>내스토어는 SELF, 다른 판매자는 SELLER 유형과 해당 판매자 ID를 사용하세요.</p></div></li>
              <li><span>3</span><div><h3>스마트스토어 선택</h3><p>조회된 채널을 선택하고 저장해 팀과 함께 관리하세요.</p></div></li>
            </Steps>
            <GuideNote><DetailIcon name="shield" size={18} /><p>계정 연결은 소유자만 할 수 있으며, 멤버도 채널 조회와 저장이 가능합니다.</p></GuideNote>
            <GuideNote><DetailIcon name="link" size={18} /><p>현재 스마트스토어 연결을 지원합니다. 네이버 검색광고는 포함되지 않습니다.</p></GuideNote>
          </DetailPanelBody>
        </GuidePanel>
      </ContentGrid>
    </DetailPage>
  )
}

type FormValues = { clientId: string; clientSecret: string; tokenType: NaverTokenType; accountId: string }
type FormErrors = Partial<Record<'clientId' | 'clientSecret' | 'accountId', string>>

function NaverConnectForm({ target, connecting, disabled, error, onSubmit, onCancel }: {
  target: FormTarget
  connecting: boolean
  disabled: boolean
  error: string
  onSubmit: (request: NaverConnectRequest) => Promise<void>
  onCancel: () => void
}) {
  const formId = useId()
  const firstInput = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<FormValues>({ clientId: '', clientSecret: '', tokenType: 'SELF', accountId: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSecret, setShowSecret] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { firstInput.current?.focus() }, [])

  function change<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value, ...(key === 'tokenType' && value === 'SELF' ? { accountId: '' } : {}) }))
    setErrors((current) => ({ ...current, [key]: undefined, ...(key === 'tokenType' ? { accountId: undefined } : {}) }))
    setSubmitted(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = '애플리케이션 ID를 입력하세요.'
    if (!values.clientSecret.trim()) nextErrors.clientSecret = '애플리케이션 시크릿을 입력하세요.'
    if (values.tokenType === 'SELLER' && !values.accountId.trim()) nextErrors.accountId = '판매자 ID를 입력하세요.'
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      document.getElementById(`${formId}-${firstError}`)?.focus()
      return
    }
    setSubmitted(true)
    await onSubmit({ clientId: values.clientId.trim(), clientSecret: values.clientSecret.trim(), tokenType: values.tokenType, ...(values.tokenType === 'SELLER' ? { accountId: values.accountId.trim() } : {}) })
  }

  return (
    <DetailPanel aria-labelledby={`${formId}-title`}>
      <PanelHeading><div><h2 id={`${formId}-title`}>{target.id ? '네이버 계정 다시 연결' : '네이버 계정 연결하기'}</h2><p>{target.name ? `${target.name}과 동일한 판매자를 인증하면 기존 연결이 갱신됩니다.` : '네이버 커머스 API의 애플리케이션 정보를 입력해 주세요.'}</p></div><DetailBadge $tone="success">소유자 전용</DetailBadge></PanelHeading>
      <CredentialsForm onSubmit={submit} noValidate autoComplete="off" aria-busy={disabled}>
        {submitted && error && <FormAlert role="alert">{error}</FormAlert>}
        <FormNotice>일반 네이버 로그인용 앱 정보와 다릅니다. 커머스API센터에 서버 IP를 허용하고 판매자·채널 조회 권한을 설정해 주세요.</FormNotice>
        <Field>
          <Label htmlFor={`${formId}-clientId`}>애플리케이션 ID</Label>
          <Input ref={firstInput} id={`${formId}-clientId`} name="clientId" value={values.clientId} onChange={(event) => change('clientId', event.target.value)} placeholder="커머스 API 애플리케이션 ID" maxLength={255} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={disabled} aria-required="true" aria-invalid={Boolean(errors.clientId)} aria-describedby={errors.clientId ? `${formId}-clientId-error` : undefined} />
          {errors.clientId && <FieldError id={`${formId}-clientId-error`}>{errors.clientId}</FieldError>}
        </Field>
        <Field>
          <LabelRow><Label htmlFor={`${formId}-clientSecret`}>애플리케이션 시크릿</Label><TogglePassword type="button" onClick={() => setShowSecret((value) => !value)} aria-label={showSecret ? '시크릿 숨기기' : '시크릿 표시'} aria-pressed={showSecret} aria-controls={`${formId}-clientSecret`} disabled={disabled}>{showSecret ? '숨기기' : '표시'}</TogglePassword></LabelRow>
          <Input id={`${formId}-clientSecret`} name="clientSecret" type={showSecret ? 'text' : 'password'} value={values.clientSecret} onChange={(event) => change('clientSecret', event.target.value)} placeholder="발급받은 시크릿을 그대로 입력" autoComplete="new-password" autoCapitalize="none" spellCheck={false} disabled={disabled} aria-required="true" aria-invalid={Boolean(errors.clientSecret)} aria-describedby={`${formId}-secret-hint${errors.clientSecret ? ` ${formId}-clientSecret-error` : ''}`} />
          <Hint id={`${formId}-secret-hint`}>시크릿은 연결 요청에만 사용하며 브라우저 저장소에 보관하지 않습니다.</Hint>
          {errors.clientSecret && <FieldError id={`${formId}-clientSecret-error`}>{errors.clientSecret}</FieldError>}
        </Field>
        <Field>
          <Label htmlFor={`${formId}-tokenType`}>인증 유형</Label>
          <TokenSelect id={`${formId}-tokenType`} name="tokenType" value={values.tokenType} onChange={(event) => change('tokenType', event.target.value as NaverTokenType)} disabled={disabled} aria-describedby={`${formId}-type-hint`}>
            <option value="SELF">SELF · 내스토어</option>
            <option value="SELLER">SELLER · 대상 판매자</option>
          </TokenSelect>
          <Hint id={`${formId}-type-hint`}>{values.tokenType === 'SELF' ? '내스토어 애플리케이션으로 본인의 판매자 계정을 연결합니다.' : '해당 판매자에 대한 권한을 가진 애플리케이션이 필요합니다.'}</Hint>
        </Field>
        {values.tokenType === 'SELLER' && <Field>
          <Label htmlFor={`${formId}-accountId`}>판매자 ID</Label>
          <Input id={`${formId}-accountId`} name="accountId" value={values.accountId} onChange={(event) => change('accountId', event.target.value)} placeholder="대상 판매자 ID 또는 UID" maxLength={255} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={disabled} aria-required="true" aria-invalid={Boolean(errors.accountId)} aria-describedby={errors.accountId ? `${formId}-accountId-error` : undefined} />
          {errors.accountId && <FieldError id={`${formId}-accountId-error`}>{errors.accountId}</FieldError>}
        </Field>}
        <FormActions><DetailSecondaryButton type="button" onClick={onCancel} disabled={disabled}>취소</DetailSecondaryButton><ConnectButton type="submit" disabled={disabled}>{connecting ? '네이버 계정 확인 중…' : '연결하기'}</ConnectButton></FormActions>
      </CredentialsForm>
    </DetailPanel>
  )
}

function safeStoreUrl(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
}

const ContentGrid = styled.div`display: grid; grid-template-columns: minmax(0, 1fr) 17.5rem; align-items: start; gap: 1.5rem; @media(max-width: 1120px) { grid-template-columns: minmax(0, 1fr); }`
const PlatformIdentity = styled.div`display: flex; align-items: center; gap: 0.875rem; min-width: 0;`
const NaverMark = styled.span`display: grid; place-items: center; flex-shrink: 0; width: 2.75rem; height: 2.75rem; border-radius: 0.75rem; background: #eaf8ef; color: #16804b; font: 850 1.5rem Arial, sans-serif;`
const EmptyMark = styled(NaverMark)`width: 4rem; height: 4rem; margin-bottom: 0.5rem; border: 1px solid #d7efdf; border-radius: 1.125rem; font-size: 2rem;`
const ConnectButton = styled(DetailPrimaryButton)`background: #16804b; &:hover:not(:disabled), &:active:not(:disabled) { background: #10683c; }`
const InlineConnect = styled(ConnectButton)`align-self: flex-start; white-space: normal;`
const ConnectionList = styled.ul`list-style: none;`
const ConnectionCard = styled.li`display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; padding: 1.5rem; & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; } @media(max-width: 600px) { padding: 1.125rem; }`
const ConnectionHeading = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; h3 { font-size: 0.9375rem; overflow-wrap: anywhere; } p { margin-top: 0.25rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; overflow-wrap: anywhere; }`
const SavedSection = styled.div`display: grid; gap: 0.625rem;`
const SectionLabel = styled.p`font-size: 0.75rem; color: ${({ theme }) => theme.colors.textSecondary}; font-weight: 650; span { margin-left: 0.3rem; color: #16804b; }`
const SavedList = styled.ul`display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; li { display: flex; align-items: center; gap: 0.35rem; min-width: 0; padding: 0.35rem 0.6rem; border-radius: 0.375rem; background: #f0f8f3; color: #246d51; font-size: 0.72rem; overflow-wrap: anywhere; }`
const ChannelSection = styled.div`display: grid; gap: 0.875rem; padding-top: 1.25rem; border-top: 1px solid ${({ theme }) => theme.colors.border};`
const SelectionHeading = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.625rem; h3 { font-size: 0.875rem; }`
const BulkActions = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; > div { display: flex; flex-wrap: wrap; gap: 0.5rem; } > span { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; }`
const ChannelList = styled.div`display: grid; gap: 0.5rem;`
const ChannelRow = styled.div<{ $selected: boolean }>`display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem; border: 1px solid ${({ theme, $selected }) => $selected ? '#bcdfcb' : theme.colors.border}; border-radius: 0.5rem; background: ${({ $selected }) => $selected ? '#f7fcf9' : 'white'}; &:focus-within { border-color: #16804b; }`
const ChannelLabel = styled.label`display: flex; align-items: center; flex: 1; min-width: 0; gap: 0.75rem; min-height: 2.25rem; cursor: pointer; input { flex-shrink: 0; width: 1rem; height: 1rem; min-height: 0; accent-color: #16804b; } &:has(input:disabled) { opacity: 0.7; cursor: wait; }`
const ChannelText = styled.span`display: grid; gap: 0.25rem; min-width: 0; overflow-wrap: anywhere; strong { font-size: 0.8125rem; font-weight: 550; } small { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; }`
const StoreLink = styled.a`display: inline-flex; align-items: center; gap: 0.35rem; min-height: 2.25rem; color: #26734a; font-size: 0.75rem; text-decoration: none; white-space: nowrap; @media(max-width: 450px) { margin-left: 1.75rem; }`
const SaveRow = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.875rem; margin-top: 0.25rem;`
const ChannelEmpty = styled.div`display: flex; align-items: flex-start; gap: 0.875rem; padding-block: 1rem; color: ${({ theme }) => theme.colors.textMuted};`
const ChannelError = styled.div`display: grid; gap: 0.75rem; > button { justify-self: start; white-space: normal; }`
const GuidePanel = styled(DetailPanel)`background: #fcfcfe; h2 { font-size: 0.875rem; }`
const Steps = styled.ol`display: grid; gap: 1.5rem; margin-top: 1.5rem; list-style: none; li { display: flex; gap: 0.75rem; } li > span { display: grid; place-items: center; flex-shrink: 0; width: 1.5rem; height: 1.5rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 50%; color: ${({ theme }) => theme.colors.textSecondary}; background: white; font-size: 0.6875rem; } h3 { font-size: 0.8125rem; font-weight: 650; } p { margin-top: 0.35rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; line-height: 1.8; word-break: keep-all; }`
const GuideNote = styled.div`display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; p { font-size: 0.72rem; line-height: 1.8; word-break: keep-all; }`
const CredentialsForm = styled.form`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; padding: 1.5rem; @media(max-width: 650px) { grid-template-columns: minmax(0, 1fr); padding: 1.125rem; }`
const FormAlert = styled(DetailAlert)`grid-column: 1 / -1;`
const FormNotice = styled(DetailHint)`grid-column: 1 / -1; padding: 0.875rem; border: 1px solid #dceee2; border-radius: 0.5rem; background: #f5fbf7; color: #436f55;`
const TokenSelect = styled.select`width: 100%; min-width: 0; min-height: 3rem; font-size: 0.9rem; @media(max-width: 640px) { font-size: 1rem; }`
const FormActions = styled.div`display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.5rem; grid-column: 1 / -1; padding-top: 0.5rem;`
