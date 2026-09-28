export type NaverDateRange = { since: string; until: string }
export type NaverPeriodPreset = 'today' | '7d' | '30d' | 'month'

export function koreaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function naverPresetPeriod(preset: NaverPeriodPreset): NaverDateRange {
  const until = koreaToday()
  const start = new Date(`${until}T00:00:00Z`)
  if (preset === '7d') start.setUTCDate(start.getUTCDate() - 6)
  if (preset === '30d') start.setUTCDate(start.getUTCDate() - 29)
  if (preset === 'month') start.setUTCDate(1)
  return { since: start.toISOString().slice(0, 10), until }
}

export function validateNaverPeriod({ since, until }: NaverDateRange): string {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
    const date = Date.parse(`${value}T00:00:00Z`)
    return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value ? date : NaN
  }
  const start = parse(since)
  const end = parse(until)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '시작일과 종료일을 올바르게 입력해 주세요.'
  if (start > end) return '종료일은 시작일보다 빠를 수 없습니다.'
  if ((end - start) / 86_400_000 + 1 > 31) return '조회 기간은 시작일과 종료일을 포함해 최대 31일입니다.'
  if (until > koreaToday()) return '한국 시간 기준 오늘까지 조회할 수 있습니다.'
  return ''
}
