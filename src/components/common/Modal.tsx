import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import Icon from './Icon'

export type ModalVariant = 'info' | 'error' | 'success' | 'confirm'

let scrollLocks = 0
let previousOverflow = ''
function lockScroll() {
  if (scrollLocks++ === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  return () => { if (--scrollLocks === 0) document.body.style.overflow = previousOverflow }
}

/** Controlled dialog for forms and operations that must stay open while saving. */
export default function Modal({ open, title, description, variant = 'info', children, footer, busy = false, onClose, size = 'md', returnFocus }: {
  open: boolean
  title: string
  description?: ReactNode
  variant?: ModalVariant
  children?: ReactNode
  footer?: ReactNode
  busy?: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  returnFocus?: HTMLElement | null
}) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const trigger = returnFocus ?? document.activeElement
    element.showModal()
    const unlock = lockScroll()
    // Reading starts at the title; Enter must never accidentally approve a write.
    heading.current?.focus({ preventScroll: true })
    return () => {
      element.close()
      unlock()
      if (trigger instanceof HTMLElement && trigger.isConnected && !trigger.matches(':disabled')) trigger.focus({ preventScroll: true })
    }
  }, [open, returnFocus])

  if (!open) return null
  return createPortal(<Surface ref={dialog} $size={size} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} aria-modal="true" aria-busy={busy || undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && !element.closest('[inert]'))
    const first = focusable[0], last = focusable.at(-1)
    if (!first) { event.preventDefault(); heading.current?.focus() }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }}>
    <Header>
      <SymbolBadge $variant={variant} aria-hidden="true"><Icon name={variant === 'success' ? 'check' : variant === 'error' ? 'shield' : 'help'} size={22} /></SymbolBadge>
      <Title id={`${id}-title`} ref={heading} tabIndex={-1}>{title}</Title>
      <CloseButton type="button" aria-label="모달 닫기" disabled={busy} onClick={onClose}><Icon name="close" size={20} /></CloseButton>
    </Header>
    <Body>
      {description && <Description id={`${id}-description`}>{description}</Description>}
      {children}
    </Body>
    {footer && <Footer>{footer}</Footer>}
  </Surface>, document.body)
}

const Surface = styled.dialog<{ $size: 'md' | 'lg' }>`
  inset: 0; margin: auto; padding: 0; width: calc(100% - 2rem);
  max-width: ${({ $size }) => $size === 'lg' ? '48rem' : '30rem'};
  max-height: calc(100dvh - 2rem); border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.125rem; background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text}; box-shadow: 0 24px 90px rgb(20 23 40 / 20%);
  overflow: auto; overscroll-behavior: contain; overflow-wrap: anywhere;
  &::backdrop { background: rgb(20 23 40 / 45%); backdrop-filter: blur(3px); }
  @media(max-width: 480px) { width: calc(100% - 1rem); max-height: calc(100dvh - 1rem); border-radius: .875rem; }
`
const Header = styled.div`display: flex; align-items: center; gap: .75rem; padding: 1.5rem 1.5rem 0; @media(max-width: 480px) { padding: 1rem 1rem 0; }`
const Title = styled.h2`flex: 1; min-width: 0; font-size: 1.125rem; line-height: 1.5; &:focus { outline: none; }`
const SymbolBadge = styled.span<{ $variant: ModalVariant }>`
  display: grid; place-items: center; flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: .75rem;
  color: ${({ theme, $variant }) => $variant === 'error' ? theme.colors.error : $variant === 'success' ? theme.colors.success : theme.colors.primary};
  background: ${({ theme, $variant }) => $variant === 'error' ? '#fef2f2' : $variant === 'success' ? '#f0fdf4' : theme.colors.primaryLight};
`
const CloseButton = styled.button`
  flex-shrink: 0; width: 2.75rem; padding: .5rem; border: 0; background: transparent; color: ${({ theme }) => theme.colors.textSecondary};
  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.surfaceMuted}; color: ${({ theme }) => theme.colors.text}; }
`
const Body = styled.div`display: grid; gap: 1rem; min-width: 0; padding: 1rem 1.5rem 1.5rem; @media(max-width: 480px) { padding: 1rem; }`
const Description = styled.div`color: ${({ theme }) => theme.colors.textSecondary}; font-size: .875rem; line-height: 1.8; white-space: pre-wrap;`
const Footer = styled.div`padding: 1rem 1.5rem; border-top: 1px solid ${({ theme }) => theme.colors.border}; background: ${({ theme }) => theme.colors.surfaceMuted}; @media(max-width: 480px) { padding: 1rem; }`
