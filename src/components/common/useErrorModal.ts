import { useEffect } from 'react'
import { useModal } from './useModal'

/** Observe terminal resource errors; keep field validation and background pending states inline. */
export function useErrorModal(message: string | null | undefined, title = '조회하지 못했습니다', enabled = true) {
  const modal = useModal()
  useEffect(() => {
    if (!enabled || !message) return
    void modal.error({ title, message })
    return modal.dismiss
  }, [enabled, message, title, modal])
}
