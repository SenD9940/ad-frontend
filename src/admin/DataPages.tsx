import { formatDate } from './format'
import { Link } from 'react-router-dom'
import ListPage, { UserLink, WorkspaceLink } from './ListPage'
import type { AdminUser, Audit, Connection, Workspace } from './types'
import { Status } from './ui'

export function UsersPage() { return <ListPage<AdminUser> title="회원 관리" description="실제 서비스에 가입한 회원과 이용 상태를 조회합니다." path="/users" filters={[
  { name: 'q', label: '회원 검색', placeholder: '이름 또는 이메일' },
  { name: 'role', label: '계정 구분', initial: 'CUSTOMER', options: [['CUSTOMER', '서비스 회원'], ['ADMIN', '운영자'], ['', '전체 계정']] },
  { name: 'status', label: '이용 상태', options: [['', '전체 상태'], ['REGISTERED', '이용 중'], ['SUSPENDED', '정지'], ['UNREGISTERED', '탈퇴']] },
]} columns={[
  { label: '회원', render: row => <UserLink id={row.id}>{row.name || row.email}<small>{row.email} · #{row.id}</small></UserLink> },
  { label: '상태', render: row => <Status value={row.status} /> },
  { label: '권한', render: row => <Status value={row.role} /> },
  { label: '참여 공간', render: row => `${row.workspaceCount ?? 0}개` },
  { label: '최근 로그인', render: row => formatDate(row.lastLoginAt) },
  { label: '가입일', render: row => formatDate(row.registeredAt) },
]} /> }
export function WorkspacesPage() { return <ListPage<Workspace> title="워크스페이스" description="회원이 만든 공간과 소유자, 구성원, 연동 현황을 관리합니다." path="/workspaces" filters={[{ name: 'q', label: '검색', placeholder: '공간 이름 또는 소유자 이메일' }, { name: 'ownerId', label: '소유 회원 ID' }]} columns={[
  { label: '워크스페이스', render: row => <WorkspaceLink id={row.id}>{row.name}<small>#{row.id}</small></WorkspaceLink> },
  { label: '소유자', render: row => <UserLink id={row.ownerId}>{row.ownerEmail}</UserLink> },
  { label: '멤버', render: row => `${row.memberCount ?? 0}명` }, { label: '연결', render: row => `${row.connectionCount ?? 0}개` },
  { label: '생성일', render: row => formatDate(row.registeredAt) },
]} /> }
export function ConnectionsPage() { return <ListPage<Connection> title="회원 연동 현황" description="회원이 저장한 외부 계정과 재인증 필요 여부를 확인합니다." path="/connections" filters={[
  { name: 'workspaceId', label: '워크스페이스 ID' }, { name: 'provider', label: '플랫폼', options: [['', '모든 플랫폼'], ['META', 'Meta'], ['NAVER', '네이버'], ['GOOGLE', 'Google'], ['THREADS', 'Threads'], ['COUPANG', '쿠팡']] }, { name: 'requiresReauth', label: '연결 상태', options: [['', '전체 상태'], ['true', '재인증 필요'], ['false', '재인증 요청 없음']] },
]} columns={[
  { label: '연결 계정', render: row => <Link to={`/admin/connections/${row.id}`}>{row.accountName || row.externalAccountId}<small>{row.provider} · #{row.id}</small></Link> },
  { label: '워크스페이스', render: row => <WorkspaceLink id={row.workspaceId}>{row.workspaceName}</WorkspaceLink> },
  { label: '상태', render: row => <Status value={row.requiresReauth ? '재인증 필요' : '저장됨'} /> },
  { label: '저장 자산', render: row => `${row.assetCount}개` }, { label: '토큰 만료일', render: row => formatDate(row.expiresAt) },
]} /> }
export function AuditPage() { return <ListPage<Audit> title="관리자 작업 이력" description="누가 어떤 작업을 수행했는지 확인합니다. 지원 화면에서의 작업은 각 지원 건의 작업 이력에서 확인하세요." path="/audit-logs" filters={[
  { name: 'actorId', label: '운영자 ID' }, { name: 'targetType', label: '대상 종류', options: [['', '전체'], ['USER', '회원'], ['WORKSPACE', '워크스페이스'], ['CONNECTION', '연결'], ['SUPPORT_TICKET', '지원 요청'], ['SUPPORT_SESSION', '지원 세션']] }, { name: 'targetId', label: '대상 ID' }, { name: 'action', label: '작업 코드', placeholder: 'USER_STATUS_CHANGED' },
]} columns={[
  { label: '작업', render: row => <>{row.action}<small>#{row.id} · {row.targetType} #{row.targetId}</small></> }, { label: '운영자', render: row => <UserLink id={row.actorUserId} /> }, { label: '기록 내용', render: row => <span className="oa-wrap">{row.reason}</span> }, { label: '변경 전 → 후', render: row => <span className="oa-wrap">{row.beforeValue || '—'} → {row.afterValue || '—'}</span> }, { label: '시각', render: row => formatDate(row.createdAt) },
]} /> }
