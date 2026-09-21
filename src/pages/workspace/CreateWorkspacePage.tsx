import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'
import { WORKSPACE_NAME_MAX_LENGTH } from './workspaceValidation'

export default function CreateWorkspacePage() {
  const { formId, name, nameError, formError, submitting, handleChange, handleSubmit } =
    useCreateWorkspace()

  return (
    <Container>
      <Card>
        <Eyebrow>United Ad</Eyebrow>
        <Title id={`${formId}-title`}>워크스페이스 만들기</Title>
        <Lead>팀을 위한 공간을 만들고, 다음 단계에서 멤버를 초대하세요. 워크스페이스는 여러 개 만들 수 있습니다.</Lead>

        <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`}>
          {formError ? (
            <FormAlert id={`${formId}-form-error`} role="alert">
              {formError}
            </FormAlert>
          ) : null}

          <Field>
            <Label htmlFor={`${formId}-name`}>워크스페이스 이름</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              type="text"
              autoComplete="organization"
              maxLength={WORKSPACE_NAME_MAX_LENGTH}
              value={name}
              onChange={handleChange}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? `${formId}-name-error` : undefined}
              disabled={submitting}
            />
            {nameError ? (
              <FieldError id={`${formId}-name-error`}>{nameError}</FieldError>
            ) : null}
          </Field>

          <Submit type="submit" disabled={submitting}>
            {submitting ? '만드는 중...' : '만들고 멤버 초대하기'}
          </Submit>
        </Form>

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

const Input = styled.input`
  width: 100%;
`

const FieldError = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`

const Submit = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
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
