import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { assetKey, useWorkspaceConnections } from '../../hooks/useWorkspaceConnections'
import { META_ASSET_SELECT_MAX } from '../../types/platform'
import type { AssetType, MetaDiscoveredAsset, PlatformAssetResponse } from '../../types/platform'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow,
  DetailHeader, DetailHint, DetailIcon, DetailIconTile, DetailLead, DetailPage,
  DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

const ASSET_GROUPS: { title: string; assetType: AssetType }[] = [
  { title: '광고 계정', assetType: 'AD_ACCOUNT' },
  { title: 'Facebook 페이지', assetType: 'PAGE' },
  { title: 'Instagram 프로필', assetType: 'PROFILE' },
]

export default function WorkspaceConnectionsPage() {
  const location = useLocation()
  const connectedNotice = Boolean(
    (location.state as { metaConnected?: boolean } | null)?.metaConnected,
  )
  const {
    isValidWorkspaceId, workspace, isOwner, metaConnections, discovered, discoverErrors,
    selected, loading, error, connecting, savingId, saveError, saveMessage,
    toggleAsset, connectMeta, saveAssets,
  } = useWorkspaceConnections()

  if (!isValidWorkspaceId) {
    return (
      <DetailPage>
        <DetailPanel><DetailEmpty>
          <DetailIconTile><DetailIcon name="link" /></DetailIconTile>
          <DetailTitle>워크스페이스를 찾을 수 없습니다</DetailTitle>
          <p>주소를 확인하거나 목록에서 다시 선택해 주세요.</p>
          <DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink>
        </DetailEmpty></DetailPanel>
      </DetailPage>
    )
  }

  return (
    <DetailPage>
      <DetailHeader>
        <div>
          <DetailEyebrow>플랫폼 연결 / Meta</DetailEyebrow>
          <DetailTitle>Meta 연결</DetailTitle>
          <DetailLead>Facebook과 Instagram의 광고 자산을 한곳에서 관리하세요.</DetailLead>
        </div>
        {!loading && isOwner ? (
          <DetailPrimaryButton type="button" onClick={() => void connectMeta()} disabled={connecting}>
            <DetailIcon name="plus" size={16} />
            {connecting ? 'Meta로 이동 중…' : metaConnections.length > 0 ? '계정 추가 · 재인증' : 'Meta 계정 연결'}
          </DetailPrimaryButton>
        ) : null}
      </DetailHeader>

      {connectedNotice ? <DetailAlert $success role="status">Meta 계정이 연결되었습니다. 아래에서 사용할 자산을 선택하고 저장해 주세요.</DetailAlert> : null}
      {error ? <DetailAlert role="alert">{error}</DetailAlert> : null}
      {saveError ? <DetailAlert role="alert">{saveError}</DetailAlert> : null}
      {saveMessage ? <DetailAlert $success role="status">{saveMessage}</DetailAlert> : null}

      <ContentGrid>
        <div>
          <DetailPanel>
            <PanelHeading>
              <PlatformIdentity>
                <MetaMark aria-hidden="true">∞</MetaMark>
                <div><h2>연결된 Meta 계정</h2><p>Facebook · Instagram · Meta 광고</p></div>
              </PlatformIdentity>
              {!loading && !error ? <DetailBadge $tone={metaConnections.length > 0 ? 'success' : undefined}>{metaConnections.length}개 연결</DetailBadge> : null}
            </PanelHeading>

            {loading ? <DetailStatus role="status">연결 정보를 불러오는 중…</DetailStatus> : error && !workspace ? (
              <DetailEmpty>
                <DetailIconTile><DetailIcon name="link" /></DetailIconTile>
                <h2>연결 정보를 확인할 수 없습니다</h2>
                <p>워크스페이스 접근 권한을 확인하거나 잠시 후 다시 방문해 주세요.</p>
                <DetailActionLink to="/workspaces">워크스페이스 목록</DetailActionLink>
              </DetailEmpty>
            ) : metaConnections.length === 0 ? (
              <DetailEmpty>
                <EmptyArt aria-hidden="true"><DetailIcon name="link" size={30} /></EmptyArt>
                <h2>첫 Meta 계정을 연결해 보세요</h2>
                <p>{isOwner ? 'Meta 계정을 연결하면 광고 계정, Facebook 페이지, Instagram 프로필을 워크스페이스에서 함께 사용할 수 있습니다.' : '워크스페이스 소유자가 Meta 계정을 연결하면 팀과 함께 자산을 확인하고 선택할 수 있습니다.'}</p>
                {isOwner ? <DetailPrimaryButton type="button" onClick={() => void connectMeta()} disabled={connecting}><DetailIcon name="plus" size={16} />{connecting ? 'Meta로 이동 중…' : 'Meta 계정 연결'}</DetailPrimaryButton> : <DetailBadge>소유자의 연결을 기다리고 있어요</DetailBadge>}
                <ServiceTags><span>광고 계정</span><span>Facebook</span><span>Instagram</span></ServiceTags>
              </DetailEmpty>
            ) : (
              <ConnectionList aria-label="연결된 Meta 계정">
                {metaConnections.map((connection) => {
                  const available = discovered[connection.id] ?? []
                  const chosen = new Set(selected[connection.id] ?? [])
                  const discoverError = discoverErrors[connection.id]
                  const discovering = !Object.hasOwn(discovered, connection.id) && !discoverError
                  const selectedCount = available.filter((asset) => chosen.has(assetKey(asset))).length
                  const savedKeys = new Set(connection.assets.map(assetKey))
                  const changed = selectedCount !== savedKeys.size || available.some((asset) => chosen.has(assetKey(asset)) !== savedKeys.has(assetKey(asset)))

                  return (
                    <ConnectionCard key={connection.id}>
                      <ConnectionHeading>
                        <div><ConnectionName>{connection.accountName || 'Meta 계정'}</ConnectionName><ConnectionMeta>계정 ID {connection.externalAccountId}</ConnectionMeta></div>
                        <DetailBadge $tone={connection.requiresReauth ? 'warning' : 'success'}>{connection.requiresReauth ? '재인증 필요' : '연결됨'}</DetailBadge>
                      </ConnectionHeading>

                      {connection.requiresReauth ? <DetailAlert role="status">계정 인증을 갱신해야 자산을 조회할 수 있습니다. 소유자가 같은 Meta 계정으로 다시 연결해 주세요.</DetailAlert> : null}

                      <SavedAssets>
                        <SectionLabel>저장된 자산 <span>{connection.assets.length}</span></SectionLabel>
                        {connection.assets.length > 0 ? (
                          <SavedList aria-label="저장된 자산">{connection.assets.map((asset) => <SavedItem key={asset.id}><DetailIcon name="check" size={13} />{formatAssetLabel(asset)}</SavedItem>)}</SavedList>
                        ) : <DetailHint>사용할 자산을 선택하고 저장하면 여기에 표시됩니다.</DetailHint>}
                      </SavedAssets>

                      {discoverError ? <DetailAlert role="alert">{discoverError}</DetailAlert> : null}
                      {!connection.requiresReauth && discovering ? <DetailStatus role="status">사용 가능한 자산을 찾는 중…</DetailStatus> : null}
                      {!connection.requiresReauth && available.length > 0 ? (
                        <AssetSelection>
                          <SelectionHeading><h3>사용할 자산 선택</h3><span>{selectedCount}개 선택 / 최대 {META_ASSET_SELECT_MAX}개</span></SelectionHeading>
                          {ASSET_GROUPS.map((group) => {
                            const items = available.filter((item) => item.assetType === group.assetType)
                            if (items.length === 0) return null
                            return (
                              <AssetGroup key={group.assetType}>
                                <GroupTitle>{group.title} <span>{items.length}</span></GroupTitle>
                                {items.map((asset) => {
                                  const key = assetKey(asset)
                                  const checkboxId = `asset-${connection.id}-${key}`
                                  return (
                                    <AssetRow key={key} htmlFor={checkboxId} $selected={chosen.has(key)}>
                                      <input id={checkboxId} type="checkbox" checked={chosen.has(key)} onChange={() => toggleAsset(connection.id, key)} disabled={savingId !== null} />
                                      <AssetText><span>{formatDiscoveredLabel(asset)}</span><small>ID {asset.externalId}</small></AssetText>
                                    </AssetRow>
                                  )
                                })}
                              </AssetGroup>
                            )
                          })}
                          <SaveRow>
                            <DetailHint>{changed ? '변경한 선택을 저장해 주세요.' : '저장된 자산이 선택되어 있습니다.'}</DetailHint>
                            <DetailPrimaryButton type="button" onClick={() => void saveAssets(connection.id)} disabled={savingId !== null || selectedCount === 0 || !changed}>
                              {savingId === connection.id ? '저장 중…' : '선택한 자산 저장'}
                            </DetailPrimaryButton>
                          </SaveRow>
                        </AssetSelection>
                      ) : null}
                      {!connection.requiresReauth && !discovering && available.length === 0 && !discoverError ? <DetailHint>이 계정에서 사용 가능한 자산을 찾지 못했습니다. Meta 계정의 광고 계정 및 페이지 접근 권한을 확인해 주세요.</DetailHint> : null}
                      {connection.requiresReauth && isOwner ? <ReauthButton type="button" onClick={() => void connectMeta()} disabled={connecting}>{connecting ? 'Meta로 이동 중…' : 'Meta 계정 다시 연결'}</ReauthButton> : null}
                    </ConnectionCard>
                  )
                })}
              </ConnectionList>
            )}
          </DetailPanel>
        </div>

        <GuidePanel aria-labelledby="meta-guide-title">
          <DetailPanelBody>
            <GuideTitle id="meta-guide-title">연결은 이렇게 진행돼요</GuideTitle>
            <Steps>
              <li><StepNumber>1</StepNumber><div><h3>Meta 계정 인증</h3><p>Facebook에 로그인하고 계정 및 페이지 접근을 허용하세요.</p></div></li>
              <li><StepNumber>2</StepNumber><div><h3>사용할 자산 선택</h3><p>워크스페이스에서 함께 관리할 광고 계정과 프로필을 선택하세요.</p></div></li>
              <li><StepNumber>3</StepNumber><div><h3>선택한 자산 저장</h3><p>저장한 자산은 참여 중인 팀 멤버도 사용할 수 있어요.</p></div></li>
            </Steps>
            <PermissionNote><DetailIcon name="shield" size={18} /><p>계정 연결과 재인증은 워크스페이스 소유자만 할 수 있습니다. 멤버는 연결된 자산을 조회하고 선택할 수 있습니다.</p></PermissionNote>
          </DetailPanelBody>
        </GuidePanel>
      </ContentGrid>
    </DetailPage>
  )
}

