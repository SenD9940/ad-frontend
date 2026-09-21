import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../auth/AuthContext'

type IconName = 'grid' | 'people' | 'link' | 'arrow' | 'check' | 'shield' | 'image' | 'plus'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></>,
    link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(0 0) scale(.92)" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6l-8-3Z" /><path d="m8 11 3 3 5-5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><path d="M17 7h.01" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const features: { icon: IconName; title: string; description: string; label: string }[] = [
  { icon: 'grid', title: '업무의 기준은 워크스페이스', description: '브랜드와 프로젝트별로 공간을 만들고, 팀과 광고 자산을 필요한 곳에 모아 두세요.', label: '하나의 공간, 명확한 구분' },
  { icon: 'people', title: '함께 일할 팀원을 한곳에', description: '이메일로 팀원을 초대하고 멤버를 관리하세요. 소유자와 멤버의 역할을 구분해 협업할 수 있어요.', label: '초대부터 멤버 관리까지' },
  { icon: 'link', title: '흩어진 광고 자산을 연결', description: 'Meta 계정을 연결하고 광고 계정, Facebook 페이지, Instagram 프로필을 선택해 저장하세요.', label: '필요한 자산만 선택' },
]

export default function LandingPage() {
  const { isLoggedIn } = useAuth()
  const [preview, setPreview] = useState<'assets' | 'members'>('assets')
  const startPath = isLoggedIn ? '/workspaces' : '/signup'
  const startLabel = isLoggedIn ? '내 워크스페이스로' : '워크스페이스 시작하기'

  return (
    <Container>
      <Hero>
        <Eyebrow><StatusDot /> A BETTER WAY TO WORK TOGETHER</Eyebrow>
        <HeroTitle>광고의 시작,<br />팀의 <span>연결</span>부터.</HeroTitle>
        <HeroDescription>팀, 계정, 광고 자산을 하나의 워크스페이스로.<br className="desktop-break" /> United Ad에서 우리 팀의 다음 일을 준비하세요.</HeroDescription>
        <HeroActions>
          <PrimaryLink to={startPath}>{startLabel}<Icon name="arrow" size={18} /></PrimaryLink>
          <SecondaryLink href="#product-preview">서비스 둘러보기 <span aria-hidden="true">↓</span></SecondaryLink>
        </HeroActions>
        <HeroNote><Icon name="check" size={14} /> 브랜드별 워크스페이스 <span>·</span><Icon name="check" size={14} /> 팀원과 함께 시작</HeroNote>
      </Hero>

      <PreviewSection id="product-preview" aria-label="워크스페이스 기능 미리보기">
        <PreviewCaption><span><StatusDot /> YOUR TEAM. ONE WORKSPACE.</span><span>기능 미리보기 · 예시 데이터</span></PreviewCaption>
        <ProductWindow>
          <PreviewSidebar>
            <PreviewBrand><BrandGlyph><i /><i /><i /><i /></BrandGlyph>united ad<span>.</span></PreviewBrand>
            <WorkspaceSwitch><WorkspaceAvatar>U</WorkspaceAvatar><div><strong>유나이티드 팀</strong><span>우리 팀의 워크스페이스</span></div><span aria-hidden="true">⌄</span></WorkspaceSwitch>
            <SidebarLabel>WORKSPACE</SidebarLabel>
            <PreviewTab id="preview-assets-tab" type="button" $active={preview === 'assets'} onClick={() => setPreview('assets')} aria-pressed={preview === 'assets'} aria-controls="preview-content"><Icon name="link" size={17} />플랫폼 연결{preview === 'assets' && <ActiveDot />}</PreviewTab>
            <PreviewTab id="preview-members-tab" type="button" $active={preview === 'members'} onClick={() => setPreview('members')} aria-pressed={preview === 'members'} aria-controls="preview-content"><Icon name="people" size={17} />멤버 관리{preview === 'members' && <ActiveDot />}</PreviewTab>
            <SidebarHelp><Icon name="shield" size={17} /><p>팀의 자산을 연결하는<br /><strong>우리만의 업무 공간</strong></p></SidebarHelp>
            <PreviewProfile><Avatar $tone="purple">나</Avatar><div><strong>워크스페이스 소유자</strong><span>Owner</span></div></PreviewProfile>
          </PreviewSidebar>
          <PreviewMain id="preview-content" role="region" aria-labelledby={preview === 'assets' ? 'preview-assets-tab' : 'preview-members-tab'}>
            <PreviewTopbar><span>워크스페이스 <span aria-hidden="true">/</span> <strong>{preview === 'assets' ? '플랫폼 연결' : '멤버 관리'}</strong></span><PreviewBadge>미리보기</PreviewBadge></PreviewTopbar>
            <PreviewContent>
              <PreviewHeading><div><h2>{preview === 'assets' ? '팀의 광고 자산을 한곳에' : '좋은 팀워크의 시작'}</h2><p>{preview === 'assets' ? '연결된 계정과 우리 팀이 사용할 자산을 확인하세요.' : '함께할 멤버를 초대하고 역할을 확인하세요.'}</p></div><PeopleStack aria-label="예시 팀원 3명"><Avatar $tone="purple">김</Avatar><Avatar $tone="peach">이</Avatar><Avatar $tone="green">박</Avatar></PeopleStack></PreviewHeading>
              {preview === 'assets' ? <>
                <MetaConnection><MetaMark aria-hidden="true">∞</MetaMark><div><strong>Meta</strong><p>유나이티드 비즈니스 계정</p></div><ConnectedBadge><StatusDot />연결됨</ConnectedBadge></MetaConnection>
                <AssetHeading><h3>워크스페이스에 연결한 자산</h3><span>3개 자산</span></AssetHeading>
                <AssetList>
                  <AssetRow><AssetIcon $tone="blue"><Icon name="grid" size={19} /></AssetIcon><div><strong>유나이티드 광고 계정</strong><span>광고 계정</span></div><AssetType>Facebook</AssetType><SelectedCheck><Icon name="check" size={12} /></SelectedCheck></AssetRow>
                  <AssetRow><AssetIcon $tone="blue"><FacebookLetter>f</FacebookLetter></AssetIcon><div><strong>유나이티드 브랜드</strong><span>Facebook 페이지</span></div><AssetType>Facebook</AssetType><SelectedCheck><Icon name="check" size={12} /></SelectedCheck></AssetRow>
                  <AssetRow><AssetIcon $tone="pink"><Icon name="image" size={20} /></AssetIcon><div><strong>@united.brand</strong><span>Instagram 프로필</span></div><AssetType>Instagram</AssetType><SelectedCheck><Icon name="check" size={12} /></SelectedCheck></AssetRow>
                </AssetList>
                <PreviewFootnote><Icon name="shield" size={14} /> 연결된 자산은 워크스페이스 멤버와 함께 확인할 수 있어요.</PreviewFootnote>
              </> : <>
                <MemberIntro><Icon name="people" size={22} /><div><strong>함께하는 멤버</strong><p>초대한 팀원과 같은 자산을 보며 협업하세요.</p></div><span>3명</span></MemberIntro>
                <MemberList>
                  {[{ name: '김유나', email: 'yuna@example.com', role: '소유자', tone: 'purple' as const }, { name: '이민수', email: 'minsu@example.com', role: '멤버', tone: 'peach' as const }, { name: '박서연', email: 'seoyeon@example.com', role: '멤버', tone: 'green' as const }].map((member) => <AssetRow key={member.email}><Avatar $tone={member.tone}>{member.name.slice(0, 1)}</Avatar><div><strong>{member.name}</strong><span>{member.email}</span></div><RoleBadge $owner={member.role === '소유자'}>{member.role}</RoleBadge></AssetRow>)}
                </MemberList>
                <PreviewFootnote><Icon name="shield" size={14} /> 계정 연결과 멤버 관리는 소유자가 담당해요.</PreviewFootnote>
              </>}
            </PreviewContent>
          </PreviewMain>
        </ProductWindow>
        <PreviewHint>왼쪽 메뉴를 선택해 플랫폼 연결과 멤버 관리를 살펴보세요.</PreviewHint>
      </PreviewSection>

      <PlatformStrip aria-label="현재 지원하는 Meta 플랫폼">
        <p>익숙한 플랫폼과,<br /><strong>새로운 업무의 시작.</strong></p>
        <PlatformWordmark><MetaMark aria-hidden="true">∞</MetaMark>Meta</PlatformWordmark>
        <PlatformWordmark><FacebookLogo aria-hidden="true">f</FacebookLogo>Facebook</PlatformWordmark>
        <PlatformWordmark><Icon name="image" size={26} />Instagram</PlatformWordmark>
      </PlatformStrip>

      <Section id="features">
        <SectionHeading><SectionEyebrow>BUILT FOR YOUR TEAM</SectionEyebrow><h2>복잡한 준비는 줄이고,<br />함께할 일에 집중하세요.</h2><p>팀과 광고 자산을 정리하는 일부터, 더 간결하게.</p></SectionHeading>
        <FeatureGrid>{features.map((feature, index) => <FeatureCard key={feature.title}><FeatureTop><FeatureIcon><Icon name={feature.icon} size={25} /></FeatureIcon><span>0{index + 1}</span></FeatureTop><h3>{feature.title}</h3><p>{feature.description}</p><FeatureLabel><Icon name="check" size={14} />{feature.label}</FeatureLabel></FeatureCard>)}</FeatureGrid>
      </Section>

      <WorkflowSection id="workflow">
        <WorkflowIntro><SectionEyebrow>FROM SETUP TO TEAMWORK</SectionEyebrow><h2>우리 팀의 시작을<br />가볍게, 세 단계로.</h2><p>빈 공간에서 함께 일할 준비까지.<br />차근차근 연결하면 됩니다.</p><TextLink to={startPath}>지금 시작하기 <Icon name="arrow" size={18} /></TextLink></WorkflowIntro>
        <WorkflowSteps>
          {[{ title: '우리 팀의 공간을 만드세요', description: '브랜드나 프로젝트 이름으로 워크스페이스를 만들어 주세요.' }, { title: '함께할 팀원을 초대하세요', description: '팀원의 이메일로 초대를 보내고, 초대 링크로 합류하세요.' }, { title: '사용할 Meta 자산을 연결하세요', description: '소유자가 Meta 계정을 연결하면 팀에서 사용할 자산을 선택할 수 있어요.' }].map((step, index) => <WorkflowStep key={step.title}><StepNumber>0{index + 1}</StepNumber><div><h3>{step.title}</h3><p>{step.description}</p></div></WorkflowStep>)}
        </WorkflowSteps>
      </WorkflowSection>

      <Section id="integrations">
        <IntegrationHeading><SectionHeading><SectionEyebrow>CONNECTED POSSIBILITIES</SectionEyebrow><h2>하나씩 연결하고,<br />더 넓게 협업하세요.</h2></SectionHeading><p>지금은 Meta와 함께.<br />더 다양한 플랫폼 연결을 준비하고 있어요.</p></IntegrationHeading>
        <IntegrationGrid>
          <IntegrationCard $available><IntegrationCardTop><IntegrationIcon $brand="meta">∞</IntegrationIcon><AvailableBadge>연동 가능</AvailableBadge></IntegrationCardTop><h3>Meta</h3><p>Facebook 광고 계정과 페이지,<br />Instagram 프로필을 연결하세요.</p><IntegrationLink to={startPath}>워크스페이스에서 연결 <Icon name="arrow" size={16} /></IntegrationLink></IntegrationCard>
          <IntegrationCard><IntegrationCardTop><IntegrationIcon $brand="naver">N</IntegrationIcon><ComingBadge>준비 중</ComingBadge></IntegrationCardTop><h3>Naver</h3><p>네이버 플랫폼 연동을<br />준비하고 있습니다.</p><ComingLabel>Coming soon</ComingLabel></IntegrationCard>
          <IntegrationCard><IntegrationCardTop><IntegrationIcon $brand="threads">@</IntegrationIcon><ComingBadge>준비 중</ComingBadge></IntegrationCardTop><h3>Threads</h3><p>Threads 플랫폼 연동을<br />준비하고 있습니다.</p><ComingLabel>Coming soon</ComingLabel></IntegrationCard>
          <IntegrationCard><IntegrationCardTop><IntegrationIcon $brand="coupang">C</IntegrationIcon><ComingBadge>준비 중</ComingBadge></IntegrationCardTop><h3>Coupang</h3><p>쿠팡 플랫폼 연동을<br />준비하고 있습니다.</p><ComingLabel>Coming soon</ComingLabel></IntegrationCard>
        </IntegrationGrid>
      </Section>

      <ClosingSection><ClosingGraphic aria-hidden="true"><i /><i /><i /><i /></ClosingGraphic><SectionEyebrow>LET’S WORK, TOGETHER.</SectionEyebrow><h2>다음 시작은,<br />우리 팀의 워크스페이스에서.</h2><p>함께할 사람과 필요한 자산을 연결해 보세요.</p><PrimaryLink to={startPath}>{startLabel}<Icon name="arrow" size={18} /></PrimaryLink></ClosingSection>
    </Container>
  )
}

