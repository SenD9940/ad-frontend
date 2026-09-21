import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAcceptWorkspaceInvite } from '../../hooks/useAcceptWorkspaceInvite'

export default function AcceptInvitePage() {
  const { isValidToken, submitting, formError, accepted, handleAccept } =
    useAcceptWorkspaceInvite()

  if (accepted) {
    return (
      <Container>
        <Card as="section">
          <Eyebrow>United Ad</Eyebrow>
          <Title>워크스페이스에 참여했습니다</Title>
          <Lead>
            워크스페이스 #{accepted.workspaceId} 멤버로 등록되었습니다.
          </Lead>
          <HomeLink to="/">홈으로 돌아가기</HomeLink>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <Eyebrow>United Ad</Eyebrow>
        <Title>워크스페이스 초대</Title>
        <Lead>
          {isValidToken
            ? '초대받은 계정으로 로그인한 뒤 참여를 수락해 주세요. 링크는 24시간 동안, 한 번만 사용할 수 있습니다.'
            : '초대 링크가 올바르지 않습니다. 메일에서 가장 최근 링크를 사용해 주세요.'}
        </Lead>

        {formError ? <FormAlert role="alert">{formError}</FormAlert> : null}

        <Submit type="button" onClick={handleAccept} disabled={!isValidToken || submitting}>
          {submitting ? '수락 중...' : '참여 수락'}
        </Submit>
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
`

const FormAlert = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #fef2f2;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  word-break: keep-all;
`

const Submit = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.xl};
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
