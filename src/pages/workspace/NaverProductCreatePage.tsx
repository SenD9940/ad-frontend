import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ApiError } from '../../api/http'
import { downloadStudioImage } from '../../studio/api'
import StudioImportPanel, { type StudioImportOutput } from '../../components/studio/StudioImportPanel'
import StudioDetailPreview from '../../components/studio/StudioDetailPreview'
import { listSavedNaverStores } from '../../api/naverStores'
import { createNaverProduct, getNaverProductCreationOptions, getNaverProductNotices, NaverProductCreationError } from '../../api/naverProductCreation'
import type { NaverStore } from '../../types/naverStore'
import type { NaverProductCreateRequest, NaverProductCreateResult, NaverProductCreationOptions, NaverProductNotice } from '../../types/naverProductCreation'
import { NaverProductCreationForm } from './NaverProductCreationForm'
import { NaverProductImagePreview } from './NaverProductImages'
import { buildProductRequest, emptyNaverProductForm, validateProductForm, type NaverProductFormValues, type ProductFormErrors } from './naverProductFormModel'
import { Actions, BackLink, CheckLabel, ExternalLink, ProductField, ReviewList, Select, StackBody } from './NaverProductFormUI'
import { DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead, DetailPage, DetailPanel, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading } from './WorkspaceDetailUI'

export default function NaverProductCreatePage() {
  const { workspaceId } = useParams()
  return <ProductCreatePage key={workspaceId} workspaceId={Number(workspaceId)} />
}

function ProductCreatePage({ workspaceId }: { workspaceId: number }) {
  const [params, setParams] = useSearchParams()
  const [locked, setLocked] = useState(false)
  const load = useCallback((signal: AbortSignal) => listSavedNaverStores(workspaceId, signal), [workspaceId])
  const inventory = useRead(String(workspaceId), load)
  const stores = inventory.data ?? []
  const selected = params.has('assetId') ? stores.find((item) => String(item.assetId) === params.get('assetId')) : stores[0]
  const assetsPath = `/workspaces/${workspaceId}/connections/naver/assets`
  const backPath = `/workspaces/${workspaceId}/naver/performance${selected ? `?assetId=${selected.assetId}` : ''}`
  return <DetailPage>
    <DetailHeader><div><DetailEyebrow>네이버 / 스마트스토어</DetailEyebrow><DetailTitle>스마트스토어 상품 등록</DetailTitle><DetailLead>이미지와 상품 정보를 입력하고, 등록 내용을 확인한 뒤 스마트스토어에 등록하세요.</DetailLead></div>{!locked && <BackLink to={backPath}>상품 및 판매 성과</BackLink>}</DetailHeader>
    {inventory.loading ? <DetailPanel><DetailStatus role="status">저장된 스마트스토어를 불러오는 중…</DetailStatus></DetailPanel> : inventory.error ? <LoadError message={inventory.error} retry={inventory.reload} /> : !stores.length ? <DetailPanel><DetailEmpty><h2>먼저 스마트스토어를 연결해 주세요</h2><p>등록할 스마트스토어 채널을 저장하면 상품을 등록할 수 있습니다.</p><DetailActionLink to={assetsPath}>스마트스토어 연결</DetailActionLink></DetailEmpty></DetailPanel> : <>
      <DetailPanel><StackBody><ProductField name="store" label="등록할 스마트스토어" hint="스토어를 변경하면 입력한 상품 정보와 이미지 선택이 초기화됩니다.">
        <Select id="product-store" value={selected?.assetId ?? ''} disabled={locked} onChange={(event) => setParams(current => { const next = new URLSearchParams(current); next.set('assetId', event.target.value); return next }, { replace: true })}>
          {!selected && <option value="">저장된 스마트스토어를 선택해 주세요</option>}
          {stores.map((item) => <option value={item.assetId} key={item.assetId}>{item.name || `스마트스토어 ${item.channelNo}`}{item.requiresReauth ? ' · 재연결 필요' : ''}</option>)}
        </Select></ProductField><DetailHint>옵션 없는 실물 상품과 국내 택배 배송을 지원합니다. 상품별 인증·허가, 복잡한 옵션이 필요한 경우 판매자센터에서 등록해 주세요.</DetailHint></StackBody></DetailPanel>
      {!selected ? <DetailAlert role="alert">저장된 스마트스토어가 아닙니다. 등록할 채널을 다시 선택해 주세요.</DetailAlert> : selected.requiresReauth ? <DetailPanel><DetailEmpty><h2>스마트스토어 재연결이 필요합니다</h2><p>자산 편집에서 네이버 판매자 권한을 다시 확인해 주세요.</p><DetailActionLink to={assetsPath}>자산 편집에서 재연결</DetailActionLink></DetailEmpty></DetailPanel> : <StoreProductCreation key={`${workspaceId}:${selected.assetId}`} workspaceId={workspaceId} store={selected} backPath={backPath} onLock={setLocked} />}
    </>}
  </DetailPage>
}

