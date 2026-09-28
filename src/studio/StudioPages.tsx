import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { readSupportSession } from '../support/session'
import type { PlatformConnectionResponse } from '../types/platform'
import type { NaverStore } from '../types/naverStore'
import { createStudioGeneration, downloadStudioImage, StudioGenerationError, studioPath, uploadStudioProductImage } from './api'
import { StudioBack, StudioEmpty, StudioFrame, StudioImage, StudioNotice, StudioPagination, StudioResourceState } from './StudioUI'
import { studioKindLabel, type StudioCapabilities, type StudioCategory, type StudioKind, type StudioOutput, type StudioPage, type StudioTemplate } from './types'
import { useStudioResource } from './useStudioResource'
import { safeStudioImageUrl, studioPreviewHtml } from './preview'

export default function StudioPages() {
  const { workspaceId = '' } = useParams()
  if (readSupportSession()) return <StudioNotice>AI 스튜디오는 회원으로 직접 로그인한 상태에서 사용할 수 있습니다.</StudioNotice>
  return <Routes key={workspaceId}>
    <Route index element={<TemplateGallery workspaceId={workspaceId} />} />
    <Route path="templates/:templateId" element={<TemplateDetail workspaceId={workspaceId} />} />
    <Route path="outputs" element={<OutputGallery workspaceId={workspaceId} />} />
    <Route path="outputs/:outputId" element={<OutputDetail workspaceId={workspaceId} />} />
    <Route path="*" element={<StudioEmpty title="페이지를 찾을 수 없습니다" description="템플릿을 선택하고 새로운 소재를 만들어 보세요."><StudioBack workspaceId={workspaceId} /></StudioEmpty>} />
  </Routes>
}

type KindFilter = StudioKind | ''
function KindButtons({ value, change }: { value: KindFilter; change: (kind: KindFilter) => void }) {
  return <div className="studio-filter" aria-label="소재 유형"><button aria-pressed={value === ''} onClick={() => change('')}>전체</button>{(['AD_IMAGE', 'DETAIL_PAGE'] as const).map(kind => <button key={kind} aria-pressed={value === kind} onClick={() => change(kind)}>{studioKindLabel[kind]}</button>)}</div>
}
function query(page: number, kind: KindFilter, q = '', categoryId = '') {
  const params = new URLSearchParams({ page: String(page), size: '12' })
  if (kind) params.set('kind', kind)
  if (q) params.set('q', q)
  if (categoryId) params.set('categoryId', categoryId)
  return params.toString()
}
function templateImage(template: StudioTemplate) { return template.imageUrl ?? template.previewImageUrl }
function dateLabel(date: string) { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('ko-KR') }

