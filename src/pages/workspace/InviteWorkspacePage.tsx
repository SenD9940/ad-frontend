import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useInviteWorkspaceMembers } from '../../hooks/useInviteWorkspaceMembers'
import { useKickWorkspaceMember } from '../../hooks/useKickWorkspaceMember'
import { INVITE_EMAIL_MAX_LENGTH } from './workspaceValidation'

export default function InviteWorkspacePage() {
  const invite = useInviteWorkspaceMembers()
  const {
    formId,
    isValidWorkspaceId,
    workspace,
    workspaceLoading,
    workspaceError,
    emailInput,
    emails,
    inputError,
    formError,
    adding,
    busy,
    submitting,
    results,
    handleInputChange,
    addEmail,
    removeEmail,
    handleSubmit,
  } = invite
  const kick = useKickWorkspaceMember({
    workspaceId: invite.workspaceId,
    isValidWorkspaceId,
    ownerUserId: workspace?.userId,
  })

  if (!isValidWorkspaceId || workspaceError) {
    return (
      <Container>
        <Card as="section">
          <Title>워크스페이스를 찾을 수 없습니다</Title>
          <Lead>
            {workspaceError || '주소를 확인하거나 워크스페이스 목록에서 다시 선택해 주세요.'}
          </Lead>
          <HomeLink to="/workspaces">워크스페이스 목록</HomeLink>
        </Card>
      </Container>
    )
  }

  if (workspaceLoading) {
    return (
      <Container>
        <Card as="section">
          <Eyebrow>United Ad</Eyebrow>
          <Title>멤버 초대</Title>
          <Lead>워크스페이스 정보를 불러오는 중...</Lead>
        </Card>
      </Container>
    )
  }

  const workspaceName = workspace?.name?.trim() || '워크스페이스'

  return (
    <Container>
      <Card>
        <Eyebrow>United Ad</Eyebrow>
        <Title id={`${formId}-title`}>멤버 초대</Title>
        <Lead>
          <strong>{workspaceName}</strong>에 이미 가입한 사용자를 이메일로 초대합니다.
          초대받은 계정으로 메일이 발송됩니다.
        </Lead>

        <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`}>
          {formError ? (
            <FormAlert role="alert">{formError}</FormAlert>
          ) : null}

          <Field>
            <Label htmlFor={`${formId}-email`}>이메일</Label>
            <AddRow>
              <Input
                id={`${formId}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={INVITE_EMAIL_MAX_LENGTH}
                value={emailInput}
                onChange={handleInputChange}
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? `${formId}-email-error` : undefined}
                disabled={busy}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void addEmail()
                  }
                }}
              />
              <AddButton type="button" onClick={() => void addEmail()} disabled={busy}>
                {adding ? '확인 중...' : '추가'}
              </AddButton>
            </AddRow>
            {inputError ? (
              <FieldError id={`${formId}-email-error`}>{inputError}</FieldError>
            ) : (
              <Hint>가입된 이메일만 추가됩니다. Enter 또는 추가로 목록에 넣습니다.</Hint>
            )}
          </Field>

          {emails.length > 0 ? (
            <IdList aria-label="초대할 이메일">
              {emails.map((email) => (
                <IdChip key={email}>
                  {email}
                  <RemoveChip
                    type="button"
                    onClick={() => removeEmail(email)}
                    disabled={busy}
                    aria-label={`${email} 삭제`}
                  >
                    삭제
                  </RemoveChip>
                </IdChip>
              ))}
            </IdList>
          ) : null}

          <Submit type="submit" disabled={busy}>
            {submitting ? '초대 중...' : '초대 메일 보내기'}
          </Submit>
        </Form>

        {results.length > 0 ? (
          <ResultList aria-label="초대 결과">
            {results.map((result) => (
              <ResultItem key={result.email} $success={result.success}>
                {result.email}: {result.message}
              </ResultItem>
            ))}
          </ResultList>
        ) : null}

        {kick.isOwner ? (
          <KickForm onSubmit={kick.handleSubmit} noValidate aria-labelledby={`${kick.formId}-title`}>
            <KickTitle id={`${kick.formId}-title`}>멤버 추방</KickTitle>
            <KickLead>이미 참여 중인 멤버를 사용자 ID로 추방합니다. 소유자는 추방할 수 없습니다.</KickLead>

            {kick.formError ? (
              <FormAlert role="alert">{kick.formError}</FormAlert>
            ) : null}
            {kick.successMessage ? (
              <SuccessAlert role="status">{kick.successMessage}</SuccessAlert>
            ) : null}

            <Field>
              <Label htmlFor={`${kick.formId}-userId`}>사용자 ID</Label>
              <Input
                id={`${kick.formId}-userId`}
                name="userId"
                type="text"
                inputMode="numeric"
                value={kick.userIdInput}
                onChange={kick.handleChange}
                aria-invalid={Boolean(kick.inputError)}
                aria-describedby={
                  kick.inputError
                    ? `${kick.formId}-userId-error`
                    : kick.confirming
                      ? `${kick.formId}-confirm`
                      : undefined
                }
                disabled={kick.submitting}
              />
              {kick.inputError ? (
                <FieldError id={`${kick.formId}-userId-error`}>{kick.inputError}</FieldError>
              ) : kick.confirming ? (
                <Hint id={`${kick.formId}-confirm`}>
                  사용자 {kick.userIdInput.trim()}를 이 워크스페이스에서 추방할까요?
                </Hint>
              ) : (
                <Hint>추방할 멤버의 사용자 ID를 입력하세요.</Hint>
              )}
            </Field>

            {kick.confirming ? (
              <ButtonRow>
                <CancelButton
                  type="button"
                  onClick={kick.cancelConfirm}
                  disabled={kick.submitting}
                >
                  취소
                </CancelButton>
                <KickSubmit type="submit" disabled={kick.submitting}>
                  {kick.submitting ? '추방 중...' : '추방 확인'}
                </KickSubmit>
              </ButtonRow>
            ) : (
              <KickSubmit type="submit" disabled={kick.submitting || kick.meLoading}>
                멤버 추방
              </KickSubmit>
            )}
          </KickForm>
        ) : null}

        <LaterLink to="/workspaces">워크스페이스 목록으로</LaterLink>
      </Card>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-width: 0;