type Review = { request: NaverProductCreateRequest; images: File[]; notice: NaverProductNotice; studio?: StudioImportOutput }

function StoreProductCreation({ workspaceId, store, backPath, onLock }: { workspaceId: number; store: NaverStore; backPath: string; onLock: (locked: boolean) => void }) {
  const [params] = useSearchParams()
  const studioOutputId = params.get('studioOutputId') ?? ''
  const [studioOutput, setStudioOutput] = useState<StudioImportOutput | null>(null)
  const [importing, setImporting] = useState(false)
  const [values, setValues] = useState(emptyNaverProductForm)
  const [images, setImages] = useState<File[]>([])
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [review, setReview] = useState<Review | null>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ message: string; unknown: boolean } | null>(null)
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState<NaverProductCreateResult | null>(null)
  const pending = useRef(false)
  const active = useRef(true)
  const title = useRef<HTMLHeadingElement>(null)
  const optionsLoader = useCallback((signal: AbortSignal) => getNaverProductCreationOptions(workspaceId, store.assetId, signal), [workspaceId, store.assetId])
  const options = useRead(String(store.assetId), optionsLoader)
  const noticesLoader = useCallback((signal: AbortSignal) => getNaverProductNotices(workspaceId, store.assetId, values.categoryId, signal), [workspaceId, store.assetId, values.categoryId])
  const notices = useRead(values.categoryId || null, noticesLoader)
  const notice = notices.data?.types.find((item) => item.type === values.noticeType)

  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!busy) return
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventExit)
    return () => window.removeEventListener('beforeunload', preventExit)
  }, [busy])

  function change(patch: Partial<NaverProductFormValues>) {
    if (pending.current || review || result || importing) return
    setValues((current) => ({ ...current, ...patch,
      ...(patch.categoryId !== undefined && patch.categoryId !== current.categoryId ? { noticeType: '', noticeFields: {} } : {}),
      ...(patch.noticeType !== undefined && patch.noticeType !== current.noticeType ? { noticeFields: {} } : {}),
    }))
    setErrors({})
  }
  async function applyStudioOutput(output: StudioImportOutput, signal: AbortSignal) {
    if (importing || pending.current || review || result) return
    if (images.length >= 10) throw new Error('이미지는 최대 10장입니다. 기존 이미지 한 장을 제거한 뒤 적용해 주세요.')
    setImporting(true); onLock(true)
    try {
      const file = await downloadStudioImage(workspaceId, output.id)
      if (signal.aborted) return
      if (file.size + images.reduce((total, image) => total + image.size, 0) > 20 * 1024 * 1024) throw new Error('이미지 전체 용량은 20MiB 이하여야 합니다. 기존 이미지를 줄인 뒤 적용해 주세요.')
      setImages(current => [...current, file])
      setValues(current => ({ ...current, name: current.name || output.title.slice(0, 100), ...(output.kind === 'DETAIL_PAGE' ? { studioOutputId: output.id } : {}) }))
      setStudioOutput(output); setErrors({})
    } finally { if (!signal.aborted) { setImporting(false); onLock(false) } }
  }
  function scrollToReview() { requestAnimationFrame(() => { title.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); title.current?.focus() }) }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || review || importing || !options.data || options.error || result) return
    const next = validateProductForm(values, images, options.data, notice)
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) { requestAnimationFrame(() => document.getElementById(`product-${first}`)?.focus()); return }
    if (!notice || notices.loading || notices.error) return
    setFailure(null)
    setReview({ request: buildProductRequest(values, notice), images: [...images], notice, studio: values.studioOutputId === studioOutput?.id ? studioOutput ?? undefined : undefined })
    onLock(true)
    scrollToReview()
  }
  function edit() {
    if (pending.current || result || failure?.unknown && !checked) return
    setReview(null); setFailure(null); setChecked(false); onLock(false)
  }
  async function register() {
    if (!review || pending.current || failure || result) return
    pending.current = true
    setBusy(true)
    try {
      const created = await createNaverProduct(workspaceId, store.assetId, review.request, review.images)
      if (active.current) { setResult(created); onLock(false) }
    } catch (caught) {
      if (active.current) setFailure({ message: caught instanceof Error ? caught.message : '등록 결과를 확인하지 못했습니다. 판매자센터에서 생성 여부를 확인해 주세요.', unknown: caught instanceof NaverProductCreationError ? caught.outcomeUnknown : true })
    } finally {
      pending.current = false
      if (active.current) { setBusy(false); scrollToReview() }
    }
  }

  if (options.loading) return <DetailPanel><DetailStatus role="status">카테고리, 원산지와 배송 정보를 불러오는 중…</DetailStatus></DetailPanel>
  if (options.error || !options.data) return <LoadError message={options.error || '상품 등록 정보를 확인할 수 없습니다.'} retry={options.reload} />
  if (result) {
    const productUrl = publicProductUrl(store.storeUrl, result.smartstoreChannelProductNo)
    return <DetailPanel><PanelHeading><h2 ref={title} tabIndex={-1}>상품 등록 완료</h2><DetailBadge $tone="success">등록 완료</DetailBadge></PanelHeading><StackBody>
      <DetailAlert $success role="status">{result.message}</DetailAlert>
      <ReviewList><div><dt>스마트스토어</dt><dd>{store.name}</dd></div><div><dt>상품명</dt><dd>{review?.request.name}</dd></div><div><dt>채널 상품 번호</dt><dd>{result.smartstoreChannelProductNo}</dd></div><div><dt>원상품 번호</dt><dd>{result.originProductNo}</dd></div><div><dt>전시 상태</dt><dd>{review?.request.displayStatus === 'ON' ? '전시 중으로 등록 요청' : '전시 중지로 등록 요청'}</dd></div></ReviewList>
      <DetailHint>상품의 실제 노출과 네이버 쇼핑 심사 상태는 판매자센터에서 확인할 수 있습니다.</DetailHint>
      <Actions><DetailActionLink to={backPath}>상품 목록으로 돌아가기</DetailActionLink><ExternalLink href="https://sell.smartstore.naver.com/" target="_blank" rel="noopener noreferrer">판매자센터 열기 ↗</ExternalLink>{productUrl && review?.request.displayStatus === 'ON' && <ExternalLink href={productUrl} target="_blank" rel="noopener noreferrer">스토어 상품 보기 ↗</ExternalLink>}</Actions>
    </StackBody></DetailPanel>
  }
  if (review) return <DetailPanel><PanelHeading><div><h2 ref={title} tabIndex={-1}>등록 내용 확인</h2><p>확인 후 등록 버튼을 누르면 선택한 스마트스토어에 상품이 생성됩니다.</p></div><DetailBadge $tone={review.request.displayStatus === 'ON' ? 'warning' : 'primary'}>{review.request.displayStatus === 'ON' ? '고객에게 공개' : '전시 중지'}</DetailBadge></PanelHeading><StackBody>
    {failure && <><DetailAlert role="alert">{failure.message}</DetailAlert>{failure.unknown ? <><DetailHint>응답을 받지 못했어도 상품이 생성되었을 수 있습니다. 판매자센터에서 상품명과 등록 시각을 확인하고, 이미 등록된 상품이 있으면 상품 목록으로 돌아가 주세요.</DetailHint><ExternalLink href="https://sell.smartstore.naver.com/" target="_blank" rel="noopener noreferrer">판매자센터에서 생성 여부 확인 ↗</ExternalLink><CheckLabel><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />판매자센터에서 상품이 등록되지 않은 것을 확인했습니다.</CheckLabel></> : <DetailHint>입력 내용과 상품 등록 권한을 확인한 뒤 수정해 주세요.</DetailHint>}</>}
    <ProductReview review={review} store={store} options={options.data} />
    <DetailHint>{review.request.displayStatus === 'ON' ? '등록 후 스토어에 전시되며 고객이 구매할 수 있습니다.' : '판매 상품으로 등록하고 스토어 전시를 중지합니다. 임시 저장이나 판매 중지 상태가 아닙니다.'} 네이버 쇼핑 등록은 {review.request.naverShoppingRegistration ? '요청합니다.' : '요청하지 않습니다.'}</DetailHint>
    {busy && <DetailStatus role="status">이미지를 업로드하고 상품을 등록하는 중입니다. 결과가 표시될 때까지 기다려 주세요.</DetailStatus>}
    <Actions><DetailSecondaryButton type="button" disabled={busy || Boolean(failure?.unknown && !checked)} onClick={edit}>{failure?.unknown ? '확인 후 입력 수정' : '입력 수정'}</DetailSecondaryButton>{!failure && <DetailPrimaryButton type="button" disabled={busy} onClick={() => void register()}>{busy ? '등록 중…' : review.request.displayStatus === 'ON' ? '스토어에 공개 등록' : '전시 중지로 상품 등록'}</DetailPrimaryButton>}{!busy && <BackLink to={backPath}>상품 목록</BackLink>}</Actions>
  </StackBody></DetailPanel>
  return <Form onSubmit={prepare} noValidate>
    {studioOutputId && <StudioImportPanel key={`${workspaceId}:${store.assetId}:${studioOutputId}`} workspaceId={workspaceId} outputId={studioOutputId} disabled={importing} applied={studioOutput?.kind === 'DETAIL_PAGE' ? values.studioOutputId === Number(studioOutputId) : studioOutput?.id === Number(studioOutputId) && images.some(file => file.name.startsWith(`studio-${studioOutputId}.`))} onApply={applyStudioOutput} />}
    {values.studioOutputId && studioOutput?.detailHtml && <DetailPanel><PanelHeading><h2>적용할 AI 상세페이지</h2></PanelHeading><StackBody><StudioDetailPreview html={studioOutput.detailHtml} imageUrl={studioOutput.imageUrl} /><DetailHint>판매가·원산지·고시 정보는 실제 상품에 맞게 직접 입력해 주세요. 등록 시 상세 이미지를 네이버에 저장합니다.</DetailHint></StackBody></DetailPanel>}
    <NaverProductCreationForm values={values} images={images} options={options.data} notices={notices.data?.types ?? []} noticesLoading={notices.loading} noticesError={notices.error}
      errors={errors} onChange={change} onImages={(next) => { if (!importing) { setImages(next); setErrors({}) } }} onNoticesReload={notices.reload} />
    {Object.keys(errors).length > 0 && <DetailAlert role="alert">필수 항목과 입력 내용을 확인해 주세요. 오류가 있는 첫 번째 항목으로 이동했습니다.</DetailAlert>}
    <Actions><DetailPrimaryButton type="submit" disabled={notices.loading || importing}>등록 내용 확인</DetailPrimaryButton><BackLink to={backPath}>취소</BackLink><DetailSecondaryButton type="button" disabled={importing} onClick={options.reload}>등록 정보 다시 불러오기</DetailSecondaryButton></Actions>
  </Form>
}

