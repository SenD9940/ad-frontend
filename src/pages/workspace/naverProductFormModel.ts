import type { NaverProductCreateRequest, NaverProductCreationOptions, NaverProductNotice } from '../../types/naverProductCreation'

type NumericField = 'salePrice' | 'stockQuantity' | 'deliveryFee' | 'freeConditionalAmount' | 'returnDeliveryFee' | 'exchangeDeliveryFee'
export type NaverProductFormValues = Omit<NaverProductCreateRequest, NumericField | 'minorPurchasable' | 'taxType' | 'noticeFields'>
  & Record<NumericField, string> & { minorPurchasable: '' | 'true' | 'false'; taxType: '' | NaverProductCreateRequest['taxType']; noticeFields: Record<string, string> }
export type ProductFormErrors = Record<string, string>

export function emptyNaverProductForm(): NaverProductFormValues {
  return { name: '', categoryId: '', salePrice: '', stockQuantity: '', detailContent: '', originAreaCode: '', originAreaContent: '', importer: '',
    taxType: '', minorPurchasable: '', afterServiceTelephoneNumber: '', afterServiceGuideContent: '', deliveryCompany: '',
    deliveryFeeType: 'FREE', deliveryFee: '', freeConditionalAmount: '', shippingAddressId: '', returnAddressId: '', returnDeliveryFee: '', exchangeDeliveryFee: '',
    noticeType: '', noticeFields: {}, displayStatus: 'SUSPENSION', naverShoppingRegistration: false }
}

export function validateProductForm(values: NaverProductFormValues, images: File[], options: NaverProductCreationOptions, notice: NaverProductNotice | undefined): ProductFormErrors {
  const errors: ProductFormErrors = {}
  const required = (name: keyof NaverProductFormValues, label: string, max: number) => {
    const value = String(values[name] ?? '').trim()
    if (!value) errors[name] = `${label}을(를) 입력해 주세요.`
    else if (value.length > max) errors[name] = `최대 ${max.toLocaleString('ko-KR')}자까지 입력할 수 있습니다.`
  }
  required('name', '상품명', 100)
  if (!options.categories.some((item) => item.id === values.categoryId)) errors.categoryId = '상품에 맞는 최종 카테고리를 선택해 주세요.'
  for (const [key, label, min, max] of [['salePrice', '판매가', 1, 999999990], ['stockQuantity', '재고 수량', 1, 99999999], ['returnDeliveryFee', '반품 배송비', 0, 1000000], ['exchangeDeliveryFee', '교환 배송비', 0, 1000000]] as const) {
    if (!integer(values[key], min) || Number(values[key]) > max) errors[key] = `${label}는 ${min}~${max.toLocaleString('ko-KR')} 범위의 정수로 입력해 주세요.`
  }
  if (!images.length) errors.images = '대표 상품 이미지를 선택해 주세요.'
  required('detailContent', '상세 설명', 50000)
  if (!options.origins.some((item) => item.code === values.originAreaCode) || options.origins.some((item) => item.code !== values.originAreaCode && item.code.startsWith(values.originAreaCode))) errors.originAreaCode = '최종 원산지를 선택해 주세요.'
  if (values.originAreaCode === '04') required('originAreaContent', '원산지 상세', 200)
  if (values.originAreaCode.startsWith('02')) required('importer', '수입자', 200)
  if (!values.taxType) errors.taxType = '상품의 과세 구분을 선택해 주세요.'
  if (!values.minorPurchasable) errors.minorPurchasable = '미성년자 구매 가능 여부를 선택해 주세요.'
  required('afterServiceTelephoneNumber', 'A/S 전화번호', 30)
  if (!errors.afterServiceTelephoneNumber && !/^[0-9+() -]{7,30}$/.test(values.afterServiceTelephoneNumber.trim())) errors.afterServiceTelephoneNumber = '7~30자의 전화번호를 입력해 주세요. 숫자, +, 괄호, 공백, 하이픈을 사용할 수 있습니다.'
  required('afterServiceGuideContent', 'A/S 안내', 1000)
  if (!options.deliveryCompanies.some((item) => item.code === values.deliveryCompany)) errors.deliveryCompany = '배송할 택배사를 선택해 주세요.'
  if (values.deliveryFeeType !== 'FREE' && (!integer(values.deliveryFee, 1) || Number(values.deliveryFee) > 100000)) errors.deliveryFee = '배송비는 1~100,000원 범위의 정수로 입력해 주세요.'
  if (values.deliveryFeeType === 'CONDITIONAL_FREE' && (!integer(values.freeConditionalAmount, 1) || Number(values.freeConditionalAmount) > 999999990)) errors.freeConditionalAmount = '무료 배송 기준 금액은 1~999,999,990원 범위로 입력해 주세요.'
  if (!options.addresses.some((item) => item.id === values.shippingAddressId && item.type === 'RELEASE' && !item.overseas)) errors.shippingAddressId = '저장된 국내 출고지를 선택해 주세요.'
  if (!options.addresses.some((item) => item.id === values.returnAddressId && item.type === 'REFUND_OR_EXCHANGE' && !item.overseas)) errors.returnAddressId = '저장된 국내 반품·교환지를 선택해 주세요.'
  if (!notice || notice.type !== values.noticeType) errors.noticeType = '카테고리에 맞는 상품 정보 제공 고시를 선택해 주세요.'
  notice?.fields.forEach((field) => {
    const value = values.noticeFields[field.key]?.trim() ?? ''
    if (!value) { if (field.required) errors[`notice-${field.key}`] = `${field.label} 항목을 입력해 주세요.`; return }
    if (field.type === 'BOOLEAN' && !['true', 'false'].includes(value)) errors[`notice-${field.key}`] = '예 또는 아니오를 선택해 주세요.'
    else if (field.type === 'NUMBER' && !integer(value, 0)) errors[`notice-${field.key}`] = '0 이상의 정수를 입력해 주세요.'
    else if (field.options.length && !field.options.some((item) => item.value === value)) errors[`notice-${field.key}`] = '목록에서 해당 값을 선택해 주세요.'
    else if (field.maxLength > 0 && value.length > field.maxLength) errors[`notice-${field.key}`] = `최대 ${field.maxLength}자까지 입력할 수 있습니다.`
  })
  return errors
}

