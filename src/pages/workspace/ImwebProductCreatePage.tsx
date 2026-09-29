import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { createImwebProduct, getImwebProductOptions, ImwebWriteError, listImwebStores } from '../../api/imweb'
import { useImwebResource } from '../../hooks/useImwebResource'
import { readSupportSession } from '../../support/session'
import type { ImwebProductRequest, ImwebProductResult, ImwebStore } from '../../types/imweb'
import StudioImportPanel, { type StudioImportOutput } from '../../components/studio/StudioImportPanel'
import { useModal } from '../../components/common/useModal'
import RegistrationReview from './RegistrationReview'
import StudioDetailPreview from '../../components/studio/StudioDetailPreview'
import { NaverProductImagePreview } from './NaverProductImages'
import { Actions, BackLink, CheckLabel, ExternalLink, Field, FieldGrid, Input, Label, ProductField, ReviewList, Select, StackBody, Textarea } from './NaverProductFormUI'
import { DetailActionLink, DetailAlert, DetailBadge, DetailEmpty, DetailEyebrow, DetailHeader, DetailHint, DetailLead, DetailPage, DetailPanel, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, DetailTitle, PanelHeading } from './WorkspaceDetailUI'

export default function ImwebProductCreatePage() {
  const { workspaceId } = useParams()
  if (readSupportSession()) return <DetailAlert role="alert">아임웹 상품 등록은 일반 사용자 계정에서 이용해 주세요.</DetailAlert>
  return <CreatePage key={workspaceId} workspaceId={Number(workspaceId)} />
}
function CreatePage({ workspaceId }: { workspaceId: number }) {
  const [params, setParams] = useSearchParams()
  const [locked, setLocked] = useState(false)
  const load = useCallback((signal: AbortSignal) => listImwebStores(workspaceId, signal), [workspaceId])
  const inventory = useImwebResource(String(workspaceId), load)
  const stores = inventory.data ?? []
  const selected = params.has('assetId') ? stores.find(item => String(item.assetId) === params.get('assetId')) : stores[0]
  const assets = `/workspaces/${workspaceId}/connections/imweb/assets`
  const back = `/workspaces/${workspaceId}/imweb/performance${selected ? `?assetId=${selected.assetId}` : ''}`
  return <DetailPage>
    <DetailHeader><div><DetailEyebrow>아임웹 / 상품</DetailEyebrow><DetailTitle>아임웹 상품 등록</DetailTitle><DetailLead>상품 정보와 이미지를 확인한 뒤 선택한 스토어에 등록하세요.</DetailLead></div>{!locked && <BackLink to={back}>상품 및 판매 성과</BackLink>}</DetailHeader>
    {inventory.loading ? <DetailStatus role="status">저장된 아임웹 스토어 조회 중…</DetailStatus> : inventory.error ? <LoadError message={inventory.error} retry={inventory.reload} /> : !stores.length ? <DetailPanel><DetailEmpty><h2>먼저 아임웹 스토어를 저장해 주세요</h2><DetailActionLink to={assets}>아임웹 연결 및 스토어 선택</DetailActionLink></DetailEmpty></DetailPanel> : <>
      <DetailPanel><StackBody><Field><Label htmlFor="imweb-product-store">등록할 아임웹 스토어</Label><Select id="imweb-product-store" disabled={locked} value={selected?.assetId ?? ''} onChange={event => setParams(current => { const next = new URLSearchParams(current); next.set('assetId', event.target.value); return next }, { replace: true })}>
        {!selected && <option value="">저장된 스토어 선택</option>}{stores.map(item => <option key={item.assetId} value={item.assetId}>{item.name} · {item.currency}{item.requiresReauth ? ' · 재연결 필요' : ''}</option>)}
      </Select><DetailHint>스토어를 변경하면 입력한 상품 정보와 이미지 선택이 초기화됩니다.</DetailHint></Field></StackBody></DetailPanel>
      {!selected ? <DetailAlert role="alert">저장된 아임웹 스토어를 선택해 주세요.</DetailAlert> : selected.requiresReauth ? <DetailPanel><DetailEmpty><h2>아임웹 재연결이 필요합니다</h2><DetailActionLink to={assets}>자산 편집에서 재연결</DetailActionLink></DetailEmpty></DetailPanel> : <StoreCreation key={`${workspaceId}:${selected.assetId}`} workspaceId={workspaceId} store={selected} back={back} onLock={setLocked} />}
    </>}
  </DetailPage>
}
type Values = { name: string; categoryCode: string; salePrice: string; originalPrice: string; stockQuantity: string; detailContent: string }
type Review = { request: ImwebProductRequest; files: File[]; studio: StudioImportOutput | null; categoryName: string }
function StoreCreation({ workspaceId, store, back, onLock }: { workspaceId: number; store: ImwebStore; back: string; onLock: (value: boolean) => void }) {
  const modal = useModal()
  const [params] = useSearchParams()
  const outputId = params.get('studioOutputId') || ''
  const [studio, setStudio] = useState<StudioImportOutput | null>(null)
  const [values, setValues] = useState<Values>({ name: '', categoryCode: '', salePrice: '', originalPrice: '', stockQuantity: '', detailContent: '' })
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ message: string; unknown: boolean } | null>(null)
  const [confirmedAbsent, setConfirmedAbsent] = useState(false)
  const [result, setResult] = useState<ImwebProductResult | null>(null)
  const pending = useRef(false)
  const active = useRef(true)
  const heading = useRef<HTMLHeadingElement>(null)
  const load = useCallback(async (signal: AbortSignal) => {
    const value = await getImwebProductOptions(workspaceId, store.assetId, signal)
    if (value.unitCode !== store.unitCode || value.currency !== store.currency) throw new Error('선택한 스토어의 상품 등록 정보가 아닙니다. 다시 조회해 주세요.')
    return value
  }, [workspaceId, store.assetId, store.unitCode, store.currency])
  const options = useImwebResource(`${workspaceId}:${store.assetId}`, load)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!busy) return
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventExit)
    return () => window.removeEventListener('beforeunload', preventExit)
  }, [busy])
  function change(patch: Partial<Values>) { if (!pending.current && !review && !result) { setValues(current => ({ ...current, ...patch })); setError('') } }
  async function applyStudio(output: StudioImportOutput, signal: AbortSignal) {
    if (signal.aborted || pending.current || review || result) return
    if (output.kind !== 'DETAIL_PAGE' || output.status !== 'SUCCEEDED' || !output.detailHtml) throw new Error('생성이 완료된 상세페이지를 선택해 주세요.')
    if (files.length >= 10) throw new Error('AI 이미지와 함께 최대 10장을 사용할 수 있습니다. 업로드 이미지를 한 장 제거해 주세요.')
    setStudio(output); setValues(current => ({ ...current, name: current.name || output.title.slice(0, 100) })); setError('')
  }
  function addFiles(selected: File[]) {
    if (pending.current || review || result || !selected.length) return
    const next = [...files, ...selected]
    if (next.length + (studio ? 1 : 0) > 10) { setError('AI 이미지를 포함해 상품 이미지는 최대 10장입니다.'); return }
    if (next.some(file => !['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024)) { setError('10MiB 이하의 JPEG 또는 PNG 이미지를 선택해 주세요.'); return }
    if (next.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) { setError('이미지 전체 용량은 20MiB 이하여야 합니다.'); return }
    setFiles(next); setError('')
  }
  function prepare(event: FormEvent) {
    event.preventDefault()
    if (pending.current || review || result || !options.data || options.data.enabled === false) return
    const name = values.name.trim()
    const category = options.data.categories.find(item => item.code === values.categoryCode)
    const salePrice = Number(values.salePrice)
    const originalPrice = values.originalPrice ? Number(values.originalPrice) : salePrice
    const stockQuantity = Number(values.stockQuantity)
    const moneyValid = (value: string) => /^\d{1,12}(?:\.\d{1,2})?$/.test(value) && Number(value) > 0 && (store.currency !== 'KRW' || Number.isInteger(Number(value)))
    if (!name || name.length > 100) { setError('상품명을 1~100자로 입력해 주세요.'); return }
    if (!category) { setError('상품 카테고리를 선택해 주세요.'); return }
    if (!moneyValid(values.salePrice) || (values.originalPrice && !moneyValid(values.originalPrice)) || originalPrice < salePrice) { setError('판매가와 정상가는 정수부 12자리·소수점 이하 2자리 이내의 양수로 입력해 주세요. 정상가는 판매가 이상이며 KRW는 정수 금액을 사용합니다.'); return }
    if (!values.stockQuantity || !Number.isSafeInteger(stockQuantity) || stockQuantity < 1 || stockQuantity > 999999999) { setError('재고를 1~999,999,999 사이의 정수로 입력해 주세요.'); return }
    if (!studio && !values.detailContent.trim()) { setError('상품 상세 설명을 입력하거나 AI 상세페이지를 적용해 주세요.'); return }
    if (!studio && !files.length) { setError('상품 이미지를 선택하거나 AI 상세페이지를 적용해 주세요.'); return }
    setError(''); setFailure(null); setConfirmedAbsent(false)
    setReview({ request: { name, categoryCode: category.code, salePrice, originalPrice, stockQuantity, detailContent: studio ? '' : values.detailContent.trim(), ...(studio ? { studioOutputId: studio.id } : {}) }, files: [...files], studio, categoryName: category.name })
    onLock(true)
  }
  function edit() {
    if (pending.current || result || (failure?.unknown && !confirmedAbsent)) return
    setReview(null); setFailure(null); setConfirmedAbsent(false); onLock(false)
    requestAnimationFrame(() => document.getElementById('product-review-trigger')?.focus())
  }
  async function register() {
    if (!review || pending.current || failure || result) return
    pending.current = true; setBusy(true)
    try {
      const created = await createImwebProduct(workspaceId, store.assetId, review.request, review.files)
      if (active.current) {
        setResult(created); onLock(false)
        void modal[created.status === 'DETAIL_PENDING' ? 'info' : 'success']({
          title: created.status === 'DETAIL_PENDING' ? '생성된 상품을 확인해 주세요' : '상품 등록 완료',
          message: `${created.notice}\n상품 ID: ${created.productId}${created.status === 'DETAIL_PENDING' ? '\n새로 등록하지 말고 관리자에서 이 상품의 상태를 확인해 주세요.' : ''}`,
        })
      }
    }
    catch (caught) {
      if (active.current) {
        const failure = { message: caught instanceof Error ? caught.message : '상품 등록 결과를 확인하지 못했습니다.', unknown: caught instanceof ImwebWriteError ? caught.outcomeUnknown : true }
        setFailure(failure)
        void modal.error({ title: failure.unknown ? '등록 결과 확인 필요' : '상품 등록 실패', message: failure.message })
      }
    }
    finally { pending.current = false; if (active.current) { setBusy(false) } }
  }
  if (options.loading) return <DetailStatus role="status">상품 등록 정보 조회 중…</DetailStatus>
  if (options.error || !options.data) return <LoadError message={options.error || '상품 등록 정보를 불러오지 못했습니다.'} retry={options.reload} />
  if (options.data.enabled === false) return <DetailPanel><StackBody><DetailHint>{options.data.disabledReason || '이 사이트의 상품 등록은 현재 지원하지 않습니다. 아임웹 관리자에서 상품을 등록해 주세요.'}</DetailHint><ExternalLink href="https://imweb.me/" target="_blank" rel="noopener noreferrer">아임웹 열기 ↗</ExternalLink></StackBody></DetailPanel>
  if (result) return <DetailPanel><PanelHeading><h2 ref={heading} tabIndex={-1}>{result.status === 'DETAIL_PENDING' ? '상품이 생성되었습니다' : '상품 등록 완료'}</h2><DetailBadge $tone={result.status === 'DETAIL_PENDING' ? 'warning' : 'success'}>{result.status === 'DETAIL_PENDING' ? '등록 결과 확인 필요' : '등록 완료'}</DetailBadge></PanelHeading><StackBody>
    <DetailAlert $success={result.status === 'CREATED'} role="status">{result.notice}</DetailAlert><ReviewList><div><dt>스토어</dt><dd>{store.name}</dd></div><div><dt>상품명</dt><dd>{review?.request.name}</dd></div><div><dt>생성된 상품 ID</dt><dd>{result.productId}</dd></div>{result.productCode && <div><dt>상품 코드</dt><dd>{result.productCode}</dd></div>}</ReviewList>
    {result.status === 'DETAIL_PENDING' && <DetailHint>이미 상품이 생성되었습니다. 상품을 새로 등록하지 말고 아임웹 관리자에서 위 상품 ID의 이미지·상세 설명·판매 상태를 확인해 주세요.</DetailHint>}
    <Actions><DetailActionLink to={back}>상품 목록으로</DetailActionLink><ExternalLink href="https://imweb.me/" target="_blank" rel="noopener noreferrer">아임웹에서 상품 확인 ↗</ExternalLink></Actions>
  </StackBody></DetailPanel>
  if (review) return <RegistrationReview recovering={Boolean(failure)} description="아래 내용을 확인한 뒤 등록하면 아임웹에 상품이 생성됩니다." busy={busy} onClose={edit}>
    {failure && <><DetailAlert role="alert">{failure.message}</DetailAlert>{failure.unknown ? <><DetailHint>응답을 받지 못했어도 상품이 생성되었을 수 있습니다. 다시 등록하기 전에 아임웹 관리자에서 상품명과 등록 시각을 확인해 주세요.</DetailHint><ExternalLink href="https://imweb.me/" target="_blank" rel="noopener noreferrer">아임웹에서 생성 여부 확인 ↗</ExternalLink><CheckLabel><input type="checkbox" checked={confirmedAbsent} onChange={event => setConfirmedAbsent(event.target.checked)} />아임웹에서 이 상품이 생성되지 않은 것을 확인했습니다.</CheckLabel></> : <DetailHint>입력 내용과 권한을 확인한 뒤 수정해 주세요.</DetailHint>}</>}
    {review.studio?.detailHtml && <StudioDetailPreview html={review.studio.detailHtml} imageUrl={review.studio.imageUrl} />}
    {review.files.length > 0 && <ImageGrid>{review.files.map((file, index) => <div key={`${file.name}:${index}`}><NaverProductImagePreview file={file} alt={`상품 이미지 ${index + 1}`} /><DetailHint>{file.name}</DetailHint></div>)}</ImageGrid>}
    <ReviewList>{[['스토어', store.name], ['상품명', review.request.name], ['카테고리', review.categoryName], ['판매가', `${review.request.salePrice.toLocaleString('ko-KR')} ${store.currency}`], ['정상가', `${review.request.originalPrice.toLocaleString('ko-KR')} ${store.currency}`], ['재고', `${review.request.stockQuantity.toLocaleString('ko-KR')}개`], ['할인', '쿠폰·적립금·회원그룹 할인 사용 안 함'], ['배송', '사이트 배송 템플릿 사용'], ['판매 상태', '상세 설명 적용 후 판매 중으로 전환'], ['상세 설명', review.studio ? '저장된 AI 상세페이지와 이미지 사용' : review.request.detailContent]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</ReviewList>
    <DetailHint>상품과 이미지를 업로드하고 상세 설명을 적용한 뒤 판매 중으로 전환합니다. 생성 후 후속 처리가 완료되지 않으면 생성된 상품 ID를 안내합니다.</DetailHint>
    <Actions><DetailSecondaryButton disabled={busy || Boolean(failure?.unknown && !confirmedAbsent)} onClick={edit}>입력 내용 수정</DetailSecondaryButton><DetailPrimaryButton disabled={busy || Boolean(failure)} onClick={() => void register()}>{busy ? '상품 등록 중…' : '확인하고 아임웹에 등록'}</DetailPrimaryButton></Actions>
  </RegistrationReview>
  return <>
    {outputId && <StudioImportPanel key={outputId} workspaceId={workspaceId} outputId={outputId} expectedKind="DETAIL_PAGE" applied={studio?.id === Number(outputId)} onApply={applyStudio} />}
    <DetailPanel><PanelHeading><div><h2>상품 정보</h2><p>옵션 없는 기본 상품을 등록합니다. 복잡한 옵션은 아임웹 관리자에서 설정해 주세요.</p></div><DetailBadge>{store.currency}</DetailBadge></PanelHeading><StackBody><form onSubmit={prepare} style={{ display: 'grid', gap: 24 }}>
      <ProductField name="name" label="상품명"><Input id="product-name" required maxLength={100} value={values.name} onChange={event => change({ name: event.target.value })} /></ProductField>
      <ProductField name="category" label="카테고리"><Select id="product-category" required value={values.categoryCode} onChange={event => change({ categoryCode: event.target.value })}><option value="">카테고리 선택</option>{options.data.categories.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</Select>{options.data.categories.length === 0 && <DetailHint>아임웹에서 상품 카테고리를 만든 뒤 등록 정보를 다시 조회해 주세요.</DetailHint>}</ProductField>
      <FieldGrid><ProductField name="sale-price" label={`판매가 (${store.currency})`}><Input id="product-sale-price" type="number" required min={store.currency === 'KRW' ? 1 : 0.01} max={store.currency === 'KRW' ? 999999999999 : 999999999999.99} step={store.currency === 'KRW' ? 1 : 0.01} value={values.salePrice} onChange={event => change({ salePrice: event.target.value })} /></ProductField><ProductField name="original-price" label={`정상가 (${store.currency})`} optional><Input id="product-original-price" type="number" min={store.currency === 'KRW' ? 1 : 0.01} max={store.currency === 'KRW' ? 999999999999 : 999999999999.99} step={store.currency === 'KRW' ? 1 : 0.01} value={values.originalPrice} onChange={event => change({ originalPrice: event.target.value })} /><DetailHint>비워 두면 판매가와 같은 금액으로 등록합니다.</DetailHint></ProductField></FieldGrid>
      <ProductField name="stock" label="재고 수량"><Input id="product-stock" type="number" required min={1} max={999999999} step={1} value={values.stockQuantity} onChange={event => change({ stockQuantity: event.target.value })} /></ProductField>
      {studio ? <><DetailAlert $success>AI 상세페이지와 이미지를 적용했습니다. 등록 시 저장된 원본을 사용합니다.</DetailAlert><StudioDetailPreview html={studio.detailHtml!} imageUrl={studio.imageUrl} /><Actions><DetailSecondaryButton type="button" onClick={() => setStudio(null)}>AI 적용 해제</DetailSecondaryButton></Actions></> : <ProductField name="detail" label="상품 상세 설명"><Textarea id="product-detail" required maxLength={20000} value={values.detailContent} onChange={event => change({ detailContent: event.target.value })} placeholder="상품의 특징과 구성, 구매 전 확인할 사항을 입력해 주세요." /></ProductField>}
      <Field><Label htmlFor="imweb-product-images">{studio ? '추가 상품 이미지 (선택)' : '상품 이미지'}</Label><DetailHint>JPEG·PNG 각 10MiB 이하, AI 이미지를 포함해 최대 10장·전체 20MiB. {studio ? 'AI 이미지가 대표 이미지로 사용됩니다.' : '첫 번째 이미지가 대표 이미지로 사용됩니다.'}</DetailHint><Input id="imweb-product-images" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple disabled={files.length + (studio ? 1 : 0) >= 10} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = '' }} /></Field>
      {files.length > 0 && <ImageGrid>{files.map((file, index) => <div key={`${file.name}:${file.lastModified}:${index}`}><NaverProductImagePreview file={file} alt={`상품 이미지 ${index + 1}`} /><DetailHint>{file.name}</DetailHint><Actions>{!studio && index > 0 && <DetailSecondaryButton type="button" onClick={() => setFiles(current => [file, ...current.filter((_, i) => i !== index)])}>대표로 설정</DetailSecondaryButton>}<DetailSecondaryButton type="button" aria-label={`${file.name} 제거`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}>제거</DetailSecondaryButton></Actions></div>)}</ImageGrid>}
      {error && <DetailAlert role="alert">{error}</DetailAlert>}<Actions><DetailPrimaryButton id="product-review-trigger" disabled={!options.data.categories.length}>등록 내용 확인</DetailPrimaryButton><DetailSecondaryButton type="button" onClick={options.reload}>등록 정보 다시 조회</DetailSecondaryButton></Actions>
    </form></StackBody></DetailPanel>
  </>
}
function LoadError({ message, retry }: { message: string; retry: () => void }) { return <DetailPanel><StackBody><DetailAlert role="alert">{message}</DetailAlert><Actions><DetailSecondaryButton onClick={retry}>다시 조회</DetailSecondaryButton></Actions></StackBody></DetailPanel> }
const ImageGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; > div { display: grid; gap: 10px; min-width: 0; } button { min-height: 32px; padding: 6px 8px; font-size: 11px; }`
