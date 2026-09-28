import type { MetaAdCreateRequest, MetaAdObjective, MetaCallToAction, MetaSpecialAdCategory } from '../../types/metaAdCreation'
import type { PlatformAssetResponse } from '../../types/platform'

export type MetaAdFormValues = {
  campaignName: string
  objective: MetaAdObjective
  specialAdCategories: MetaSpecialAdCategory[]
  specialAdCategoryCountry: string
  adSetName: string
  dailyBudget: string
  countries: string
  ageMin: string
  ageMax: string
  pixelId: string
  adName: string
  pageAssetId: string
  instagramAssetId: string
  imageSource: 'upload' | 'url'
  imageKey: string
  imageUrl: string
  linkUrl: string
  message: string
  headline: string
  description: string
  callToAction: MetaCallToAction
}

export type MetaAdFormErrors = Partial<Record<keyof MetaAdFormValues, string>>

export function emptyMetaAdForm(): MetaAdFormValues {
  return {
    campaignName: '', objective: 'OUTCOME_TRAFFIC', specialAdCategories: [], specialAdCategoryCountry: '',
    adSetName: '', dailyBudget: '', countries: 'KR', ageMin: '18', ageMax: '65', pixelId: '',
    adName: '', pageAssetId: '', instagramAssetId: '', imageSource: 'upload', imageKey: '', imageUrl: '', linkUrl: '', message: '',
    headline: '', description: '', callToAction: 'LEARN_MORE',
  }
}

export function countryCodes(value: string): string[] {
  return [...new Set(value.trim().toUpperCase().split(/[\s,]+/).filter(Boolean))]
}

