import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import Modal from './Modal'
import { ModalContext } from './ModalContext'
import { createModalStore } from './modalStore'

const titles = { info: '안내', error: '처리하지 못했습니다', success: '완료했습니다', confirm: '진행하시겠어요?' }

export default function ModalProvider({ children }: { children: ReactNode }) {
  const { key: route } = useLocation()
  const [store] = useState(() => createModalStore(route))
  const current = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useLayoutEffect(() => store.setRoute(route), [store, route])
  useEffect(() => () => store.clear(), [store])
  return <ModalContext.Provider value={store}>
    {children}
    {current && current.route === route && <Modal key={current.id} open title={current.title ?? titles[current.variant]} variant={current.variant} description={current.message} returnFocus={current.returnFocus} onClose={() => store.settle(current.id, false)} footer={
      <Actions>
        {current.variant === 'confirm' && <Button type="button" $secondary onClick={() => store.settle(current.id, false)}>{current.cancelLabel ?? '취소'}</Button>}
        <Button type="button" $danger={current.danger} onClick={() => store.settle(current.id, true)}>{current.confirmLabel ?? '확인'}</Button>
      </Actions>
    } />}
  </ModalContext.Provider>
}

const Actions = styled.div`display: flex; justify-content: flex-end; gap: .625rem; flex-wrap: wrap;`
const Button = styled.button<{ $secondary?: boolean; $danger?: boolean }>`
  min-width: 5.5rem; font-size: .875rem;
  background: ${({ theme, $secondary, $danger }) => $secondary ? theme.colors.surface : $danger ? theme.colors.error : theme.colors.primary};
  color: ${({ theme, $secondary }) => $secondary ? theme.colors.textSecondary : theme.colors.onPrimary};
  border-color: ${({ theme, $secondary }) => $secondary ? theme.colors.border : 'transparent'};
  &:hover:not(:disabled) { background: ${({ theme, $secondary, $danger }) => $secondary ? theme.colors.surfaceMuted : $danger ? '#991b1b' : theme.colors.primaryHover}; }
`
