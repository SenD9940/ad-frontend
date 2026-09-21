import styled from 'styled-components'
import { useAcceptWorkspaceInvite } from '../../hooks/useAcceptWorkspaceInvite'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow,
  DetailIcon, DetailIconTile, DetailPage, DetailPanel, DetailPrimaryButton, DetailTitle,
} from './WorkspaceDetailUI'

export default function AcceptInvitePage() {
  const { isValidToken, submitting, formError, accepted, handleAccept } = useAcceptWorkspaceInvite()

  return (
    <InvitePage>
      <DetailPanel>
        <InviteContent>
          <InviteIcon $accepted={Boolean(accepted)}><DetailIcon name={accepted ? 'check' : 'users'} size={28} /></InviteIcon>
          <DetailEyebrow>UNITED AD · WORKSPACE</DetailEyebrow>
          <DetailTitle>{accepted ? '팀에 합류했습니다' : isValidToken ? '새로운 팀의 초대가 도착했어요' : '초대 링크를 확인해 주세요'}</DetailTitle>
          <p>{accepted ? `워크스페이스 #${accepted.workspaceId}에 참여했습니다. 이제 팀과 함께 연결된 채널과 자산을 관리할 수 있습니다.` : isValidToken ? '초대받은 계정으로 로그인되어 있는지 확인한 후, 아래 버튼을 눌러 워크스페이스에 참여하세요.' : '초대 링크가 올바르지 않습니다. 초대 메일의 가장 최근 링크를 열거나 팀에 새 초대를 요청해 주세요.'}</p>
          {accepted ? (
            <DetailActionLink to={`/workspaces/${accepted.workspaceId}/connections/meta`}>워크스페이스로 이동<DetailIcon name="arrow" size={16} /></DetailActionLink>
          ) : (
            <>
              {formError ? <FormAlert role="alert">{formError}</FormAlert> : null}
              {isValidToken ? (
                <><Submit type="button" onClick={() => void handleAccept()} disabled={submitting} aria-busy={submitting}>{submitting ? '워크스페이스에 참여하는 중…' : '초대 수락하고 참여하기'}{!submitting ? <DetailIcon name="arrow" size={16} /> : null}</Submit><DetailBadge><DetailIcon name="clock" size={13} />발송 후 24시간 유효 · 1회 사용</DetailBadge></>
              ) : <DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink>}
            </>
          )}
        </InviteContent>
      </DetailPanel>
    </InvitePage>
  )
}

const InvitePage = styled(DetailPage)`max-width: 36rem; padding-block: clamp(1rem, 5vw, 3rem);`
const InviteContent = styled(DetailEmpty)`padding: clamp(2rem, 5vw, 3.5rem) clamp(1.25rem, 4vw, 2.5rem);`
const InviteIcon = styled(DetailIconTile)<{ $accepted: boolean }>`width: 4rem; height: 4rem; margin-bottom: 0.5rem; border-radius: 1.125rem; ${({ $accepted }) => $accepted && 'background: #eaf8f1; border-color: #ccebdd; color: #167853;'} `
const Submit = styled(DetailPrimaryButton)`width: 100%; margin-top: 0.5rem; min-height: 2.875rem;`
const FormAlert = styled(DetailAlert)`width: 100%; text-align: left;`
