import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useMyWorkspaces } from '../../hooks/useMyWorkspaces'
import type { WorkspaceResponse } from '../../types/workspace'

export default function WorkspaceListPage() {
  const { owned, joined, loading, error } = useMyWorkspaces()
  const isEmpty = !loading && !error && owned.length === 0 && joined.length === 0

  return (
    <Container>
      <Card as="section">
        <HeaderRow>
          <Intro>
            <Eyebrow>United Ad</Eyebrow>
            <Title>워크스페이스</Title>
            <Lead>내가 만든 공간과 초대를 수락해 참여 중인 공간을 나눠 보여 줍니다.</Lead>
          </Intro>
          <CreateLink to="/workspaces/new">새 워크스페이스</CreateLink>
        </HeaderRow>

        {error ? (
          <FormAlert role="alert">{error}</FormAlert>
        ) : null}

        {loading ? (
          <Status>목록을 불러오는 중...</Status>
        ) : isEmpty ? (
          <Empty>
            <EmptyTitle>아직 워크스페이스가 없습니다</EmptyTitle>
            <EmptyLead>팀을 위한 공간을 만들거나, 초대를 수락하면 여기에 나타납니다.</EmptyLead>
            <EmptyLink to="/workspaces/new">워크스페이스 만들기</EmptyLink>
          </Empty>
        ) : (
          <>
            <Section>
              <SectionTitle>내 워크스페이스</SectionTitle>
              {owned.length === 0 ? (
                <EmptyNote>아직 만든 워크스페이스가 없습니다.</EmptyNote>
              ) : (
                <List aria-label="내 워크스페이스">
                  {owned.map((workspace) => (
                    <Item key={workspace.id}>
                      <ItemBody>
                        <ItemName>{workspace.name}</ItemName>
                        <ItemMeta>{formatRegisteredAt(workspace)}</ItemMeta>
                      </ItemBody>
                      <InviteLink to={`/workspaces/${workspace.id}/invite`}>
                        멤버 관리
                      </InviteLink>
                    </Item>
                  ))}
                </List>
              )}
            </Section>

            <Section>
              <SectionTitle>참여 워크스페이스</SectionTitle>
              {joined.length === 0 ? (
                <EmptyNote>아직 참여 중인 워크스페이스가 없습니다.</EmptyNote>
              ) : (
                <List aria-label="참여 워크스페이스">
                  {joined.map((workspace) => (
                    <Item key={workspace.id}>
                      <ItemBody>
                        <ItemName>{workspace.name}</ItemName>
                        <ItemMeta>{formatRegisteredAt(workspace)}</ItemMeta>
                      </ItemBody>
                    </Item>
                  ))}
                </List>
              )}
            </Section>
          </>
        )}
      </Card>
    </Container>
  )
}

function formatRegisteredAt(workspace: WorkspaceResponse): string {
  if (!workspace.registeredAt) {
    return `ID ${workspace.id}`
  }
  const date = new Date(workspace.registeredAt)
  if (Number.isNaN(date.getTime())) {
    return `ID ${workspace.id}`
  }
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date)
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-width: 0;
`

const Card = styled.div`
  width: 100%;
  max-width: 40rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Intro = styled.div`
  min-width: 0;
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

const CreateLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
`

const FormAlert = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #fef2f2;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  word-break: keep-all;
`

const Status = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Empty = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`

const EmptyTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

const EmptyLead = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: keep-all;
`

const EmptyLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  margin-top: ${({ theme }) => theme.spacing.md};
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

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

const EmptyNote = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  word-break: keep-all;
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const Item = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`

const ItemBody = styled.div`
  min-width: 0;
`

const ItemName = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
  word-break: keep-all;
`

const ItemMeta = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const InviteLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primary};
  }
`
