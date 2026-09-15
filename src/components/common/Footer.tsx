import { Link } from 'react-router-dom'
import styled from 'styled-components'

export default function Footer() {
  return (
    <Container>
      <Inner>
        <TopRow>
          <Brand to="/" aria-label="United Ad 홈">
            United Ad<span aria-hidden="true">.</span>
          </Brand>
          <TopLink href="#">
            맨 위로 <span aria-hidden="true">↑</span>
          </TopLink>
        </TopRow>

        <BusinessInfo aria-label="사업자 정보">
          <div>
            <dt>상호</dt>
            <dd>주식회사 오리넌</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>김윤재</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>488-86-03327</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>
              <a href="mailto:dnqlsdnqls529@orinan.kr">
                dnqlsdnqls529@orinan.kr
              </a>
            </dd>
          </div>
          <div>
            <dt>사업장 주소</dt>
            <dd>
              충청북도 청주시 청원구 안덕벌로104번길 28, 502호 청주대학교
              미래창조관(내덕동)
            </dd>
          </div>
        </BusinessInfo>

        <Copyright>
          © {new Date().getFullYear()} United Ad. All rights reserved.
        </Copyright>
      </Inner>
    </Container>
  )
}

const Container = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding: clamp(2rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem);
`

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
  white-space: nowrap;

  span {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const TopLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const BusinessInfo = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.8;

  div {
    display: flex;
    min-width: 0;
    gap: ${({ theme }) => theme.spacing.sm};
  }

  div:last-child {
    width: 100%;
  }

  dt {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    min-width: 0;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  a[href^='mailto:'] {
    color: inherit;
    text-decoration: none;
  }

  @media (max-width: 600px) {
    flex-direction: column;
  }
`

const Copyright = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
