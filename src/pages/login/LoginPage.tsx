import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useLogin } from '../../hooks/useLogin'
import { EMAIL_MAX_LENGTH } from './loginValidation'

export default function LoginPage() {
  const {
    formId,
    fieldId,
    errorId,
    values,
    errors,
    formError,
    submitting,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
  } = useLogin()

  return (
    <Container>
      <Card>
        <Eyebrow>United Ad</Eyebrow>
        <Title id={`${formId}-title`}>로그인</Title>
        <Lead>가입한 이메일로 United Ad에 로그인하세요.</Lead>

        <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`}>
          {formError ? (
            <FormAlert id={`${formId}-form-error`} role="alert">
              {formError}
            </FormAlert>
          ) : null}

          <Field>
            <Label htmlFor={fieldId('email')}>이메일</Label>
            <Input
              id={fieldId('email')}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
              value={values.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? errorId('email') : undefined}
              disabled={submitting}
            />
            {errors.email ? (
              <FieldError id={errorId('email')}>{errors.email}</FieldError>
            ) : null}
          </Field>

          <Field>
            <LabelRow>
              <Label htmlFor={fieldId('password')}>비밀번호</Label>
              <TogglePassword type="button" onClick={togglePassword} disabled={submitting}>
                {showPassword ? '숨기기' : '표시'}
              </TogglePassword>
            </LabelRow>
            <Input
              id={fieldId('password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? errorId('password') : undefined}
              disabled={submitting}
            />
            {errors.password ? (
              <FieldError id={errorId('password')}>{errors.password}</FieldError>
            ) : null}
          </Field>

          <Submit type="submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </Submit>
        </Form>

        <SwitchAuth>
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </SwitchAuth>
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

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
`

const TogglePassword = styled.button`
  min-height: auto;
  padding: 0;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;

  &:hover:not(:disabled) {
    background: none;
    color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:active:not(:disabled) {
    background: none;
  }
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

const SwitchAuth = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;

  a {
    font-weight: 700;
    text-decoration: none;
  }
`
