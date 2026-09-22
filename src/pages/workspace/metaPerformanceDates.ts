import type { DateRange } from '../../types/metaAds'

export type PerformancePreset = 'today' | '7d' | '30d' | 'month'

export function validatePerformancePeriod(period: DateRange): string {
  const parseDay = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
    const timestamp = Date.parse(`${value}T00:00:00Z`)
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : NaN
  }
  const since = parseDay(period.since)
  const until = parseDay(period.until)
  if (!Number.isFinite(since) || !Number.isFinite(until)) return '시작일과 종료일을 올바른 날짜로 입력해 주세요.'
  if (since > until) return '종료일은 시작일보다 빠를 수 없습니다.'
  if ((until - since) / 86_400_000 + 1 > 366) return '조회 기간은 시작일과 종료일을 포함해 최대 366일입니다.'
  return ''
}

export function getPresetPeriod(preset: PerformancePreset): DateRange {
  const until = new Date()
  const since = new Date(until)
  if (preset === '7d') since.setDate(since.getDate() - 6)
  if (preset === '30d') since.setDate(since.getDate() - 29)
  if (preset === 'month') since.setDate(1)
  const format = (day: Date) => `${String(day.getFullYear()).padStart(4, '0')}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  return { since: format(since), until: format(until) }
}
