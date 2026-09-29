import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Modal from '../../components/common/Modal'
import { useErrorModal } from '../../components/common/useErrorModal'
import { useModal } from '../../components/common/useModal'
import { ApiError } from '../../api/http'
import { createMetaAd, MetaAdCreationError } from '../../api/metaAdCreation'
import { uploadMetaAdImage } from '../../api/metaAdImages'
import { downloadStudioImage } from '../../studio/api'
import StudioImportPanel, { type StudioImportOutput } from '../../components/studio/StudioImportPanel'
import { listPlatformConnections } from '../../api/platformConnections'
import { useMetaAdPages } from '../../hooks/useMetaAdPages'
import type { MetaAdCreateRequest, MetaAdCreateResult } from '../../types/metaAdCreation'
import type { PlatformConnectionResponse } from '../../types/platform'
import { MetaAdCreationForm } from './MetaAdCreationForm'
import { MetaAdImageInput, MetaAdImagePreview, type UploadedMetaAdImage } from './MetaAdImageInput'
import { MetaPageSetup } from './MetaPageSetup'
import { buildMetaAdRequest, emptyMetaAdForm, validateMetaAdForm, type MetaAdFormErrors, type MetaAdFormValues } from './metaAdFormModel'
import { metaAdEditPath } from './metaAdEditPaths'
import {
  DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead,
  DetailPage, DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading,
} from './WorkspaceDetailUI'

type Failure = { message: string; outcome: MetaAdCreateResult | null; unknown: boolean }
type ReviewedAd = { assetId: number; accountName: string; pageName: string; profileName: string; request: MetaAdCreateRequest; image: UploadedMetaAdImage | null }
type ImageContext = { key: string }

