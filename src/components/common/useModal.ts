import { useContext, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ModalContext } from './ModalContext'
import type { ConfirmOptions, MessageOptions } from './modalStore'

export function useModal() {
  const store = useContext(ModalContext)
  if (!store) throw new Error('useModal must be used within ModalProvider')
  const { key: route } = useLocation()
  const owner = useMemo(() => Symbol(`modal-caller:${route}`), [route])
  useEffect(() => store.register(owner), [store, owner])
  return useMemo(() => ({
    confirm: (options: ConfirmOptions) => store.open(owner, route, 'confirm', options),
    info: (options: MessageOptions) => store.open(owner, route, 'info', options),
    error: (options: MessageOptions) => store.open(owner, route, 'error', options),
    success: (options: MessageOptions) => store.open(owner, route, 'success', options),
    dismiss: () => store.cancelOwner(owner),
  }), [store, owner, route])
}
