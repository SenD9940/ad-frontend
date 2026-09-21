import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  Eyebrow, Field, FieldError, Form, FormAlert, Input, Label, LabelRow,
  Lead, Submit, SwitchAuth, Title, TogglePassword,
} from '../../components/auth/AuthFormUI'
import { useLogin } from '../../hooks/useLogin'
import { EMAIL_MAX_LENGTH } from './loginValidation'

export default function LoginPage() {
  const {
    formId, fieldId, errorId, values, errors, formError, submitting,
    showPassword, handleChange, handleSubmit, togglePassword,
  } = useLogin()

  return (
    <Container>
      <BrandPanel aria-label="United Ad 소개">
        <BrandLabel><BrandMark aria-hidden="true">u.</BrandMark> United Ad</BrandLabel>
        <BrandHeading>함께하는 광고 운영,<br />{' '}하나의 워크스페이스.</BrandHeading>
        <BrandCopy>흩어져 있던 광고 계정과 팀을 연결하고,<br />더 중요한 일에 집중하세요.</BrandCopy>
        <WorkspacePreview aria-hidden="true">
          <PreviewTop><PreviewDots><i /><i /><i /></PreviewDots><span>YOUR WORKSPACE</span></PreviewTop>
          <PreviewBody>
            <PreviewIcon>U</PreviewIcon>
            <PreviewTitle>우리 팀의 워크스페이스<small>광고 운영을 위한 공간</small></PreviewTitle>
          </PreviewBody>
          <PreviewRow><span><RowIcon>↗</RowIcon>광고 계정 연결</span><PreviewPill>Connect</PreviewPill></PreviewRow>
          <PreviewRow><span><RowIcon>＋</RowIcon>팀 멤버 초대</span><PreviewAvatars><i>U</i><i>A</i><i>＋</i></PreviewAvatars></PreviewRow>
        </WorkspacePreview>
        <BrandFooter><span aria-hidden="true">✦</span> 팀과 계정을 연결하는 더 나은 시작</BrandFooter>
      </BrandPanel>

      <FormPanel>
        <FormContent>
          <Eyebrow>WELCOME BACK</Eyebrow>
          <Title id={`${formId}-title`}>다시 만나 반가워요</Title>
          <Lead>로그인하고 팀의 광고 운영을 이어가세요.</Lead>
          <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`} aria-busy={submitting}>
            {formError ? <FormAlert id={`${formId}-form-error`} role="alert">{formError}</FormAlert> : null}
            <Field>
              <Label htmlFor={fieldId('email')}>이메일</Label>
              <Input
                id={fieldId('email')} name="email" type="email" inputMode="email"
                autoComplete="email" placeholder="name@company.com" maxLength={EMAIL_MAX_LENGTH}
                value={values.email} onChange={handleChange} aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? errorId('email') : undefined} disabled={submitting}
              />
              {errors.email ? <FieldError id={errorId('email')}>{errors.email}</FieldError> : null}
            </Field>
            <Field>
              <LabelRow>
                <Label htmlFor={fieldId('password')}>비밀번호</Label>
                <TogglePassword
                  type="button" onClick={togglePassword} disabled={submitting}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  aria-controls={fieldId('password')} aria-pressed={showPassword}
                >{showPassword ? '숨기기' : '표시'}</TogglePassword>
              </LabelRow>
              <Input
                id={fieldId('password')} name="password" type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" placeholder="비밀번호를 입력하세요"
                value={values.password} onChange={handleChange} aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? errorId('password') : undefined} disabled={submitting}
              />
              {errors.password ? <FieldError id={errorId('password')}>{errors.password}</FieldError> : null}
            </Field>
            <Submit type="submit" disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
              {!submitting && <span aria-hidden="true">→</span>}
            </Submit>
          </Form>
          <SwitchAuth>아직 계정이 없으신가요? <Link to="/signup">회원가입</Link></SwitchAuth>
        </FormContent>
      </FormPanel>
    </Container>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  width: 100%;
  max-width: 1056px;
  min-width: 0;
  min-height: 610px;
  margin: 1rem auto;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.5rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 64px rgb(32 35 49 / 4%);
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    min-height: auto;
    max-width: 480px;
    margin-block: 0;
  }
`
const BrandPanel = styled.aside`
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: clamp(1.75rem, 3.5vw, 3rem);
  background: linear-gradient(145deg, #f0edff, #eeeffc 60%, #e7e8fa);
  @media (max-width: 760px) { padding: 1.5rem; }
`
const BrandLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #343047;
  font-size: 1rem;
  font-weight: 750;
  letter-spacing: -0.035em;
`
const BrandMark = styled.span`
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
`
const BrandHeading = styled.h2`
  margin-top: 3rem;
  color: #302946;
  font-size: clamp(1.6rem, 2.6vw, 2rem);
  line-height: 1.5;
  letter-spacing: -0.05em;
  word-break: keep-all;
  @media (max-width: 760px) {
    margin-top: 1rem;
    font-size: 1.35rem;
    br { display: none; }
  }
`
const BrandCopy = styled.p`
  margin-top: 0.8rem;
  color: #6a627e;
  font-size: 0.88rem;
  line-height: 1.85;
  word-break: keep-all;
  @media (max-width: 760px) { display: none; }
`
const WorkspacePreview = styled.div`
  margin-top: 2.5rem;
  padding: 1.2rem;
  transform: rotate(-2deg);
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 85%);
  box-shadow: 0 18px 36px rgb(66 49 126 / 8%);
  @media (max-width: 760px) { display: none; }
`
const PreviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #888196;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
`
const PreviewDots = styled.div`
  display: flex;
  gap: 0.25rem;
  i { width: 0.35rem; height: 0.35rem; border-radius: 50%; background: #e5e0f0; }
`
const PreviewBody = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding-block: 1.2rem;
`
const PreviewIcon = styled.div`
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.7rem;
  background: #eeebff;
  color: #635bff;
  font-weight: 750;
`
const PreviewTitle = styled.div`
  color: #393149;
  font-size: 0.83rem;
  font-weight: 700;
  small { display: block; margin-top: 0.2rem; color: #8a819a; font-size: 0.65rem; font-weight: 400; }
`
const PreviewRow = styled.div`
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-top: 1px solid #f0edf5;
  color: #6b627b;
  font-size: 0.7rem;
  > span:first-child { display: flex; align-items: center; gap: 0.5rem; }
`
const RowIcon = styled.span`
  color: #9b93b0;
  font-size: 1rem;
`
const PreviewPill = styled.span`
  padding: 0.2rem 0.45rem;
  border-radius: 0.3rem;
  background: #eeebff;
  color: #796bd0;
  font-size: 0.6rem;
`
const PreviewAvatars = styled.span`
  display: flex;
  i {
    display: grid; width: 1.45rem; height: 1.45rem; place-items: center;
    margin-left: -0.3rem; border: 2px solid #fff; border-radius: 50%;
    background: #e9e3fa; color: #9380bf; font-size: 0.5rem; font-style: normal;
  }
  i:nth-child(2) { background: #e2e8fa; color: #758cc4; }
  i:last-child { background: #f2eff7; }
`
const BrandFooter = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 2rem;
  color: #827792;
  font-size: 0.7rem;
  span { color: #8c7bbf; }
  @media (max-width: 760px) { display: none; }
`
const FormPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3.5rem);
  @media (max-width: 760px) { padding-block: 2rem; }
`
const FormContent = styled.div`
  width: 100%;
  max-width: 360px;
`
