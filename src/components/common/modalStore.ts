import type { ReactNode } from 'react'
import type { ModalVariant } from './Modal'

export type MessageOptions = { title?: string; message: ReactNode; confirmLabel?: string; returnFocus?: HTMLElement | null }
export type ConfirmOptions = MessageOptions & { cancelLabel?: string; danger?: boolean }
export type ModalRequest = ConfirmOptions & {
  id: number; owner: symbol; route: string; variant: ModalVariant; resolve: (accepted: boolean) => void
}

/** Promises always settle, including when the caller unmounts or navigation cancels a dialog. */
export function createModalStore(initialRoute: string) {
  let route = initialRoute
  let sequence = 0
  let queue: ModalRequest[] = []
  const owners = new Set<symbol>()
  const listeners = new Set<() => void>()
  const publish = () => listeners.forEach(listener => listener())
  function cancelWhere(matches: (request: ModalRequest) => boolean) {
    const cancelled = queue.filter(matches)
    if (!cancelled.length) return
    queue = queue.filter(request => !matches(request))
    cancelled.forEach(request => request.resolve(false))
    publish()
  }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => queue[0] ?? null,
    register(owner: symbol) { owners.add(owner); return () => { owners.delete(owner); cancelWhere(request => request.owner === owner) } },
    cancelOwner(owner: symbol) { cancelWhere(request => request.owner === owner) },
    setRoute(nextRoute: string) { route = nextRoute; cancelWhere(request => request.route !== route) },
    clear() { cancelWhere(() => true) },
    open(owner: symbol, requestRoute: string, variant: ModalVariant, options: ConfirmOptions) {
      if (!owners.has(owner) || requestRoute !== route) return Promise.resolve(false)
      return new Promise<boolean>(resolve => {
        queue = [...queue, { ...options, id: ++sequence, owner, route, variant, resolve }]
        publish()
      })
    },
    settle(id: number, accepted: boolean) {
      const request = queue.find(item => item.id === id)
      if (!request) return
      // Several panels can fail from the same outage. Acknowledge their identical
      // error together, while keeping independent caller cancellation intact.
      const settled = queue.filter(item => item === request || (request.variant === 'error' && item.variant === 'error' && typeof request.message === 'string' && item.message === request.message && item.route === request.route))
      queue = queue.filter(item => !settled.includes(item))
      settled.forEach(item => item.resolve(accepted))
      publish()
    },
  }
}
export type ModalStore = ReturnType<typeof createModalStore>
