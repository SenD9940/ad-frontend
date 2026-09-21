import styled from 'styled-components'
import { useInviteWorkspaceMembers } from '../../hooks/useInviteWorkspaceMembers'
import { useKickWorkspaceMember } from '../../hooks/useKickWorkspaceMember'
import { INVITE_EMAIL_MAX_LENGTH, INVITE_EMAILS_MAX } from './workspaceValidation'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow,
  DetailHeader, DetailHint, DetailIcon, DetailIconTile, DetailLead, DetailPage,
  DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton,
  DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

export default function InviteWorkspacePage() {
  const invite = useInviteWorkspaceMembers()
  const {
    formId, isValidWorkspaceId, workspace, workspaceLoading, workspaceError,
    emailInput, emails, inputError, formError, adding, busy, submitting, results,
    handleInputChange, addEmail, removeEmail, handleSubmit,
  } = invite
  const kick = useKickWorkspaceMember({
    workspaceId: invite.workspaceId,
    isValidWorkspaceId,
    ownerUserId: workspace?.userId,
  })

  if (!isValidWorkspaceId || workspaceError) {
    return (
      <DetailPage><DetailPanel><DetailEmpty>
        <DetailIconTile><DetailIcon name="users" /></DetailIconTile>
        <DetailTitle>워크스페이스를 찾을 수 없습니다</DetailTitle>
        <p>{workspaceError || '주소를 확인하거나 워크스페이스 목록에서 다시 선택해 주세요.'}</p>
        <DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink>
      </DetailEmpty></DetailPanel></DetailPage>
    )
  }

  if (workspaceLoading) {
    return <DetailPage><DetailHeader><div><DetailEyebrow>워크스페이스 / 멤버</DetailEyebrow><DetailTitle>멤버 관리</DetailTitle></div></DetailHeader><DetailPanel><DetailStatus role="status">워크스페이스 정보를 불러오는 중…</DetailStatus></DetailPanel></DetailPage>
  }

  const workspaceName = workspace?.name?.trim() || '워크스페이스'

  return (
    <DetailPage>
      <DetailHeader>
        <div>
          <DetailEyebrow>워크스페이스 / 멤버</DetailEyebrow>
          <DetailTitle>멤버 관리</DetailTitle>
          <DetailLead><strong>{workspaceName}</strong>의 멤버를 확인하고 새로운 팀원을 초대하세요.</DetailLead>
        </div>
        {!kick.loading && !kick.error ? <DetailBadge $tone="primary"><DetailIcon name="users" size={14} />{kick.members.length}명의 멤버</DetailBadge> : null}
      </DetailHeader>

      <ContentGrid>
        <InvitePanel aria-labelledby={`${formId}-title`}>
          <PanelHeading><PanelIdentity><DetailIconTile><DetailIcon name="mail" /></DetailIconTile><div><h2 id={`${formId}-title`}>새 멤버 초대</h2><p>이메일로 팀에 초대하세요.</p></div></PanelIdentity></PanelHeading>
          <DetailPanelBody>
            <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`} aria-busy={busy}>
              {formError ? <DetailAlert role="alert">{formError}</DetailAlert> : null}
              <Field>
                <Label htmlFor={`${formId}-email`}>초대할 이메일</Label>
                <AddRow>
                  <Input
                    id={`${formId}-email`} name="email" type="email" autoComplete="email" inputMode="email"
                    placeholder="name@company.com" maxLength={INVITE_EMAIL_MAX_LENGTH}
                    value={emailInput} onChange={handleInputChange}
                    aria-invalid={Boolean(inputError)}
                    aria-describedby={`${formId}-email-hint${inputError ? ` ${formId}-email-error` : ''}`}
                    disabled={busy}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        if (!busy) void addEmail()
                      }
                    }}
                  />
                  <DetailSecondaryButton type="button" onClick={() => void addEmail()} disabled={busy || !emailInput.trim()}>{adding ? '확인 중…' : '추가'}</DetailSecondaryButton>
                </AddRow>
                {inputError ? <FieldError id={`${formId}-email-error`} role="alert">{inputError}</FieldError> : null}
                <DetailHint id={`${formId}-email-hint`}>United Ad에 가입된 이메일을 입력하고 추가해 주세요. 한 번에 최대 {INVITE_EMAILS_MAX}명까지 초대할 수 있어요.</DetailHint>
              </Field>

              <Recipients aria-live="polite">
                <RecipientsHeading>초대할 멤버 <span>{emails.length}명</span></RecipientsHeading>
                {emails.length > 0 ? (
                  <EmailList aria-label="초대할 이메일">{emails.map((email) => (
                    <EmailItem key={email}><EmailText><DetailIcon name="mail" size={15} /><span>{email}</span></EmailText><RemoveButton type="button" onClick={() => removeEmail(email)} disabled={busy} aria-label={`${email} 초대 목록에서 삭제`}>×</RemoveButton></EmailItem>
                  ))}</EmailList>
                ) : <RecipientPlaceholder>추가한 이메일이 여기에 표시됩니다.</RecipientPlaceholder>}
              </Recipients>
              <Submit type="submit" disabled={busy || emails.length === 0}><DetailIcon name="mail" size={16} />{submitting ? '초대 메일 보내는 중…' : emails.length > 0 ? `${emails.length}명에게 초대 보내기` : '초대 메일 보내기'}</Submit>
            </Form>
            {results.length > 0 ? (
              <ResultList aria-label="초대 결과" aria-live="polite">{results.map((result) => <ResultItem key={result.email} $success={result.success}><strong>{result.success ? '발송 완료' : '발송 실패'}</strong><span>{result.email}</span><p>{result.message}</p></ResultItem>)}</ResultList>
            ) : null}
            <InviteNote><DetailIcon name="clock" size={16} /><span>초대 링크는 발송 후 24시간 동안 한 번 사용할 수 있습니다.</span></InviteNote>
          </DetailPanelBody>
        </InvitePanel>

        <DetailPanel aria-labelledby={`${kick.sectionId}-title`}>
          <PanelHeading>
            <div><h2 id={`${kick.sectionId}-title`}>워크스페이스 멤버</h2><p>이 워크스페이스에서 함께 작업하는 팀원입니다.</p></div>
            {!kick.loading && !kick.error ? <DetailBadge>{kick.members.length}명</DetailBadge> : null}
          </PanelHeading>
          {kick.loading ? <DetailStatus role="status">멤버 목록을 불러오는 중…</DetailStatus> : kick.error ? <DetailPanelBody><DetailAlert role="alert">{kick.error}</DetailAlert></DetailPanelBody> : (
            <>
              {kick.kickError || kick.successMessage ? <Feedback>{kick.kickError ? <DetailAlert role="alert">{kick.kickError}</DetailAlert> : null}{kick.successMessage ? <DetailAlert $success role="status">{kick.successMessage}</DetailAlert> : null}</Feedback> : null}
              {kick.members.length === 0 ? <DetailEmpty><DetailIconTile><DetailIcon name="users" /></DetailIconTile><h3>아직 참여한 멤버가 없어요</h3><p>새 멤버를 이메일로 초대하고 함께 워크스페이스를 관리하세요.</p></DetailEmpty> : (
                <MemberList aria-labelledby={`${kick.sectionId}-title`}>
                  {kick.members.map((member) => {
                    const isWorkspaceOwner = member.userId === workspace?.userId
                    const confirming = kick.confirmingUserId === member.userId
                    const kicking = kick.kickingUserId === member.userId
                    return (
                      <MemberItem key={member.userId} $confirming={confirming}>
                        <MemberRow>
                          <MemberIdentity>
                            <Avatar $owner={isWorkspaceOwner} aria-hidden="true"><DetailIcon name={isWorkspaceOwner ? 'shield' : 'users'} size={18} /></Avatar>
                            <div><MemberName>사용자 {member.userId}</MemberName><MemberMeta>{formatJoinedDate(member.registeredAt)}</MemberMeta></div>
                          </MemberIdentity>
                          <MemberActions>
                            <DetailBadge $tone={isWorkspaceOwner ? 'primary' : undefined}>{isWorkspaceOwner ? '소유자' : '멤버'}</DetailBadge>
                            {kick.isOwner && !isWorkspaceOwner && !confirming ? <RemoveMemberButton type="button" onClick={() => kick.requestKick(member.userId)} disabled={kick.kickingUserId !== null} aria-label={`사용자 ${member.userId} 내보내기`}>내보내기</RemoveMemberButton> : null}
                          </MemberActions>
                        </MemberRow>
                        {confirming ? (
                          <Confirmation role="group" aria-label={`사용자 ${member.userId} 내보내기 확인`}>
                            <p>사용자 {member.userId}를 내보낼까요? 이 워크스페이스에 더 이상 접근할 수 없습니다.</p>
                            <ButtonRow><DetailSecondaryButton type="button" onClick={kick.cancelKick} disabled={kicking}>취소</DetailSecondaryButton><KickSubmit type="button" onClick={() => void kick.confirmKick(member.userId)} disabled={kicking}>{kicking ? '내보내는 중…' : '내보내기 확인'}</KickSubmit></ButtonRow>
                          </Confirmation>
                        ) : null}
                      </MemberItem>
                    )
                  })}
                </MemberList>
              )}
              <MemberFooter><DetailIcon name="shield" size={15} /><p>{kick.isOwner ? '소유자만 멤버를 내보낼 수 있습니다. 소유자는 내보낼 수 없습니다.' : '멤버의 접근 권한은 워크스페이스 소유자가 관리합니다.'}</p></MemberFooter>
            </>
          )}
        </DetailPanel>
      </ContentGrid>
    </DetailPage>
  )
}

function formatJoinedDate(value: string | null): string {
  if (!value) return '워크스페이스 멤버'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '워크스페이스 멤버'
  return `${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)} 참여`
}

const ContentGrid = styled.div`display: grid; grid-template-columns: minmax(19rem, 0.85fr) minmax(0, 1.15fr); align-items: start; gap: 1.5rem; @media (max-width: 1120px) { grid-template-columns: minmax(0, 1fr); }`
const InvitePanel = styled(DetailPanel)`min-width: 0;`
const PanelIdentity = styled.div`display: flex; align-items: center; gap: 0.875rem;`
const Form = styled.form`display: flex; flex-direction: column; gap: 1.25rem;`
const Field = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`
const Label = styled.label`font-size: 0.8125rem; font-weight: 650;`
const AddRow = styled.div`display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem;`
const Input = styled.input`width: 100%; min-width: 0; font-size: 0.8125rem;`
const FieldError = styled.p`color: ${({ theme }) => theme.colors.error}; font-size: 0.75rem; line-height: 1.6;`
const Recipients = styled.div`padding-top: 0.125rem;`
const RecipientsHeading = styled.p`display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 650; span { color: ${({ theme }) => theme.colors.primary}; }`
const RecipientPlaceholder = styled.p`margin-top: 0.75rem; padding: 1.125rem 0.75rem; border: 1px dashed ${({ theme }) => theme.colors.border}; border-radius: 0.5rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; text-align: center;`
const EmailList = styled.ul`display: grid; gap: 0.4rem; margin-top: 0.75rem; list-style: none;`
const EmailItem = styled.li`display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.45rem 0.5rem 0.45rem 0.75rem; border: 1px solid #e5e1ff; border-radius: 0.5rem; background: #f9f8ff;`
const EmailText = styled.div`display: flex; align-items: center; gap: 0.5rem; min-width: 0; font-size: 0.75rem; svg { flex-shrink: 0; color: ${({ theme }) => theme.colors.primary}; } span { overflow-wrap: anywhere; }`
const RemoveButton = styled.button`width: 2rem; min-height: 2rem; padding: 0; flex-shrink: 0; border: 0; background: transparent; color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.25rem; &:hover:not(:disabled), &:active:not(:disabled) { background: #eee9ff; color: ${({ theme }) => theme.colors.primary}; }`
const Submit = styled(DetailPrimaryButton)`width: 100%;`
const ResultList = styled.ul`display: grid; gap: 0.5rem; margin-top: 1.25rem; list-style: none;`
const ResultItem = styled.li<{ $success: boolean }>`padding: 0.75rem; border-radius: 0.5rem; background: ${({ $success }) => $success ? '#f1faf5' : '#fff5f5'}; color: ${({ $success }) => $success ? '#167853' : '#b33434'}; font-size: 0.75rem; line-height: 1.7; overflow-wrap: anywhere; strong { margin-right: 0.5rem; } p { margin-top: 0.25rem; }`
const InviteNote = styled.div`display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1.25rem; padding-top: 1.125rem; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.72rem; line-height: 1.8; word-break: keep-all; svg { flex-shrink: 0; margin-top: 0.15rem; }`
const Feedback = styled.div`display: grid; gap: 0.75rem; padding: 1.25rem 1.5rem 0;`
const MemberList = styled.ul`list-style: none; padding: 0 1.5rem; @media (max-width: 600px) { padding: 0 1.125rem; }`
const MemberItem = styled.li<{ $confirming: boolean }>`padding: 1.125rem 0; & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; } ${({ $confirming }) => $confirming && 'padding-bottom: 1.25rem;'} `
const MemberRow = styled.div`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;`
const MemberIdentity = styled.div`display: flex; align-items: center; gap: 0.75rem; min-width: 0;`
const Avatar = styled.span<{ $owner: boolean }>`display: grid; place-items: center; width: 2.5rem; height: 2.5rem; flex-shrink: 0; border-radius: 50%; background: ${({ $owner }) => $owner ? '#eeebff' : '#f0f3f7'}; color: ${({ $owner }) => $owner ? '#635bff' : '#6b778d'};`
const MemberName = styled.p`font-size: 0.8125rem; font-weight: 650; overflow-wrap: anywhere;`
const MemberMeta = styled.p`margin-top: 0.25rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.6875rem;`
const MemberActions = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;`
const RemoveMemberButton = styled.button`min-height: 2rem; padding: 0.3rem 0.5rem; border: 0; background: transparent; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.6875rem; &:hover:not(:disabled), &:active:not(:disabled) { background: #fff0f0; color: ${({ theme }) => theme.colors.error}; }`
const Confirmation = styled.div`margin-top: 0.875rem; padding: 0.875rem; border: 1px solid #f3d8d8; border-radius: 0.5rem; background: #fff8f8; p { font-size: 0.75rem; line-height: 1.7; color: #a33c3c; word-break: keep-all; }`
const ButtonRow = styled.div`display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;`
const KickSubmit = styled(DetailPrimaryButton)`background: ${({ theme }) => theme.colors.error}; box-shadow: none; &:hover:not(:disabled) { background: #a32929; } &:active:not(:disabled) { background: #8a2323; }`
const MemberFooter = styled.div`display: flex; align-items: flex-start; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; svg { flex-shrink: 0; margin-top: 0.15rem; } p { font-size: 0.7rem; line-height: 1.8; word-break: keep-all; } @media (max-width: 600px) { padding-inline: 1.125rem; }`