export function buildProductRequest(values: NaverProductFormValues, notice: NaverProductNotice): NaverProductCreateRequest {
  const fields = Object.fromEntries(notice.fields.flatMap((field) => {
    const value = values.noticeFields[field.key]?.trim() ?? ''
    return value ? [[field.key, field.type === 'BOOLEAN' ? value === 'true' : field.type === 'NUMBER' ? Number(value) : value]] : []
  }))
  return { name: values.name.trim(), categoryId: values.categoryId, salePrice: Number(values.salePrice), stockQuantity: Number(values.stockQuantity),
    detailContent: values.detailContent.trim(), originAreaCode: values.originAreaCode,
    ...(values.originAreaContent?.trim() ? { originAreaContent: values.originAreaContent.trim() } : {}), ...(values.importer?.trim() ? { importer: values.importer.trim() } : {}),
    taxType: values.taxType as NaverProductCreateRequest['taxType'], minorPurchasable: values.minorPurchasable === 'true',
    afterServiceTelephoneNumber: values.afterServiceTelephoneNumber.trim(), afterServiceGuideContent: values.afterServiceGuideContent.trim(),
    deliveryCompany: values.deliveryCompany, deliveryFeeType: values.deliveryFeeType, deliveryFee: values.deliveryFeeType === 'FREE' ? 0 : Number(values.deliveryFee),
    ...(values.deliveryFeeType === 'CONDITIONAL_FREE' ? { freeConditionalAmount: Number(values.freeConditionalAmount) } : {}),
    shippingAddressId: values.shippingAddressId, returnAddressId: values.returnAddressId, returnDeliveryFee: Number(values.returnDeliveryFee), exchangeDeliveryFee: Number(values.exchangeDeliveryFee),
    noticeType: values.noticeType, noticeFields: fields, displayStatus: values.displayStatus, naverShoppingRegistration: values.naverShoppingRegistration }
}

function integer(value: string, min: number) { return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= min }