function TemplateGallery({ workspaceId }: { workspaceId: string }) {
  const [filter, setFilter] = useState({ kind: '' as KindFilter, q: '', categoryId: '', page: 0 })
  const templates = useStudioResource<StudioPage<StudioTemplate>>(`${studioPath(workspaceId)}/templates?${query(filter.page, filter.kind, filter.q, filter.categoryId)}`)
  const capabilities = useStudioResource<StudioCapabilities>(`${studioPath(workspaceId)}/capabilities`)
  const categories = useStudioResource<StudioCategory[]>(`${studioPath(workspaceId)}/categories`)
  return <StudioFrame workspaceId={workspaceId} title="AI 스튜디오" description="샘플의 스타일을 선택하고, 우리 상품에 맞는 광고 이미지와 상세페이지를 만들어 보세요.">
    <section className="studio-welcome"><div><span className="studio-badge">IDEA → CREATIVE</span><h2>상품의 매력을,<br />새로운 이미지로.</h2><p>생성한 결과는 Meta 광고와 네이버 스마트스토어 등록 화면에서 이어서 사용할 수 있습니다.</p></div><ol><li><span>01</span>스타일 선택</li><li><span>02</span>상품 정보 입력</li><li><span>03</span>결과 확인 및 사용</li></ol></section>
    {capabilities.data && !capabilities.data.enabled && <StudioNotice>{capabilities.data.disabledReason || 'AI 생성 서비스를 준비 중입니다. 템플릿을 먼저 둘러보세요.'}</StudioNotice>}
    <div className="studio-toolbar"><KindButtons value={filter.kind} change={kind => setFilter(current => ({ ...current, kind, page: 0 }))} /><label className="studio-field studio-category-filter"><span className="studio-sr-only">카테고리 필터</span><select aria-label="카테고리 필터" value={filter.categoryId} disabled={categories.loading || Boolean(categories.error)} onChange={event => setFilter(current => ({ ...current, categoryId: event.target.value, page: 0 }))}><option value="">전체 카테고리</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><form role="search" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setFilter(current => ({ ...current, q: String(data.get('q') || '').trim(), page: 0 })) }}><input aria-label="템플릿 검색" name="q" maxLength={100} placeholder="템플릿 이름, 스타일 검색" /><button className="studio-button studio-secondary">검색</button></form></div>
    {categories.error && <StudioNotice error>{categories.error}<button className="studio-button studio-secondary" onClick={categories.reload}>카테고리 다시 조회</button></StudioNotice>}<StudioResourceState {...templates} />
    {templates.data && (templates.data.items.length ? <><p className="studio-count">{templates.data.totalElements.toLocaleString('ko-KR')}개의 템플릿</p><div className="studio-grid">{templates.data.items.map(template => <article className="studio-tile" key={template.id}><StudioImage src={templateImage(template)} title={template.title} kind={template.kind} /><div className="studio-tile-copy"><div className="studio-meta"><span className="studio-badge">{studioKindLabel[template.kind]}</span>{template.categoryName && <span>{template.categoryName}</span>}</div><h2>{template.title}</h2><p>{template.description || '상품 정보를 입력해 이 스타일로 만들어 보세요.'}</p><Link className="studio-button studio-secondary" to={`templates/${template.id}`}>이 스타일로 만들기 <span aria-hidden="true">↗</span></Link></div></article>)}</div><StudioPagination data={templates.data} onChange={page => setFilter(current => ({ ...current, page }))} /></> : <StudioEmpty title={filter.q || filter.kind || filter.categoryId ? '검색 결과가 없습니다' : '템플릿을 준비하고 있습니다'} description={filter.q || filter.kind || filter.categoryId ? '다른 검색어나 소재 유형으로 다시 찾아보세요.' : '운영자가 샘플을 공개하면 이곳에서 상품에 맞는 스타일을 선택할 수 있습니다.'} />)}
  </StudioFrame>
}

function TemplateDetail({ workspaceId }: { workspaceId: string }) {
  const { templateId = '' } = useParams()
  const template = useStudioResource<StudioTemplate>(`${studioPath(workspaceId)}/templates/${templateId}`)
  return <StudioFrame workspaceId={workspaceId} title="상품에 맞게 만들기" description="상품의 특징과 원하는 분위기를 알려주세요. 선택한 스타일로 새로운 소재를 만듭니다."><StudioBack workspaceId={workspaceId} /><StudioResourceState {...template} />{template.data && <GenerationForm key={`${workspaceId}:${templateId}`} workspaceId={workspaceId} template={template.data} />}</StudioFrame>
}