export default function MetaAdCreatePage() {
  const modal = useModal()
  const { workspaceId } = useParams()
  const [params, setParams] = useSearchParams()
  const [connections, setConnections] = useState<PlatformConnectionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  useErrorModal(loadError, '광고 자산 조회 실패')
  const [attempt, setAttempt] = useState(0)
  const [values, setValues] = useState(emptyMetaAdForm)
  const [errors, setErrors] = useState<MetaAdFormErrors>({})
  const [accountError, setAccountError] = useState('')
  const [review, setReview] = useState<ReviewedAd | null>(null)
  const [busy, setBusy] = useState(false)
  const [imageState, setImageState] = useState<{ context: ImageContext; image: UploadedMetaAdImage | null } | null>(null)
  const [uploadingContext, setUploadingContext] = useState<ImageContext | null>(null)
  const pending = useRef(false)
  const active = useRef(true)
  const [result, setResult] = useState<MetaAdCreateResult | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [checkedOutcome, setCheckedOutcome] = useState(false)
  const [retryReady, setRetryReady] = useState(false)
  const mainTitle = useRef<HTMLHeadingElement>(null)
  const assetIdParam = params.get('assetId') ?? ''
  const studioOutputId = params.get('studioOutputId') ?? ''
  const accounts = connections.filter((connection) => connection.providerType === 'META').flatMap((connection) => (
    connection.assets.filter((asset) => asset.platformType === 'FACEBOOK' && asset.assetType === 'AD_ACCOUNT').map((asset) => ({ asset, connection }))
  ))
  const selected = accounts.find(({ asset }) => String(asset.id) === assetIdParam)
  const imageScope = `${workspaceId}:${assetIdParam}`
  const imageContext = useMemo(() => ({ key: imageScope }), [imageScope])
  const uploadedImage = imageState?.context === imageContext ? imageState.image : null
  const imageUploading = uploadingContext === imageContext
  const accountPages = useMetaAdPages(Number(workspaceId), selected?.asset.id, Boolean(selected && !selected.connection.requiresReauth && !loading && !loadError))
  const pages = selected?.connection.assets.filter((asset) => asset.platformType === 'FACEBOOK' && asset.assetType === 'PAGE'
    && accountPages.pages.some((available) => available.externalId === asset.externalId)) ?? []
  const page = pages.find((asset) => String(asset.id) === values.pageAssetId && asset.externalId === accountPages.selectedId)
  const profiles = page ? selected?.connection.assets.filter((asset) => asset.platformType === 'INSTAGRAM' && asset.assetType === 'PROFILE' && asset.facebookPageId === page.externalId) ?? [] : []
  const profile = profiles.find((asset) => String(asset.id) === values.instagramAssetId)
  const assetsPath = `/workspaces/${workspaceId}/connections/meta/assets`
  const performancePath = `/workspaces/${workspaceId}/meta/performance${selected ? `?assetId=${selected.asset.id}` : ''}`
  const existingObjects = Boolean(failure?.outcome && [failure.outcome.campaignId, failure.outcome.adSetId, failure.outcome.creativeId, failure.outcome.adId].some(Boolean))
  const needsOutcomeCheck = Boolean(failure && (failure.unknown || existingObjects))
  const blocked = needsOutcomeCheck && !retryReady

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    listPlatformConnections(Number(workspaceId)).then((items) => {
      if (!cancelled) setConnections(items)
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof ApiError ? error.message : '저장된 자산을 불러오지 못했습니다.')
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [attempt, workspaceId])

  function changeValues(patch: Partial<MetaAdFormValues>) {
    if (pending.current || review || blocked || result) return
    setValues((current) => ({ ...current, ...patch,
      ...(patch.pageAssetId !== undefined && patch.pageAssetId !== current.pageAssetId ? { instagramAssetId: '' } : {}),
      ...(patch.objective === 'OUTCOME_TRAFFIC' ? { pixelId: '' } : {}),
      ...(patch.specialAdCategories?.length === 0 ? { specialAdCategoryCountry: '' } : {}),
    }))
    setErrors({})
  }

  function changeAccount(value: string) {
    if (pending.current || review || blocked || result || imageUploading) return
    accountPages.selectPage('')
    setParams(current => { const next = new URLSearchParams(current); if (value) next.set('assetId', value); else next.delete('assetId'); return next }, { replace: true })
    setValues((current) => ({ ...current, pageAssetId: '', instagramAssetId: '', imageKey: '' }))
    setImageState(null)
    setUploadingContext(null)
    setErrors({})
    setAccountError('')
  }

  async function applyStudioImage(output: StudioImportOutput, signal: AbortSignal) {
    if (output.kind !== 'AD_IMAGE') throw new Error('Meta 광고에는 광고 소재 이미지만 적용할 수 있습니다.')
    if (!selected || selected.connection.requiresReauth || imageUploading || pending.current) return
    setUploadingContext(imageContext)
    try {
      const file = await downloadStudioImage(Number(workspaceId), output.id)
      if (signal.aborted) return
      const image = await uploadMetaAdImage(Number(workspaceId), selected.asset.id, file, undefined, signal)
      if (signal.aborted) return
      setImageState({ context: imageContext, image: { ...image, workspaceId: Number(workspaceId), assetId: selected.asset.id, file, fileName: file.name, studioOutputId: output.id } })
      setValues(current => ({ ...current, imageSource: 'upload', imageKey: image.imageKey }))
      setErrors({})
    } finally { if (active.current) setUploadingContext(current => current === imageContext ? null : current) }
  }

  function prepareReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || blocked || result) return
    if (!selected) {
      setAccountError('등록할 광고 계정을 선택해 주세요.')
      document.getElementById('ad-create-account')?.focus()
      return
    }
    if (selected.connection.requiresReauth) return
    if (imageUploading) return
    if (!page || accountPages.loading || accountPages.error || accountPages.saving) {
      setErrors({ pageAssetId: '광고에 사용할 페이지를 선택하고 저장해 주세요.' })
      document.getElementById('ad-create-setup-page')?.focus()
      return
    }
    const effectiveValues = { ...values, imageKey: uploadedImage?.imageKey ?? '' }
    const nextErrors = validateMetaAdForm(effectiveValues, pages, profiles)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(firstError === 'pageAssetId' ? 'ad-create-setup-page' : firstError === 'imageKey' ? 'ad-create-image-file' : `ad-create-${firstError}`)?.focus())
      return
    }
    if (!needsOutcomeCheck) setFailure(null)
    setReview({ assetId: selected.asset.id, accountName: selected.asset.name || selected.asset.externalId,
      pageName: page?.name || page?.externalId || '', profileName: profile?.name || profile?.externalId || '', request: buildMetaAdRequest(effectiveValues), image: values.imageSource === 'upload' ? uploadedImage : null })
  }

  function closeReview() {
    if (pending.current) return
    setReview(null)
    requestAnimationFrame(() => document.getElementById('ad-review-trigger')?.focus())
  }

  async function submitAd() {
    if (!review || pending.current || blocked || result) return
    pending.current = true
    setBusy(true)
    setFailure(null)
    setCheckedOutcome(false)
    setRetryReady(false)
    try {
      const created = await createMetaAd(Number(workspaceId), review.assetId, review.request)
      if (active.current) { setResult(created); void modal.success({ title: '광고 등록 완료', message: `${created.message}\n등록된 광고는 일시정지 상태입니다. 생성된 항목과 상태를 확인해 주세요.` }) }
    } catch (caught: unknown) {
      if (active.current) {
        const failure = { message: caught instanceof ApiError ? caught.message : '등록 결과를 확인하지 못했습니다. Meta 광고 관리자에서 생성 여부를 확인해 주세요.',
          outcome: caught instanceof MetaAdCreationError ? caught.outcome : null,
          unknown: caught instanceof MetaAdCreationError ? caught.outcomeUnknown : !(caught instanceof ApiError) }
        setFailure(failure)
        setReview(null)
        void modal.error({ title: failure.unknown ? '광고 등록 결과 확인 필요' : '광고 등록 실패', message: failure.message })
      }
    } finally {
      pending.current = false
      if (active.current) {
        setBusy(false)
      }
    }
  }

  return <DetailPage>
    <DetailHeader>
      <div><DetailEyebrow>Meta / 광고 등록</DetailEyebrow><DetailTitle ref={mainTitle} tabIndex={-1}>Meta 광고 등록</DetailTitle><DetailLead>캠페인부터 이미지 광고까지 한 번에 등록하세요. 등록한 광고는 일시정지 상태로 생성됩니다.</DetailLead></div>
      {!busy && <BackLink to={performancePath}>성과로 돌아가기</BackLink>}
    </DetailHeader>
    {loading ? <DetailPanel><DetailStatus role="status">광고에 사용할 저장된 자산을 불러오는 중…</DetailStatus></DetailPanel> : loadError ? <DetailPanel><DetailEmpty><DetailAlert role="alert">{loadError}</DetailAlert><DetailSecondaryButton type="button" onClick={() => { setLoading(true); setLoadError(''); setAttempt((current) => current + 1) }}>자산 다시 불러오기</DetailSecondaryButton></DetailEmpty></DetailPanel> : result ? (
      <DetailPanel><PanelHeading><h2>광고 등록 완료</h2><DetailBadge $tone="success">일시정지</DetailBadge></PanelHeading><StackBody>
        <DetailAlert $success role="status">{result.message}</DetailAlert>
        <DetailHint>광고가 자동으로 집행되지는 않습니다. 생성된 캠페인과 성과를 확인할 수 있습니다.</DetailHint>
        <CreationIds result={result} />
        <Actions>
          {result.adId && /^[1-9]\d*$/.test(result.adId) ? <BackLink to={metaAdEditPath(workspaceId!, { assetId: result.assetId, type: 'ad', objectId: result.adId })}>광고 수정</BackLink> : null}
          {result.adSetId && /^[1-9]\d*$/.test(result.adSetId) ? <BackLink to={metaAdEditPath(workspaceId!, { assetId: result.assetId, type: 'ad-set', objectId: result.adSetId })}>광고세트 수정</BackLink> : null}
          {result.campaignId && /^[1-9]\d*$/.test(result.campaignId) ? <BackLink to={metaAdEditPath(workspaceId!, { assetId: result.assetId, type: 'campaign', objectId: result.campaignId })}>캠페인 수정</BackLink> : null}
        </Actions>
        <Actions><DetailActionLink to={`/workspaces/${workspaceId}/meta/performance?assetId=${result.assetId}`}>캠페인·성과 보기</DetailActionLink><ExternalLink href="https://adsmanager.facebook.com/" target="_blank" rel="noopener noreferrer">Meta 광고 관리자 열기 ↗</ExternalLink></Actions>
      </StackBody></DetailPanel>
    ) : accounts.length === 0 ? <DetailPanel><DetailEmpty><h2>광고 계정을 먼저 저장해 주세요</h2><p>광고 계정과 Facebook 페이지를 같은 Meta 연결에서 선택하고 저장하면 광고를 등록할 수 있습니다.</p><DetailActionLink to={assetsPath}>자산 편집</DetailActionLink></DetailEmpty></DetailPanel> : <>
      {failure ? <DetailPanel><PanelHeading><h2>{failure.unknown ? '광고 등록 결과 확인 필요' : existingObjects ? '일부 항목이 생성되었습니다' : '광고를 등록하지 못했습니다'}</h2><DetailBadge $tone="warning">{failure.unknown ? '결과 확인 필요' : '등록 실패'}</DetailBadge></PanelHeading><StackBody>
        <DetailAlert role="alert">{failure.message}</DetailAlert>
        {failure.outcome ? <><DetailHint>중단 단계: {stepLabel(failure.outcome.failedStep)}</DetailHint><CreationIds result={failure.outcome} /></> : null}
        {needsOutcomeCheck ? <>
          <DetailHint>{failure.unknown ? '응답을 확인하지 못했어도 Meta에서 항목이 생성되었을 수 있습니다. ' : '이미 생성된 항목은 일시정지 상태로 남아 있습니다. '}다시 등록하면 새 캠페인부터 생성되어 중복될 수 있으므로 Meta 광고 관리자에서 결과를 먼저 확인해 주세요.</DetailHint>
          <Actions><ExternalLink href="https://adsmanager.facebook.com/" target="_blank" rel="noopener noreferrer">Meta 광고 관리자에서 확인 ↗</ExternalLink><BackLink to={performancePath}>캠페인·성과 보기</BackLink></Actions>
          {!retryReady ? <><CheckLabel><input type="checkbox" checked={checkedOutcome} onChange={(event) => setCheckedOutcome(event.target.checked)} />Meta 광고 관리자에서 생성 결과를 확인했습니다.</CheckLabel><DetailSecondaryButton type="button" disabled={!checkedOutcome} onClick={() => { setRetryReady(true); setReview(null) }}>입력을 수정해 새 등록 준비</DetailSecondaryButton></> : <DetailHint>확인한 이전 등록 결과입니다. 아래에서 내용을 수정한 뒤 새로 등록할 수 있습니다.</DetailHint>}
        </> : <><DetailHint>입력과 광고 등록 권한을 확인해 주세요. 권한이 부족하면 자산 편집에서 Meta 계정을 재인증할 수 있습니다.</DetailHint><Actions><DetailSecondaryButton type="button" onClick={() => { setReview(null); setFailure(null) }}>입력 수정</DetailSecondaryButton><BackLink to={assetsPath}>자산 편집·재인증</BackLink></Actions></>}
      </StackBody></DetailPanel> : null}

      {!blocked && review ? <Modal open title="등록 내용 확인" description="선택한 광고 계정에 캠페인·광고세트·광고를 일시정지 상태로 생성합니다." variant="confirm" size="lg" busy={busy} onClose={closeReview}><StackBody>
        <ReviewList>
          <div><dt>광고 계정</dt><dd>{review.accountName}</dd></div>
          <div><dt>캠페인 / 목표</dt><dd>{review.request.campaign.name} / {review.request.campaign.objective === 'OUTCOME_SALES' ? '판매' : '트래픽'}</dd></div>
          <div><dt>특별 광고 카테고리</dt><dd>{review.request.campaign.specialAdCategories.map(categoryLabel).join(', ') || '해당 없음'}{review.request.campaign.specialAdCategoryCountry?.length ? ` · 신고 국가 ${review.request.campaign.specialAdCategoryCountry.join(', ')}` : ''}</dd></div>
          <div><dt>광고세트</dt><dd>{review.request.adSet.name}</dd></div>
          <div><dt>일일 예산</dt><dd>{review.request.adSet.dailyBudget.toLocaleString('ko-KR')} (광고 계정 통화의 최소 단위)</dd></div>
          <div><dt>대상 국가 / 연령</dt><dd>{review.request.adSet.countries.join(', ')} / {review.request.adSet.ageMin}~{review.request.adSet.ageMax}세</dd></div>
          {review.request.adSet.pixelId ? <div><dt>픽셀 ID</dt><dd>{review.request.adSet.pixelId}</dd></div> : null}
          <div><dt>게재 위치 / 페이지</dt><dd>Facebook 피드 · {review.pageName}{review.profileName ? ` / Instagram 피드 · ${review.profileName}` : ''}</dd></div>
          <div><dt>광고 이름</dt><dd>{review.request.ad.name}</dd></div>
          <div><dt>광고 이미지</dt><dd>{review.image ? <ImageReview><MetaAdImagePreview file={review.image.file} alt="등록할 광고 이미지" /><span>{review.image.fileName}</span></ImageReview> : <ExternalLink href={review.request.ad.imageUrl} target="_blank" rel="noopener noreferrer">{review.request.ad.imageUrl}</ExternalLink>}</dd></div>
          <div><dt>랜딩 페이지</dt><dd><ExternalLink href={review.request.ad.linkUrl} target="_blank" rel="noopener noreferrer">{review.request.ad.linkUrl}</ExternalLink></dd></div>
          <div><dt>광고 제목</dt><dd>{review.request.ad.headline}</dd></div>
          <div><dt>광고 본문</dt><dd>{review.request.ad.message}</dd></div>
          {review.request.ad.description ? <div><dt>설명</dt><dd>{review.request.ad.description}</dd></div> : null}
          <div><dt>광고 버튼</dt><dd>{ctaLabel(review.request.ad.callToAction)}</dd></div>
        </ReviewList>
        <DetailHint>캠페인·광고세트·소재·광고를 새로 생성합니다. 예산은 입력한 최소 화폐 단위 그대로 전달되며, 자동으로 활성화하지 않습니다.</DetailHint>
        {busy ? <DetailStatus role="status">광고를 등록하는 중입니다. 결과가 나올 때까지 기다려 주세요.</DetailStatus> : null}
        <Actions><DetailSecondaryButton type="button" disabled={busy} onClick={closeReview}>입력 수정</DetailSecondaryButton><DetailPrimaryButton type="button" onClick={() => void submitAd()} disabled={busy || Boolean(failure && !retryReady)}>{busy ? '등록 중…' : '일시정지 상태로 등록'}</DetailPrimaryButton></Actions>
      </StackBody></Modal> : !blocked ? <Form onSubmit={prepareReview} noValidate>
        {studioOutputId && <StudioImportPanel key={`${imageScope}:${studioOutputId}`} workspaceId={Number(workspaceId)} outputId={studioOutputId} expectedKind="AD_IMAGE" disabled={!selected || selected.connection.requiresReauth || busy || imageUploading} applied={uploadedImage?.studioOutputId === Number(studioOutputId)} onApply={applyStudioImage} />}
        <DetailPanel><PanelHeading><h2>광고 계정 선택</h2><DetailBadge>등록 준비</DetailBadge></PanelHeading><StackBody>
          <AccountLabel htmlFor="ad-create-account">광고 계정<select id="ad-create-account" value={assetIdParam} disabled={busy || imageUploading} onChange={(event) => changeAccount(event.target.value)} aria-invalid={Boolean(accountError)} aria-describedby={accountError ? 'ad-create-account-error' : undefined}>
            <option value="">광고 계정을 선택해 주세요</option>
            {assetIdParam && !selected ? <option value={assetIdParam} disabled>저장되지 않은 광고 계정입니다</option> : null}
            {accounts.map(({ asset, connection }) => <option key={asset.id} value={asset.id}>{asset.name || asset.externalId} · {connection.accountName || 'Meta 계정'} · {asset.externalId}</option>)}
          </select></AccountLabel>
          {accountError ? <FieldError id="ad-create-account-error" role="alert">{accountError}</FieldError> : null}
          <DetailHint>선택한 광고 계정에서 사용할 수 있는 페이지를 조회합니다. Instagram은 선택한 페이지에 연결해 저장한 프로필을 사용합니다.</DetailHint>
          {selected?.connection.requiresReauth ? <DetailAlert role="alert">Meta 계정 재인증이 필요합니다. <Link to={assetsPath}>자산 편집·재인증</Link></DetailAlert> : null}
          {selected && !selected.connection.requiresReauth ? <MetaPageSetup
            workspaceId={Number(workspaceId)}
            accountName={selected.asset.name}
            pages={accountPages.pages}
            loading={accountPages.loading}
            error={accountPages.error}
            saveError={accountPages.saveError}
            saving={accountPages.saving}
            selectedId={accountPages.selectedId}
            saved={Boolean(page)}
            onSelect={(externalId) => {
              accountPages.selectPage(externalId)
              const saved = pages.find((item) => item.externalId === externalId)
              setValues((current) => ({ ...current, pageAssetId: saved ? String(saved.id) : '', instagramAssetId: '' }))
              setErrors({})
            }}
            onReload={() => {
              accountPages.reload()
              setValues((current) => ({ ...current, pageAssetId: '', instagramAssetId: '' }))
              setErrors({})
            }}
            onSave={() => void accountPages.save((assets, savedPage) => {
              setConnections((current) => current.map((connection) => connection.id === selected.connection.id ? { ...connection, assets } : connection))
              setValues((current) => ({ ...current, pageAssetId: String(savedPage.id), instagramAssetId: '' }))
              setErrors({})
            })}
          /> : null}
        </StackBody></DetailPanel>
        {selected && !selected.connection.requiresReauth && page ? <>
          <MetaAdCreationForm values={values} onChange={changeValues} errors={errors} disabled={busy || imageUploading} instagramProfiles={profiles} imageInput={
            <ImageField>
              <Actions role="group" aria-label="광고 이미지 등록 방식">
                <ImageSourceButton type="button" aria-pressed={values.imageSource === 'upload'} disabled={busy || imageUploading} onClick={() => changeValues({ imageSource: 'upload' })}>이미지 업로드</ImageSourceButton>
                <ImageSourceButton type="button" aria-pressed={values.imageSource === 'url'} disabled={busy || imageUploading} onClick={() => changeValues({ imageSource: 'url' })}>URL 입력</ImageSourceButton>
              </Actions>
              {values.imageSource === 'upload' ? <MetaAdImageInput
                key={`${workspaceId}:${selected.asset.id}`}
                workspaceId={Number(workspaceId)}
                assetId={selected.asset.id}
                disabled={busy || imageUploading}
                value={uploadedImage}
                error={errors.imageKey}
                onChange={(image) => {
                  setImageState({ context: imageContext, image })
                  setValues((current) => ({ ...current, imageKey: image?.imageKey ?? '' }))
                  setErrors({})
                }}
                onBusyChange={(uploading) => setUploadingContext((current) => uploading ? imageContext : current === imageContext ? null : current)}
              /> : <ImageField>
                <AccountLabel htmlFor="ad-create-imageUrl">이미지 URL<input id="ad-create-imageUrl" type="url" maxLength={2048} placeholder="https://cdn.example.com/image.jpg" value={values.imageUrl} disabled={busy} onChange={(event) => changeValues({ imageUrl: event.target.value })} aria-invalid={Boolean(errors.imageUrl)} aria-describedby={errors.imageUrl ? 'ad-create-imageUrl-error' : 'ad-create-imageUrl-hint'} /></AccountLabel>
                <DetailHint id="ad-create-imageUrl-hint">Meta가 접근할 수 있는 이미지의 HTTPS 주소를 입력하세요.</DetailHint>
                {errors.imageUrl ? <FieldError id="ad-create-imageUrl-error" role="alert">{errors.imageUrl}</FieldError> : null}
              </ImageField>}
            </ImageField>
          } />
          {Object.keys(errors).length > 0 ? <DetailAlert role="alert">입력 항목을 확인해 주세요. 표시된 오류를 수정하면 등록 내용을 확인할 수 있습니다.</DetailAlert> : null}
          <SubmitBar><DetailHint>{imageUploading ? '이미지 업로드가 완료되면 등록 내용을 확인할 수 있습니다.' : '등록 내용을 확인한 뒤 생성합니다. 광고는 일시정지 상태로 등록됩니다.'}</DetailHint><DetailPrimaryButton id="ad-review-trigger" type="submit" disabled={busy || imageUploading}>등록 내용 확인</DetailPrimaryButton></SubmitBar>
        </> : null}
      </Form> : null}
    </>}
  </DetailPage>
}

