export function formatDate(value?: string | null) { return value ? new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}+09:00`).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }) : '—' }
export function number(value?: number) { return value == null ? '—' : value.toLocaleString('ko-KR') }
