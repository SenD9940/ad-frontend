import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/http'
import { useErrorModal } from '../components/common/useErrorModal'

export function useNaverOrderResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0)
  const identity = useMemo(() => ({ key, revision }), [key, revision])
  const [result, setResult] = useState<{ identity: typeof identity; data: T | null; error: string } | null>(null)
  useEffect(() => {
    if (identity.key === null) return
    const controller = new AbortController()
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ identity, data, error: '' })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ identity, data: null, error: error instanceof ApiError ? error.message : '주문 정보를 불러오지 못했습니다.' })
    })
    return () => controller.abort()
  }, [identity, load])
  const current = result?.identity === identity && key !== null ? result : null
  useErrorModal(current?.error, '스마트스토어 조회 실패')
  return { data: current?.data ?? null, error: current?.error ?? '', loading: key !== null && !current, reload: useCallback(() => setRevision(value => value + 1), []) }
}
