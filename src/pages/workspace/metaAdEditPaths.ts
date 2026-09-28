export function metaAdEditPath(workspaceId: string | number, options: {
  assetId?: number
  type?: 'ad' | 'ad-set' | 'campaign'
  objectId?: string
} = {}): string {
  const query = new URLSearchParams()
  if (options.assetId !== undefined) query.set('assetId', String(options.assetId))
  if (options.type) query.set('type', options.type)
  if (options.objectId) query.set('objectId', options.objectId)
  const search = query.toString()
  return `/workspaces/${workspaceId}/meta/ads/edit${search ? `?${search}` : ''}`
}
