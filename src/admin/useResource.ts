import { useEffect, useState } from 'react'
import { adminGet } from './api'

export function useResource<T>(path: string) {
  const [revision, setRevision] = useState(0)
  const key = `${path}|${revision}`
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' })
  useEffect(() => {
    const controller = new AbortController()
    adminGet<T>(path, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : '조회하지 못했습니다.' })
    })
    return () => controller.abort()
  }, [path, key])
  return { data: state.key === key ? state.data : undefined, error: state.key === key ? state.error : undefined, loading: state.key !== key, reload: () => setRevision(value => value + 1) }
}
