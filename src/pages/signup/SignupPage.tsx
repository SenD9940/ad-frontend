import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  Eyebrow, Field, FieldError, Form, FormAlert, Hint, Input, Label,
  LabelRow, Lead, Submit, SwitchAuth, Title, TogglePassword,
} from '../../components/auth/AuthFormUI'
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
        <SuccessCard as="section" aria-labelledby={`${formId}-success-title`}>
          <SuccessIcon aria-hidden="true">✓</SuccessIcon>
          <Eyebrow>YOU’RE ALL SET</Eyebrow>
          <Title id={`${formId}-success-title`}>회원가입이 완료되었습니다</Title>
          <Lead>
            <strong>{completedEmail}</strong> 계정으로 가입되었습니다.
            이제 United Ad에서 광고 운영을 시작할 수 있습니다.
          </Lead>
          <HomeLink to="/login">로그인하기 <span aria-hidden="true">→</span></HomeLink>
        </SuccessCard>
      </Container>
    )
  }

  return (
    <Container>
      <Intro>
        <Eyebrow>GET STARTED WITH UNITED AD</Eyebrow>
        <IntroTitle>더 나은 광고 운영의<br />{' '}첫걸음을 함께해요.</IntroTitle>
        <Lead>나만의 계정을 만들고, 팀과 함께할 워크스페이스를 준비하세요.</Lead>
        <SetupList aria-label="가입 후 시작하는 방법">
          <li><span>01</span><div><strong>계정 만들기</strong><p>이메일과 기본 정보를 입력하세요.</p></div></li>
          <li><span>02</span><div><strong>워크스페이스 준비</strong><p>팀의 광고 운영 공간을 만드세요.</p></div></li>
          <li><span>03</span><div><strong>팀과 광고 계정 연결</strong><p>멤버를 초대하고 운영을 시작하세요.</p></div></li>
        </SetupList>
        <IntroNote>이미 계정이 있으신가요?<Link to="/login">로그인 <span aria-hidden="true">→</span></Link></IntroNote>
      </Intro>
      <Card>
        <CardHeading>
          <div><Title id={`${formId}-title`}>회원가입</Title><Lead>필수 정보를 입력해 계정을 만들어 주세요.</Lead></div>
          <RequiredNote>주소 외 필수 입력</RequiredNote>
        </CardHeading>
        <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`} aria-busy={submitting}>
          {formError ? (
            <FormAlert id={`${formId}-form-error`} role="alert">
              {formError}
            </FormAlert>
          ) : null}

          <Section>
            <SectionLegend><SectionNumber>01</SectionNumber>계정 정보</SectionLegend>
            <AccountGrid>
              <Field>
                <Label htmlFor={fieldId('email')}>이메일</Label>
                <Input
                  id={fieldId('email')}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  maxLength={EMAIL_MAX_LENGTH}
                  value={values.email}
                  onChange={handleChange}
                  aria-required="true"
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
                  <TogglePassword
                    type="button" onClick={togglePassword} disabled={submitting}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                    aria-controls={`${fieldId('password')} ${fieldId('passwordConfirm')}`}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? '숨기기' : '표시'}
                  </TogglePassword>
                </LabelRow>
                <Input
                  id={fieldId('password')}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="8자 이상 입력"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={values.password}
                  onChange={handleChange}
                  aria-required="true"
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
                  placeholder="비밀번호 다시 입력"
                  value={values.passwordConfirm}
                  onChange={handleChange}
                  aria-required="true"
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

            </AccountGrid>
          </Section>
          <Section>
            <SectionLegend><SectionNumber>02</SectionNumber>기본 정보</SectionLegend>
            <FieldGrid>
              <Field>
                <Label htmlFor={fieldId('name')}>이름</Label>
                <Input
                  id={fieldId('name')}
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="이름을 입력하세요"
                  maxLength={NAME_MAX_LENGTH}
                  value={values.name}
                  onChange={handleChange}
                  aria-required="true"
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
                  aria-required="true"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? errorId('phone') : undefined}
                  disabled={submitting}
                />
                {errors.phone ? (
                  <FieldError id={errorId('phone')}>{errors.phone}</FieldError>
                ) : null}
              </Field>

            </FieldGrid>
          </Section>
          <Section>
            <SectionLegend><SectionNumber>03</SectionNumber>주소 <OptionalBadge>선택</OptionalBadge></SectionLegend>
            <SectionHint>주소는 입력하지 않아도 가입할 수 있어요.</SectionHint>
            <AddressFields>

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
                  placeholder="도로명 또는 지번 주소"
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
                  placeholder="동, 호수 등 상세 주소"
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

            </AddressFields>
          </Section>
          <Submit type="submit" disabled={submitting}>
            {submitting ? '가입 중...' : '계정 만들기'}
            {!submitting && <span aria-hidden="true">→</span>}
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
  align-items: flex-start;
  justify-content: center;
  gap: clamp(2rem, 5vw, 5rem);
  width: 100%;
  max-width: 1060px;
  min-width: 0;
  margin: 0.75rem auto;
  @media (max-width: 880px) { flex-direction: column; align-items: center; gap: 1.75rem; }
`
const Intro = styled.aside`
  position: sticky;
  top: 7rem;
  flex: 1;
  min-width: 0;
  padding-top: 2rem;
  @media (max-width: 880px) { position: static; width: 100%; max-width: 640px; padding-top: 0; }
`
const IntroTitle = styled.h2`
  margin-top: 1rem;
  font-size: clamp(1.65rem, 2.5vw, 2.2rem);
  line-height: 1.5;
  letter-spacing: -0.05em;
  word-break: keep-all;
  @media (max-width: 880px) { font-size: 1.65rem; br { display: none; } }
`
const SetupList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  margin: 2.5rem 0;
  padding: 0;
  list-style: none;
  li { display: flex; gap: 0.9rem; align-items: flex-start; }
  li > span {
    display: grid; flex-shrink: 0; width: 2rem; height: 2rem; place-items: center;
    border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 0.65rem;
    background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.7rem; font-weight: 700;
  }
  li:first-child > span { border-color: #ddd9ff; background: #eeebff; color: ${({ theme }) => theme.colors.primary}; }
  strong { display: block; font-size: 0.88rem; font-weight: 650; }
  p { margin-top: 0.3rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.8rem; line-height: 1.6; }
  @media (max-width: 880px) { display: none; }
`
const IntroNote = styled.p`
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem;
  a { display: flex; align-items: center; gap: 0.5rem; width: fit-content; margin-top: 0.5rem; font-weight: 650; text-decoration: none; }
  @media (max-width: 880px) { display: none; }
`
const Card = styled.div`
  width: 100%;
  max-width: 640px;
  min-width: 0;
  flex: 1.8;
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 8px 40px rgb(32 35 49 / 3%);
`
const CardHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  h1 { margin-top: 0; font-size: 1.5rem; }
  p { font-size: 0.8rem; }
  @media (max-width: 540px) { flex-direction: column; }
`
const RequiredNote = styled.span`
  flex-shrink: 0;
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
  @media (max-width: 540px) { margin-top: 0; }
`
const Section = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0 0 1.5rem;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-of-type { padding-bottom: 0; border-bottom: 0; }
`
const SectionLegend = styled.legend`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 1.1rem;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 700;
`
const SectionNumber = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.72rem;
  font-weight: 700;
`
const OptionalBadge = styled.span`
  padding: 0.12rem 0.4rem;
  border-radius: 0.3rem;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.65rem;
  font-weight: 500;
`
const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: 540px) { grid-template-columns: 1fr; }
`
const AccountGrid = styled(FieldGrid)`
  > div:first-child { grid-column: 1 / -1; }
`
const SectionHint = styled.p`
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.78rem;
`
const AddressFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`
const ZipRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
`
const SearchAddress = styled.button`
  white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  &:hover:not(:disabled), &:active:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.primary};
  }
`
const SuccessCard = styled(Card)`
  flex: none;
  max-width: 540px;
  margin-block: 2.5rem;
  padding: clamp(2rem, 5vw, 3.5rem);
  text-align: center;
`
const SuccessIcon = styled.div`
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: #eaf7f0;
  color: ${({ theme }) => theme.colors.success};
  font-size: 1.5rem;
`
const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 3rem;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; color: ${({ theme }) => theme.colors.onPrimary}; }
`
