import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useSignup } from '../../hooks/useSignup'
import {
  ADDRESS_DETAIL_MAX_LENGTH,
  ADDRESS_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  ZIP_CODE_MAX_LENGTH,
} from './signupValidation'

export default function SignupPage() {
  const {
    formId,
    fieldId,
    errorId,
    values,
    errors,
    formError,
    submitting,
    showPassword,
    completedEmail,
    handleChange,
    handleSubmit,
    openPostcode,
    togglePassword,
  } = useSignup()

  if (completedEmail) {
    return (
      <Container>
        <Card as="section" aria-labelledby={`${formId}-success-title`}>
          <Eyebrow>United Ad</Eyebrow>
          <Title id={`${formId}-success-title`}>회원가입이 완료되었습니다</Title>
          <Lead>
            <strong>{completedEmail}</strong> 계정으로 가입되었습니다.
            이제 United Ad에서 광고 운영을 시작할 수 있습니다.
          </Lead>
          <HomeLink to="/login">로그인하기</HomeLink>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <Eyebrow>United Ad</Eyebrow>
        <Title id={`${formId}-title`}>회원가입</Title>
        <Lead>계정을 만들고 광고 운영을 시작해 보세요.</Lead>

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
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? errorId('password') : `${formId}-password-hint`
              }
              disabled={submitting}
            />
            {errors.password ? (
              <FieldError id={errorId('password')}>{errors.password}</FieldError>
            ) : (
              <Hint id={`${formId}-password-hint`}>8자 이상, 72자 이하</Hint>
            )}
          </Field>

          <Field>
            <Label htmlFor={fieldId('passwordConfirm')}>비밀번호 확인</Label>
            <Input
              id={fieldId('passwordConfirm')}
              name="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={values.passwordConfirm}
              onChange={handleChange}
              aria-invalid={Boolean(errors.passwordConfirm)}
              aria-describedby={
                errors.passwordConfirm ? errorId('passwordConfirm') : undefined
              }
              disabled={submitting}
            />
            {errors.passwordConfirm ? (
              <FieldError id={errorId('passwordConfirm')}>
                {errors.passwordConfirm}
              </FieldError>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor={fieldId('name')}>이름</Label>
            <Input
              id={fieldId('name')}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
              value={values.name}
              onChange={handleChange}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? errorId('name') : undefined}
              disabled={submitting}
            />
            {errors.name ? (
              <FieldError id={errorId('name')}>{errors.name}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor={fieldId('phone')}>휴대폰 번호</Label>
            <Input
              id={fieldId('phone')}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={values.phone}
              onChange={handleChange}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? errorId('phone') : undefined}
              disabled={submitting}
            />
            {errors.phone ? (
              <FieldError id={errorId('phone')}>{errors.phone}</FieldError>
            ) : null}
          </Field>

          <AddressLegend>주소 (선택)</AddressLegend>

          <Field>
            <Label htmlFor={fieldId('zipCode')}>우편번호</Label>
            <ZipRow>
              <Input
                id={fieldId('zipCode')}
                name="zipCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={ZIP_CODE_MAX_LENGTH}
                value={values.zipCode}
                onChange={handleChange}
                aria-invalid={Boolean(errors.zipCode)}
                aria-describedby={errors.zipCode ? errorId('zipCode') : undefined}
                disabled={submitting}
              />
              <SearchAddress type="button" onClick={openPostcode} disabled={submitting}>
                주소 검색
              </SearchAddress>
            </ZipRow>
            {errors.zipCode ? (
              <FieldError id={errorId('zipCode')}>{errors.zipCode}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor={fieldId('address')}>기본 주소</Label>
            <Input
              id={fieldId('address')}
              name="address"
              type="text"
              autoComplete="street-address"
              maxLength={ADDRESS_MAX_LENGTH}
              value={values.address}
              onChange={handleChange}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? errorId('address') : undefined}
              disabled={submitting}
            />
            {errors.address ? (
              <FieldError id={errorId('address')}>{errors.address}</FieldError>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor={fieldId('addressDetail')}>상세 주소</Label>
            <Input
              id={fieldId('addressDetail')}
              name="addressDetail"
              type="text"
              autoComplete="address-line2"
              maxLength={ADDRESS_DETAIL_MAX_LENGTH}
              value={values.addressDetail}
              onChange={handleChange}
              aria-invalid={Boolean(errors.addressDetail)}
              aria-describedby={
                errors.addressDetail ? errorId('addressDetail') : undefined
              }
              disabled={submitting}
            />
            {errors.addressDetail ? (
              <FieldError id={errorId('addressDetail')}>
                {errors.addressDetail}
              </FieldError>
            ) : null}
          </Field>

          <Submit type="submit" disabled={submitting}>
            {submitting ? '가입 중...' : '가입하기'}
          </Submit>
        </Form>

        <SwitchAuth>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
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

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const FieldError = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`

const AddressLegend = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 700;
`

const ZipRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SearchAddress = styled.button`
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

const Submit = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
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
