export type StudioKind = 'AD_IMAGE' | 'DETAIL_PAGE'
export type StudioCategory = { id: number; name: string }

export type StudioPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type StudioTemplate = {
  id: number
  kind: StudioKind
  title: string
  description: string
  categoryId: number
  categoryName: string
  imageUrl: string | null
  previewImageUrl?: string | null
  prompt?: string
  previewImageKey?: string | null
  published?: boolean
  createdAt: string
  updatedAt: string
}

export type StudioOutput = {
  id: number
  workspaceId: number
  templateId: number
  kind: StudioKind
  title: string
  imageUrl: string | null
  detailHtml: string | null
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  failureMessage?: string | null
  createdAt: string
}

export type StudioCapabilities = { enabled: boolean; disabledReason: string | null }
export type StudioGenerationRequest = {
  templateId: number
  productName: string
  productDescription: string
  audience?: string
  instructions?: string
  productImageKey?: string
  idempotencyKey: string
}

export const studioKindLabel: Record<StudioKind, string> = {
  AD_IMAGE: '광고 이미지',
  DETAIL_PAGE: '상품 상세페이지',
}
