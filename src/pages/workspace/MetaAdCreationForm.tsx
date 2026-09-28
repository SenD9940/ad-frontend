import type { InputHTMLAttributes, ReactNode } from 'react'
import styled from 'styled-components'
import type { MetaAdObjective, MetaCallToAction, MetaSpecialAdCategory } from '../../types/metaAdCreation'
import type { PlatformAssetResponse } from '../../types/platform'
import type { MetaAdFormValues } from './metaAdFormModel'
import { DetailBadge, DetailHint, DetailPanel, DetailPanelBody, PanelHeading } from './WorkspaceDetailUI'

type FormErrors = Partial<Record<keyof MetaAdFormValues, string>>
type TextFieldName = Exclude<keyof MetaAdFormValues, 'specialAdCategories'>

type TextFieldOptions = {
  hint?: string
  optional?: boolean
  placeholder?: string
  maxLength?: number
  type?: 'text' | 'url' | 'number'
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  min?: number
  max?: number
  multiline?: boolean
  uppercase?: boolean
}

const CATEGORIES: { value: MetaSpecialAdCategory; label: string }[] = [
  { value: 'CREDIT', label: '신용' },
  { value: 'EMPLOYMENT', label: '고용' },
  { value: 'FINANCIAL_PRODUCTS_SERVICES', label: '금융 상품·서비스' },
  { value: 'HOUSING', label: '주택' },
  { value: 'ISSUES_ELECTIONS_POLITICS', label: '사회 이슈·선거·정치' },
  { value: 'ONLINE_GAMBLING_AND_GAMING', label: '온라인 도박·게임' },
]

const CALLS_TO_ACTION: { value: MetaCallToAction; label: string }[] = [
  { value: 'LEARN_MORE', label: '더 알아보기' },
  { value: 'SHOP_NOW', label: '지금 쇼핑하기' },
  { value: 'SIGN_UP', label: '가입하기' },
  { value: 'CONTACT_US', label: '문의하기' },
  { value: 'BOOK_TRAVEL', label: '여행 예약하기' },
  { value: 'DOWNLOAD', label: '다운로드' },
  { value: 'GET_QUOTE', label: '견적 받기' },
  { value: 'APPLY_NOW', label: '지금 신청하기' },
  { value: 'GET_OFFER', label: '혜택 받기' },
]

