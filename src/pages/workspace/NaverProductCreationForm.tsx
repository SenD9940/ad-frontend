import { useMemo, useState, type ReactNode } from 'react'
import type { NaverProductCreationOptions, NaverProductNotice } from '../../types/naverProductCreation'
import type { NaverProductFormValues, ProductFormErrors } from './naverProductFormModel'
import { DetailAlert, DetailBadge, DetailHint, DetailPanel, DetailSecondaryButton, DetailStatus, PanelHeading } from './WorkspaceDetailUI'
import { CheckLabel, FieldGrid, FormStack, Input, ProductField, Select, StackBody, Textarea, fieldDescription } from './NaverProductFormUI'
import { NaverProductImages } from './NaverProductImages'

export function NaverProductCreationForm({ values, images, options, notices, noticesLoading, noticesError, errors, onChange, onImages, onNoticesReload }: {
  values: NaverProductFormValues; images: File[]; options: NaverProductCreationOptions; notices: NaverProductNotice[]
  noticesLoading: boolean; noticesError: string; errors: ProductFormErrors
  onChange: (patch: Partial<NaverProductFormValues>) => void; onImages: (images: File[]) => void; onNoticesReload: () => void
}) {
  const [categoryQuery, setCategoryQuery] = useState('')
  const [originQuery, setOriginQuery] = useState('')
  const selectedNotice = notices.find((item) => item.type === values.noticeType)
  const categories = useMemo(() => options.categories.filter((item) => item.id === values.categoryId || item.name.toLocaleLowerCase().includes(categoryQuery.trim().toLocaleLowerCase())), [options.categories, values.categoryId, categoryQuery])
  const origins = useMemo(() => options.origins.filter((item) => !options.origins.some((other) => other.code !== item.code && other.code.startsWith(item.code))
    && (item.code === values.originAreaCode || item.name.includes(originQuery.trim()))), [options.origins, values.originAreaCode, originQuery])

  function text(name: keyof NaverProductFormValues, label: string, settings: { multiline?: boolean; maxLength?: number; hint?: string; optional?: boolean; number?: boolean; placeholder?: string } = {}) {
    const props = { id: `product-${name}`, value: String(values[name] ?? ''), 'aria-required': !settings.optional,
      'aria-invalid': Boolean(errors[name]), 'aria-describedby': fieldDescription(name, Boolean(settings.hint), errors[name]),
      maxLength: settings.maxLength, placeholder: settings.placeholder,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [name]: event.target.value }) }
    return <ProductField name={name} label={label} hint={settings.hint} optional={settings.optional} error={errors[name]}>
      {settings.multiline ? <Textarea {...props} rows={7} /> : <Input {...props} inputMode={settings.number ? 'numeric' : undefined} type="text" />}
    </ProductField>
  }
  function select(name: keyof NaverProductFormValues, label: string, items: Array<{ value: string; label: string }>, hint?: string) {
    return <ProductField name={name} label={label} hint={hint} error={errors[name]}><Select id={`product-${name}`} value={String(values[name])}
      aria-required="true" aria-invalid={Boolean(errors[name])} aria-describedby={fieldDescription(name, Boolean(hint), errors[name])}
      onChange={(event) => onChange({ [name]: event.target.value })}><option value="">선택해 주세요</option>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></ProductField>
  }
  const addressOptions = (type: 'RELEASE' | 'REFUND_OR_EXCHANGE') => options.addresses.filter((item) => item.type === type && !item.overseas)
    .map((item) => ({ value: item.id, label: `${item.name || '주소'} · ${item.address}` }))

  return <FormStack>
    <Section number="01" title="기본 정보" description="등록할 상품의 카테고리, 판매가와 재고를 입력하세요.">
      {text('name', '상품명', { maxLength: 100, hint: '상품의 정확한 이름을 입력하세요. 최대 100자' })}
      <ProductField name="categorySearch" label="카테고리 검색" hint="상품의 종류로 검색한 뒤 아래에서 최종 카테고리를 선택하세요."><Input id="product-categorySearch" type="search" value={categoryQuery} placeholder="예: 머그컵" onChange={(event) => setCategoryQuery(event.target.value)} /></ProductField>
      {select('categoryId', '상품 카테고리', categories.map((item) => ({ value: item.id, label: item.name })), `${categories.length.toLocaleString('ko-KR')}개 카테고리. 인증·허가가 필요한 상품은 해당 정보를 갖춰 판매자센터에서 등록해 주세요.`)}
      <FieldGrid>{text('salePrice', '판매가 (원)', { number: true, hint: '할인 전 판매가를 1원 이상의 정수로 입력하세요.' })}{text('stockQuantity', '재고 수량 (개)', { number: true, hint: '옵션 구분 없는 상품의 실제 판매 가능 수량' })}</FieldGrid>
      <FieldGrid>{select('taxType', '과세 구분', [{ value: 'TAX', label: '과세' }, { value: 'DUTYFREE', label: '면세' }, { value: 'SMALL', label: '영세' }])}{select('minorPurchasable', '미성년자 구매 가능', [{ value: 'true', label: '구매 가능' }, { value: 'false', label: '구매 불가' }])}</FieldGrid>
    </Section>
    <Section number="02" title="이미지 및 상세 설명" description="고객에게 보여 줄 상품 이미지와 설명을 준비하세요.">
      <NaverProductImages images={images} disabled={false} error={errors.images} onChange={onImages} />
      {values.studioOutputId && <DetailHint>AI 상세페이지가 연결되어 있습니다. 등록 시 상세 이미지와 설명이 함께 반영됩니다. <DetailSecondaryButton type="button" onClick={() => onChange({ studioOutputId: undefined })}>AI 상세페이지 연결 해제</DetailSecondaryButton></DetailHint>}
      {text('detailContent', values.studioOutputId ? '상세페이지 아래에 추가할 설명' : '상세 설명', { multiline: true, maxLength: 50000, optional: Boolean(values.studioOutputId), hint: '일반 텍스트로 입력하세요. 줄바꿈을 유지하며 HTML 태그는 문자로 표시합니다.' })}
    </Section>
    <Section number="03" title="원산지 및 고객 지원" description="실제 상품의 원산지와 판매자 A/S 정보를 입력하세요.">
      <ProductField name="originSearch" label="원산지 검색" optional><Input id="product-originSearch" type="search" value={originQuery} placeholder="국가 또는 지역으로 검색" onChange={(event) => setOriginQuery(event.target.value)} /></ProductField>
      {select('originAreaCode', '원산지', origins.map((item) => ({ value: item.code, label: item.name })))}
      <FieldGrid>{text('originAreaContent', '원산지 상세', { optional: values.originAreaCode !== '04', maxLength: 200, hint: '직접 입력 원산지를 선택한 경우 필수입니다.' })}{text('importer', '수입자', { optional: !values.originAreaCode.startsWith('02'), maxLength: 200, hint: '수입 상품은 실제 수입자 정보를 입력하세요.' })}</FieldGrid>
      {text('afterServiceTelephoneNumber', 'A/S 전화번호', { maxLength: 30, placeholder: '예: 02-1234-5678' })}
      {text('afterServiceGuideContent', 'A/S 안내', { multiline: true, maxLength: 1000, hint: '문의 가능 시간, 접수 방법과 A/S 기준을 안내해 주세요.' })}
    </Section>
    <Section number="04" title="배송 및 반품" description="국내 택배 배송과 판매자센터에 저장된 주소를 사용합니다.">
      <FieldGrid>{select('deliveryCompany', '택배사', options.deliveryCompanies.map((item) => ({ value: item.code, label: item.name })))}{select('deliveryFeeType', '배송비 방식', [{ value: 'FREE', label: '무료 배송' }, { value: 'PAID', label: '유료 배송' }, { value: 'CONDITIONAL_FREE', label: '조건부 무료 배송' }])}</FieldGrid>
      {values.deliveryFeeType !== 'FREE' && <FieldGrid>{text('deliveryFee', '기본 배송비 (원)', { number: true })}{values.deliveryFeeType === 'CONDITIONAL_FREE' && text('freeConditionalAmount', '무료 배송 기준 금액 (원)', { number: true, hint: '이 금액 이상 구매하면 무료 배송합니다.' })}</FieldGrid>}
      {select('shippingAddressId', '출고지', addressOptions('RELEASE'))}
      {select('returnAddressId', '반품·교환지', addressOptions('REFUND_OR_EXCHANGE'))}
      {(!addressOptions('RELEASE').length || !addressOptions('REFUND_OR_EXCHANGE').length) && <DetailAlert role="alert">사용할 국내 출고지 또는 반품·교환지가 없습니다. <a href="https://sell.smartstore.naver.com/" target="_blank" rel="noopener noreferrer">스마트스토어 판매자센터</a>에서 주소를 저장한 뒤 등록 정보를 다시 불러와 주세요.</DetailAlert>}
      <FieldGrid>{text('returnDeliveryFee', '반품 배송비 (원)', { number: true, hint: '반품 시 고객이 부담하는 배송비' })}{text('exchangeDeliveryFee', '교환 배송비 (원)', { number: true, hint: '교환 시 고객이 부담하는 배송비' })}</FieldGrid>
    </Section>
    <Section number="05" title="상품 정보 제공 고시" description="선택한 상품에 해당하는 정보를 직접 확인하고 입력하세요.">
      {!values.categoryId ? <DetailHint>상품 카테고리를 먼저 선택해 주세요.</DetailHint> : noticesLoading ? <DetailStatus role="status">카테고리에 맞는 고시 항목을 불러오는 중…</DetailStatus> : noticesError ? <><DetailAlert role="alert">{noticesError}</DetailAlert><DetailSecondaryButton type="button" onClick={onNoticesReload}>고시 항목 다시 조회</DetailSecondaryButton></> : !notices.length ? <DetailAlert role="alert">이 카테고리는 현재 등록 화면에서 지원하는 고시 항목이 없습니다. 스마트스토어 판매자센터에서 등록해 주세요.</DetailAlert> : <>
        {select('noticeType', '상품 정보 제공 고시 유형', notices.map((item) => ({ value: item.type, label: item.name })))}
        {selectedNotice && <FieldGrid>{selectedNotice.fields.map((field) => {
          const name = `notice-${field.key}`
          const value = values.noticeFields[field.key] ?? ''
          const change = (next: string) => onChange({ noticeFields: { ...values.noticeFields, [field.key]: next } })
          const shared = { id: `product-${name}`, value, 'aria-required': field.required, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': fieldDescription(name, Boolean(field.description), errors[name]) }
          return <ProductField key={field.key} name={name} label={field.label} hint={field.description || undefined} error={errors[name]} optional={!field.required}>
            {field.type === 'BOOLEAN' ? <Select {...shared} onChange={(event) => change(event.target.value)}><option value="">선택해 주세요</option><option value="true">예</option><option value="false">아니오</option></Select>
              : field.options.length ? <Select {...shared} onChange={(event) => change(event.target.value)}><option value="">선택해 주세요</option>{field.options.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</Select>
                : <Input {...shared} inputMode={field.type === 'NUMBER' ? 'decimal' : undefined} maxLength={field.maxLength || undefined} onChange={(event) => change(event.target.value)} />}
          </ProductField>
        })}</FieldGrid>}
      </>}
    </Section>
    <Section number="06" title="전시 설정" description="등록 후 고객에게 상품을 공개할지 선택하세요.">
      {select('displayStatus', '스마트스토어 전시 상태', [{ value: 'SUSPENSION', label: '전시 중지' }, { value: 'ON', label: '전시 중 · 고객에게 공개' }], '전시 중지는 임시 저장이 아닙니다. 상품은 판매 상품으로 등록되며 스토어 전시만 중지됩니다.')}
      <CheckLabel><input type="checkbox" checked={values.naverShoppingRegistration} onChange={(event) => onChange({ naverShoppingRegistration: event.target.checked })} />네이버 쇼핑에도 등록 요청</CheckLabel>
    </Section>
  </FormStack>
}

function Section({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <DetailPanel><PanelHeading><div><h2>{title}</h2><p>{description}</p></div><DetailBadge>{number}</DetailBadge></PanelHeading><StackBody>{children}</StackBody></DetailPanel>
}
