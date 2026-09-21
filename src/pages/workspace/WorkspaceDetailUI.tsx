/* eslint-disable react-refresh/only-export-components -- All exports are reusable React or styled components. */
import { Link } from 'react-router-dom'
import styled from 'styled-components'

type IconName = 'link' | 'users' | 'arrow' | 'plus' | 'check' | 'shield' | 'mail' | 'clock' | 'layers'

export function DetailIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    link: 'M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    check: 'm5 12 4 4L19 6',
    shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6',
    mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
    clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',
    layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

export const DetailPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  min-width: 0;
  max-width: 75rem;
  margin-inline: auto;
`

export const DetailHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding-bottom: 0.25rem;
`

export const DetailEyebrow = styled.p`
  margin-bottom: 0.55rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
`

export const DetailTitle = styled.h1`
  font-size: clamp(1.5rem, 2.6vw, 1.875rem);
  font-weight: 750;
  letter-spacing: -0.04em;
  overflow-wrap: anywhere;
`

export const DetailLead = styled.p`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  line-height: 1.7;
  word-break: keep-all;
  overflow-wrap: anywhere;
`

export const DetailPanel = styled.section`
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.875rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 2px 3px rgb(24 31 55 / 2%);
`

export const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  h2 { font-size: 1rem; font-weight: 700; }
  p { margin-top: 0.25rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.8rem; }
  @media (max-width: 600px) { padding: 1.125rem; }
`

export const DetailBadge = styled.span<{ $tone?: 'success' | 'warning' | 'primary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  width: fit-content;
  flex-shrink: 0;
  padding: 0.3rem 0.625rem;
  border-radius: 0.375rem;
  color: ${({ $tone }) => $tone === 'success' ? '#167853' : $tone === 'warning' ? '#96600d' : $tone === 'primary' ? '#635bff' : '#626979'};
  background: ${({ $tone }) => $tone === 'success' ? '#eaf8f1' : $tone === 'warning' ? '#fff5df' : $tone === 'primary' ? '#f0eeff' : '#f3f4f7'};
  font-size: 0.72rem;
  font-weight: 650;
  line-height: 1.5;
`

export const DetailAlert = styled.p<{ $success?: boolean }>`
  padding: 0.875rem 1rem;
  border: 1px solid ${({ $success }) => $success ? '#ccebdd' : '#f4d9d9'};
  border-radius: 0.625rem;
  background: ${({ $success }) => $success ? '#f1faf5' : '#fff5f5'};
  color: ${({ $success }) => $success ? '#167853' : '#b33434'};
  font-size: 0.8125rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
`

export const DetailPrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.625rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 650;
  white-space: nowrap;
  box-shadow: 0 2px 3px rgb(99 91 255 / 9%);
`

export const DetailSecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  background: white;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8125rem;
  white-space: nowrap;
  &:hover:not(:disabled), &:active:not(:disabled) {
    background: #f7f8fc;
    border-color: #c9c7e0;
    color: ${({ theme }) => theme.colors.text};
  }
`

export const DetailActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.625rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; color: white; }
`

export const DetailEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 3.5rem 1.5rem;
  text-align: center;
  :where(h2, h3) { font-size: 1.125rem; }
  > :where(p:not([class])) { max-width: 28rem; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 0.875rem; line-height: 1.8; word-break: keep-all; }
  @media (max-width: 600px) { padding: 2.5rem 1.125rem; }
`

export const DetailIconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid #ebe8ff;
  border-radius: 0.75rem;
  background: #f5f3ff;
  color: #635bff;
`

export const DetailPanelBody = styled.div`
  padding: 1.5rem;
  @media (max-width: 600px) { padding: 1.125rem; }
`

export const DetailHint = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  word-break: keep-all;
`

export const DetailStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;

  &::before {
    content: '';
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-top-color: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: detail-spin 0.8s linear infinite;
  }

  @keyframes detail-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { &::before { animation: none; } }
`
