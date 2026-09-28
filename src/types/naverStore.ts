export type NaverStore = {
  assetId: number
  connectionId: number
  channelNo: string
  name: string
  storeUrl: string | null
  connectionName: string | null
  requiresReauth: boolean
}

export type NaverProduct = {
  productId: string
  name: string
  status: string
  imageUrl: string | null
  salePrice: number
  discountedPrice: number | null
  stockQuantity: number | null
}

export type NaverProducts = {
  assetId: number
  channelNo: string
  items: NaverProduct[]
  page: number
  size: number
  hasNext: boolean
  totalElements: number | null
  fetchedAt: string
}

export type NaverSalesSummary = {
  paymentAmount: number
  remainingPaymentAmount: number | null
  paidOrderCount: number
  productOrderCount: number
  quantity: number
  averageOrderAmount: number
  canceledProductOrderCount: number
  returnedProductOrderCount: number
}

export type NaverSales = {
  assetId: number
  channelNo: string
  since: string
  until: string
  timeZone: 'Asia/Seoul'
  basis: 'PAYMENT_DATE'
  currency: 'KRW'
  summary: NaverSalesSummary
  daily: Array<NaverSalesSummary & { date: string }>
  topProducts: Array<{
    productId: string
    name: string
    productOrderCount: number
    quantity: number
    paymentAmount: number
    remainingPaymentAmount: number | null
  }>
  complete: true
  fetchedAt: string
  notice: string
}
