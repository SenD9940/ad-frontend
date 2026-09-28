export type NaverProductCreationOptions = {
  categories: Array<{ id: string; name: string }>
  origins: Array<{ code: string; name: string }>
  addresses: Array<{ id: string; name: string; address: string; type: 'RELEASE' | 'REFUND_OR_EXCHANGE'; overseas: boolean }>
  deliveryCompanies: Array<{ code: string; name: string }>
}

export type NaverProductNoticeField = {
  key: string; label: string; description: string | null; maxLength: number; required: boolean
  type: 'TEXT' | 'BOOLEAN' | 'NUMBER'; options: Array<{ value: string; label: string }>
}
export type NaverProductNotice = { type: string; name: string; fields: NaverProductNoticeField[] }
export type NaverProductNotices = { types: NaverProductNotice[] }

export type NaverProductCreateRequest = {
  name: string; categoryId: string; salePrice: number; stockQuantity: number; detailContent: string
  originAreaCode: string; originAreaContent?: string; importer?: string
  taxType: 'TAX' | 'DUTYFREE' | 'SMALL'; minorPurchasable: boolean
  afterServiceTelephoneNumber: string; afterServiceGuideContent: string
  deliveryCompany: string; deliveryFeeType: 'FREE' | 'PAID' | 'CONDITIONAL_FREE'; deliveryFee: number
  freeConditionalAmount?: number; shippingAddressId: string; returnAddressId: string
  returnDeliveryFee: number; exchangeDeliveryFee: number
  noticeType: string; noticeFields: Record<string, string | boolean | number>
  displayStatus: 'ON' | 'SUSPENSION'; naverShoppingRegistration: boolean
  studioOutputId?: number
}

export type NaverProductCreateResult = {
  status: 'CREATED' | 'UNKNOWN'
  originProductNo: string | null
  smartstoreChannelProductNo: string | null
  message: string
}
