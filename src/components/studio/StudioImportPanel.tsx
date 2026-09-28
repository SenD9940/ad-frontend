import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudioOutput } from '../../studio/api'
import { DetailAlert, DetailHint, DetailPanel, DetailPanelBody, DetailPrimaryButton, DetailSecondaryButton, DetailStatus, PanelHeading } from '../../pages/workspace/WorkspaceDetailUI'

export type StudioImportOutput = Awaited<ReturnType<typeof getStudioOutput>>

export default function StudioImportPanel({ workspaceId, outputId, disabled, applied, onApply }: {
  workspaceId: number; outputId: string; disabled?: boolean; applied?: boolean
  onApply: (output: StudioImportOutput, signal: AbortSignal) => Promise<void>
}) {
  const [output, setOutput] = useState<StudioImportOutput | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const operation = useRef<AbortController | null>(null)
  useEffect(() => {
    let active = true
    if (!/^[1-9]\d*$/.test(outputId) || !Number.isSafeInteger(Number(outputId))) return
    getStudioOutput(workspaceId, Number(outputId)).then(data => { if (active) setOutput(data) })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : 'AI 결과를 불러오지 못했습니다.') })
    return () => { active = false; operation.current?.abort() }
  }, [workspaceId, outputId, attempt])
  const invalidId = !/^[1-9]\d*$/.test(outputId) || !Number.isSafeInteger(Number(outputId))
  async function apply() {
    if (!output || output.status !== 'SUCCEEDED' || disabled || pending.current || applied) return
    pending.current = true; setBusy(true); setError('')
    const controller = new AbortController()
    operation.current = controller
    try { await onApply(output, controller.signal) }
    catch (caught) { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'AI 결과를 적용하지 못했습니다.') }
    finally { pending.current = false; if (!controller.signal.aborted) setBusy(false) }
  }
  return <DetailPanel>
    <PanelHeading><div><h2>AI 스튜디오에서 가져오기</h2><p>저장된 결과를 적용한 뒤 등록 내용을 확인하세요.</p></div></PanelHeading>
    <DetailPanelBody style={{ display: 'grid', gap: 14 }}>
      {invalidId ? <DetailAlert role="alert">올바른 AI 결과를 선택해 주세요.</DetailAlert> : <>
        {!output && !error && <DetailStatus role="status">AI 결과를 불러오는 중…</DetailStatus>}
        {output && <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {output.imageUrl && <img src={output.imageUrl} alt="선택한 AI 결과" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 10 }} />}
          <div><strong>{output.title}</strong><DetailHint>{output.kind === 'DETAIL_PAGE' ? '판매용 상세페이지와 이미지' : '광고 소재 이미지'}</DetailHint></div>
          <DetailPrimaryButton type="button" disabled={output.status !== 'SUCCEEDED' || disabled || busy || applied} onClick={() => void apply()}>{busy ? '적용 중…' : applied ? '적용 완료' : '등록 화면에 적용'}</DetailPrimaryButton>
        </div>}
        {output && output.status !== 'SUCCEEDED' && <DetailAlert role="status">{output.status === 'PENDING' ? '이미지를 생성하고 있습니다. 내 결과에서 완료 여부를 확인해 주세요.' : '생성이 완료되지 않은 결과입니다. AI 스튜디오에서 다른 결과를 선택해 주세요.'}</DetailAlert>}
        {error && <DetailAlert role="alert">{error}</DetailAlert>}
        {!output && error && <DetailSecondaryButton type="button" onClick={() => { setError(''); setAttempt(value => value + 1) }}>다시 불러오기</DetailSecondaryButton>}
        {disabled && !busy && <DetailHint>연결된 계정과 필요한 자산을 먼저 선택해 주세요.</DetailHint>}
      </>}
      <DetailHint><Link to={`/workspaces/${workspaceId}/studio/outputs`}>AI 스튜디오 결과 목록</Link> · 적용만으로 광고나 상품이 등록되지는 않습니다.</DetailHint>
    </DetailPanelBody>
  </DetailPanel>
}