function GenerationForm({ workspaceId, template }: { workspaceId: string; template: StudioTemplate }) {
  const navigate = useNavigate()
  const capabilities = useStudioResource<StudioCapabilities>(`${studioPath(workspaceId)}/capabilities`)
  const [values, setValues] = useState({ productName: '', productDescription: '', audience: '', instructions: '' })
  const [busy, setBusy] = useState(false)
  const [productImage, setProductImage] = useState<{ imageKey: string; imageUrl: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const uploadPending = useRef(false)
  const [failure, setFailure] = useState<{ message: string; unknown: boolean } | null>(null)
  const pending = useRef(false)
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!busy) return
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventExit)
    return () => window.removeEventListener('beforeunload', preventExit)
  }, [busy])
  async function upload(file: File) {
    if (pending.current || uploadPending.current) return
    if (!['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) { setUploadError('JPG 또는 PNG 이미지를 10MB 이하로 선택해 주세요.'); return }
    uploadPending.current = true; setUploading(true); setUploadError('')
    try {
      const image = await uploadStudioProductImage(workspaceId, file)
      if (active.current) setProductImage(image)
    } catch (error) { if (active.current) setUploadError(error instanceof Error ? error.message : '상품 사진을 업로드하지 못했습니다.') }
    finally { uploadPending.current = false; if (active.current) setUploading(false) }
  }
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || uploadPending.current || !capabilities.data?.enabled || failure?.unknown || !values.productName.trim() || !values.productDescription.trim()) return
    pending.current = true
    setBusy(true); setFailure(null)
    try {
      const output = await createStudioGeneration(workspaceId, { templateId: template.id, productName: values.productName.trim(), productDescription: values.productDescription.trim(), audience: values.audience.trim(), instructions: values.instructions.trim(), ...(productImage ? { productImageKey: productImage.imageKey } : {}), idempotencyKey: crypto.randomUUID() })
      if (active.current) navigate(`/workspaces/${workspaceId}/studio/outputs/${output.id}`)
    } catch (error) {
      if (active.current) setFailure({ message: error instanceof Error ? error.message : '생성하지 못했습니다.', unknown: error instanceof StudioGenerationError && error.outcomeUnknown })
    } finally { pending.current = false; if (active.current) setBusy(false) }
  }
  return <div className="studio-split"><section className="studio-panel"><h2>우리 상품 소개</h2><StudioResourceState {...capabilities} />{capabilities.data && !capabilities.data.enabled && <StudioNotice>{capabilities.data.disabledReason || 'AI 생성 서비스를 준비 중입니다. 잠시 후 다시 확인해 주세요.'}</StudioNotice>}
    <form className="studio-form" onSubmit={generate}><fieldset disabled={busy || uploading || Boolean(failure?.unknown)}>
      <label className="studio-field"><span>상품명 <em>*</em></span><input name="productName" required maxLength={150} value={values.productName} onChange={event => setValues(current => ({ ...current, productName: event.target.value }))} placeholder="예: 데일리 보습 핸드크림" /></label>
      <div className="studio-upload"><label className="studio-field"><span>실제 상품 사진 <small>선택</small></span><input aria-label="상품 사진" type="file" accept="image/jpeg,image/png" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} /><small>상품 외형을 참고할 수 있도록 실제 사진을 올려주세요. JPG, PNG · 최대 10MB</small></label>{productImage && <><img src={safeStudioImageUrl(productImage.imageUrl)} alt="참고할 상품 사진" referrerPolicy="no-referrer" /><button type="button" className="studio-button studio-secondary" onClick={() => setProductImage(null)}>사진 제거</button></>}{uploading && <p role="status">상품 사진을 업로드하고 있습니다.</p>}{uploadError && <StudioNotice error>{uploadError}</StudioNotice>}</div>
      <label className="studio-field"><span>상품 설명 <em>*</em></span><textarea name="productDescription" required maxLength={3000} rows={5} value={values.productDescription} onChange={event => setValues(current => ({ ...current, productDescription: event.target.value }))} placeholder="소재, 크기, 색상, 핵심 장점 등 실제 상품 정보를 입력하세요." /><small>확인된 정보만 입력해 주세요. 상세페이지의 문구에도 사용됩니다.</small></label>
      <label className="studio-field"><span>주요 고객 <small>선택</small></span><input name="audience" maxLength={500} value={values.audience} onChange={event => setValues(current => ({ ...current, audience: event.target.value }))} placeholder="예: 간편한 일상 관리를 원하는 직장인" /></label>
      <label className="studio-field"><span>추가 요청 <small>선택</small></span><textarea name="instructions" maxLength={1000} rows={3} value={values.instructions} onChange={event => setValues(current => ({ ...current, instructions: event.target.value }))} placeholder="원하는 색상, 분위기, 강조할 특징을 알려주세요." /></label>
    </fieldset>{failure && <StudioNotice error>{failure.message}{failure.unknown && <Link className="studio-button studio-secondary" to={`/workspaces/${workspaceId}/studio/outputs`}>내 결과 확인</Link>}</StudioNotice>}
      {busy && <StudioNotice>AI가 소재를 만들고 있습니다. 몇 분 정도 걸릴 수 있습니다. 이 화면에서 결과를 기다려 주세요.</StudioNotice>}
      <button className="studio-button" disabled={busy || uploading || !capabilities.data?.enabled || Boolean(failure?.unknown) || !values.productName.trim() || !values.productDescription.trim()}>{busy ? '생성 중…' : `${studioKindLabel[template.kind]} 생성`}</button>
      <p className="studio-note">상품 정보·사진과 샘플 스타일이 OpenAI로 전달됩니다. 이미지·문구와 상품 정보를 확인한 후 등록하세요.</p>
    </form></section><aside className="studio-panel studio-summary"><StudioImage src={templateImage(template)} title={template.title} kind={template.kind} /><div className="studio-meta"><span className="studio-badge">{studioKindLabel[template.kind]}</span><span>{template.categoryName}</span></div><h2>{template.title}</h2><p>{template.description}</p><div className="studio-step"><span>1</span><div><strong>상품 정보에 맞춰 생성</strong><p>선택한 스타일을 참고해 새로운 결과를 만듭니다.</p></div></div><div className="studio-step"><span>2</span><div><strong>확인 후 채널에서 사용</strong><p>Meta 광고 또는 스마트스토어 등록 화면으로 이어서 이동할 수 있습니다.</p></div></div></aside></div>
}

