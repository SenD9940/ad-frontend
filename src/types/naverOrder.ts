export type NaverOrderOption = { code: string; label: string }
export type NaverOrderOptions = {
  rangeTypes: NaverOrderOption[]; statuses: NaverOrderOption[]; deliveryMethods: NaverOrderOption[]; carriers: NaverOrderOption[];
  settlementAvailable: boolean; settlementUnavailableReason: string | null
}
export type NaverOrder = {
  productOrderId: string; orderId: string | null; productName: string | null; productOption: string | null;
  status: string | null; placeOrderStatus: string | null; claimStatus: string | null; orderDate: string | null; paymentDate: string | null;
  initialQuantity: number | null; remainingQuantity: number | null; initialPaymentAmount: number | null; remainingPaymentAmount: number | null; deliveryStatus: string | null
}
export type NaverOrders = {
  assetId: number; channelNo: string; date: string; rangeType: string; status: string | null; items: NaverOrder[];
  page: number; size: number; hasNext: boolean; fetchedAt: string; notice: string
}
export type NaverOrderQuery = { date: string; rangeType: string; status: string; page: number }
export type NaverOrderActionCode = 'CONFIRM' | 'DISPATCH' | 'APPROVE_CANCEL' | 'APPROVE_RETURN'
export type NaverOrderClaim = {
  type: string | null; claimId: string | null; status: string | null; quantity: number | null; reason: string | null;
  requestedAt: string | null; completedAt: string | null; collectStatus: string | null; holdbackStatus: string | null;
  holdbackReason: string | null; refundStandbyStatus: string | null; refundExpectedDate: string | null
}
export type NaverOrderDetail = {
  assetId: number; channelNo: string; order: NaverOrder; paymentMeans: string | null; paymentDueDate: string | null; shippingDueDate: string | null;
  recipient: { name: string | null; tel1: string | null; tel2: string | null; zipCode: string | null; baseAddress: string | null; detailedAddress: string | null; country: string | null } | null;
  shippingMemo: string | null;
  delivery: { method: string | null; company: string | null; trackingNumber: string | null; status: string | null; sendDate: string | null; pickupDate: string | null; deliveredDate: string | null; wrongTrackingNumber: boolean | null } | null;
  currentClaims: NaverOrderClaim[]; completedClaims: NaverOrderClaim[]; version: string;
  actions: { code: NaverOrderActionCode; label: string; description: string }[]; actionNotice: string | null; fetchedAt: string
}
export type NaverOrderActionRequest = {
  action: NaverOrderActionCode; expectedVersion: string; requestId: string; deliveryMethod?: string;
  deliveryCompanyCode?: string; trackingNumber?: string; dispatchDate?: string; returnReceived?: boolean
}
export type NaverOrderActionResult = { productOrderId: string; action: NaverOrderActionCode; status: 'ACCEPTED'; notice: string }
export type NaverSettlementDay = {
  settleBasisStartDate: string | null; settleBasisEndDate: string | null; settleExpectDate: string | null;
  settleCompleteDate: string | null; settleMethodType: string | null; settleAmount: number | null; paySettleAmount: number | null;
  commissionSettleAmount: number | null; benefitSettleAmount: number | null; deductionRestoreSettleAmount: number | null
}
export type NaverSettlements = {
  assetId: number; channelNo: string; since: string; until: string; basis: 'SETTLEMENT_EXPECTED'; items: NaverSettlementDay[];
  page: number; size: number; hasNext: boolean; fetchedAt: string; notice: string
}
