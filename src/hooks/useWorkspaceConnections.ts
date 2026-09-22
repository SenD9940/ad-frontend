import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { getMe } from '../api/users'
import { getMyWorkspace } from '../api/workspaces'
import {
  discoverMetaAssets,
  listPlatformConnections,
  selectMetaAssets,
  startMetaAuthorization,
} from '../api/platformConnections'
import { META_ASSET_SELECT_MAX } from '../types/platform'
import type {
  MetaDiscoveredAsset,
  PlatformConnectionResponse,
} from '../types/platform'
import type { UserResponse } from '../types/user'
import type { WorkspaceResponse } from '../types/workspace'

export function assetKey(asset: {
  externalId: string
  platformType: string
  assetType: string
}): string {
  return `${asset.platformType}:${asset.assetType}:${asset.externalId}`
}

export function useWorkspaceConnections() {
  const { workspaceId: workspaceIdParam } = useParams()
  const workspaceId = Number(workspaceIdParam)
  const isValidWorkspaceId = Number.isSafeInteger(workspaceId) && workspaceId > 0

  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null)
  const [me, setMe] = useState<UserResponse | null>(null)
  const [connections, setConnections] = useState<PlatformConnectionResponse[]>([])
  const [discovery, setDiscovery] = useState<{
    connections: PlatformConnectionResponse[]
    assets: Record<number, MetaDiscoveredAsset[]>
    errors: Record<number, string>
  } | null>(null)
  const [selected, setSelected] = useState<Record<number, string[]>>({})
  const [loading, setLoading] = useState(isValidWorkspaceId)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const savePending = useRef(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const isOwner = Boolean(workspace && me && workspace.userId === me.id)
  const metaConnections = useMemo(
    () => connections.filter((item) => item.providerType === 'META'),
    [connections],
  )

  const discovered = discovery?.connections === metaConnections ? discovery.assets : {}
  const discoverErrors = discovery?.connections === metaConnections ? discovery.errors : {}

  useEffect(() => {
    if (!isValidWorkspaceId) {
      return
    }

    let cancelled = false
    Promise.all([
      getMe(),
      getMyWorkspace(workspaceId),
      listPlatformConnections(workspaceId),
    ])
      .then(([user, space, items]) => {
        if (!cancelled) {
          setMe(user)
          setWorkspace(space)
          setConnections(items)
          setSelected(savedAssetSelections(items))
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : '연결 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isValidWorkspaceId, workspaceId])

  useEffect(() => {
    const ready = metaConnections.filter((item) => !item.requiresReauth)
    if (!isValidWorkspaceId || ready.length === 0) {
      return
    }

    let cancelled = false
    Promise.allSettled(
      ready.map(async (connection) => ({
        id: connection.id,
        assets: await discoverMetaAssets(workspaceId, connection.id),
      })),
    ).then((results) => {
      if (cancelled) {
        return
      }
      const nextAssets: Record<number, MetaDiscoveredAsset[]> = {}
      const nextErrors: Record<number, string> = {}
      results.forEach((result, index) => {
        const connectionId = ready[index].id
        if (result.status === 'fulfilled') {
          nextAssets[connectionId] = [...new Map(
            result.value.assets.map((asset) => [assetKey(asset), asset]),
          ).values()]
        } else {
          const caught = result.reason
          nextErrors[connectionId] =
            caught instanceof ApiError
              ? caught.message
              : '사용 가능한 자산을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        }
      })
      setDiscovery({ connections: metaConnections, assets: nextAssets, errors: nextErrors })
    })

    return () => {
      cancelled = true
    }
  }, [isValidWorkspaceId, metaConnections, workspaceId])

  function toggleAsset(connectionId: number, key: string) {
    if (savingId !== null) return

    const availableKeys = new Set((discovered[connectionId] ?? []).map(assetKey))
    if (!availableKeys.has(key)) return

    setSaveError('')
    setSaveMessage('')
    const present = new Set((selected[connectionId] ?? []).filter((item) => availableKeys.has(item)))
    if (present.has(key)) {
      present.delete(key)
    } else {
      if (present.size >= META_ASSET_SELECT_MAX) {
        setSaveError(`한 번에 ${META_ASSET_SELECT_MAX}개까지 선택할 수 있습니다.`)
        return
      }
      present.add(key)
    }
    setSelected((current) => ({ ...current, [connectionId]: [...present] }))
  }

  function selectAllAssets(connectionId: number) {
    if (savingId !== null) return

    const keys = [...new Set((discovered[connectionId] ?? []).map(assetKey))]
    setSaveMessage('')
    if (keys.length > META_ASSET_SELECT_MAX) {
      setSaveError(`사용 가능한 자산이 ${keys.length}개입니다. 한 번에 ${META_ASSET_SELECT_MAX}개까지 저장할 수 있으므로 사용할 자산을 개별 선택해 주세요.`)
      return
    }

    setSaveError('')
    setSelected((current) => ({ ...current, [connectionId]: keys }))
  }

  function clearAssetSelection(connectionId: number) {
    if (savingId !== null) return

    setSaveError('')
    setSaveMessage('')
    setSelected((current) => ({ ...current, [connectionId]: [] }))
  }

  async function connectMeta() {
    if (!isValidWorkspaceId || !isOwner) {
      setError('워크스페이스 소유자만 Meta 계정을 연결할 수 있습니다.')
      return
    }
    setConnecting(true)
    setError('')
    try {
      const response = await startMetaAuthorization(workspaceId)
      window.location.assign(response.authorizationUrl)
    } catch (caught) {
      setConnecting(false)
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Meta 연결을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  async function saveAssets(connectionId: number): Promise<{ hasSavedAdAccount: boolean } | null> {
    if (savePending.current || !isValidWorkspaceId) return null

    const available = discovered[connectionId] ?? []
    const chosen = new Set(selected[connectionId] ?? [])
    const assets = available
      .filter((item) => chosen.has(assetKey(item)))
      .map((item) => ({
        externalId: item.externalId,
        platformType: item.platformType,
        assetType: item.assetType,
      }))
    if (assets.length === 0) {
      setSaveError('저장할 자산을 선택하세요.')
      return null
    }
    if (assets.length > META_ASSET_SELECT_MAX) {
      setSaveError(`한 번에 ${META_ASSET_SELECT_MAX}개까지 선택할 수 있습니다.`)
      return null
    }

    savePending.current = true
    setSavingId(connectionId)
    setSaveError('')
    setSaveMessage('')
    let saved = false
    try {
      await selectMetaAssets(workspaceId, connectionId, assets)
      saved = true
      const items = await listPlatformConnections(workspaceId)
      const hasSavedAdAccount = items.some((connection) => (
        connection.providerType === 'META' && connection.assets.some((asset) => (
          asset.platformType === 'FACEBOOK' && asset.assetType === 'AD_ACCOUNT'
        ))
      ))
      setConnections(items)
      setSelected(savedAssetSelections(items))
      setSaveMessage(hasSavedAdAccount
        ? '선택한 자산을 저장했습니다.'
        : '선택한 자산을 저장했습니다. 광고 성과를 확인하려면 광고 계정을 선택하고 저장해 주세요. 페이지와 프로필만으로는 광고 성과를 조회할 수 없습니다.')
      return { hasSavedAdAccount }
    } catch (caught) {
      setSaveError(
        saved
          ? '자산은 저장되었지만 저장된 목록을 확인하지 못했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.'
          : caught instanceof ApiError
          ? caught.message
          : '자산을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      return null
    } finally {
      savePending.current = false
      setSavingId(null)
    }
  }

  return {
    workspaceId,
    isValidWorkspaceId,
    workspace,
    isOwner,
    metaConnections,
    discovered,
    discoverErrors,
    selected,
    loading,
    error,
    connecting,
    savingId,
    saveError,
    saveMessage,
    toggleAsset,
    selectAllAssets,
    clearAssetSelection,
    connectMeta,
    saveAssets,
  }
}

function savedAssetSelections(connections: PlatformConnectionResponse[]): Record<number, string[]> {
  return Object.fromEntries(
    connections
      .filter((connection) => connection.providerType === 'META')
      .map((connection) => [connection.id, connection.assets.map(assetKey)]),
  )
}