function CreationIds({ result }: { result: MetaAdCreateResult }) {
  return <ReviewList aria-label="광고 등록 결과">
    <div><dt>광고 계정 ID</dt><dd><code>{result.adAccountId}</code></dd></div>
    {([['캠페인 ID', result.campaignId], ['광고세트 ID', result.adSetId], ['소재 ID', result.creativeId], ['광고 ID', result.adId]] as const).map(([label, id]) => <div key={label}><dt>{label}</dt><dd><code>{id || '확인된 ID 없음'}</code></dd></div>)}
  </ReviewList>
}

function stepLabel(step: MetaAdCreateResult['failedStep']) {
  return step ? { CAMPAIGN: '캠페인', AD_SET: '광고세트', CREATIVE: '소재', AD: '광고' }[step] : '확인할 수 없음'
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = { CREDIT: '신용', EMPLOYMENT: '고용', FINANCIAL_PRODUCTS_SERVICES: '금융 상품·서비스', HOUSING: '주택', ISSUES_ELECTIONS_POLITICS: '사회 이슈·선거·정치', ONLINE_GAMBLING_AND_GAMING: '온라인 도박·게임' }
  return labels[category] || category
}

function ctaLabel(cta: string) {
  const labels: Record<string, string> = { LEARN_MORE: '더 알아보기', SHOP_NOW: '쇼핑하기', SIGN_UP: '가입하기', CONTACT_US: '문의하기', BOOK_TRAVEL: '예약하기', DOWNLOAD: '다운로드', GET_QUOTE: '견적 받기', APPLY_NOW: '신청하기', GET_OFFER: '혜택 받기' }
  return labels[cta] || cta
}