function OutputGallery({ workspaceId }: { workspaceId: string }) {
  const [filter, setFilter] = useState({ kind: '' as KindFilter, page: 0 })
  const outputs = useStudioResource<StudioPage<StudioOutput>>(`${studioPath(workspaceId)}/outputs?${query(filter.page, filter.kind)}`)
  return <StudioFrame workspaceId={workspaceId} title="내 생성 결과" description="워크스페이스에서 만든 소재를 모아 보고, 광고와 상품 등록에 활용하세요." action={<button className="studio-button studio-secondary" disabled={outputs.loading} onClick={outputs.reload}>목록 새로고침</button>}>
    <div className="studio-toolbar"><KindButtons value={filter.kind} change={kind => setFilter({ kind, page: 0 })} /></div><StudioResourceState {...outputs} />
    {outputs.data && (outputs.data.items.length ? <><div className="studio-grid">{outputs.data.items.map(output => <article className="studio-tile" key={output.id}><StudioImage src={output.imageUrl} title={output.title} kind={output.kind} /><div className="studio-tile-copy"><div className="studio-meta"><span className="studio-badge">{studioKindLabel[output.kind]}</span><OutputStatus output={output} /></div><h2>{output.title}</h2><p>{dateLabel(output.createdAt)}</p><Link className="studio-button studio-secondary" to={`${output.id}`}>{output.status === 'SUCCEEDED' ? '결과 보기 및 사용' : '상태 확인'}</Link></div></article>)}</div><StudioPagination data={outputs.data} onChange={page => setFilter(current => ({ ...current, page }))} /></> : <StudioEmpty title="아직 생성한 결과가 없습니다" description="원하는 샘플을 선택하고 첫 광고 이미지나 상세페이지를 만들어 보세요."><Link className="studio-button" to={`/workspaces/${workspaceId}/studio`}>템플릿 둘러보기</Link></StudioEmpty>)}
  </StudioFrame>
}
function OutputStatus({ output }: { output: StudioOutput }) {
  return <span className={`studio-badge${output.status === 'SUCCEEDED' ? ' studio-published' : output.status === 'FAILED' ? ' studio-failed' : ''}`}>{output.status === 'SUCCEEDED' ? '생성 완료' : output.status === 'FAILED' ? '생성 실패' : '생성 중'}</span>
}