function ProductReview({ review, store, options }: { review: Review; store: NaverStore; options: NaverProductCreationOptions }) {
  const { request } = review
  const address = (id: string) => { const item = options.addresses.find((value) => value.id === id); return item ? `${item.name} · ${item.address}` : '' }
  const money = (value: number) => `${value.toLocaleString('ko-KR')}원`
  const rows = [
    ['스마트스토어', store.name], ['상품명', request.name], ['카테고리', options.categories.find((item) => item.id === request.categoryId)?.name],
    ['판매가 / 재고', `${money(request.salePrice)} / ${request.stockQuantity.toLocaleString('ko-KR')}개`],
    ['과세 / 미성년자', `${request.taxType === 'TAX' ? '과세' : request.taxType === 'DUTYFREE' ? '면세' : '영세'} / ${request.minorPurchasable ? '구매 가능' : '구매 불가'}`],
    ['원산지', options.origins.find((item) => item.code === request.originAreaCode)?.name], ...(request.originAreaContent ? [['원산지 상세', request.originAreaContent]] : []), ...(request.importer ? [['수입자', request.importer]] : []),
    ['상세 설명', request.detailContent], ['A/S 전화번호', request.afterServiceTelephoneNumber], ['A/S 안내', request.afterServiceGuideContent],
    ['택배사', options.deliveryCompanies.find((item) => item.code === request.deliveryCompany)?.name],
    ['배송비', request.deliveryFeeType === 'FREE' ? '무료' : `${money(request.deliveryFee)}${request.deliveryFeeType === 'CONDITIONAL_FREE' ? ` · ${money(request.freeConditionalAmount!)} 이상 무료` : ''}`],
    ['출고지', address(request.shippingAddressId)], ['반품·교환지', address(request.returnAddressId)], ['반품 / 교환 배송비', `${money(request.returnDeliveryFee)} / ${money(request.exchangeDeliveryFee)}`],
    ['고시 유형', review.notice.name], ...review.notice.fields.filter((field) => request.noticeFields[field.key] !== undefined).map((field) => {
      const value = request.noticeFields[field.key]
      return [field.label, typeof value === 'boolean' ? value ? '예' : '아니오' : field.options.find((option) => option.value === String(value))?.label ?? String(value)]
    }),
  ]
  return <><ReviewImages>{review.images.map((file, index) => <div key={index}><NaverProductImagePreview file={file} alt={`${index === 0 ? '대표' : '추가'} 상품 이미지`} /><small>{index === 0 ? '대표 이미지' : `추가 ${index}`}</small></div>)}</ReviewImages>{review.studio?.detailHtml && <StudioDetailPreview html={review.studio.detailHtml} imageUrl={review.studio.imageUrl} />}<ReviewList>{rows.map(([label, value], index) => <div key={`${label}:${index}`}><dt>{label}</dt><dd>{value}</dd></div>)}</ReviewList></>
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <DetailPanel><DetailEmpty><DetailAlert role="alert">{message}</DetailAlert><DetailSecondaryButton type="button" onClick={retry}>다시 불러오기</DetailSecondaryButton></DetailEmpty></DetailPanel>
}

