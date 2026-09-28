import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { DetailAlert, DetailBadge, DetailHint, DetailSecondaryButton } from './WorkspaceDetailUI'
import { Actions, Field, Label } from './NaverProductFormUI'

export function NaverProductImages({ images, disabled, error, onChange }: {
  images: File[]; disabled: boolean; error?: string; onChange: (images: File[]) => void
}) {
  const [fileError, setFileError] = useState('')
  function add(files: File[]) {
    if (disabled || !files.length) return
    if (images.length + files.length > 10) { setFileError('대표 이미지 1장과 추가 이미지 9장까지 등록할 수 있습니다.'); return }
    if (files.some((file) => !['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024)) {
      setFileError('10MiB 이하의 JPEG 또는 PNG 파일을 선택해 주세요.'); return
    }
    if ([...images, ...files].reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) {
      setFileError('이미지 전체 용량은 20MiB 이하여야 합니다.'); return
    }
    onChange([...images, ...files])
    setFileError('')
  }
  return <Field>
    <Label htmlFor="product-images">상품 이미지</Label>
    <DetailHint id="product-images-hint">첫 번째 이미지가 대표 이미지입니다. JPEG·PNG 각 10MiB 이하, 최대 10장·전체 20MiB까지 선택하세요. 상품 등록 시 네이버에 업로드합니다.</DetailHint>
    <FileInput id="product-images" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple disabled={disabled || images.length >= 10}
      aria-required="true" aria-invalid={Boolean(fileError || error)} aria-describedby={`product-images-hint${fileError || error ? ' product-images-error' : ''}`}
      onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ''; add(files) }} />
    {images.length > 0 && <ImageGrid>{images.map((file, index) => <ImageCard key={`${file.name}:${file.lastModified}:${index}`}>
      <NaverProductImagePreview file={file} alt={`${index === 0 ? '대표' : `추가 ${index}`} 상품 이미지`} />
      <DetailBadge $tone={index === 0 ? 'success' : undefined}>{index === 0 ? '대표 이미지' : `추가 이미지 ${index}`}</DetailBadge>
      <FileName title={file.name}>{file.name}</FileName>
      <Actions>{index > 0 && <SmallButton type="button" disabled={disabled} onClick={() => onChange([file, ...images.filter((_, current) => current !== index)])}>대표로 설정</SmallButton>}<SmallButton type="button" disabled={disabled} aria-label={`${file.name} 이미지 제거`} onClick={() => { onChange(images.filter((_, current) => current !== index)); setFileError('') }}>제거</SmallButton></Actions>
    </ImageCard>)}</ImageGrid>}
    {(fileError || error) && <DetailAlert id="product-images-error" role="alert">{fileError || error}</DetailAlert>}
  </Field>
}

export function NaverProductImagePreview({ file, alt }: { file: File; alt: string }) {
  const image = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const element = image.current
    if (element) element.src = url
    return () => { if (element) element.removeAttribute('src'); URL.revokeObjectURL(url) }
  }, [file])
  return <PreviewImage ref={image} alt={alt} />
}

const FileInput = styled.input`width: 100%; min-width: 0; padding: 15px; border: 1px dashed ${({ theme }) => theme.colors.border}; background: #f8fbf9; font-size: 12px; &::file-selector-button { margin-right: 12px; padding: 9px 12px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 7px; background: white; font: inherit; cursor: pointer; }`
const ImageGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-top: 8px;`
const ImageCard = styled.div`display: flex; flex-direction: column; align-items: flex-start; gap: 10px; min-width: 0; padding: 12px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px;`
const PreviewImage = styled.img`display: block; width: 100%; aspect-ratio: 1; border-radius: 6px; object-fit: contain; background: #f5f7f6;`
const FileName = styled.p`max-width: 100%; color: ${({ theme }) => theme.colors.textSecondary}; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
const SmallButton = styled(DetailSecondaryButton)`min-height: 30px; padding: 5px 8px; font-size: 10px;`