function formatAssetLabel(asset: PlatformAssetResponse): string {
  const label = asset.assetType === 'AD_ACCOUNT' ? '광고 계정' : asset.assetType === 'PAGE' ? '페이지' : '프로필'
  return `${label} · ${asset.name || asset.externalId}`
}

function formatDiscoveredLabel(asset: MetaDiscoveredAsset): string {
  const page = asset.assetType === 'PROFILE' && asset.facebookPageId ? ` · 페이지 ${asset.facebookPageId}` : ''
  return `${asset.name || asset.externalId}${page}`
}

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17.5rem;
  gap: 1.5rem;
  align-items: start;
  @media (max-width: 1120px) { grid-template-columns: minmax(0, 1fr); }
`
const PlatformIdentity = styled.div`display: flex; align-items: center; gap: 0.875rem; min-width: 0;`
const MetaMark = styled.span`display: grid; place-items: center; width: 2.75rem; height: 2.75rem; flex-shrink: 0; border-radius: 0.75rem; background: #eef5ff; color: #0866ff; font-size: 2.3rem; line-height: 1; font-weight: 600;`
const EmptyArt = styled(DetailIconTile)`width: 4.5rem; height: 4.5rem; margin-bottom: 0.25rem; border-radius: 1.25rem;`
const ServiceTags = styled.div`display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; span { padding: 0.3rem 0.6rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 0.375rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; }`
const ConnectionList = styled.ul`list-style: none;`
const ConnectionCard = styled.li`display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; } @media (max-width: 600px) { padding: 1.125rem; }`
const ConnectionHeading = styled.div`display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;`
const ConnectionName = styled.h3`font-size: 0.9375rem; overflow-wrap: anywhere;`
const ConnectionMeta = styled.p`margin-top: 0.25rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; overflow-wrap: anywhere;`
const SavedAssets = styled.div`display: grid; gap: 0.75rem;`
const SectionLabel = styled.p`font-size: 0.75rem; font-weight: 650; color: ${({ theme }) => theme.colors.textSecondary}; span { margin-left: 0.3rem; color: ${({ theme }) => theme.colors.primary}; }`
const SavedList = styled.ul`display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none;`
const SavedItem = styled.li`display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; border-radius: 0.375rem; background: #f2f8f5; color: #246d51; font-size: 0.72rem; overflow-wrap: anywhere; svg { flex-shrink: 0; }`
const AssetSelection = styled.div`padding-top: 1.25rem; border-top: 1px solid ${({ theme }) => theme.colors.border};`
const SelectionHeading = styled.div`display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; h3 { font-size: 0.875rem; } span { font-size: 0.75rem; color: ${({ theme }) => theme.colors.textMuted}; }`
const AssetGroup = styled.fieldset`min-width: 0; margin-top: 1.25rem; padding: 0; border: 0;`
const GroupTitle = styled.legend`margin-bottom: 0.625rem; font-size: 0.75rem; font-weight: 650; span { color: ${({ theme }) => theme.colors.textMuted}; margin-left: 0.375rem; }`
const AssetRow = styled.label<{ $selected: boolean }>`display: flex; align-items: center; gap: 0.75rem; min-height: 3.5rem; padding: 0.75rem; margin-top: 0.4rem; border: 1px solid ${({ theme, $selected }) => $selected ? '#d8d4ff' : theme.colors.border}; border-radius: 0.5rem; background: ${({ $selected }) => $selected ? '#faf9ff' : 'transparent'}; cursor: pointer; &:hover { border-color: #b5aef7; } input { flex-shrink: 0; width: 1rem; height: 1rem; min-height: 0; margin: 0; accent-color: ${({ theme }) => theme.colors.primary}; } &:has(input:disabled) { cursor: wait; opacity: 0.7; }`
const AssetText = styled.span`display: grid; gap: 0.2rem; min-width: 0; font-size: 0.8125rem; overflow-wrap: anywhere; small { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; }`
const SaveRow = styled.div`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.875rem; margin-top: 1.25rem;`
const ReauthButton = styled(DetailPrimaryButton)`align-self: flex-start;`
const GuidePanel = styled(DetailPanel)`background: #fcfcfe;`
const GuideTitle = styled.h2`font-size: 0.875rem;`
const Steps = styled.ol`display: grid; gap: 1.5rem; padding: 0; margin-top: 1.5rem; list-style: none; li { display: flex; gap: 0.75rem; } h3 { font-size: 0.8125rem; font-weight: 650; } p { margin-top: 0.35rem; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.75rem; line-height: 1.8; word-break: keep-all; }`
const StepNumber = styled.span`display: grid; place-items: center; flex-shrink: 0; width: 1.5rem; height: 1.5rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 50%; background: white; font-size: 0.6875rem; font-weight: 650; color: ${({ theme }) => theme.colors.textSecondary};`
const PermissionNote = styled.div`display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid ${({ theme }) => theme.colors.border}; color: ${({ theme }) => theme.colors.textMuted}; svg { flex-shrink: 0; margin-top: 0.15rem; } p { font-size: 0.72rem; line-height: 1.8; word-break: keep-all; }`
