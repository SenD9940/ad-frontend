import { formatDate, number } from './format'
import { Link } from 'react-router-dom'
import type { Audit, Overview, Page, SupportTicket } from './types'
import { useResource } from './useResource'
import { Card, Empty, Heading, ResourceState, Status, Table } from './ui'

export default function OverviewPage() {
  const overview = useResource<Overview>('/overview')
  const audit = useResource<Page<Audit>>('/audit-logs?size=5')
  const tickets = useResource<Page<SupportTicket>>('/support/tickets?size=5')
  const data = overview.data
  return <><Heading eyebrow="UNITED AD · OPERATIONS" title="서비스 운영 현황" description="회원의 이용 현황과 진행 중인 기술 지원을 한눈에 확인하세요."><button className="oa-button oa-secondary" onClick={() => { overview.reload(); audit.reload(); tickets.reload() }}>새로고침</button></Heading>
    <ResourceState {...overview} />
    {data && <><div className="oa-stats">{[
      ['서비스 회원', number(data.registeredUsers), `전체 ${number(data.users)}명 · 정지 ${number(data.suspendedUsers)}명`],
      ['최근 7일 가입', number(data.newUsersLast7Days), '가입 시각 기준'],
      ['생성된 워크스페이스', number(data.workspaces), `저장된 자산 ${number(data.assets)}개`],
      ['연동 확인 필요', number(data.connectionsRequiringReauth), `전체 연결 ${number(data.connections)}개`],
    ].map(([label, count, note], index) => <div className={`oa-stat ${index === 3 ? 'oa-highlight' : ''}`} key={label}><p>{label}</p><strong>{count}</strong><small>{note}</small></div>)}</div><p className="oa-muted" style={{ marginBottom: 22 }}>마지막 조회 {formatDate(data.fetchedAt)} · 회원 수에는 운영자 계정이 포함됩니다.</p></>}
    <div className="oa-two"><Card title="최근 기술 지원" extra={<Link className="oa-inline-link" to="/admin/support">전체 보기 →</Link>}><ResourceState {...tickets} />{tickets.data && (tickets.data.items.length ? <Table headers={['지원 요청', '상태', '지원료']}>{tickets.data.items.map(ticket => <tr key={ticket.id}><td><Link to={`/admin/support/${ticket.id}`}>{ticket.title}</Link><small>회원 #{ticket.customerUserId} · {formatDate(ticket.createdAt)}</small></td><td><Status value={ticket.status} /></td><td>{number(ticket.amountKrw)}원</td></tr>)}</Table> : <Empty text="기술 지원을 등록하면 고객의 승인부터 작업 완료까지 관리할 수 있습니다." />)}</Card>
    <Card title="운영 바로가기"><div className="oa-card-body"><Link className="oa-button oa-secondary" to="/admin/users">회원 조회 →</Link><p className="oa-muted" style={{ margin: '14px 0 24px' }}>회원의 워크스페이스와 연결 정보를 확인하고 계정 상태를 관리합니다.</p><Link className="oa-button" to="/admin/support/new">기술 지원 등록 +</Link><p className="oa-muted" style={{ marginTop: 14 }}>지원 범위·금액을 안내하고 고객 승인 후 해당 화면에서 작업합니다.</p></div></Card></div>
    <Card title="최근 관리자 작업" extra={<Link className="oa-inline-link" to="/admin/audit">전체 이력 →</Link>}><ResourceState {...audit} />{audit.data && (audit.data.items.length ? <Table headers={['작업', '운영자', '기록 내용', '시각']}>{audit.data.items.map(item => <tr key={item.id}><td>{item.action}<small>{item.targetType} #{item.targetId}</small></td><td>#{item.actorUserId}</td><td className="oa-wrap">{item.reason}</td><td>{formatDate(item.createdAt)}</td></tr>)}</Table> : <Empty />)}</Card>
  </>
}