export function MetaAdCreationForm({ values, onChange, errors, disabled, instagramProfiles, imageInput }: {
  values: MetaAdFormValues
  onChange: (patch: Partial<MetaAdFormValues>) => void
  errors: FormErrors
  disabled: boolean
  instagramProfiles: PlatformAssetResponse[]
  imageInput: ReactNode
}) {
  function textField(name: TextFieldName, label: string, options: TextFieldOptions = {}) {
    return <TextField key={name} name={name} label={label} value={values[name]} error={errors[name]} disabled={disabled} onChange={(value) => onChange({ [name]: value })} {...options} />
  }

  function toggleCategory(category: MetaSpecialAdCategory, checked: boolean) {
    onChange({ specialAdCategories: checked ? [...new Set([...values.specialAdCategories, category])] : values.specialAdCategories.filter((value) => value !== category) })
  }

  return (
    <FormSections>
      <DetailPanel aria-labelledby="ad-create-campaign-title">
        <PanelHeading><PanelIdentity><StepNumber>01</StepNumber><div><h2 id="ad-create-campaign-title">캠페인 설정</h2><p>광고의 목적과 특별 광고 카테고리를 정하세요.</p></div></PanelIdentity><DetailBadge>필수 항목을 입력해 주세요</DetailBadge></PanelHeading>
        <PanelBody>
          <FieldGrid>
            {textField('campaignName', '캠페인 이름', { placeholder: '예: 가을 신상품 캠페인', maxLength: 255 })}
            <FieldBlock name="objective" label="광고 목표" error={errors.objective} hint={values.objective === 'OUTCOME_SALES' ? '웹사이트 구매 전환을 목표로 하며, 구매 이벤트가 설정된 픽셀이 필요합니다.' : '웹사이트 링크 클릭을 목표로 합니다.'}>
              <Select id={fieldId('objective')} name="objective" value={values.objective} onChange={(event) => onChange({ objective: event.target.value as MetaAdObjective })} disabled={disabled} aria-required="true" aria-invalid={Boolean(errors.objective)} aria-describedby={descriptionIds('objective', true, errors.objective)}>
                <option value="OUTCOME_TRAFFIC">트래픽 · 웹사이트 방문</option>
                <option value="OUTCOME_SALES">판매 · 웹사이트 구매</option>
              </Select>
            </FieldBlock>
          </FieldGrid>
          <CategoryGroup id={fieldId('specialAdCategories')} disabled={disabled} tabIndex={-1} aria-describedby={descriptionIds('specialAdCategories', true, errors.specialAdCategories)} aria-invalid={Boolean(errors.specialAdCategories)}>
            <legend>특별 광고 카테고리 <Optional>해당 시 선택</Optional></legend>
            <FieldHint id={`${fieldId('specialAdCategories')}-hint`}>광고에 해당되는 항목을 모두 선택하세요. 아무 항목도 선택하지 않으면 ‘해당 없음’으로 등록합니다.</FieldHint>
            <CategoryGrid>{CATEGORIES.map((category) => <CategoryChoice key={category.value} $selected={values.specialAdCategories.includes(category.value)}><input type="checkbox" name="specialAdCategories" value={category.value} checked={values.specialAdCategories.includes(category.value)} onChange={(event) => toggleCategory(category.value, event.target.checked)} disabled={disabled} /><span>{category.label}</span></CategoryChoice>)}</CategoryGrid>
            <CategoryFooter>{values.specialAdCategories.length ? <ClearCategories type="button" onClick={() => onChange({ specialAdCategories: [] })} disabled={disabled}>선택 해제 · 해당 없음</ClearCategories> : <SelectionNote>현재 선택: 해당 없음</SelectionNote>}</CategoryFooter>
            {errors.specialAdCategories && <FieldError id={`${fieldId('specialAdCategories')}-error`}>{errors.specialAdCategories}</FieldError>}
          </CategoryGroup>
          {values.specialAdCategories.length > 0 && textField('specialAdCategoryCountry', '특별 광고 카테고리 신고 국가', { optional: true, uppercase: true, placeholder: '예: KR, US', hint: '신고에 필요한 대문자 2자리 국가코드를 쉼표로 구분해 입력하세요. 실제 광고를 게재할 국가는 아래에서 별도로 설정합니다.' })}
        </PanelBody>
      </DetailPanel>

      <DetailPanel aria-labelledby="ad-create-adset-title">
        <PanelHeading><PanelIdentity><StepNumber>02</StepNumber><div><h2 id="ad-create-adset-title">광고 세트 설정</h2><p>일일 예산과 광고를 보여줄 대상을 정하세요.</p></div></PanelIdentity></PanelHeading>
        <PanelBody>
          <FieldGrid>
            {textField('adSetName', '광고 세트 이름', { placeholder: '예: 한국 성인 피드', maxLength: 255 })}
            {textField('dailyBudget', '일일 예산 (최소 화폐 단위)', { inputMode: 'numeric', placeholder: '양의 정수 입력', maxLength: 19, hint: '광고 계정 통화의 최소 단위로 입력하세요. 입력한 금액의 단위와 환율은 자동 변환되지 않습니다.' })}
          </FieldGrid>
          {textField('countries', '광고 게재 국가', { uppercase: true, placeholder: 'KR', hint: '대문자 2자리 국가코드를 쉼표로 구분해 입력하세요. 예: KR, US · 최대 25개 국가' })}
          <FieldGrid>
            {textField('ageMin', '최소 연령', { type: 'number', inputMode: 'numeric', min: 18, max: 65, hint: '18~65세 범위에서 입력하세요.' })}
            {textField('ageMax', '최대 연령', { type: 'number', inputMode: 'numeric', min: 18, max: 65, hint: '최소 연령 이상, 65세 이하로 입력하세요.' })}
          </FieldGrid>
          {values.objective === 'OUTCOME_SALES' && textField('pixelId', 'Meta 픽셀 ID', { inputMode: 'numeric', maxLength: 32, placeholder: '구매 이벤트가 설정된 픽셀 ID', hint: '이 광고 계정에서 사용할 수 있는 숫자 픽셀 ID를 입력하세요. 구매(PURCHASE) 이벤트로 최적화합니다.' })}
          <SectionNote>특별 광고 카테고리와 국가에 따라 사용할 수 있는 타겟이 달라질 수 있습니다. 실제 허용 조건은 Meta에서 확인합니다.</SectionNote>
        </PanelBody>
      </DetailPanel>

      <DetailPanel aria-labelledby="ad-create-creative-title">
        <PanelHeading><PanelIdentity><StepNumber>03</StepNumber><div><h2 id="ad-create-creative-title">광고 소재 설정</h2><p>피드에 표시할 단일 이미지와 웹사이트 링크를 준비하세요.</p></div></PanelIdentity><DetailBadge $tone="primary">단일 이미지</DetailBadge></PanelHeading>
        <PanelBody>
          {textField('adName', '광고 이름', { placeholder: '예: 가을 신상품 이미지 광고', maxLength: 255 })}
          <FieldGrid>
            <FieldBlock name="instagramAssetId" label="Instagram 프로필" optional error={errors.instagramAssetId} hint={values.pageAssetId ? instagramProfiles.length ? '선택한 페이지에 연결된 프로필만 표시됩니다. 선택하면 Instagram 피드에도 게재합니다.' : '선택한 페이지에 연결해 저장한 Instagram 프로필이 없습니다.' : 'Facebook 페이지를 먼저 선택해 주세요.'}>
              <Select id={fieldId('instagramAssetId')} name="instagramAssetId" value={values.instagramAssetId} onChange={(event) => onChange({ instagramAssetId: event.target.value })} disabled={disabled || !values.pageAssetId || instagramProfiles.length === 0} aria-invalid={Boolean(errors.instagramAssetId)} aria-describedby={descriptionIds('instagramAssetId', true, errors.instagramAssetId)}>
                <option value="">사용 안 함 · Facebook 피드만</option>
                {instagramProfiles.map((profile) => <option key={profile.id} value={String(profile.id)}>{profile.name || '이름 없는 프로필'} · {profile.externalId}</option>)}
              </Select>
            </FieldBlock>
          </FieldGrid>
          {imageInput}
          {textField('linkUrl', '랜딩 페이지 URL', { type: 'url', maxLength: 2048, placeholder: 'https://shop.example.com/product', hint: '광고를 클릭했을 때 이동할 웹사이트의 HTTPS 주소입니다.' })}
          {textField('message', '광고 본문', { multiline: true, maxLength: 5000, placeholder: '제품이나 서비스를 소개하고 전달할 메시지를 입력하세요.', hint: '최대 5,000자' })}
          <FieldGrid>
            {textField('headline', '광고 제목', { maxLength: 255, placeholder: '예: 가을 신상품을 만나보세요', hint: '이미지와 함께 표시할 제목 · 최대 255자' })}
            <FieldBlock name="callToAction" label="행동 유도 버튼" error={errors.callToAction} hint="광고에서 사용할 버튼 문구를 선택하세요.">
              <Select id={fieldId('callToAction')} name="callToAction" value={values.callToAction} onChange={(event) => onChange({ callToAction: event.target.value as MetaCallToAction })} disabled={disabled} aria-required="true" aria-invalid={Boolean(errors.callToAction)} aria-describedby={descriptionIds('callToAction', true, errors.callToAction)}>
                {CALLS_TO_ACTION.map((cta) => <option key={cta.value} value={cta.value}>{cta.label}</option>)}
              </Select>
            </FieldBlock>
          </FieldGrid>
          {textField('description', '추가 설명', { optional: true, maxLength: 255, placeholder: '추가로 안내할 내용을 입력하세요.', hint: '선택 사항 · 최대 255자' })}
        </PanelBody>
      </DetailPanel>
    </FormSections>
  )
}

