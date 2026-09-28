/* eslint-disable react-refresh/only-export-components -- Reusable React and styled form components. */
import type { ReactNode } from 'react'
import styled from 'styled-components'
import { DetailActionLink, DetailPanelBody } from './WorkspaceDetailUI'

export function ProductField({ name, label, hint, error, optional, children }: {
  name: string; label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode
}) {
  return <Field><Label htmlFor={`product-${name}`}>{label}{optional && <Optional>선택</Optional>}</Label>{children}
    {hint && <Hint id={`product-${name}-hint`}>{hint}</Hint>}
    {error && <FieldError id={`product-${name}-error`}>{error}</FieldError>}
  </Field>
}

export function fieldDescription(name: string, hint: boolean, error?: string): string | undefined {
  return [hint && `product-${name}-hint`, error && `product-${name}-error`].filter(Boolean).join(' ') || undefined
}

export const FormStack = styled.div`display: grid; gap: 24px; min-width: 0;`
export const StackBody = styled(DetailPanelBody)`display: grid; gap: 22px; min-width: 0;`
export const FieldGrid = styled.div`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; align-items: start; @media(max-width: 640px) { grid-template-columns: minmax(0, 1fr); }`
export const Field = styled.div`display: grid; gap: 8px; min-width: 0;`
export const Label = styled.label`display: flex; align-items: center; gap: 7px; flex-wrap: wrap; color: ${({ theme }) => theme.colors.text}; font-size: 13px; font-weight: 650; line-height: 1.6;`
export const Optional = styled.span`color: ${({ theme }) => theme.colors.textMuted}; font-size: 10px; font-weight: 450;`
export const Input = styled.input`width: 100%; min-width: 0; min-height: 44px; font-size: 13px; @media(max-width: 640px) { font-size: 16px; }`
export const Select = styled.select`width: 100%; min-width: 0; min-height: 44px; font-size: 13px; text-overflow: ellipsis; @media(max-width: 640px) { font-size: 16px; }`
export const Textarea = styled.textarea`width: 100%; min-width: 0; min-height: 124px; resize: vertical; font-size: 13px; line-height: 1.8; @media(max-width: 640px) { font-size: 16px; }`
export const Hint = styled.p`color: ${({ theme }) => theme.colors.textMuted}; font-size: 11px; line-height: 1.8; word-break: keep-all; overflow-wrap: anywhere;`
export const FieldError = styled.p`color: ${({ theme }) => theme.colors.error}; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere;`
export const Actions = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 12px;`
export const BackLink = styled(DetailActionLink)`border: 1px solid ${({ theme }) => theme.colors.border}; background: white; color: ${({ theme }) => theme.colors.textSecondary}; &:hover { background: #f7f8fc; color: ${({ theme }) => theme.colors.text}; }`
export const ExternalLink = styled.a`display: inline-flex; align-items: center; min-height: 42px; font-size: 13px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere;`
export const ReviewList = styled.dl`display: grid; gap: 0; margin: 0; > div { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 16px; padding: 14px 0; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; } dt { color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; } dd { margin: 0; color: ${({ theme }) => theme.colors.text}; font-size: 13px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; } @media(max-width: 560px) { > div { grid-template-columns: minmax(0, 1fr); gap: 6px; } }`
export const CheckLabel = styled.label`display: flex; align-items: flex-start; gap: 10px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 13px; line-height: 1.8; input { flex-shrink: 0; margin-top: 5px; width: 16px; height: 16px; }`