function publicProductUrl(storeUrl: string | null, productId: string | null): string | null {
  if (!storeUrl || !productId || !/^\d+$/.test(productId)) return null
  try { const url = new URL(storeUrl); return url.protocol === 'https:' && url.hostname === 'smartstore.naver.com' && !url.username && !url.password ? `${url.origin}${url.pathname.replace(/\/$/, '')}/products/${productId}` : null } catch { return null }
}

function useRead<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0)
  const identity = useMemo(() => ({ key, revision }), [key, revision])
  const [result, setResult] = useState<{ identity: typeof identity; data: T | null; error: string } | null>(null)
  useEffect(() => {
    if (identity.key === null) return
    const controller = new AbortController()
    load(controller.signal).then((data) => { if (!controller.signal.aborted) setResult({ identity, data, error: '' }) })
      .catch((error: unknown) => { if (!controller.signal.aborted) setResult({ identity, data: null, error: error instanceof ApiError ? error.message : '등록 정보를 불러오지 못했습니다. 다시 시도해 주세요.' }) })
    return () => controller.abort()
  }, [identity, load])
  const current = result?.identity === identity && key !== null ? result : null
  return { data: current?.data ?? null, error: current?.error ?? '', loading: key !== null && !current, reload: useCallback(() => setRevision((value) => value + 1), []) }
}

const Form = styled.form`display: grid; gap: 24px; min-width: 0;`
const ReviewImages = styled.div`display: flex; gap: 12px; flex-wrap: wrap; > div { width: 100px; max-width: 100%; } small { display: block; margin-top: 7px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; text-align: center; }`
