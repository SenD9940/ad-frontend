import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { MetaDiscoveredAsset } from '../../types/platform'
import { DetailAlert, DetailHint, DetailPrimaryButton, DetailSecondaryButton, DetailStatus } from './WorkspaceDetailUI'

type Props = {
  workspaceId: number
  accountName: string
  pages: MetaDiscoveredAsset[]
  loading: boolean
  error: string
  saveError: string
  saving: boolean
  selectedId: string
  saved: boolean
  onSelect: (externalId: string) => void
  onReload: () => void
  onSave: () => void
}

export function MetaPageSetup({ workspaceId, accountName, pages, loading, error, saveError, saving, selectedId, saved, onSelect, onReload, onSave }: Props) {
  return <Setup aria-labelledby="ad-create-setup-heading">
    <div><h3 id="ad-create-setup-heading">광고에 사용할 Facebook 페이지</h3><DetailHint>{accountName || '선택한 광고 계정'}에서 사용할 수 있는 페이지를 선택하세요.</DetailHint></div>
    {loading ? <DetailStatus role="status">광고 계정의 Facebook 페이지를 조회하는 중…</DetailStatus> : error ? (
      <DetailAlert role="alert">페이지 목록을 불러오지 못했습니다. {error}</DetailAlert>
    ) : pages.length === 0 ? (
      <DetailHint role="status">이 광고 계정에서 조회되는 Facebook 페이지가 없습니다. Meta 비즈니스 설정에서 광고 계정과 페이지의 자산 할당·접근 권한을 확인해 주세요. 앱에 페이지 접근을 허용하지 않았다면 자산 편집에서 Meta 계정을 재인증해 주세요.</DetailHint>
    ) : <>
      <PageLabel htmlFor="ad-create-setup-page">Facebook 페이지
        <select id="ad-create-setup-page" value={selectedId} disabled={saving} onChange={(event) => onSelect(event.target.value)}>
          <option value="">페이지를 선택해 주세요</option>
          {pages.map((page) => <option key={page.externalId} value={page.externalId}>{page.name || 'Facebook 페이지'} · {page.externalId}</option>)}
        </select>
      </PageLabel>
      <DetailHint role={saved ? 'status' : undefined}>{saved ? '선택한 페이지로 광고 내용을 입력하세요.' : '새 페이지는 저장한 뒤 광고 등록에 사용할 수 있습니다.'}</DetailHint>
    </>}
    {saveError ? <DetailAlert role="alert">{saveError}</DetailAlert> : null}
    <Actions>
      {!loading && !error && pages.length > 0 && !saved ? <DetailPrimaryButton type="button" disabled={!selectedId || saving} onClick={onSave}>{saving ? '페이지 저장 중…' : '페이지 저장하고 계속'}</DetailPrimaryButton> : null}
      <DetailSecondaryButton type="button" disabled={loading || saving} onClick={onReload}>페이지 다시 조회</DetailSecondaryButton>
      {!saving ? <Link to={`/workspaces/${workspaceId}/connections/meta/assets`}>자산 편집·재인증</Link> : null}
    </Actions>
  </Setup>
}

const Setup = styled.div`display: grid; gap: 1rem; min-width: 0; padding: 1.125rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: .625rem; background: #f8f9fc; h3 { margin-bottom: .375rem; font-size: .9375rem; }`
const PageLabel = styled.label`display: grid; gap: .625rem; min-width: 0; font-size: .8125rem; font-weight: 600; select { width: 100%; min-width: 0; font-size: .8125rem; }`
const Actions = styled.div`display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; min-width: 0; a { font-size: .8125rem; }`
