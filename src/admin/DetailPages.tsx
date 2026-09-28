import { formatDate } from './format'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminWrite } from './api'
import { UserLink, WorkspaceLink } from './ListPage'
import type { AdminUser, Connection, Invitation, Member, Page, Workspace } from './types'
import { useResource } from './useResource'
import { ActionButton, Card, Empty, Heading, Pagination, ResourceState, Status, Table } from './ui'

export function UserDetailPage() {
  const { id } = useParams()
  const user = useResource<AdminUser>(`/users/${id}`)
  const [page, setPage] = useState(0)
  const spaces = useResource<Page<Workspace>>(`/users/${id}/workspaces?page=${page}&size=20`)
  const data = user.data
  return <><Link className="oa-back" to="/admin/users">← 회원 목록</Link><Heading title={data?.name || data?.email || '회원 상세'} description={`서비스 회원 #${id}의 계정과 생성 데이터를 확인합니다.`}>{data && <Link className="oa-button" to={`/admin/support/new?customerUserId=${id}`}>기술 지원 등록</Link>}</Heading><ResourceState {...user} />{data && <><Card title="계정 정보"><div className="oa-card-body"><dl className="oa-detail-grid"><div><dt>이메일</dt><dd>{data.email}</dd></div><div><dt>이용 상태 / 권한</dt><dd><Status value={data.status} /> <Status value={data.role} /></dd></div><div><dt>가입일</dt><dd>{formatDate(data.registeredAt)}</dd></div><div><dt>최근 로그인</dt><dd>{formatDate(data.lastLoginAt)}</dd></div></dl></div></Card><Card title="운영 조치"><div className="oa-card-body oa-actions">{data.status !== 'UNREGISTERED' && <><ActionButton label={data.status === 'SUSPENDED' ? '이용 정지 해제' : '이용 정지'} danger={data.status !== 'SUSPENDED'} description={`${data.email}의 상태를 변경하면 기존 세션이 모두 종료됩니다.`} action={v => adminWrite(`/users/${id}/status`, { reason: v.reason, status: data.status === 'SUSPENDED' ? 'REGISTERED' : 'SUSPENDED' }, 'patch')} onDone={user.reload} /><ActionButton label="권한 변경" description={`${data.email}의 관리자 권한을 변경합니다. 변경 시 모든 세션이 종료됩니다.`} fields={[{ name: 'role', label: '변경할 권한', value: data.role, options: [{ value: 'CUSTOMER', label: '서비스 회원' }, { value: 'ADMIN', label: '관리자' }] }]} action={v => adminWrite(`/users/${id}/role`, v, 'patch')} onDone={user.reload} /></>}<ActionButton label="모든 세션 종료" description={`${data.email}의 기존 로그인 세션을 모두 무효화합니다.`} action={v => adminWrite(`/users/${id}/revoke-sessions`, v)} onDone={user.reload} /></div></Card></>}
    <Card title="소유 및 참여 워크스페이스"><ResourceState {...spaces} />{spaces.data && (spaces.data.items.length ? <Table headers={['공간', '소유자', '참여 구분', '생성일']}>{spaces.data.items.map(space => <tr key={space.id}><td><WorkspaceLink id={space.id}>{space.name}</WorkspaceLink></td><td><UserLink id={space.ownerId}>{space.ownerEmail}</UserLink></td><td><Status value={space.role || 'MEMBER'} /></td><td>{formatDate(space.registeredAt)}</td></tr>)}</Table> : <Empty />)}<Pagination data={spaces.data} onChange={setPage} /></Card></>
}

