import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/http'
import { listMetaAdPages, saveMetaAdPage } from '../api/metaAdPages'
import type { MetaDiscoveredAsset, PlatformAssetResponse } from '../types/platform'

type RequestIdentity = { key: string; attempt: number }
type PageState = { request: RequestIdentity; pages: MetaDiscoveredAsset[]; error: string }

export function useMetaAdPages(workspaceId: number, assetId: number | undefined, enabled: boolean) {
  const key = `${workspaceId}:${assetId}:${enabled}`
  const [state, setState] = useState<PageState | null>(null)
  const [choice, setChoice] = useState<{ request: RequestIdentity; id: string } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const request = useMemo(() => ({ key, attempt }), [key, attempt])
  const [savingRequest, setSavingRequest] = useState<RequestIdentity | null>(null)
  const [failure, setFailure] = useState<{ request: RequestIdentity; message: string } | null>(null)
  const generation = useRef(0)
  const pending = useRef(new Set<RequestIdentity>())
  const pages = state?.request === request ? state.pages : []
  const loading = enabled && assetId !== undefined && state?.request !== request
  const selectedId = choice?.request === request ? choice.id : ''
  const selectedPage = pages.find((page) => page.externalId === selectedId)
  const saving = savingRequest === request

  useEffect(() => {
    const requestId = ++generation.current
    if (enabled && assetId !== undefined) {
      listMetaAdPages(workspaceId, assetId).then((items) => {
        if (generation.current === requestId) setState({ request, pages: items, error: '' })
      }).catch((error: unknown) => {
        if (generation.current === requestId) setState({ request, pages: [], error: error instanceof ApiError ? error.message : '페이지 목록을 불러오지 못했습니다.' })
      })
    }
    return () => { generation.current += 1 }
  }, [workspaceId, assetId, enabled, request])

  function selectPage(id: string) {
    if (saving) return
    setChoice({ request, id })
    setFailure({ request, message: '' })
  }

  function reload() {
    if (saving || loading) return
    setState(null)
    setChoice({ request, id: '' })
    setFailure({ request, message: '' })
    setAttempt((current) => current + 1)
  }

  async function save(onSaved: (assets: PlatformAssetResponse[], page: PlatformAssetResponse) => void) {
    if (!selectedPage || pending.current.has(request) || !enabled || assetId === undefined || loading) return
    const requestId = generation.current
    pending.current.add(request)
    setSavingRequest(request)
    setFailure({ request, message: '' })
    try {
      const assets = await saveMetaAdPage(workspaceId, assetId, selectedPage.externalId)
      if (generation.current !== requestId) return
      const page = assets.find((item) => item.platformType === 'FACEBOOK' && item.assetType === 'PAGE' && item.externalId === selectedPage.externalId)
      if (!page || !Number.isSafeInteger(page.id) || page.id <= 0) throw new ApiError('저장 응답에서 선택한 페이지를 확인하지 못했습니다. 다시 조회해 주세요.')
      onSaved(assets, page)
    } catch (error: unknown) {
      if (generation.current === requestId) setFailure({ request, message: error instanceof ApiError ? error.message : '페이지를 저장하지 못했습니다. 다시 시도해 주세요.' })
    } finally {
      pending.current.delete(request)
      setSavingRequest((current) => current === request ? null : current)
    }
  }

  return { pages, loading, error: state?.request === request ? state.error : '', selectedId, selectedPage, saving,
    saveError: failure?.request === request ? failure.message : '', selectPage, reload, save }
}
