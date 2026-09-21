import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useMyWorkspaces } from '../../hooks/useMyWorkspaces'
import Icon from '../../components/common/Icon'
import type { WorkspaceResponse } from '../../types/workspace'

type Filter = 'all' | 'owned' | 'joined'

export default function WorkspaceListPage() {
  const { owned, joined, loading, error, reload } = useMyWorkspaces()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const ownedIds = new Set(owned.map((workspace) => workspace.id))
  const joinedOnly = joined.filter((workspace) => !ownedIds.has(workspace.id))
  const all = [...owned, ...joinedOnly]
  const source = filter === 'owned' ? owned : filter === 'joined' ? joinedOnly : all
  const filtered = source.filter((workspace) => workspace.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const isEmpty = !loading && !error && all.length === 0

  return (
    <Page>
      <Header><div><Eyebrow>YOUR TEAM, CONNECTED</Eyebrow><Title>워크스페이스</Title><Lead>팀의 광고 자산과 멤버를 한곳에서 관리하세요.</Lead></div><PrimaryLink to="/workspaces/new"><Icon name="plus" size={17} />새 워크스페이스</PrimaryLink></Header>
      <Welcome><WelcomeCopy><Tag><span />함께 일하는 새로운 방식</Tag><h2>우리 팀의 다음 시작,<br />하나의 워크스페이스에서.</h2><p>팀원을 초대하고 Meta 광고 계정을 연결해 보세요.<br />여러 팀과 브랜드의 자산을 공간별로 관리할 수 있습니다.</p><WelcomeLink to="/workspaces/new">워크스페이스 만들기 <Icon name="arrow" size={17} /></WelcomeLink></WelcomeCopy><WelcomeArt aria-hidden="true"><ArtOrbit /><ArtTile $position="left">∞</ArtTile><ArtCenter><Icon name="grid" size={30} /><span>united ad.</span></ArtCenter><ArtTile $position="right"><Icon name="users" size={26} /></ArtTile><ArtLabel><span /> 팀과 자산을 하나로</ArtLabel></WelcomeArt></Welcome>
      <Collection aria-label="워크스페이스 목록">
        <Toolbar><Filters role="group" aria-label="워크스페이스 필터">{([{ value: 'all', label: '전체', count: all.length }, { value: 'owned', label: '내가 만든', count: owned.length }, { value: 'joined', label: '참여 중', count: joinedOnly.length }] as const).map((item) => <FilterButton key={item.value} type="button" $active={filter === item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{loading || error ? '—' : item.count}</span></FilterButton>)}</Filters><Search><Icon name="search" size={17} /><input type="search" aria-label="워크스페이스 검색" placeholder="워크스페이스 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></Search></Toolbar>
        {error ? <Empty role="alert"><EmptyIcon><Icon name="help" size={26} /></EmptyIcon><h2>워크스페이스를 불러오지 못했어요</h2><p>{error}</p><button type="button" onClick={reload}>다시 시도</button></Empty> : loading ? <div role="status" aria-label="워크스페이스 목록을 불러오는 중"><Grid aria-hidden="true">{[1, 2, 3].map((key) => <Skeleton key={key}><span /><i /><i /></Skeleton>)}</Grid><LoadingText>워크스페이스를 불러오는 중...</LoadingText></div> : isEmpty ? <Empty><EmptyIcon><Icon name="grid" size={27} /></EmptyIcon><h2>첫 워크스페이스를 만들어 보세요</h2><p>팀이나 브랜드 이름으로 새로운 공간을 시작하세요.<br />초대받은 워크스페이스도 이곳에서 확인할 수 있어요.</p><PrimaryLink to="/workspaces/new"><Icon name="plus" size={17} />워크스페이스 만들기</PrimaryLink></Empty> : filtered.length === 0 ? <Empty role="status"><EmptyIcon><Icon name="search" size={26} /></EmptyIcon><h2>{query.trim() ? '검색 결과가 없어요' : filter === 'joined' ? '아직 참여 중인 워크스페이스가 없어요' : '아직 만든 워크스페이스가 없어요'}</h2><p>{query.trim() ? '다른 이름으로 검색하거나 필터를 변경해 보세요.' : filter === 'joined' ? '이메일로 받은 초대를 수락하면 이곳에 표시됩니다.' : '새 공간을 만들고 팀과 함께 시작해 보세요.'}</p><ResetButton type="button" onClick={() => { setQuery(''); setFilter('all') }}>전체 워크스페이스 보기</ResetButton></Empty> : <><ResultCount role="status">{filtered.length}개의 워크스페이스</ResultCount><Grid>{filtered.map((workspace, index) => <WorkspaceCard key={workspace.id} to={`/workspaces/${workspace.id}`}><CardTop><Avatar $tone={index % 3}>{workspace.name.slice(0, 1).toUpperCase()}</Avatar><Role $owner={ownedIds.has(workspace.id)}>{ownedIds.has(workspace.id) ? '소유자' : '멤버'}</Role></CardTop><h2>{workspace.name}</h2><p>{formatDate(workspace)}</p><CardBottom><span><Icon name="grid" size={14} />워크스페이스 열기</span><Icon name="arrow" size={17} /></CardBottom></WorkspaceCard>)}<CreateCard to="/workspaces/new"><CreateIcon><Icon name="plus" size={24} /></CreateIcon><strong>새 워크스페이스</strong><span>새로운 팀, 새로운 시작</span></CreateCard></Grid></>}
      </Collection>
      <Note><Icon name="shield" size={16} /><p>워크스페이스별로 팀과 연결된 자산을 구분해 관리할 수 있습니다.</p></Note>
    </Page>
  )
}

function formatDate(workspace: WorkspaceResponse) {
  const date = workspace.registeredAt ? new Date(workspace.registeredAt) : null
  return date && !Number.isNaN(date.getTime()) ? `${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)} 생성` : '팀을 위한 공유 공간'
}

const Page = styled.div`display: flex; flex-direction: column; gap: 30px;`
const Header = styled.header`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;`
const Eyebrow = styled.p`margin-bottom: 8px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 650; letter-spacing: 1.5px;`
const Title = styled.h1`font-size: clamp(25px, 3vw, 30px); font-weight: 750; letter-spacing: -1px;`
const Lead = styled.p`margin-top: 7px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px;`
const PrimaryLink = styled(Link)`display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 42px; padding: 10px 16px; border-radius: 7px; background: ${({ theme }) => theme.colors.primary}; color: white; font-size: 12px; font-weight: 650; text-decoration: none; box-shadow: 0 2px 3px #635bff12; &:hover { background: ${({ theme }) => theme.colors.primaryHover}; color: white; }`
const Welcome = styled.section`display: grid; grid-template-columns: 1.1fr 1fr; min-height: 256px; border: 1px solid #e8e3f7; border-radius: 13px; overflow: hidden; background: linear-gradient(112deg, #f0edfd 0%, #f6f4fd 54%, #edeafa 100%); @media(max-width: 1050px) { grid-template-columns: 1.25fr 1fr; } @media(max-width: 620px) { grid-template-columns: 1fr; }`
const WelcomeCopy = styled.div`position: relative; z-index: 1; padding: 29px 34px; h2 { margin-top: 13px; color: #302754; font-size: clamp(21px, 2.2vw, 26px); font-weight: 720; line-height: 1.4; letter-spacing: -1px; } p { margin-top: 10px; color: #77718e; font-size: 12px; line-height: 1.8; word-break: keep-all; } @media(max-width: 620px) { padding: 25px; }`
const Tag = styled.p`display: flex; align-items: center; gap: 7px; && { margin-top: 0; color: #7360bd; font-size: 10px; font-weight: 600; } span { width: 5px; height: 5px; border-radius: 50%; background: #8b74e9; }`
const WelcomeLink = styled(Link)`display: inline-flex; align-items: center; gap: 18px; min-height: 36px; margin-top: 13px; color: #6350b8; font-size: 12px; font-weight: 650; text-decoration: none;`
const WelcomeArt = styled.div`position: relative; display: flex; align-items: center; justify-content: center; min-height: 250px; @media(max-width: 620px) { display: none; }`
const ArtOrbit = styled.div`position: absolute; width: 310px; height: 310px; border: 1px solid #dcd5f2; border-radius: 50%; &::before, &::after { position: absolute; content: ''; border: 1px solid #e1dcf2; border-radius: 50%; } &::before { inset: 35px; } &::after { inset: -36px; }`
const ArtCenter = styled.div`position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 112px; height: 112px; border: 1px solid #fff; border-radius: 26px; background: #ffffffdb; box-shadow: 0 18px 35px #6d58b41a; color: #7662dc; transform: rotate(-7deg); span { color: #443765; font-size: 13px; font-weight: 800; letter-spacing: -.5px; }`
const ArtTile = styled.div<{ $position: 'left' | 'right' }>`position: absolute; z-index: 1; display: grid; place-items: center; width: 56px; height: 56px; border: 1px solid white; border-radius: 15px; background: #ffffffcf; box-shadow: 0 10px 24px #6d58b412; color: ${({ $position }) => $position === 'left' ? '#3986dc' : '#aa7a4c'}; font-size: 38px; ${({ $position }) => $position === 'left' ? 'left: 9%; top: 22%; transform: rotate(-12deg);' : 'right: 12%; bottom: 22%; transform: rotate(10deg);'}`
const ArtLabel = styled.div`position: absolute; left: 18%; bottom: 24px; display: flex; align-items: center; gap: 7px; padding: 7px 12px; border: 1px solid #fff; border-radius: 6px; background: #ffffffb3; color: #7a7190; font-size: 10px; transform: rotate(-4deg); span { width: 5px; height: 5px; border-radius: 50%; background: #73b79b; }`
const Collection = styled.section`min-width: 0;`
const Toolbar = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;`
const Filters = styled.div`display: flex; gap: 5px; padding: 4px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; background: #efeff5; @media(max-width: 380px) { gap: 0; width: 100%; }`
const FilterButton = styled.button<{ $active: boolean }>`gap: 7px; min-height: 34px; padding: 7px 12px; border: 0; border-radius: 5px; background: ${({ $active }) => $active ? 'white' : 'transparent'}; color: ${({ $active, theme }) => $active ? theme.colors.text : theme.colors.textMuted}; box-shadow: ${({ $active }) => $active ? '0 1px 4px #2023310d' : 'none'}; font-size: 12px; font-weight: 550; white-space: nowrap; span { font-size: 10px; color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textMuted}; } &:hover:not(:disabled) { background: white; } @media(max-width: 380px) { flex: 1; padding-inline: 8px; }`
const Search = styled.label`display: flex; align-items: center; gap: 9px; width: 230px; padding: 0 12px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 7px; background: white; color: ${({ theme }) => theme.colors.textMuted}; &:focus-within { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; } && input { min-width: 0; width: 100%; min-height: 40px; padding: 8px 0; border: 0; background: transparent; font-size: 12px; &:focus-visible { outline: none; } } @media(max-width: 620px) { width: 100%; }`
const ResultCount = styled.p`margin-bottom: 13px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px;`
const Grid = styled.div`display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; @media(max-width: 1150px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } @media(max-width: 560px) { grid-template-columns: 1fr; }`
const WorkspaceCard = styled(Link)`display: flex; flex-direction: column; min-width: 0; min-height: 205px; padding: 22px 22px 0; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 11px; background: white; color: ${({ theme }) => theme.colors.text}; text-decoration: none; box-shadow: ${({ theme }) => theme.shadows.sm}; transition: border-color .18s, transform .18s, box-shadow .18s; h2 { margin-top: 19px; font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; } > p { margin-top: 4px; margin-bottom: 21px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; } &:hover { transform: translateY(-3px); border-color: #c9c1f6; box-shadow: 0 8px 18px #635bff09; }`
const CardTop = styled.div`display: flex; justify-content: space-between; align-items: center;`
const Avatar = styled.span<{ $tone: number }>`display: grid; place-items: center; width: 39px; height: 39px; border-radius: 10px; background: ${({ $tone }) => ['#eeecff', '#eaf4ee', '#fff1e7'][$tone]}; color: ${({ $tone }) => ['#7968c5', '#558e73', '#b68052'][$tone]}; font-size: 17px; font-weight: 650;`
const Role = styled.span<{ $owner: boolean }>`padding: 3px 7px; border-radius: 5px; background: ${({ $owner }) => $owner ? '#f2f0fd' : '#f1f4f7'}; color: ${({ $owner }) => $owner ? '#8270b7' : '#71818a'}; font-size: 10px; font-weight: 550;`
const CardBottom = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding: 13px 0; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; > span { display: flex; align-items: center; gap: 6px; }`
const CreateCard = styled(Link)`display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; min-height: 218px; padding: 25px; border: 1px dashed #d9d8e7; border-radius: 11px; color: ${({ theme }) => theme.colors.textSecondary}; text-decoration: none; strong { margin-top: 5px; font-size: 12px; font-weight: 550; } > span:last-child { color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; } &:hover { border-color: #9b90e6; background: #f3f1fc; }`
const CreateIcon = styled.span`display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #e5e3ee; border-radius: 10px; color: #9b94af; background: white;`
const Empty = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; min-height: 290px; padding: 38px 22px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 12px; background: white; text-align: center; h2 { font-size: 18px; } p { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px; line-height: 1.8; word-break: keep-all; }`
const EmptyIcon = styled.span`display: grid; place-items: center; width: 55px; height: 55px; margin-bottom: 3px; border: 1px solid #e8e3fa; border-radius: 16px; background: #f7f5ff; color: #9281d3;`
const ResetButton = styled.button`background: ${({ theme }) => theme.colors.surfaceMuted}; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryLight}; }`
const Note = styled.div`display: flex; align-items: center; justify-content: center; gap: 8px; color: ${({ theme }) => theme.colors.textMuted}; p { font-size: 11px; }`
const Skeleton = styled.div`display: flex; flex-direction: column; gap: 17px; min-height: 205px; padding: 22px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 11px; background: white; span, i { display: block; border-radius: 7px; background: #eeeef5; } span { width: 39px; height: 39px; } i { width: 70%; height: 13px; } i:last-child { width: 45%; }`
const LoadingText = styled.p`margin-top: 16px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px;`
