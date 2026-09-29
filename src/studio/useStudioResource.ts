import { useErrorModal } from '../components/common/useErrorModal'
import { useCallback, useEffect, useState } from 'react'
import http from '../api/http'
import type { Api } from '../types/api'

export function useStudioResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0)
  const key = `${path}|${revision}`
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' })
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useErrorModal(state.key === key ? state.error : undefined, 'AI 스튜디오 정보를 불러오지 못했습니다')
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    http.get<Api<T>>(path, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ key, data: data.body })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : '정보를 불러오지 못했습니다.' })
    })
    return () => controller.abort()
  }, [path, key])
  return { data: state.key === key ? state.data : undefined, error: state.key === key ? state.error : undefined, loading: path !== null && state.key !== key, reload }
}
