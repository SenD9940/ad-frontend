import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { MetaAdImageFileError, uploadMetaAdImage } from '../../api/metaAdImages'
import type { MetaAdImageUploadResponse } from '../../api/metaAdImages'
import { DetailAlert, DetailBadge, DetailHint, DetailSecondaryButton } from './WorkspaceDetailUI'

export type UploadedMetaAdImage = MetaAdImageUploadResponse & {
  workspaceId: number
  assetId: number
  file: File
  fileName: string
  studioOutputId?: number
}

export type MetaAdImageInputProps = {
  workspaceId: number
  assetId: number
  disabled: boolean
  value: UploadedMetaAdImage | null
  onChange: (value: UploadedMetaAdImage | null) => void
  onBusyChange: (busy: boolean) => void
  error?: string
}

export function MetaAdImageInput({ workspaceId, assetId, disabled, value, onChange, onBusyChange, error }: MetaAdImageInputProps) {
  const [chosenFile, setChosenFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const active = useRef(true)
  const pending = useRef(false)
  const generation = useRef(0)
  const uploadController = useRef<AbortController | null>(null)
  const busyCallback = useRef(onBusyChange)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => { busyCallback.current = onBusyChange }, [onBusyChange])
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      generation.current += 1
      uploadController.current?.abort()
      if (pending.current) busyCallback.current(false)
      pending.current = false
    }
  }, [])

  async function upload(file: File) {
    if (disabled || pending.current) return
    const currentGeneration = ++generation.current
    const controller = new AbortController()
    uploadController.current = controller
    const isCurrent = () => active.current && currentGeneration === generation.current
    pending.current = true
    setBusy(true)
    busyCallback.current(true)
    setProgress(0)
    setUploadError(null)
    setCanRetry(false)
    setChosenFile(file)
    onChange(null)
    try {
      const uploaded = await uploadMetaAdImage(workspaceId, assetId, file, (percent) => {
        if (isCurrent()) setProgress(percent)
      }, controller.signal)
      if (isCurrent()) onChange({ ...uploaded, workspaceId, assetId, file, fileName: file.name })
    } catch (caught) {
      if (isCurrent()) {
        setUploadError(caught instanceof Error ? caught.message : '이미지를 업로드하지 못했습니다. 다시 시도해 주세요.')
        setCanRetry(!(caught instanceof MetaAdImageFileError))
      }
    } finally {
      if (isCurrent()) {
        pending.current = false
        uploadController.current = null
        setBusy(false)
        busyCallback.current(false)
      }
    }
  }

  function remove() {
    if (disabled || pending.current) return
    generation.current += 1
    setChosenFile(null)
    setUploadError(null)
    setCanRetry(false)
    setProgress(0)
    if (fileInput.current) fileInput.current.value = ''
    onChange(null)
  }

  const displayedError = uploadError || error
  const selectedFile = value?.file || chosenFile
  return (
    <ImageField aria-busy={busy}>
      <FieldLabel htmlFor="ad-create-image-file">광고 이미지</FieldLabel>
      <UploadBox>
        {value && <PreviewFrame><MetaAdImagePreview file={value.file} alt="업로드한 광고 소재 미리보기" /></PreviewFrame>}
        <UploadContent>
          <DetailHint id="ad-create-image-file-hint">JPEG·PNG, 최대 10MiB · 가로·세로 각각 10,000px 이하, 총 2,500만 픽셀 이하</DetailHint>
          <FileInput ref={fileInput} id="ad-create-image-file" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" disabled={disabled || busy} aria-required="true" aria-invalid={Boolean(displayedError)} aria-describedby={`ad-create-image-file-hint${displayedError ? ' ad-create-image-file-error' : ''}`} onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) void upload(file)
          }} />
          {selectedFile && <FileDetails><strong>{selectedFile.name}</strong><span>{formatSize(selectedFile.size)}</span></FileDetails>}
          {busy && <ProgressStatus role="status" aria-live="polite"><span>{progress >= 100 ? '업로드한 이미지를 처리하고 있습니다…' : `이미지 업로드 중 · ${progress}%`}</span><progress aria-label="이미지 업로드 진행률" max={100} value={progress} /></ProgressStatus>}
          {!busy && value && <DetailBadge $tone="success">업로드 완료 · 광고 소재로 사용합니다</DetailBadge>}
          {!busy && selectedFile && <FileActions>{canRetry && chosenFile && <DetailSecondaryButton type="button" disabled={disabled} onClick={() => void upload(chosenFile)}>업로드 다시 시도</DetailSecondaryButton>}<DetailSecondaryButton type="button" disabled={disabled} onClick={remove}>이미지 선택 해제</DetailSecondaryButton></FileActions>}
        </UploadContent>
      </UploadBox>
      {displayedError && <DetailAlert id="ad-create-image-file-error" role="alert">{displayedError}</DetailAlert>}
    </ImageField>
  )
}

export function MetaAdImagePreview({ file, alt = '광고 소재 미리보기' }: { file: File; alt?: string }) {
  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    const image = imageRef.current
    if (image) image.src = objectUrl
    return () => {
      if (image) image.removeAttribute('src')
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])
  return <PreviewImage ref={imageRef} alt={alt} />
}

function formatSize(size: number): string {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MiB` : `${Math.max(1, Math.round(size / 1024))} KiB`
}

const ImageField = styled.div`display:flex;flex-direction:column;gap:.65rem;min-width:0;`
const FieldLabel = styled.label`font-size:.8125rem;font-weight:650;`
const UploadBox = styled.div`display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1px dashed ${({ theme }) => theme.colors.border};border-radius:.75rem;background:#fafaff;min-width:0;@media(max-width:600px){flex-direction:column;}`
const UploadContent = styled.div`display:flex;flex-direction:column;align-items:flex-start;gap:.75rem;flex:1;min-width:0;width:100%;`
const FileInput = styled.input`width:100%;min-width:0;font-size:.75rem;color:${({ theme }) => theme.colors.textSecondary};&::file-selector-button{margin-right:.6rem;padding:.55rem .8rem;border:1px solid ${({ theme }) => theme.colors.border};border-radius:.5rem;background:white;color:${({ theme }) => theme.colors.text};font:inherit;font-weight:600;cursor:pointer;}&:disabled::file-selector-button{cursor:not-allowed;}`
const FileDetails = styled.div`display:flex;align-items:baseline;flex-wrap:wrap;gap:.5rem;font-size:.75rem;min-width:0;strong{font-weight:600;overflow-wrap:anywhere;}span{color:${({ theme }) => theme.colors.textMuted};}`
const FileActions = styled.div`display:flex;flex-wrap:wrap;gap:.5rem;`
const ProgressStatus = styled.div`display:flex;flex-direction:column;gap:.5rem;width:100%;font-size:.8125rem;color:${({ theme }) => theme.colors.textSecondary};progress{width:100%;height:.4rem;accent-color:${({ theme }) => theme.colors.primary};}`
const PreviewFrame = styled.div`width:8rem;max-width:100%;flex-shrink:0;`
const PreviewImage = styled.img`display:block;width:100%;max-height:22rem;object-fit:contain;border:1px solid ${({ theme }) => theme.colors.border};border-radius:.625rem;background:#f4f5f8;`
