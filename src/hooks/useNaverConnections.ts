import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { getMe } from '../api/users'
import { getMyWorkspace } from '../api/workspaces'
import { connectNaver, discoverNaverChannels, listNaverConnections, selectNaverChannels } from '../api/naverConnections'
import { NAVER_CHANNEL_SELECT_MAX } from '../types/platform'
import type { NaverChannel, NaverConnectRequest, PlatformConnectionResponse } from '../types/platform'

export function useNaverConnections() {
  const { workspaceId: workspaceIdParam } = useParams()
  const workspaceId = Number(workspaceIdParam)
  const isValidWorkspaceId = Number.isSafeInteger(workspaceId) && workspaceId > 0
  const [isOwner, setIsOwner] = useState(false)
  const [connections, setConnections] = useState<PlatformConnectionResponse[]>([])
  const [loading, setLoading] = useState(isValidWorkspaceId)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState<Record<number, NaverChannel[]>>({})
  const [channelErrors, setChannelErrors] = useState<Record<number, string>>({})
  const [channelLoading, setChannelLoading] = useState<Record<number, boolean>>({})
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [connectMessage, setConnectMessage] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const active = useRef(false)
  const lifecycle = useRef(0)
  const mutationVersion = useRef(0)
  const connectionIndex = useRef(new Map<number, PlatformConnectionResponse>())
  const channelRequests = useRef(new Map<number, AbortController>())
  const listRequest = useRef<AbortController | null>(null)
  const pendingRequests = useRef(new Set<AbortController>())
  const mutationBusy = useRef(false)
  const loadedWorkspaceId = useRef(workspaceId)

  const applyConnections = useCallback((items: PlatformConnectionResponse[]) => {
    const naver = items.filter((item) => item.providerType === 'NAVER')
    connectionIndex.current = new Map(naver.map((item) => [item.id, item]))
    const ids = new Set(naver.map((item) => item.id))
    for (const [id, controller] of channelRequests.current) {
      if (!ids.has(id) || connectionIndex.current.get(id)?.requiresReauth) {
        controller.abort()
        channelRequests.current.delete(id)
      }
    }
    const pendingIds = new Set(channelRequests.current.keys())
    setConnections(naver)
    setSelected((current) => Object.fromEntries(naver.map((item) => [item.id,
      item.requiresReauth ? [] : current[item.id] ?? savedChannelNos(item),
    ])))
    setChannels((current) => retainConnections(current, naver.filter((item) => !item.requiresReauth)))
    setChannelErrors((current) => retainConnections(current, naver))
    setChannelLoading((current) => Object.fromEntries(naver.map((item) => [item.id,
      !item.requiresReauth && Boolean(current[item.id]) && pendingIds.has(item.id),
    ])))
  }, [])

  // A list response started before a connect/save may not replace the newer mutation.
  const refreshConnections = useCallback(async (): Promise<boolean> => {
    listRequest.current?.abort()
    const controller = new AbortController()
    listRequest.current = controller
    pendingRequests.current.add(controller)
    const version = mutationVersion.current
    const cycle = lifecycle.current
    try {
      const items = await listNaverConnections(workspaceId, controller.signal)
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current || version !== mutationVersion.current) return false
      applyConnections(items)
      return true
    } catch {
      return false
    } finally {
      pendingRequests.current.delete(controller)
      if (listRequest.current === controller) listRequest.current = null
    }
  }, [applyConnections, workspaceId])

  const requestChannels = useCallback(async (connectionId: number): Promise<void> => {
    const connection = connectionIndex.current.get(connectionId)
    if (!active.current || !connection || connection.requiresReauth) return
    channelRequests.current.get(connectionId)?.abort()
    const controller = new AbortController()
    const cycle = lifecycle.current
    channelRequests.current.set(connectionId, controller)
    pendingRequests.current.add(controller)
    setChannelLoading((current) => ({ ...current, [connectionId]: true }))
    setChannelErrors((current) => ({ ...current, [connectionId]: '' }))
    const currentRequest = () => active.current && cycle === lifecycle.current && !controller.signal.aborted && channelRequests.current.get(connectionId) === controller
    try {
      const items = await discoverNaverChannels(workspaceId, connectionId, controller.signal)
      if (!currentRequest()) return
      const available = new Set(items.map((item) => item.channelNo))
      setChannels((current) => ({ ...current, [connectionId]: items }))
      setSelected((current) => ({ ...current, [connectionId]: [...new Set(current[connectionId] ?? [])].filter((no) => available.has(no)).slice(0, NAVER_CHANNEL_SELECT_MAX) }))
    } catch (caught) {
      if (!currentRequest()) return
      setChannels((current) => ({ ...current, [connectionId]: [] }))
      setChannelErrors((current) => ({ ...current, [connectionId]: errorMessage(caught, '채널을 불러오지 못했습니다. 다시 조회해 주세요.') }))
      if (isPermissionError(caught)) setIsOwner(false)
      // The server can set requires_reauth while refreshing a token. Read that state
      // without automatically repeating the failed external request.
      await refreshConnections()
    } finally {
      pendingRequests.current.delete(controller)
      if (currentRequest()) {
        channelRequests.current.delete(connectionId)
        setChannelLoading((current) => ({ ...current, [connectionId]: false }))
      }
    }
  }, [refreshConnections, workspaceId])

  const reload = useCallback(async (): Promise<void> => {
    if (!isValidWorkspaceId || !active.current || mutationBusy.current) return
    listRequest.current?.abort()
    for (const request of channelRequests.current.values()) request.abort()
    channelRequests.current.clear()
    const controller = new AbortController()
    const cycle = lifecycle.current
    const version = mutationVersion.current
    listRequest.current = controller
    pendingRequests.current.add(controller)
    setLoading(true)
    setError('')
    try {
      const [me, workspace, items] = await Promise.all([
        getMe(), getMyWorkspace(workspaceId), listNaverConnections(workspaceId, controller.signal),
      ])
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current || version !== mutationVersion.current) return
      setIsOwner(workspace.userId === me.id)
      applyConnections(items)
      for (const item of items) if (!item.requiresReauth) void requestChannels(item.id)
    } catch (caught) {
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current) return
      setError(errorMessage(caught, '네이버 연결 정보를 불러오지 못했습니다. 다시 시도해 주세요.'))
      if (isPermissionError(caught)) setIsOwner(false)
    } finally {
      pendingRequests.current.delete(controller)
      if (active.current && !controller.signal.aborted && cycle === lifecycle.current) setLoading(false)
      if (listRequest.current === controller) listRequest.current = null
    }
  }, [applyConnections, isValidWorkspaceId, requestChannels, workspaceId])

  useEffect(() => {
    active.current = true
    const cycle = ++lifecycle.current
    const pending = pendingRequests.current
    const channelPending = channelRequests.current
    const workspaceChanged = loadedWorkspaceId.current !== workspaceId
    loadedWorkspaceId.current = workspaceId
    if (workspaceChanged) {
      connectionIndex.current.clear()
      mutationBusy.current = false
      mutationVersion.current += 1
    }
    // Keep setup/cleanup symmetric under Strict Mode; cancelled setup never loads.
    queueMicrotask(() => {
      if (!active.current || cycle !== lifecycle.current) return
      if (workspaceChanged) {
        setIsOwner(false)
        setConnections([])
        setChannels({})
        setChannelErrors({})
        setChannelLoading({})
        setSelected({})
        setLoading(isValidWorkspaceId)
        setError('')
        setConnecting(false)
        setConnectError('')
        setConnectMessage('')
        setSavingId(null)
        setSaveError('')
        setSaveMessage('')
      }
      void reload()
    })
    return () => {
      active.current = false
      lifecycle.current += 1
      for (const controller of pending) controller.abort()
      pending.clear()
      channelPending.clear()
    }
  }, [isValidWorkspaceId, reload, workspaceId])

  async function connect(request: NaverConnectRequest): Promise<boolean> {
    if (mutationBusy.current || loading || !active.current) return false
    if (!isValidWorkspaceId || !isOwner) {
      setConnectError('워크스페이스 소유자만 네이버 계정을 연결할 수 있습니다.')
      return false
    }
    if (!request.clientId.trim() || !request.clientSecret || (request.tokenType === 'SELLER' && !request.accountId?.trim())) {
      setConnectError('애플리케이션 ID와 시크릿, 인증 유형에 필요한 판매자 정보를 입력해 주세요.')
      return false
    }
    mutationBusy.current = true
    mutationVersion.current += 1
    listRequest.current?.abort()
    const controller = new AbortController()
    const cycle = lifecycle.current
    pendingRequests.current.add(controller)
    setConnecting(true)
    setConnectError('')
    setConnectMessage('')
    try {
      const item = await connectNaver(workspaceId, request, controller.signal)
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current) return false
      mutationVersion.current += 1
      listRequest.current?.abort()
      channelRequests.current.get(item.id)?.abort()
      channelRequests.current.delete(item.id)
      const existing = connectionIndex.current.has(item.id)
      applyConnections([...connectionIndex.current.values()].filter((current) => current.id !== item.id).concat(item))
      setSelected((current) => ({ ...current, [item.id]: savedChannelNos(item) }))
      setConnectMessage(existing ? '네이버 계정의 인증 정보를 갱신했습니다. 사용할 채널을 확인해 주세요.' : '네이버 계정이 연결되었습니다. 사용할 스마트스토어 채널을 선택해 주세요.')
      void requestChannels(item.id)
      return true
    } catch (caught) {
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current) return false
      setConnectError(errorMessage(caught, '네이버 계정을 연결하지 못했습니다. 입력 정보를 확인하고 다시 시도해 주세요.'))
      if (isPermissionError(caught)) setIsOwner(false)
      return false
    } finally {
      pendingRequests.current.delete(controller)
      if (active.current && cycle === lifecycle.current) {
        mutationBusy.current = false
        setConnecting(false)
      }
    }
  }

  function canSelect(connectionId: number): boolean {
    return active.current && !loading && !mutationBusy.current && !channelRequests.current.has(connectionId)
      && Boolean(connectionIndex.current.get(connectionId) && !connectionIndex.current.get(connectionId)?.requiresReauth)
      && !channelErrors[connectionId]
  }

  function toggleChannel(connectionId: number, channelNo: number) {
    if (!canSelect(connectionId)) return
    const available = new Set((channels[connectionId] ?? []).map((channel) => channel.channelNo))
    if (!available.has(channelNo)) return
    const chosen = new Set((selected[connectionId] ?? []).filter((no) => available.has(no)))
    if (chosen.has(channelNo)) chosen.delete(channelNo)
    else {
      if (chosen.size >= NAVER_CHANNEL_SELECT_MAX) {
        setSaveError(`한 번에 ${NAVER_CHANNEL_SELECT_MAX}개까지 선택할 수 있습니다.`)
        return
      }
      chosen.add(channelNo)
    }
    setSaveError('')
    setSaveMessage('')
    setSelected((current) => ({ ...current, [connectionId]: [...chosen] }))
  }

  function selectAllChannels(connectionId: number) {
    if (!canSelect(connectionId)) return
    const available = [...new Set((channels[connectionId] ?? []).map((channel) => channel.channelNo))]
    setSaveMessage('')
    if (available.length > NAVER_CHANNEL_SELECT_MAX) {
      setSaveError(`사용 가능한 채널이 ${available.length}개입니다. 한 번에 ${NAVER_CHANNEL_SELECT_MAX}개까지 저장할 수 있으므로 사용할 채널을 개별 선택해 주세요.`)
      return
    }
    setSaveError('')
    setSelected((current) => ({ ...current, [connectionId]: available }))
  }

  function clearChannelSelection(connectionId: number) {
    if (!canSelect(connectionId)) return
    setSaveError('')
    setSaveMessage('')
    setSelected((current) => ({ ...current, [connectionId]: [] }))
  }

  function reloadChannels(connectionId: number) {
    if (mutationBusy.current || loading) return
    void requestChannels(connectionId)
  }

  async function saveChannels(connectionId: number): Promise<void> {
    if (!canSelect(connectionId)) return
    const available = new Set((channels[connectionId] ?? []).map((channel) => channel.channelNo))
    const chosen = [...new Set(selected[connectionId] ?? [])].filter((no) => available.has(no))
    if (chosen.length === 0 || chosen.length > NAVER_CHANNEL_SELECT_MAX) {
      setSaveError(`저장할 채널을 1개 이상, ${NAVER_CHANNEL_SELECT_MAX}개 이하로 선택해 주세요.`)
      return
    }
    mutationBusy.current = true
    mutationVersion.current += 1
    listRequest.current?.abort()
    const controller = new AbortController()
    const cycle = lifecycle.current
    pendingRequests.current.add(controller)
    setSavingId(connectionId)
    setSaveError('')
    setSaveMessage('')
    try {
      const saved = await selectNaverChannels(workspaceId, connectionId, chosen, controller.signal)
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current) return
      mutationVersion.current += 1
      listRequest.current?.abort()
      const connection = connectionIndex.current.get(connectionId)
      if (connection) {
        const assets = saved.map((channel) => ({ id: channel.assetId, externalId: String(channel.channelNo), name: channel.name,
          platformType: 'NAVER_SMART_STORE' as const, assetType: 'STORE' as const, facebookPageId: null }))
        applyConnections([...connectionIndex.current.values()].map((item) => item.id === connectionId ? { ...item, assets } : item))
      }
      setSelected((current) => ({ ...current, [connectionId]: saved.map((channel) => channel.channelNo)
        .filter((no) => available.has(no)).slice(0, NAVER_CHANNEL_SELECT_MAX) }))
      setSaveMessage('선택한 스마트스토어 채널을 저장했습니다. 기존에 저장한 다른 채널도 유지됩니다.')
      const refreshed = await refreshConnections()
      if (!refreshed && active.current && !controller.signal.aborted && cycle === lifecycle.current) {
        setSaveError('채널은 저장했지만 연결 목록을 갱신하지 못했습니다. 다시 조회해 주세요.')
      }
    } catch (caught) {
      if (!active.current || controller.signal.aborted || cycle !== lifecycle.current) return
      setSaveError(errorMessage(caught, '채널을 저장하지 못했습니다. 다시 시도해 주세요.'))
      if (isPermissionError(caught)) setIsOwner(false)
      await refreshConnections()
      // A stale selection or changed credentials requires a fresh discovery. Leave
      // retries to the user for permission/rate-limit/server failures.
      if (caught instanceof ApiError && caught.resultCode === 400 && /다시 조회|접근할 수 없는|접근할 수 없습니다/.test(caught.message)) {
        void requestChannels(connectionId)
      }
    } finally {
      pendingRequests.current.delete(controller)
      if (active.current && cycle === lifecycle.current) {
        mutationBusy.current = false
        setSavingId(null)
      }
    }
  }

  return { workspaceId, isValidWorkspaceId, isOwner, connections, loading, error, reload,
    channels, channelErrors, channelLoading, selected, connecting, connectError, connectMessage,
    connect, savingId, saveError, saveMessage, toggleChannel, selectAllChannels,
    clearChannelSelection, saveChannels, reloadChannels }
}

function savedChannelNos(connection: PlatformConnectionResponse): number[] {
  return [...new Set(connection.assets.filter((asset) => asset.platformType === 'NAVER_SMART_STORE' && asset.assetType === 'STORE')
    .map((asset) => Number(asset.externalId)).filter((no) => Number.isSafeInteger(no) && no > 0))].slice(0, NAVER_CHANNEL_SELECT_MAX)
}

function retainConnections<T>(values: Record<number, T>, connections: PlatformConnectionResponse[]): Record<number, T> {
  return Object.fromEntries(connections.filter((item) => Object.hasOwn(values, item.id)).map((item) => [item.id, values[item.id]]))
}

function isPermissionError(error: unknown): boolean {
  return error instanceof ApiError && (error.resultCode === 3403 || error.status === 403)
}

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  if (isPermissionError(error)) return '워크스페이스에 접근할 권한이 없습니다. 소유자에게 권한을 확인해 주세요.'
  if (error.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
  return error.message || fallback
}