`

const Card = styled.div`
  width: 100%;
  max-width: 32rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

const Eyebrow = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  letter-spacing: -0.02em;
`

const Title = styled.h1`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: clamp(1.75rem, 4vw, 2rem);
`

const Lead = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: keep-all;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const FormAlert = styled.p`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #fef2f2;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  word-break: keep-all;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`

const AddRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Input = styled.input`
  width: 100%;
`

const AddButton = styled.button`
  white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover:not(:disabled),
  &:active:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const FieldError = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`

const IdList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const IdChip = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`

const RemoveChip = styled.button`
  min-height: auto;
  padding: 0;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover:not(:disabled) {
    background: none;
    color: ${({ theme }) => theme.colors.error};
  }

  &:active:not(:disabled) {
    background: none;
  }
`

const Submit = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const ResultList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.lg};
`

const ResultItem = styled.li<{ $success: boolean }>`
  color: ${({ theme, $success }) =>
    $success ? theme.colors.success : theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  word-break: keep-all;
`

const KickForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const KickTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
`

const KickLead = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: keep-all;
`

const SuccessAlert = styled.p`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #f0fdf4;
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  word-break: keep-all;
`

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`

const CancelButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover:not(:disabled),
  &:active:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const KickSubmit = styled.button`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.error};

  &:hover:not(:disabled) {
    background-color: #991b1b;
  }

  &:active:not(:disabled) {
    background-color: #7f1d1d;
  }
`

const LaterLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
`