const Form = styled.form`display: grid; gap: 1.5rem; min-width: 0;`
const StackBody = styled(DetailPanelBody)`display: grid; gap: 1.125rem; min-width: 0;`
const Actions = styled.div`display: flex; gap: .75rem; align-items: center; flex-wrap: wrap;`
const BackLink = styled(Link)`display: inline-flex; align-items: center; justify-content: center; min-height: 2.625rem; padding: .625rem .875rem; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: .5rem; background: white; color: ${({ theme }) => theme.colors.textSecondary}; font-size: .8125rem; font-weight: 600; text-decoration: none;`
const ExternalLink = styled.a`font-size: .8125rem; line-height: 1.75; overflow-wrap: anywhere;`
const AccountLabel = styled.label`display: grid; gap: .625rem; font-size: .8125rem; font-weight: 600; select { width: 100%; min-width: 0; font-size: .8125rem; }`
const FieldError = styled.p`color: #b33434; font-size: .8125rem;`
const CheckLabel = styled.label`display: flex; align-items: center; gap: .625rem; font-size: .8125rem; line-height: 1.7; input { width: 1rem; height: 1rem; min-height: 0; flex-shrink: 0; }`
const ReviewList = styled.dl`display: grid; gap: 0; min-width: 0; margin: 0; > div { display: grid; grid-template-columns: 10rem minmax(0, 1fr); gap: .75rem; padding: .875rem 0; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; } dt { color: ${({ theme }) => theme.colors.textMuted}; font-size: .75rem; } dd { margin: 0; font-size: .8125rem; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; } @media(max-width: 600px) { > div { grid-template-columns: minmax(0, 1fr); gap: .25rem; } }`
const SubmitBar = styled.div`display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;`
const ImageField = styled.div`display: grid; gap: .875rem; min-width: 0;`
const ImageReview = styled.div`display: grid; gap: .75rem; max-width: 24rem;`
const ImageSourceButton = styled(DetailSecondaryButton)`&[aria-pressed='true'] { color: ${({ theme }) => theme.colors.primary}; background: #f5f3ff; border-color: #d8d4ff; }`
