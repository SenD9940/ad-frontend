import { createContext } from 'react'
import type { ModalStore } from './modalStore'

export const ModalContext = createContext<ModalStore | null>(null)