function TextField({ name, label, value, error, disabled, onChange, optional, hint, multiline, uppercase, ...inputOptions }: TextFieldOptions & {
  name: TextFieldName
  label: string
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const shared = { id: fieldId(name), name, value, disabled, maxLength: inputOptions.maxLength, 'aria-required': !optional, 'aria-invalid': Boolean(error), 'aria-describedby': descriptionIds(name, Boolean(hint), error) }
  return <FieldBlock name={name} label={label} hint={hint} error={error} optional={optional}>
    {multiline ? <Textarea {...shared} rows={5} onChange={(event) => onChange(event.target.value)} placeholder={inputOptions.placeholder} /> : <Input {...shared} {...inputOptions} type={inputOptions.type || 'text'} step={inputOptions.type === 'number' ? 1 : undefined} autoCapitalize={uppercase ? 'characters' : inputOptions.type === 'url' ? 'none' : undefined} spellCheck={inputOptions.type === 'url' ? false : undefined} onChange={(event) => onChange(uppercase ? event.target.value.toUpperCase() : event.target.value)} />}
  </FieldBlock>
}

function FieldBlock({ name, label, hint, error, optional, children }: {
  name: keyof MetaAdFormValues
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: ReactNode
}) {
  return <Field><Label htmlFor={fieldId(name)}>{label}{optional && <Optional>선택</Optional>}</Label>{children}{hint && <FieldHint id={`${fieldId(name)}-hint`}>{hint}</FieldHint>}{error && <FieldError id={`${fieldId(name)}-error`}>{error}</FieldError>}</Field>
}

function fieldId(name: keyof MetaAdFormValues): string {
  return `ad-create-${name}`
}

function descriptionIds(name: keyof MetaAdFormValues, hasHint: boolean, error?: string): string | undefined {
  return [hasHint && `${fieldId(name)}-hint`, error && `${fieldId(name)}-error`].filter(Boolean).join(' ') || undefined
}

const FormSections = styled.div`display: grid; gap: 24px; min-width: 0;`
const PanelIdentity = styled.div`display: flex; align-items: flex-start; gap: 13px; min-width: 0; > div { min-width: 0; }`
const StepNumber = styled.span`display: grid; flex-shrink: 0; place-items: center; width: 31px; height: 31px; border: 1px solid #e7e3fa; border-radius: 8px; background: #f6f4ff; color: ${({ theme }) => theme.colors.primary}; font-size: 11px; font-weight: 700;`
const PanelBody = styled(DetailPanelBody)`display: grid; gap: 24px; min-width: 0;`
const FieldGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 20px; min-width: 0; @media (max-width: 640px) { grid-template-columns: minmax(0, 1fr); }`
const Field = styled.div`display: grid; gap: 8px; min-width: 0;`
const Label = styled.label`display: flex; align-items: center; flex-wrap: wrap; gap: 7px; color: ${({ theme }) => theme.colors.text}; font-size: 13px; font-weight: 650; line-height: 1.6;`
const Optional = styled.span`color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 450;`
const Input = styled.input`width: 100%; min-width: 0; min-height: 44px; font-size: 13px; @media (max-width: 640px) { font-size: 16px; }`
const Select = styled.select`width: 100%; min-width: 0; min-height: 44px; font-size: 13px; text-overflow: ellipsis; @media (max-width: 640px) { font-size: 16px; }`
const Textarea = styled.textarea`width: 100%; min-width: 0; min-height: 132px; resize: vertical; font-size: 13px; line-height: 1.8; @media (max-width: 640px) { font-size: 16px; }`
const FieldHint = styled.p`color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.8; word-break: keep-all; overflow-wrap: anywhere;`
const FieldError = styled.p`color: ${({ theme }) => theme.colors.error}; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere;`
const CategoryGroup = styled.fieldset`min-width: 0; margin: 0; padding: 0; border: 0; legend { margin-bottom: 8px; color: ${({ theme }) => theme.colors.text}; font-size: 13px; font-weight: 650; line-height: 1.6; } legend > span { margin-left: 7px; }`
const CategoryGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 13px; @media (max-width: 640px) { grid-template-columns: minmax(0, 1fr); }`
const CategoryChoice = styled.label<{ $selected: boolean }>`display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 12px; border: 1px solid ${({ $selected, theme }) => $selected ? '#d8d2fc' : theme.colors.border}; border-radius: 7px; background: ${({ $selected }) => $selected ? '#f8f6ff' : '#fff'}; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; line-height: 1.65; cursor: pointer; input { width: 16px; height: 16px; margin: 0; flex-shrink: 0; } span { min-width: 0; overflow-wrap: anywhere; } &:has(input:disabled) { cursor: not-allowed; opacity: .7; }`
const CategoryFooter = styled.div`margin-top: 10px;`
const ClearCategories = styled.button`&& { min-height: 32px; padding: 4px 0; border: 0; background: transparent; color: ${({ theme }) => theme.colors.primary}; font-size: 11px; font-weight: 550; } &&:hover:not(:disabled), &&:active:not(:disabled) { color: ${({ theme }) => theme.colors.primaryHover}; background: transparent; }`
const SelectionNote = styled.p`color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px;`
const SectionNote = styled(DetailHint)`padding: 12px 14px; border: 1px solid #ece9f6; border-radius: 7px; background: #faf9fd; font-size: 11px;`