function OutputDetail({ workspaceId }: { workspaceId: string }) {
  const { outputId = '' } = useParams()
  const output = useStudioResource<StudioOutput>(`${studioPath(workspaceId)}/outputs/${outputId}`)
  return <StudioFrame workspaceId={workspaceId} title="생성 결과" description="이미지와 내용을 확인하고 연결된 광고 계정이나 스토어에서 사용하세요." action={<button className="studio-button studio-secondary" disabled={output.loading} onClick={output.reload}>상태 새로고침</button>}><Link className="studio-back" to={`/workspaces/${workspaceId}/studio/outputs`}>← 내 결과로 돌아가기</Link><StudioResourceState {...output} />{output.data && <OutputContent key={`${workspaceId}:${outputId}`} workspaceId={workspaceId} output={output.data} />}</StudioFrame>
}
function OutputContent({ workspaceId, output }: { workspaceId: string; output: StudioOutput }) {
  const [download, setDownload] = useState(false)
  const [error, setError] = useState('')
  const downloading = useRef(false)
  const ready = output.status === 'SUCCEEDED'
  async function saveImage() {
    if (downloading.current || !ready) return
    downloading.current = true; setDownload(true); setError('')
    try {
      const file = await downloadStudioImage(workspaceId, output.id)
      const url = URL.createObjectURL(file)
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (caught) { setError(caught instanceof Error ? caught.message : '이미지를 다운로드하지 못했습니다.') }
    finally { downloading.current = false; setDownload(false) }
  }
  return <><div className="studio-output-heading"><div><div className="studio-meta"><span className="studio-badge">{studioKindLabel[output.kind]}</span><OutputStatus output={output} /><span>{dateLabel(output.createdAt)}</span></div><h2>{output.title}</h2></div>{ready && <button className="studio-button studio-secondary" onClick={saveImage} disabled={download}>{download ? '다운로드 중…' : '이미지 다운로드'}</button>}</div>
    {error && <StudioNotice error>{error}</StudioNotice>}
    {output.status === 'PENDING' ? <StudioEmpty title="소재를 생성하고 있습니다" description="생성이 끝나면 이곳에서 확인할 수 있습니다. 잠시 후 상태를 새로고침해 주세요." /> : output.status === 'FAILED' ? <StudioNotice error>{output.failureMessage || '소재를 생성하지 못했습니다. 상품 정보를 확인하고 다시 만들어 주세요.'}<Link className="studio-button studio-secondary" to={`/workspaces/${workspaceId}/studio/templates/${output.templateId}`}>다시 만들기</Link></StudioNotice> : ready && <div className="studio-split"><section className="studio-panel">{output.kind === 'DETAIL_PAGE' && output.detailHtml ? <iframe title="생성된 상세페이지 미리보기" className="studio-preview" sandbox="" srcDoc={studioPreviewHtml(output.detailHtml, output.imageUrl)} /> : <img className="studio-output-image" src={safeStudioImageUrl(output.imageUrl)} alt={output.title} referrerPolicy="no-referrer" />}<p className="studio-note">등록 전에 이미지, 상품 정보, 광고 문구를 확인해 주세요.</p></section><OutputDestination workspaceId={workspaceId} output={output} /></div>}
  </>
}
function OutputDestination({ workspaceId, output }: { workspaceId: string; output: StudioOutput }) {
  const connections = useStudioResource<PlatformConnectionResponse[]>(`/api/workspaces/${workspaceId}/connections`)
  const stores = useStudioResource<NaverStore[]>(`/api/workspaces/${workspaceId}/naver/stores`)
  const [selectedMeta, setSelectedMeta] = useState('')
  const [selectedNaver, setSelectedNaver] = useState('')
  const accounts = (connections.data || []).filter(connection => connection.providerType === 'META').flatMap(connection => connection.assets.filter(asset => asset.platformType === 'FACEBOOK' && asset.assetType === 'AD_ACCOUNT').map(asset => ({ ...asset, requiresReauth: connection.requiresReauth })))
  const uniqueAccounts = [...new Map(accounts.map(account => [account.id, account])).values()]
  const availableAccounts = uniqueAccounts.filter(account => !account.requiresReauth)
  const availableStores = (stores.data || []).filter(store => !store.requiresReauth)
  const metaId = selectedMeta || String(availableAccounts[0]?.id || '')
  const naverId = selectedNaver || String(availableStores[0]?.assetId || '')
  const metaValid = availableAccounts.some(account => String(account.id) === metaId)
  const naverValid = availableStores.some(store => String(store.assetId) === naverId)
  return <aside className="studio-panel"><h2>어디에 사용할까요?</h2><p>등록 화면에서 생성 결과를 가져온 후 나머지 설정을 입력하세요.</p><section className="studio-destination"><div className="studio-channel"><span className="studio-meta-mark">∞</span><strong>Meta 광고</strong></div><StudioResourceState {...connections} />{connections.data && (uniqueAccounts.length ? <><label className="studio-field"><span>광고 계정</span><select aria-label="Meta 광고 계정" value={metaId} onChange={event => setSelectedMeta(event.target.value)}>{!metaValid && <option value="">계정을 선택하세요</option>}{uniqueAccounts.map(account => <option key={account.id} value={account.id} disabled={account.requiresReauth}>{account.name || account.externalId}{account.requiresReauth ? ' · 재연결 필요' : ''}</option>)}</select></label>{metaValid ? <Link className="studio-button studio-secondary" to={`/workspaces/${workspaceId}/meta/ads/new?assetId=${metaId}&studioOutputId=${output.id}`}>광고 이미지로 사용</Link> : <Link to={`/workspaces/${workspaceId}/connections/meta/assets`}>Meta 자산 편집</Link>}<p className="studio-note">{output.kind === 'DETAIL_PAGE' ? '상세페이지의 대표 이미지를 광고 소재로 가져옵니다.' : '생성한 이미지를 광고 소재로 가져옵니다.'}</p></> : <p>저장된 광고 계정이 없습니다. <Link to={`/workspaces/${workspaceId}/connections/meta/assets`}>Meta 연결</Link></p>)}</section>
    <section className="studio-destination"><div className="studio-channel"><span className="studio-naver-mark">N</span><strong>네이버 스마트스토어</strong></div><StudioResourceState {...stores} />{stores.data && (stores.data.length ? <><label className="studio-field"><span>스마트스토어</span><select aria-label="스마트스토어" value={naverId} onChange={event => setSelectedNaver(event.target.value)}>{!naverValid && <option value="">스토어를 선택하세요</option>}{stores.data.map(store => <option key={store.assetId} value={store.assetId} disabled={store.requiresReauth}>{store.name || store.channelNo}{store.requiresReauth ? ' · 재연결 필요' : ''}</option>)}</select></label>{naverValid ? <Link className="studio-button studio-secondary" to={`/workspaces/${workspaceId}/naver/products/new?assetId=${naverId}&studioOutputId=${output.id}`}>상품 등록에 사용</Link> : <Link to={`/workspaces/${workspaceId}/connections/naver/assets`}>네이버 자산 편집</Link>}<p className="studio-note">{output.kind === 'DETAIL_PAGE' ? '이미지와 상세페이지 내용을 함께 가져옵니다.' : '생성한 이미지를 상품 이미지로 가져옵니다.'}</p></> : <p>저장된 스토어가 없습니다. <Link to={`/workspaces/${workspaceId}/connections/naver/assets`}>스마트스토어 연결</Link></p>)}</section>
  </aside>
}
