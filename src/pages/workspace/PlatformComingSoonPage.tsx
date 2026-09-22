import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
  DetailActionLink, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader,
  DetailIcon, DetailIconTile, DetailLead, DetailPage, DetailPanel, DetailTitle,
} from './WorkspaceDetailUI'

const COPY = {
  threads: { title: 'Threads', mark: '@', color: '#292c35', background: '#f0f1f4', lead: 'Threads 계정과 게시물을 한곳에서 관리할 수 있도록 준비하고 있습니다.' },
  coupang: { title: '쿠팡', mark: 'C', color: '#e9513a', background: '#fff0eb', lead: '쿠팡 마켓플레이스와 워크스페이스를 연결할 수 있도록 준비하고 있습니다.' },
} as const

type PlatformKey = keyof typeof COPY

export default function PlatformComingSoonPage({ platform }: { platform: PlatformKey }) {
  const copy = COPY[platform]
  const { workspaceId } = useParams()
  const validWorkspaceId = workspaceId && Number.isSafeInteger(Number(workspaceId)) && Number(workspaceId) > 0

  return (
    <DetailPage>
      <DetailHeader><div><DetailEyebrow>플랫폼 연결 / {copy.title}</DetailEyebrow><DetailTitle>{copy.title} 연결</DetailTitle><DetailLead>워크스페이스의 비즈니스 채널을 연결하고 관리하세요.</DetailLead></div><DetailBadge>준비 중</DetailBadge></DetailHeader>
      <DetailPanel>
        <ComingSoon>
          <PlatformMark $color={copy.color} $background={copy.background} aria-hidden="true">{copy.mark}</PlatformMark>
          <DetailBadge $tone="primary"><DetailIcon name="clock" size={13} />새로운 연결을 준비하고 있어요</DetailBadge>
          <h2>{copy.title} 연결, 곧 만나요</h2>
          <p>{copy.lead} 현재는 Meta와 네이버 스마트스토어 연결을 이용할 수 있습니다.</p>
          <DetailActionLink to={validWorkspaceId ? `/workspaces/${workspaceId}/connections/meta` : '/workspaces'}>{validWorkspaceId ? 'Meta로 이동' : '워크스페이스 목록'}<DetailIcon name="arrow" size={16} /></DetailActionLink>
        </ComingSoon>
      </DetailPanel>
      <Availability><DetailIconTile><DetailIcon name="link" size={18} /></DetailIconTile><div><h2>지금 연결할 수 있는 플랫폼</h2><p>Meta · Facebook 광고 계정, 페이지 및 Instagram 프로필</p><p>네이버 스마트스토어 · 판매자 계정 및 스토어 채널</p></div><DetailBadge $tone="success">이용 가능</DetailBadge></Availability>
    </DetailPage>
  )
}

const ComingSoon = styled(DetailEmpty)`padding-block: clamp(3rem, 8vw, 6rem); h2 { font-size: clamp(1.25rem, 3vw, 1.5rem); letter-spacing: -0.035em; } p { margin-bottom: 0.5rem; }`
const PlatformMark = styled.div<{ $color: string; $background: string }>`display: grid; place-items: center; width: 4.5rem; height: 4.5rem; margin-bottom: 0.75rem; border-radius: 1.25rem; color: ${({ $color }) => $color}; background: ${({ $background }) => $background}; font-size: 2.5rem; font-weight: 800;`
const Availability = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: 0.875rem; padding: 1.125rem 1.25rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 0.75rem; background: ${({ theme }) => theme.colors.surface}; div { flex: 1; min-width: 12rem; } h2 { font-size: 0.8125rem; } p { margin-top: 0.25rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; line-height: 1.7; }`