export function WorkspaceDetailPage() {
  const { id } = useParams()
  const workspace = useResource<Workspace>(`/workspaces/${id}`)
  const [memberPage, setMemberPage] = useState(0)
  const [invitePage, setInvitePage] = useState(0)
  const members = useResource<Page<Member>>(`/workspaces/${id}/members?page=${memberPage}&size=20`)
  const invites = useResource<Page<Invitation>>(`/workspaces/${id}/invitations?page=${invitePage}&size=20`)
  const data = workspace.data
  const refresh = () => { workspace.reload(); members.reload(); invites.reload() }
  return <><Link className="oa-back" to="/admin/workspaces">← 워크스페이스 목록</Link><Heading title={data?.name || '워크스페이스 상세'} description={`워크스페이스 #${id}의 구성과 연결을 관리합니다.`}>{data && <><Link className="oa-button oa-secondary" to={`/admin/connections?workspaceId=${id}`}>연동 현황</Link><Link className="oa-button" to={`/admin/support/new?workspaceId=${id}`}>기술 지원 등록</Link></>}</Heading><ResourceState {...workspace} />{data && <Card title="공간 정보"><div className="oa-card-body"><dl className="oa-detail-grid"><div><dt>소유 회원</dt><dd><UserLink id={data.ownerId}>{data.ownerEmail}</UserLink></dd></div><div><dt>생성일</dt><dd>{formatDate(data.registeredAt)}</dd></div><div><dt>구성원</dt><dd>{data.memberCount}명</dd></div><div><dt>연결 계정</dt><dd>{data.connectionCount}개</dd></div></dl><div className="oa-actions" style={{ marginTop: 25 }}><ActionButton label="이름 변경" description={`워크스페이스 #${id}의 이름을 변경합니다.`} fields={[{ name: 'name', label: '워크스페이스 이름', value: data.name, maxLength: 100 }]} action={v => adminWrite(`/workspaces/${id}`, v, 'patch')} onDone={refresh} /><ActionButton label="소유권 이전" description={`현재 소유자는 ${data.ownerEmail}입니다. 참여 중인 활성 회원에게만 이전할 수 있고, 기존 소유자는 멤버로 남습니다.`} fields={[{ name: 'newOwnerId', label: '새 소유자의 회원 ID', type: 'number' }]} action={v => adminWrite(`/workspaces/${id}/owner`, { reason: v.reason, expectedOwnerId: data.ownerId, newOwnerId: Number(v.newOwnerId) }, 'patch')} onDone={refresh} /></div></div></Card>}
    <Card title="참여 멤버"><ResourceState {...members} />{members.data && (members.data.items.length ? <Table headers={['회원', '상태', '구분', '관리']}>{members.data.items.map(member => <tr key={member.userId}><td><UserLink id={member.userId}>{member.name || member.email}<small>{member.email} · #{member.userId}</small></UserLink></td><td><Status value={member.status} /></td><td><Status value={member.owner ? 'OWNER' : 'MEMBER'} /></td><td>{!member.owner && <ActionButton label="멤버 제거" danger description={`${member.email}의 이 워크스페이스 접근을 해제합니다.`} action={v => adminWrite(`/workspaces/${id}/members/${member.userId}/remove`, v)} onDone={refresh} />}</td></tr>)}</Table> : <Empty />)}<Pagination data={members.data} onChange={setMemberPage} /></Card>
    <Card title="초대 현황"><ResourceState {...invites} />{invites.data && (invites.data.items.length ? <Table headers={['초대 회원', '만료일', '상태', '관리']}>{invites.data.items.map(invite => <tr key={invite.userId}><td>{invite.email}</td><td>{formatDate(invite.expiresAt)}</td><td><Status value={invite.expired ? '만료됨' : '초대 중'} /></td><td><ActionButton label="초대 취소" danger description={`${invite.email}에게 보낸 초대를 취소합니다.`} action={v => adminWrite(`/workspaces/${id}/invitations/${invite.userId}/revoke`, v)} onDone={refresh} /></td></tr>)}</Table> : <Empty />)}<Pagination data={invites.data} onChange={setInvitePage} /></Card></>
}

export function ConnectionDetailPage() {
  const { id } = useParams()
  const connection = useResource<Connection>(`/connections/${id}`)
  const data = connection.data
  return <><Link className="oa-back" to="/admin/connections">← 연동 현황</Link><Heading title={data?.accountName || '연결 상세'} description="고객이 저장한 외부 연결의 메타데이터를 확인합니다." /><ResourceState {...connection} />{data && <Card title={`${data.provider} 연결 #${data.id}`}><div className="oa-card-body"><dl className="oa-detail-grid"><div><dt>소속 공간</dt><dd><WorkspaceLink id={data.workspaceId}>{data.workspaceName}</WorkspaceLink></dd></div><div><dt>외부 계정 ID</dt><dd>{data.externalAccountId}</dd></div><div><dt>상태</dt><dd>{data.requiresReauth ? '재인증 필요' : '재인증 요청 없음'}</dd></div><div><dt>저장된 자산</dt><dd>{data.assetCount}개</dd></div><div><dt>등록일</dt><dd>{formatDate(data.registeredAt)}</dd></div><div><dt>토큰 만료일</dt><dd>{formatDate(data.expiresAt)}</dd></div></dl><div className="oa-actions" style={{ marginTop: 26 }}>{!data.requiresReauth && <ActionButton label="재인증 필요로 변경" description="고객이 이 연결을 다시 인증해야 이용할 수 있도록 표시합니다. 해당 고객에게 안내한 뒤 처리해 주세요." action={v => adminWrite(`/connections/${id}/require-reauth`, v)} onDone={connection.reload} />}</div></div></Card>}</>
}
