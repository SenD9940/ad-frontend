import type { ReactNode } from 'react'
import Modal from '../../components/common/Modal'
import { StackBody } from './NaverProductFormUI'
import { DetailPanel, PanelHeading } from './WorkspaceDetailUI'

/** A single review before writing; unresolved outcomes remain on the page. */
export default function RegistrationReview({ recovering, description, busy, onClose, children }: {
  recovering: boolean
  description: string
  busy: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (recovering) return <DetailPanel><PanelHeading><h2>등록 결과 확인</h2></PanelHeading><StackBody>{children}</StackBody></DetailPanel>
  return <Modal open title="등록 내용 확인" description={description} variant="confirm" size="lg" busy={busy} onClose={onClose}>{children}</Modal>
}