const Container = styled.div`width: 100%; min-width: 0; color: ${({ theme }) => theme.colors.text};`
const Hero = styled.section`padding: 58px 0 48px; text-align: center; @media (max-width: 600px) { padding: 35px 0 35px; }`
const Eyebrow = styled.p`display: inline-flex; align-items: center; gap: 9px; padding: 7px 12px; border: 1px solid #e5e3f8; border-radius: 6px; background: #f7f6ff; color: #655d9c; font-size: 10px; font-weight: 700; letter-spacing: 1.3px; @media (max-width: 400px) { font-size: 9px; letter-spacing: .9px; }`
const StatusDot = styled.i`display: inline-block; flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: currentColor;`
const HeroTitle = styled.h1`margin: 22px 0 18px; font-size: clamp(40px, 5.8vw, 66px); font-weight: 750; line-height: 1.2; letter-spacing: -.065em; span { color: ${({ theme }) => theme.colors.primary}; }`
const HeroDescription = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; font-size: 16px; line-height: 1.85; letter-spacing: -.35px; word-break: keep-all; @media (max-width: 600px) { font-size: 14px; } @media (max-width: 380px) { .desktop-break { display: none; } }`
const HeroActions = styled.div`display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; margin-top: 27px;`
const PrimaryLink = styled(Link)`display: inline-flex; align-items: center; justify-content: center; gap: 18px; min-height: 48px; padding: 12px 20px; border: 1px solid ${({ theme }) => theme.colors.primary}; border-radius: 8px; color: white; background: ${({ theme }) => theme.colors.primary}; font-size: 13px; font-weight: 650; text-decoration: none; box-shadow: 0 3px 5px rgb(99 91 255 / 15%); transition: background 160ms ease, transform 160ms ease; &:hover { background: ${({ theme }) => theme.colors.primaryHover}; color: white; transform: translateY(-1px); }`
const SecondaryLink = styled.a`display: inline-flex; align-items: center; justify-content: center; gap: 20px; min-height: 48px; padding: 12px 20px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; background: white; color: ${({ theme }) => theme.colors.text}; font-size: 13px; font-weight: 600; text-decoration: none; &:hover { background: ${({ theme }) => theme.colors.surfaceMuted}; }`
const HeroNote = styled.p`display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 5px; margin-top: 17px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; > span { margin-inline: 6px; } svg { color: #8d87b6; }`
const PreviewSection = styled.section`padding: 20px 30px 15px; border: 1px solid #e8e5f1; border-radius: 16px; background: linear-gradient(125deg, #efedfa, #f3f3f6 53%, #eaf1ed); scroll-margin-top: 12px; @media (max-width: 760px) { padding: 14px 12px 12px; border-radius: 12px; }`
const PreviewCaption = styled.div`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 17px; color: #75718a; font-size: 10px; > span:first-child { display: flex; align-items: center; gap: 7px; font-size: 9px; font-weight: 650; letter-spacing: 1.25px; } @media (max-width: 480px) { > span:first-child { font-size: 8px; letter-spacing: .6px; } font-size: 9px; }`
const ProductWindow = styled.div`display: grid; grid-template-columns: 211px minmax(0, 1fr); overflow: hidden; border: 1px solid #dedfe8; border-radius: 9px; background: #fff; box-shadow: 0 12px 38px rgb(47 41 82 / 7%), 0 1px 3px rgb(47 41 82 / 4%); @media (max-width: 760px) { grid-template-columns: 164px minmax(0, 1fr); } @media (max-width: 600px) { display: flex; flex-direction: column; }`
const PreviewSidebar = styled.div`display: flex; flex-direction: column; gap: 5px; padding: 23px 15px 15px; border-right: 1px solid #e8e9f0; background: #fbfbfd; @media (max-width: 600px) { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding: 13px; border-right: 0; border-bottom: 1px solid #e8e9f0; }`
const PreviewBrand = styled.div`display: flex; align-items: center; gap: 7px; padding: 0 7px; color: #202331; font-size: 18px; font-weight: 800; letter-spacing: -.7px; > span { margin-left: -7px; color: #635bff; } @media (max-width: 760px) { font-size: 15px; } @media (max-width: 600px) { grid-column: 1 / -1; margin-bottom: 5px; }`
const BrandGlyph = styled.span`display: grid; grid-template-columns: repeat(2, 5px); gap: 2px; padding: 6px; border-radius: 6px; background: #635bff; i { width: 5px; height: 5px; border-radius: 1px; background: white; } i:nth-child(2) { opacity: .55; } i:nth-child(3) { opacity: .7; }`
const WorkspaceSwitch = styled.div`display: flex; align-items: center; gap: 8px; margin-top: 24px; margin-bottom: 14px; padding: 10px 7px; border: 1px solid #e8e9f0; border-radius: 6px; background: white; div { flex: 1; } strong { display: block; font-size: 10px; font-weight: 650; } div > span { display: block; margin-top: 2px; color: #8a8d9b; font-size: 8px; } > span:last-child { color: #9598a8; } @media (max-width: 600px) { display: none; }`
const WorkspaceAvatar = styled.span`display: grid; flex-shrink: 0; place-items: center; width: 28px; height: 28px; border-radius: 6px; background: #edeaff; color: #635bff; font-size: 13px; font-weight: 750;`
const SidebarLabel = styled.p`padding: 0 9px; margin: 6px 0; color: #9698a7; font-size: 8px; font-weight: 600; letter-spacing: 1px; @media (max-width: 600px) { display: none; }`
const PreviewTab = styled.button<{ $active: boolean }>`&& { display: flex; justify-content: flex-start; min-height: 38px; padding: 9px 11px; border: 0; border-radius: 6px; background: ${({ $active }) => $active ? '#eeecff' : 'transparent'}; color: ${({ $active }) => $active ? '#635bff' : '#6c7080'}; font-size: 11px; font-weight: ${({ $active }) => $active ? 650 : 500}; text-align: left; } &&:hover { background: #eeecff; color: #635bff; }`
const ActiveDot = styled.span`width: 5px; height: 5px; margin-left: auto; border-radius: 50%; background: #635bff;`
const SidebarHelp = styled.div`display: flex; align-items: flex-start; gap: 8px; margin: auto 7px 23px; padding-top: 34px; color: #8a86aa; p { font-size: 9px; line-height: 1.8; } strong { font-weight: 500; } @media (max-width: 600px) { display: none; }`
const PreviewProfile = styled.div`display: flex; align-items: center; gap: 9px; padding-top: 14px; border-top: 1px solid #e8e9f0; strong { display: block; font-size: 9px; font-weight: 600; } div > span { color: #999aaa; font-size: 8px; } @media (max-width: 600px) { display: none; }`
const Avatar = styled.span<{ $tone: 'purple' | 'peach' | 'green' }>`display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; width: 30px; height: 30px; border: 2px solid white; border-radius: 50%; background: ${({ $tone }) => ({ purple: '#e9e5ff', peach: '#fae5d8', green: '#deeee6' })[$tone]}; color: ${({ $tone }) => ({ purple: '#7566b7', peach: '#a77553', green: '#5e8f79' })[$tone]}; font-size: 10px; font-weight: 700;`
const PreviewMain = styled.div`min-width: 0;`
const PreviewTopbar = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 12px 28px; border-bottom: 1px solid #eeeef4; color: #9396a4; font-size: 10px; > span > span { margin-inline: 9px; color: #c4c5ce; } strong { color: #54596c; font-weight: 500; } @media (max-width: 760px) { padding-inline: 17px; }`
const PreviewBadge = styled.span`padding: 3px 7px; border: 1px solid #e8e9f0; border-radius: 4px; color: #8d90a0; font-size: 8px; white-space: nowrap;`
const PreviewContent = styled.div`min-height: 356px; padding: 24px 29px 22px; @media (max-width: 760px) { padding: 20px 17px; } @media (max-width: 600px) { min-height: 0; padding: 20px 14px 15px; }`
const PreviewHeading = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; h2 { font-size: 19px; font-weight: 700; letter-spacing: -.6px; } p { margin-top: 5px; color: #8a8e9f; font-size: 10px; } @media (max-width: 760px) { h2 { font-size: 17px; } } @media (max-width: 400px) { h2 { font-size: 16px; } p { font-size: 9px; } }`
const PeopleStack = styled.div`display: flex; flex-shrink: 0; > span + span { margin-left: -9px; } @media (max-width: 900px) { display: none; }`
const MetaConnection = styled.div`display: flex; align-items: center; gap: 11px; padding: 15px; border: 1px solid #e5e5f1; border-radius: 7px; background: #fdfdff; strong { font-size: 12px; font-weight: 700; } p { margin-top: 1px; color: #9396a4; font-size: 9px; } @media (max-width: 400px) { gap: 8px; padding: 12px; }`
const MetaMark = styled.span`color: #1479ed; font-family: Arial, sans-serif; font-size: 37px; font-weight: 500; line-height: 1;`
const ConnectedBadge = styled.span`display: inline-flex; align-items: center; gap: 5px; margin-left: auto; padding: 4px 7px; border-radius: 4px; background: #edf8f2; color: #3d916b; font-size: 8px; font-weight: 600; white-space: nowrap; i { width: 4px; height: 4px; }`
const AssetHeading = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 21px 0 9px; h3 { font-size: 10px; font-weight: 600; } > span { color: #9699a6; font-size: 9px; }`
const AssetList = styled.div`border: 1px solid #e9e9f0; border-radius: 7px;`
const AssetRow = styled.div`display: flex; align-items: center; gap: 10px; min-height: 58px; padding: 10px 13px; + div { border-top: 1px solid #efeff5; } > div { min-width: 0; } strong { display: block; color: #505465; font-size: 10px; font-weight: 600; overflow-wrap: anywhere; } div > span { display: block; margin-top: 1px; color: #9b9dab; font-size: 8px; } @media (max-width: 400px) { gap: 7px; padding-inline: 10px; }`
const AssetIcon = styled.span<{ $tone: 'blue' | 'pink' }>`display: grid; flex-shrink: 0; place-items: center; width: 29px; height: 29px; border-radius: 6px; background: ${({ $tone }) => $tone === 'blue' ? '#eff4ff' : '#fff0f5'}; color: ${({ $tone }) => $tone === 'blue' ? '#7598ec' : '#d68bae'};`
const FacebookLetter = styled.span`font-family: Arial, sans-serif; font-size: 21px; font-weight: 700;`
const AssetType = styled.span`margin-left: auto; color: #a0a3b1; font-size: 8px; @media (max-width: 760px) { display: none; }`
const SelectedCheck = styled.span`display: grid; flex-shrink: 0; place-items: center; width: 16px; height: 16px; margin-left: 14px; border-radius: 4px; background: #736bfa; color: white; @media (max-width: 760px) { margin-left: auto; }`
const PreviewFootnote = styled.p`display: flex; align-items: center; gap: 5px; margin-top: 13px; color: #9497a7; font-size: 8px; svg { flex-shrink: 0; }`
const MemberIntro = styled.div`display: flex; align-items: center; gap: 12px; min-height: 70px; padding: 14px; border: 1px solid #e5e5f1; border-radius: 7px; background: #fdfdff; > svg { color: #847acd; } strong { font-size: 11px; } p { margin-top: 2px; color: #9396a4; font-size: 9px; } > span { margin-left: auto; color: #8178b1; font-size: 10px; white-space: nowrap; }`
const MemberList = styled(AssetList)`margin-top: 23px;`
const RoleBadge = styled.span<{ $owner: boolean }>`margin-left: auto; padding: 4px 7px; border-radius: 4px; background: ${({ $owner }) => $owner ? '#efecfd' : '#f3f4f7'}; color: ${({ $owner }) => $owner ? '#8472ba' : '#8a8e9e'}; font-size: 8px; white-space: nowrap;`
const PreviewHint = styled.p`margin-top: 12px; color: #8c879d; font-size: 9px; text-align: center; @media (max-width: 600px) { font-size: 8px; }`
const PlatformStrip = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 25px; padding: 36px 58px 38px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; > p { color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.7; } strong { color: ${({ theme }) => theme.colors.textSecondary}; font-weight: 600; } @media (max-width: 760px) { gap: 20px; padding: 27px 5px; } @media (max-width: 600px) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px 8px; > p { grid-column: 1 / -1; text-align: center; br { display: none; } strong { margin-left: 5px; } } }`
const PlatformWordmark = styled.div`display: inline-flex; align-items: center; justify-content: center; gap: 7px; color: #687082; font-size: 20px; font-weight: 650; letter-spacing: -.7px; ${MetaMark} { color: #758098; font-size: 35px; } @media (max-width: 760px) { font-size: 16px; gap: 5px; svg { width: 21px; } } @media (max-width: 400px) { font-size: 14px; ${MetaMark} { font-size: 27px; } }`
const FacebookLogo = styled.span`display: grid; place-items: center; width: 24px; height: 24px; overflow: hidden; border-radius: 50%; background: #7d869a; color: white; font-family: Arial, sans-serif; font-size: 26px; line-height: 1.2; @media (max-width: 600px) { width: 20px; height: 20px; font-size: 23px; }`
const Section = styled.section`padding: 79px 0 73px; scroll-margin-top: 0; @media (max-width: 600px) { padding-block: 52px; scroll-margin-top: 0; }`
const SectionHeading = styled.div`h2 { margin-top: 11px; font-size: clamp(27px, 3vw, 35px); font-weight: 700; line-height: 1.4; letter-spacing: -1.5px; } > p:last-child { margin-top: 15px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px; }`
const SectionEyebrow = styled.p`color: ${({ theme }) => theme.colors.primary}; font-size: 9px; font-weight: 700; letter-spacing: 1.5px;`
const FeatureGrid = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 30px; @media (max-width: 700px) { grid-template-columns: 1fr; gap: 13px; }`
const FeatureCard = styled.article`display: flex; flex-direction: column; padding: 26px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px; background: white; h3 { margin-top: 22px; font-size: 17px; font-weight: 650; letter-spacing: -.6px; } > p { margin-top: 11px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; line-height: 1.85; word-break: keep-all; } @media (max-width: 900px) { padding: 20px; h3 { font-size: 15px; } } @media (max-width: 700px) { h3 { margin-top: 16px; font-size: 17px; } }`
const FeatureTop = styled.div`display: flex; align-items: center; justify-content: space-between; > span { align-self: flex-start; color: #bcbeca; font-size: 10px; font-variant-numeric: tabular-nums; }`
const FeatureIcon = styled.div`display: grid; place-items: center; width: 47px; height: 47px; border: 1px solid #ece9fc; border-radius: 11px; background: #f6f4ff; color: #8573d9;`
const FeatureLabel = styled.div`display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 27px; color: #8b859f; font-size: 10px; svg { color: #8980ba; }`
const WorkflowSection = styled.section`display: grid; grid-template-columns: 1fr 1.15fr; gap: 65px; padding: 50px; border: 1px solid #eae8f0; border-radius: 12px; background: #f4f3f8; scroll-margin-top: 12px; @media (max-width: 900px) { gap: 30px; padding: 34px; } @media (max-width: 650px) { grid-template-columns: 1fr; gap: 30px; padding: 26px; }`
const WorkflowIntro = styled.div`h2 { margin-top: 13px; font-size: 30px; font-weight: 700; line-height: 1.4; letter-spacing: -1.5px; } > p:not(:first-child) { margin-top: 15px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; line-height: 1.85; } @media (max-width: 760px) { h2 { font-size: 27px; } }`
const TextLink = styled(Link)`display: inline-flex; align-items: center; gap: 14px; min-height: 40px; margin-top: 22px; color: ${({ theme }) => theme.colors.primary}; font-size: 12px; font-weight: 600; text-decoration: none;`
const WorkflowSteps = styled.ol`display: flex; flex-direction: column; gap: 0; margin: 0; padding: 0; list-style: none;`
const WorkflowStep = styled.li`position: relative; display: flex; align-items: flex-start; gap: 18px; padding-bottom: 29px; &:last-child { padding-bottom: 0; } &:not(:last-child)::after { position: absolute; top: 37px; bottom: 5px; left: 16px; width: 1px; background: #ded9ed; content: ''; } h3 { margin-top: 7px; font-size: 14px; font-weight: 650; letter-spacing: -.5px; } p { max-width: 350px; margin-top: 8px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; line-height: 1.8; word-break: keep-all; }`
const StepNumber = styled.span`display: grid; flex-shrink: 0; place-items: center; width: 34px; height: 34px; border: 1px solid #ded9ed; border-radius: 50%; background: white; color: #8e7bbd; font-size: 10px; font-weight: 600; font-variant-numeric: tabular-nums;`
const IntegrationHeading = styled.div`display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; > p { padding-bottom: 3px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; line-height: 1.85; } @media (max-width: 600px) { flex-direction: column; align-items: flex-start; gap: 12px; }`
const IntegrationGrid = styled.div`display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; margin-top: 29px; @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } @media (max-width: 400px) { gap: 10px; }`
const IntegrationCard = styled.article<{ $available?: boolean }>`padding: 21px; border: 1px solid ${({ $available }) => $available ? '#dcd8f9' : '#e8e9f0'}; border-radius: 9px; background: ${({ $available }) => $available ? '#fbfaff' : 'white'}; h3 { margin-top: 17px; font-size: 16px; font-weight: 650; letter-spacing: -.4px; } p { margin-top: 9px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; line-height: 1.8; word-break: keep-all; } @media (max-width: 500px) { padding: 16px; }`
const IntegrationCardTop = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 7px;`
const IntegrationIcon = styled.span<{ $brand: 'meta' | 'naver' | 'threads' | 'coupang' }>`display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #eeeeF3; border-radius: 9px; background: white; color: ${({ $brand }) => ({ meta: '#1479ed', naver: '#24ac5a', threads: '#383b43', coupang: '#bd844b' })[$brand]}; font-family: Arial, sans-serif; font-size: ${({ $brand }) => $brand === 'meta' ? '35px' : '23px'}; font-weight: ${({ $brand }) => $brand === 'meta' ? 500 : 800}; line-height: 1;`
const AvailableBadge = styled.span`padding: 4px 6px; border-radius: 4px; background: #edeaff; color: #8a78c2; font-size: 8px; font-weight: 600; white-space: nowrap;`
const ComingBadge = styled(AvailableBadge)`background: #f3f4f6; color: #9396a3;`
const IntegrationLink = styled(Link)`display: flex; align-items: center; gap: 9px; min-height: 36px; margin-top: 17px; color: #8572bf; font-size: 10px; font-weight: 600; text-decoration: none; @media (max-width: 500px) { gap: 5px; font-size: 9px; }`
const ComingLabel = styled.span`display: flex; align-items: center; min-height: 36px; margin-top: 17px; color: #b0b1bb; font-size: 10px;`
const ClosingSection = styled.section`position: relative; overflow: hidden; padding: 46px 20px 49px; margin-bottom: 34px; border: 1px solid #e7e3f3; border-radius: 13px; background: #eeecf7; text-align: center; h2 { position: relative; margin-top: 13px; font-size: clamp(25px, 3vw, 34px); font-weight: 700; line-height: 1.4; letter-spacing: -1.4px; } > p { position: relative; } > p:not(:first-of-type) { margin-top: 14px; color: #8a819d; font-size: 12px; } > a { position: relative; margin-top: 23px; }`
const ClosingGraphic = styled.div`position: absolute; right: -45px; top: 30px; display: grid; grid-template-columns: repeat(2, 100px); gap: 22px; transform: rotate(-18deg); opacity: .22; i { width: 100px; height: 100px; border-radius: 24px; background: #d2cbea; } i:nth-child(2) { opacity: .45; } i:nth-child(3) { opacity: .6; } @media (max-width: 650px) { right: -95px; opacity: .14; }`
