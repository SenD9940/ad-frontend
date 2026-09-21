import { Link } from 'react-router-dom'
import styled from 'styled-components'

export default function Footer() {
  return (
    <Container>
      <Inner>
        <TopRow>
          <div>
            <Brand to="/" aria-label="United Ad 홈">united ad<span>.</span></Brand>
            <Tagline>팀과 광고 자산을 연결하는 하나의 공간.</Tagline>
          </div>
          <FooterNavigation aria-label="하단 메뉴">
            <a href="/#features">주요 기능</a>
            <a href="/#workflow">이용 방법</a>
            <a href="mailto:dnqlsdnqls529@orinan.kr">문의하기 ↗</a>
          </FooterNavigation>
        </TopRow>
        <BusinessInfo aria-label="사업자 정보">
          <div><dt>상호</dt><dd>주식회사 오리넌</dd></div>
          <div><dt>대표자</dt><dd>김윤재</dd></div>
          <div><dt>사업자등록번호</dt><dd>488-86-03327</dd></div>
          <div><dt>이메일</dt><dd><a href="mailto:dnqlsdnqls529@orinan.kr">dnqlsdnqls529@orinan.kr</a></dd></div>
          <div><dt>주소</dt><dd>충청북도 청주시 청원구 안덕벌로104번길 28, 502호 청주대학교 미래창조관(내덕동)</dd></div>
        </BusinessInfo>
        <BottomRow>
          <p>© {new Date().getFullYear()} United Ad. All rights reserved.</p>
          <a href="#">맨 위로 <span aria-hidden="true">↑</span></a>
        </BottomRow>
      </Inner>
    </Container>
  )
}

const Container = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: white;
`
const Inner = styled.div`
  max-width: 1248px;
  margin-inline: auto;
  padding: 52px 32px 24px;
  @media (max-width: 600px) { padding: 36px 20px 20px; }
`
const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
`
const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -1.3px;
  text-decoration: none;
  span { color: ${({ theme }) => theme.colors.primary}; }
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`
const Tagline = styled.p`
  margin-top: 5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
`
const FooterNavigation = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
  a { display: inline-flex; align-items: center; min-height: 44px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px; text-decoration: none; }
  a:hover { color: ${({ theme }) => theme.colors.primary}; }
`
const BusinessInfo = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: 5px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  line-height: 1.9;
  div { display: flex; min-width: 0; gap: 7px; }
  div:last-child { width: 100%; }
  dt { flex-shrink: 0; }
  dd { min-width: 0; word-break: keep-all; overflow-wrap: anywhere; }
  a { color: inherit; text-decoration: none; }
  @media (max-width: 600px) { gap: 5px 15px; }
`
const BottomRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 26px;
  padding-top: 17px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  a { display: inline-flex; align-items: center; gap: 12px; min-height: 36px; color: inherit; text-decoration: none; }
`
