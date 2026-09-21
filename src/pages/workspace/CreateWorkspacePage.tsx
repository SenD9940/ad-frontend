import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'
import { WORKSPACE_NAME_MAX_LENGTH } from './workspaceValidation'
import Icon from '../../components/common/Icon'

export default function CreateWorkspacePage() {
  const { formId, name, nameError, formError, submitting, handleChange, handleSubmit } = useCreateWorkspace()
  return (
    <Page>
      <Back to="/workspaces"><Icon name="back" size={17} />워크스페이스로 돌아가기</Back>
      <Header><Eyebrow>LET’S GET STARTED</Eyebrow><h1>팀을 위한 공간을 만들어 보세요</h1><p>브랜드, 프로젝트, 팀마다 독립적인 워크스페이스를 만들 수 있어요.</p></Header>
      <Layout>
        <Card><CardIcon><Icon name="grid" size={26} /></CardIcon><h2 id={`${formId}-title`}>새 워크스페이스</h2><p>팀이 쉽게 알아볼 수 있는 이름을 정해 주세요.</p>
          <Form onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-title`} aria-busy={submitting}>
            {formError && <Alert role="alert">{formError}</Alert>}
            <Field><Label htmlFor={`${formId}-name`}>워크스페이스 이름 <span>필수</span></Label><Input id={`${formId}-name`} name="name" type="text" autoComplete="organization" placeholder="예: 유나이티드 마케팅팀" maxLength={WORKSPACE_NAME_MAX_LENGTH} value={name} onChange={handleChange} aria-required="true" aria-invalid={Boolean(nameError)} aria-describedby={`${formId}-hint${nameError ? ` ${formId}-name-error` : ''}`} disabled={submitting} /><Hint><span id={`${formId}-hint`}>회사명이나 팀 이름을 추천해요.</span><span>{name.length}/{WORKSPACE_NAME_MAX_LENGTH}</span></Hint>{nameError && <FieldError id={`${formId}-name-error`}>{nameError}</FieldError>}</Field>
            <Preview aria-label="워크스페이스 이름 미리보기"><span>{name.trim().slice(0, 1) || 'W'}</span><div><strong>{name.trim() || '우리 팀의 워크스페이스'}</strong><small>나만의 새로운 협업 공간</small></div><Owner>소유자</Owner></Preview>
            <Submit type="submit" disabled={submitting}>{submitting ? '워크스페이스 만드는 중...' : '워크스페이스 만들기'}<Icon name="arrow" size={17} /></Submit>
          </Form>
          <Footnote><Icon name="shield" size={15} />생성 후 플랫폼을 연결하고 멤버를 초대할 수 있어요.</Footnote>
        </Card>
        <Steps><Eyebrow>시작은 간단하게</Eyebrow><h2>이렇게 연결해 보세요.</h2><ol><li><StepNumber $active>01</StepNumber><div><h3>워크스페이스 만들기</h3><p>팀의 광고 자산을 관리할 공간을 만드세요.</p></div></li><li><StepNumber>02</StepNumber><div><h3>광고 플랫폼 연결하기</h3><p>Meta 계정을 연결하고 관리할 자산을 선택하세요.</p></div></li><li><StepNumber>03</StepNumber><div><h3>팀원 초대하기</h3><p>이메일로 함께할 멤버를 초대하세요.</p></div></li></ol><StepNote><Icon name="users" size={19} /><p>여러 워크스페이스를 만들어 팀과 브랜드별로 나누어 관리할 수 있습니다.</p></StepNote></Steps>
      </Layout>
    </Page>
  )
}

const Page = styled.div`max-width: 1000px; margin: 0 auto;`
const Back = styled(Link)`display: inline-flex; align-items: center; gap: 8px; min-height: 36px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; text-decoration: none;`
const Header = styled.header`margin: 26px 0 30px; h1 { font-size: clamp(24px, 3vw, 30px); font-weight: 750; } > p { margin-top: 10px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px; line-height: 1.8; word-break: keep-all; }`
const Eyebrow = styled.p`margin-bottom: 10px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 650; letter-spacing: 1.3px;`
const Layout = styled.div`display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; align-items: start; @media(max-width: 1050px) { grid-template-columns: 1fr; }`
const Card = styled.section`padding: clamp(23px, 3vw, 34px); border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 13px; background: white; box-shadow: ${({ theme }) => theme.shadows.sm}; h2 { margin-top: 20px; font-size: 20px; } > p { margin-top: 7px; font-size: 13px; color: ${({ theme }) => theme.colors.textSecondary}; }`
const CardIcon = styled.span`display: grid; place-items: center; width: 52px; height: 52px; border: 1px solid #e8e2ff; border-radius: 14px; color: #8571d4; background: #f5f2ff;`
const Form = styled.form`display: flex; flex-direction: column; gap: 24px; margin-top: 30px;`
const Field = styled.div`display: flex; flex-direction: column; gap: 8px;`
const Label = styled.label`display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 650; span { color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 400; }`
const Input = styled.input`width: 100%; font-size: 14px;`
const Hint = styled.div`display: flex; justify-content: space-between; gap: 10px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px;`
const Alert = styled.p`padding: 12px 14px; border: 1px solid #f4d9d9; border-radius: 7px; background: #fff5f5; color: ${({ theme }) => theme.colors.error}; font-size: 13px;`
const FieldError = styled.p`font-size: 12px; color: ${({ theme }) => theme.colors.error};`
const Preview = styled.div`display: flex; align-items: center; gap: 12px; padding: 15px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 9px; background: #fbfbfe; > span:first-child { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 9px; background: #eeecff; color: #8070c4; font-size: 16px; font-weight: 600; } div { min-width: 0; flex: 1; } strong { display: block; overflow-wrap: anywhere; font-size: 12px; } small { display: block; margin-top: 3px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; }`
const Owner = styled.span`flex-shrink: 0; padding: 3px 6px; border-radius: 4px; background: #f1eefb; color: #8b7ba9; font-size: 9px;`
const Submit = styled.button`width: 100%; min-height: 46px; border-radius: 7px; font-size: 13px;`
const Footnote = styled.div`display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 17px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px;`
const Steps = styled.aside`padding: 29px 20px; h2 { font-size: 20px; } ol { display: flex; flex-direction: column; gap: 26px; margin-top: 30px; } li { display: flex; gap: 13px; } h3 { font-size: 13px; font-weight: 650; } li p { margin-top: 6px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; line-height: 1.8; word-break: keep-all; } @media(max-width: 1050px) { padding: 10px; }`
const StepNumber = styled.span<{ $active?: boolean }>`display: grid; place-items: center; flex-shrink: 0; width: 29px; height: 29px; border: 1px solid ${({ $active }) => $active ? '#e1dbfc' : '#e5e5ee'}; border-radius: 8px; background: ${({ $active }) => $active ? '#eeecff' : '#fff'}; color: ${({ $active }) => $active ? '#8571d4' : '#9491a2'}; font-size: 10px; font-weight: 600;`
const StepNote = styled.div`display: flex; align-items: flex-start; gap: 10px; margin-top: 35px; padding-top: 24px; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; p { font-size: 11px; line-height: 1.8; word-break: keep-all; }`
