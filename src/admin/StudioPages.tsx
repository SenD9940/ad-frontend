import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminWrite } from './api'
import { analyzeStudioTemplate, type StudioTemplateAnalysis } from './studioApi'
import { safeStudioImageUrl } from '../studio/preview'
import { useResource } from './useResource'
import { StudioEmpty, StudioImage, StudioNotice, StudioPagination, StudioResourceState } from '../studio/StudioUI'
import { studioKindLabel, type StudioKind, type StudioPage, type StudioTemplate, type StudioCategory } from '../studio/types'

const path = '/ai-studio/templates'
const categoryPath = '/ai-studio/categories'
type TemplateImage = { imageKey: string; imageUrl: string; expiresAt: string }

export function StudioTemplatesPage() {
  const [filter, setFilter] = useState({ q: '', kind: '', categoryId: '', page: 0 })
  const params = new URLSearchParams({ page: String(filter.page), size: '12' })
  if (filter.kind) params.set('kind', filter.kind)
  if (filter.q) params.set('q', filter.q)
  if (filter.categoryId) params.set('categoryId', filter.categoryId)
  const categories = useResource<StudioCategory[]>(categoryPath)
  const templates = useResource<StudioPage<StudioTemplate>>(`${path}?${params}`)
  return <div className="studio"><header className="studio-heading"><div><p className="studio-eyebrow">AI STUDIO / TEMPLATE LIBRARY</p><h1>AI 스튜디오</h1><p>광고 소재와 상품 상세페이지의 샘플 스타일을 등록하고 공개하세요.</p></div><div className="studio-actions"><Link className="studio-button studio-secondary" to="/admin/studio/categories">카테고리 관리</Link><Link className="studio-button" to="/admin/studio/new">+ 샘플 등록</Link></div></header>
    <div className="studio-toolbar"><div className="studio-filter" aria-label="샘플 유형">{[['', '전체'], ['AD_IMAGE', '광고 이미지'], ['DETAIL_PAGE', '상품 상세페이지']].map(([kind, label]) => <button key={kind} aria-pressed={filter.kind === kind} onClick={() => setFilter(current => ({ ...current, kind, page: 0 }))}>{label}</button>)}</div><label className="studio-field studio-category-filter"><span className="studio-sr-only">카테고리 필터</span><select aria-label="카테고리 필터" value={filter.categoryId} disabled={categories.loading || Boolean(categories.error)} onChange={event => setFilter(current => ({ ...current, categoryId: event.target.value, page: 0 }))}><option value="">전체 카테고리</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><form role="search" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); setFilter(current => ({ ...current, q: String(form.get('q') || '').trim(), page: 0 })) }}><input aria-label="샘플 검색" name="q" maxLength={100} placeholder="샘플 이름, 스타일 검색" /><button className="studio-button studio-secondary">검색</button></form></div>{categories.error && <StudioNotice error>{categories.error}<button className="studio-button studio-secondary" onClick={categories.reload}>카테고리 다시 조회</button></StudioNotice>}<StudioResourceState {...templates} />
    {templates.data && (templates.data.items.length ? <><p className="studio-count">총 {templates.data.totalElements.toLocaleString('ko-KR')}개 · 공개 상태는 각 샘플에서 변경할 수 있습니다.</p><div className="studio-grid">{templates.data.items.map(template => <article className="studio-tile" key={template.id}><StudioImage src={template.previewImageUrl ?? template.imageUrl} title={template.title} kind={template.kind} /><div className="studio-tile-copy"><div className="studio-meta"><span className="studio-badge">{studioKindLabel[template.kind]}</span><span className={`studio-badge${template.published ? ' studio-published' : ''}`}>{template.published ? '공개' : '비공개'}</span>{template.categoryName && <span>{template.categoryName}</span>}</div><h2>{template.title}</h2><p>{template.description || '등록된 설명이 없습니다.'}</p><Link className="studio-button studio-secondary" to={`/admin/studio/${template.id}`}>샘플 편집</Link></div></article>)}</div><StudioPagination data={templates.data} onChange={page => setFilter(current => ({ ...current, page }))} /></> : <StudioEmpty title={filter.q || filter.kind || filter.categoryId ? '검색 결과가 없습니다' : '첫 번째 샘플을 등록하세요'} description={filter.q || filter.kind || filter.categoryId ? '검색어나 유형을 바꾸어 다시 확인해 주세요.' : '광고 이미지와 상세페이지의 참고 스타일을 등록하면 고객이 AI로 콘텐츠를 만들 수 있습니다.'}><Link className="studio-button" to="/admin/studio/new">샘플 등록</Link></StudioEmpty>)}
  </div>
}
export function StudioTemplateEditPage() {
  const { id } = useParams()
  if (!id) return <TemplateForm key="new" />
  return <ExistingTemplate key={id} id={id} />
}
function ExistingTemplate({ id }: { id: string }) {
  const template = useResource<StudioTemplate>(`${path}/${id}`)
  return <><StudioResourceState {...template} />{template.data && <TemplateForm key={`${template.data.id}:${template.data.updatedAt}`} initial={template.data} />}</>
}
type AnalysisField = keyof StudioTemplateAnalysis
function TemplateForm({ initial }: { initial?: StudioTemplate }) {
  const navigate = useNavigate()
  const [values, setValues] = useState({ title: initial?.title || '', kind: initial?.kind || 'AD_IMAGE' as StudioKind, description: initial?.description || '', categoryId: initial?.categoryId ? String(initial.categoryId) : '', prompt: initial?.prompt || '', published: initial?.published || false })
  const categories = useResource<StudioCategory[]>(categoryPath)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryEditor, setCategoryEditor] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const categoryPending = useRef(false)
  const [preview, setPreview] = useState({ key: initial?.previewImageKey || '', url: initial?.previewImageUrl ?? initial?.imageUrl ?? '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [analysis, setAnalysis] = useState<{ status: 'idle' | 'running' | 'done' | 'failed'; message: string }>({ status: 'idle', message: '' })
  const [suggestion, setSuggestion] = useState<StudioTemplateAnalysis | null>(null)
  const edited = useRef({ title: Boolean(initial?.title), description: Boolean(initial?.description), prompt: Boolean(initial?.prompt) })
  const pending = useRef(false)
  const uploadPending = useRef(false)
  const active = useRef(true)
  const analysisVersion = useRef(0)
  const analysisController = useRef<AbortController | null>(null)
  const uploadController = useRef<AbortController | null>(null)
  useEffect(() => {
    active.current = true
    return () => { active.current = false; analysisVersion.current += 1; analysisController.current?.abort(); uploadController.current?.abort() }
  }, [])
  function cancelAnalysis() {
    analysisVersion.current += 1
    analysisController.current?.abort(); analysisController.current = null
    setAnalysis({ status: 'idle', message: '' }); setSuggestion(null)
  }
  function editAnalysis(field: AnalysisField, value: string) {
    edited.current[field] = true
    setValues(current => ({ ...current, [field]: value })); setSaved(false)
  }
  async function analyze(imageKey: string, kind: StudioKind) {
    if (analysisController.current || pending.current || !imageKey) return
    const controller = new AbortController()
    analysisController.current = controller
    const version = ++analysisVersion.current
    setAnalysis({ status: 'running', message: 'AI가 이미지의 스타일을 분석하고 있습니다. 잠시 기다려 주세요.' }); setSuggestion(null)
    try {
      const result = await analyzeStudioTemplate(imageKey, kind, controller.signal)
      if (!active.current || controller.signal.aborted || analysisVersion.current !== version) return
      setSuggestion(result)
      setValues(current => ({ ...current, title: edited.current.title ? current.title : result.title, description: edited.current.description ? current.description : result.description, prompt: edited.current.prompt ? current.prompt : result.prompt }))
      setSaved(false)
      setAnalysis({ status: 'done', message: Object.values(edited.current).some(Boolean) ? 'AI 분석을 완료했습니다. 기존 내용과 직접 입력한 내용은 유지했습니다.' : '샘플 이름, 스타일 설명, 생성 지침을 자동으로 채웠습니다.' })
    } catch (caught) {
      if (!active.current || controller.signal.aborted || analysisVersion.current !== version) return
      setAnalysis({ status: 'failed', message: `${caught instanceof Error ? caught.message : 'AI 분석을 완료하지 못했습니다.'} 이미지는 업로드되어 있습니다. 그대로 저장하거나 다시 분석할 수 있습니다.` })
    } finally { if (analysisVersion.current === version) analysisController.current = null }
  }
  async function upload(file: File) {
    if (uploadPending.current || pending.current || categoryPending.current) return
    if (!['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) { setError('JPG 또는 PNG 이미지를 10MB 이하로 선택해 주세요.'); return }
    cancelAnalysis()
    uploadPending.current = true; setUploading(true); setError(''); setSaved(false)
    const controller = new AbortController(); uploadController.current = controller
    let image: TemplateImage | undefined
    try {
      const data = new FormData(); data.append('file', file)
      image = await adminWrite<TemplateImage>(`${path}/images`, data, 'post', { signal: controller.signal })
      if (!active.current || controller.signal.aborted) return
      if (!image.imageKey || !safeStudioImageUrl(image.imageUrl)) throw new Error('이미지 업로드 결과를 확인하지 못했습니다.')
      setPreview({ key: image.imageKey, url: image.imageUrl })
      // Keep manually entered fields; remove auto-filled text from the previous image.
      setValues(current => ({ ...current, title: edited.current.title ? current.title : '', description: edited.current.description ? current.description : '', prompt: edited.current.prompt ? current.prompt : '' }))
    } catch (caught) {
      image = undefined
      if (active.current && !controller.signal.aborted) setError(caught instanceof Error ? caught.message : '이미지를 올리지 못했습니다.')
    } finally {
      uploadPending.current = false; uploadController.current = null
      if (active.current) setUploading(false)
    }
    if (image && active.current && !controller.signal.aborted) void analyze(image.imageKey, values.kind)
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || uploadPending.current || categoryPending.current || analysisController.current || categories.loading) return
    if (!categories.data?.some(category => category.id === Number(values.categoryId))) { setError('카테고리를 선택해 주세요.'); return }
    if ((!initial || values.published) && !preview.key) { setError('샘플 이미지를 먼저 업로드해 주세요.'); return }
    pending.current = true; setSaving(true); setError(''); setSaved(false)
    try {
      const template = await adminWrite<StudioTemplate>(initial ? `${path}/${initial.id}` : path, { ...values, title: values.title.trim(), description: values.description.trim(), categoryId: Number(values.categoryId), prompt: values.prompt.trim(), previewImageKey: preview.key }, initial ? 'patch' : 'post')
      if (!active.current) return
      if (!initial) navigate(`/admin/studio/${template.id}`, { replace: true })
      else { setValues(current => ({ ...current, title: template.title, description: template.description || '', prompt: template.prompt || '' })); setSaved(true) }
    } catch (caught) { if (active.current) setError(caught instanceof Error ? caught.message : '샘플을 저장하지 못했습니다.') }
    finally { pending.current = false; if (active.current) setSaving(false) }
  }
  async function createCategory() {
    if (categoryPending.current || pending.current || uploadPending.current || !categoryName.trim()) return
    categoryPending.current = true; setCreatingCategory(true); setCategoryError('')
    try {
      const category = await adminWrite<StudioCategory>(categoryPath, { name: categoryName.trim() })
      if (!active.current) return
      setValues(current => ({ ...current, categoryId: String(category.id) })); setSaved(false)
      setCategoryName(''); setCategoryEditor(false); categories.reload()
    } catch (caught) { if (active.current) setCategoryError(caught instanceof Error ? caught.message : '카테고리를 등록하지 못했습니다.') }
    finally { categoryPending.current = false; if (active.current) setCreatingCategory(false) }
  }
  const busy = uploading || saving || creatingCategory
  const analyzing = analysis.status === 'running'
  const needsImage = (!initial || values.published) && !preview.key
  const differsFromSuggestion = suggestion && (['title', 'description', 'prompt'] as const).some(field => values[field] !== suggestion[field])
  return <div className="studio"><header className="studio-heading"><div><p className="studio-eyebrow">AI STUDIO / TEMPLATE EDITOR</p><h1>{initial ? '샘플 편집' : '샘플 등록'}</h1><p>유형과 카테고리를 선택하고 이미지를 올리면 AI가 샘플 정보를 채워 드립니다.</p></div><Link className="studio-button studio-secondary" to="/admin/studio">샘플 목록</Link></header>
    <form className="studio-split" onSubmit={save}><section className="studio-panel studio-form"><h2>샘플 정보</h2><fieldset disabled={busy}>
      <div className="studio-form-columns"><label className="studio-field"><span>소재 유형</span><select name="kind" value={values.kind} onChange={event => {
        cancelAnalysis()
        setValues(current => ({ ...current, kind: event.target.value as StudioKind, title: edited.current.title ? current.title : '', description: edited.current.description ? current.description : '', prompt: edited.current.prompt ? current.prompt : '' })); setSaved(false)
      }}><option value="AD_IMAGE">광고 이미지</option><option value="DETAIL_PAGE">상품 상세페이지</option></select></label><div className="studio-field"><label htmlFor="studio-template-category"><strong>카테고리 <em>*</em></strong></label><select id="studio-template-category" name="categoryId" required value={values.categoryId} disabled={busy || categories.loading || Boolean(categories.error) || !categories.data?.length} onChange={event => { setValues(current => ({ ...current, categoryId: event.target.value })); setSaved(false) }}><option value="">{categories.loading ? '카테고리 조회 중…' : '카테고리를 선택해 주세요'}</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><div className="studio-category-help"><button type="button" className="studio-text-button" disabled={busy} onClick={() => { setCategoryEditor(current => !current); setCategoryError('') }}>+ 새 카테고리</button><Link to="/admin/studio/categories" target="_blank" rel="noopener noreferrer">카테고리 관리 ↗</Link><button type="button" className="studio-text-button" disabled={busy || categories.loading} onClick={categories.reload}>목록 새로고침</button></div></div></div>
      {categories.error && <StudioNotice error>{categories.error}<button type="button" className="studio-button studio-secondary" onClick={categories.reload}>다시 조회</button></StudioNotice>}
      {categories.data?.length === 0 && <StudioNotice>샘플을 등록하려면 카테고리를 먼저 만들어 주세요. 아래에서 바로 추가할 수 있습니다.</StudioNotice>}
      {(categoryEditor || categories.data?.length === 0) && <div className="studio-inline-category"><label className="studio-field"><span>새 카테고리 이름</span><input aria-label="새 카테고리 이름" value={categoryName} onChange={event => setCategoryName(event.target.value)} maxLength={80} placeholder="예: 뷰티, 패션, 식품" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void createCategory() } }} /></label><button type="button" className="studio-button studio-secondary" disabled={busy || !categoryName.trim()} onClick={() => void createCategory()}>{creatingCategory ? '등록 중…' : '등록하고 선택'}</button>{categoryError && <StudioNotice error>{categoryError}</StudioNotice>}</div>}
      <details className="studio-analysis-details"><summary>AI 분석 내용 수정 <span>(선택)</span></summary><div className="studio-analysis-fields">
        <p>비워 두어도 저장할 수 있습니다. 직접 작성한 내용은 다시 분석해도 유지됩니다.</p>
        <label className="studio-field"><span>샘플 이름</span><input name="title" maxLength={150} value={values.title} onChange={event => editAnalysis('title', event.target.value)} placeholder="이미지 분석 후 자동으로 입력됩니다" /></label>
        <label className="studio-field"><span>스타일 설명 <small>고객에게 표시</small></span><textarea name="description" rows={3} maxLength={2000} value={values.description} onChange={event => editAnalysis('description', event.target.value)} placeholder="이미지의 분위기와 특징을 자동으로 입력합니다" /></label>
        <label className="studio-field"><span>AI 생성 지침 <small>운영자 전용</small></span><textarea name="prompt" rows={7} maxLength={6000} value={values.prompt} onChange={event => editAnalysis('prompt', event.target.value)} placeholder="색감, 구도, 배경 등 이미지 스타일을 자동으로 분석합니다" /><small>특정 상품의 효능·가격보다 다른 상품에도 적용할 수 있는 스타일을 설명해 주세요.</small></label>
        {differsFromSuggestion && <div className="studio-analysis-apply"><p>현재 입력한 내용 대신 이번 AI 분석 결과를 사용하려면 적용해 주세요.</p><button type="button" className="studio-button studio-secondary" disabled={busy || analyzing} onClick={() => { if (!suggestion) return; edited.current = { title: false, description: false, prompt: false }; setValues(current => ({ ...current, ...suggestion })); setSaved(false) }}>분석 결과로 바꾸기</button></div>}
      </div></details>
      <label className="studio-checkbox"><input name="published" type="checkbox" checked={values.published} onChange={event => { setValues(current => ({ ...current, published: event.target.checked })); setSaved(false) }} /><span><strong>고객에게 공개</strong><br />저장하면 고객의 AI 스튜디오에서 선택할 수 있습니다.</span></label>
    </fieldset>{error && <StudioNotice error>{error}</StudioNotice>}{saved && <StudioNotice>샘플을 저장했습니다. {values.published ? '고객에게 공개된 상태입니다.' : '비공개 상태입니다.'}</StudioNotice>}<div className="studio-actions"><button className="studio-button" disabled={busy || analyzing || needsImage || categories.loading || Boolean(categories.error) || !categories.data?.some(category => category.id === Number(values.categoryId))}>{saving ? '저장 중…' : analyzing ? '이미지 분석 중…' : initial ? '변경사항 저장' : '샘플 저장'}</button><Link className="studio-button studio-secondary" to="/admin/studio">목록으로</Link></div><p className="studio-note">AI 분석을 이용할 수 없어도 이미지를 저장할 수 있습니다. 비어 있는 이름과 생성 지침은 기본값으로 저장됩니다.</p></section>
      <aside className="studio-panel studio-summary"><h2>샘플 이미지 {(!initial || values.published) && <em>*</em>}</h2><div className="studio-upload">{preview.url ? <img src={safeStudioImageUrl(preview.url)} alt="업로드한 샘플" referrerPolicy="no-referrer" /> : <StudioImage title="샘플 이미지" kind={values.kind} />}<label className="studio-field"><span>{uploading ? '이미지 업로드 중…' : preview.key ? '이미지 바꾸기' : '이미지 선택'}</span><input aria-label="샘플 이미지" type="file" accept="image/jpeg,image/png" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} /></label><small>JPG, PNG · 최대 10MB</small>{preview.key && <div className="studio-actions"><button type="button" className="studio-button studio-secondary" disabled={busy || analyzing} onClick={() => void analyze(preview.key, values.kind)}>{analyzing ? '분석 중…' : analysis.status === 'idle' ? 'AI로 분석하기' : '다시 분석'}</button><button type="button" className="studio-button studio-secondary" disabled={busy} onClick={() => { cancelAnalysis(); setPreview({ key: '', url: '' }); setValues(current => ({ ...current, published: false, title: edited.current.title ? current.title : '', description: edited.current.description ? current.description : '', prompt: edited.current.prompt ? current.prompt : '' })); setSaved(false) }}>이미지 제거</button></div>}</div><p className="studio-note">사용 권한이 있는 이미지를 올려주세요. 업로드한 이미지는 스타일 분석을 위해 OpenAI로 전달됩니다.</p>
      {analysis.status !== 'idle' && <StudioNotice error={analysis.status === 'failed'}>{analysis.message}</StudioNotice>}
      <div className="studio-preview-card"><span className="studio-badge">{studioKindLabel[values.kind]}</span><h3>{values.title.trim() || `${studioKindLabel[values.kind]} 샘플`}</h3><p>{values.description.trim() || '선택한 이미지의 스타일을 참고해 상품에 맞는 소재를 만듭니다.'}</p></div></aside>
    </form>
  </div>
}