export function validateMetaAdForm(values: MetaAdFormValues, pages: PlatformAssetResponse[], profiles: PlatformAssetResponse[]): MetaAdFormErrors {
  const errors: MetaAdFormErrors = {}
  for (const key of ['campaignName', 'adSetName', 'adName', 'headline', 'message'] as const) {
    const limit = key === 'message' ? 5000 : 255
    if (!values[key].trim()) errors[key] = '필수 항목을 입력해 주세요.'
    else if (values[key].trim().length > limit) errors[key] = `${limit.toLocaleString('ko-KR')}자 이내로 입력해 주세요.`
  }
  if (values.description.trim().length > 255) errors.description = '255자 이내로 입력해 주세요.'
  if (!['OUTCOME_TRAFFIC', 'OUTCOME_SALES'].includes(values.objective)) errors.objective = '트래픽 또는 판매 목표를 선택해 주세요.'
  const categories = ['CREDIT', 'EMPLOYMENT', 'FINANCIAL_PRODUCTS_SERVICES', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS', 'ONLINE_GAMBLING_AND_GAMING']
  if (values.specialAdCategories.length > 6 || values.specialAdCategories.some((category) => !categories.includes(category))) errors.specialAdCategories = '올바른 특별 광고 카테고리를 선택해 주세요.'
  const countries = countryCodes(values.countries)
  if (countries.length < 1 || countries.length > 25 || countries.some((country) => !/^[A-Z]{2}$/.test(country))) errors.countries = '국가코드를 1~25개 입력해 주세요. 예: KR, US'
  const specialCountries = countryCodes(values.specialAdCategoryCountry)
  if (specialCountries.length > 250 || specialCountries.some((country) => !/^[A-Z]{2}$/.test(country))) errors.specialAdCategoryCountry = '2자리 국가코드를 최대 250개 입력해 주세요.'
  if (!/^\d+$/.test(values.dailyBudget) || Number(values.dailyBudget) <= 0) errors.dailyBudget = '일일 예산을 1 이상의 정수로 입력해 주세요.'
  else if (!Number.isSafeInteger(Number(values.dailyBudget))) errors.dailyBudget = '일일 예산이 입력 가능한 범위를 넘었습니다.'
  for (const key of ['ageMin', 'ageMax'] as const) {
    if (!/^\d+$/.test(values[key]) || Number(values[key]) < 18 || Number(values[key]) > 65) errors[key] = '연령은 18~65 사이의 정수로 입력해 주세요.'
  }
  if (!errors.ageMin && !errors.ageMax && Number(values.ageMin) > Number(values.ageMax)) errors.ageMax = '최대 연령은 최소 연령 이상이어야 합니다.'
  if (values.objective === 'OUTCOME_SALES' && !/^\d{1,32}$/.test(values.pixelId.trim())) errors.pixelId = '판매 목표에 사용할 픽셀 ID를 숫자 1~32자리로 입력해 주세요.'
  if (!pages.some((page) => String(page.id) === values.pageAssetId)) errors.pageAssetId = '선택한 광고 계정에서 사용할 수 있는 Facebook 페이지를 선택해 주세요.'
  if (values.instagramAssetId && !profiles.some((profile) => String(profile.id) === values.instagramAssetId)) errors.instagramAssetId = '선택한 페이지에 연결된 Instagram 프로필을 선택해 주세요.'
  if (values.imageSource === 'upload' && (!values.imageKey.trim() || values.imageKey.length > 1024)) errors.imageKey = '광고 소재로 사용할 이미지를 업로드해 주세요.'
  if (values.imageSource !== 'upload' && values.imageSource !== 'url') errors.imageSource = '이미지 등록 방식을 선택해 주세요.'
  for (const key of values.imageSource === 'url' ? ['imageUrl', 'linkUrl'] as const : ['linkUrl'] as const) {
    if (!validPublicHttpsUrl(values[key])) errors[key] = '외부에서 접근 가능한 HTTPS 주소를 입력해 주세요. 로그인 정보·#·로컬 주소는 사용할 수 없습니다.'
  }
  if (!['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US', 'BOOK_TRAVEL', 'DOWNLOAD', 'GET_QUOTE', 'APPLY_NOW', 'GET_OFFER'].includes(values.callToAction)) errors.callToAction = '광고 버튼을 선택해 주세요.'
  return errors
}

function validPublicHttpsUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value || value.length > 2048 || /\s/.test(value) || value.includes('#')) return false
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return url.protocol === 'https:' && Boolean(host) && !url.username && !url.password
      && host !== 'localhost' && !host.endsWith('.localhost') && !host.endsWith('.local')
      && host !== '[::1]' && host !== '[::]'
      && !/^(?:(?:0|10|127)\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)
  } catch { return false }
}

export function buildMetaAdRequest(values: MetaAdFormValues): MetaAdCreateRequest {
  const specialCountries = countryCodes(values.specialAdCategoryCountry)
  return {
    campaign: {
      name: values.campaignName.trim(), objective: values.objective,
      specialAdCategories: [...new Set(values.specialAdCategories)],
      ...(specialCountries.length > 0 ? { specialAdCategoryCountry: specialCountries } : {}),
    },
    adSet: {
      name: values.adSetName.trim(), dailyBudget: Number(values.dailyBudget), countries: countryCodes(values.countries),
      ageMin: Number(values.ageMin), ageMax: Number(values.ageMax),
      ...(values.objective === 'OUTCOME_SALES' ? { pixelId: values.pixelId.trim() } : {}),
    },
    ad: {
      name: values.adName.trim(), pageAssetId: Number(values.pageAssetId),
      ...(values.instagramAssetId ? { instagramAssetId: Number(values.instagramAssetId) } : {}),
      ...(values.imageSource === 'upload' ? { imageKey: values.imageKey.trim() } : { imageUrl: values.imageUrl.trim() }),
      linkUrl: values.linkUrl.trim(), message: values.message.trim(),
      headline: values.headline.trim(), ...(values.description.trim() ? { description: values.description.trim() } : {}),
      callToAction: values.callToAction,
    },
  }
}
