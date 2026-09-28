import { adminWrite } from './api'
import type { StudioKind } from '../studio/types'

export type StudioTemplateAnalysis = { title: string; description: string; prompt: string }

export async function analyzeStudioTemplate(imageKey: string, kind: StudioKind, signal: AbortSignal): Promise<StudioTemplateAnalysis> {
  const result = await adminWrite<StudioTemplateAnalysis>('/ai-studio/templates/analyze', { imageKey, kind }, 'post', { timeout: 90_000, signal })
  if (!result || !(['title', 'description', 'prompt'] as const).every(field => typeof result[field] === 'string' && result[field].trim())
    || result.title.length > 150 || result.description.length > 2000 || result.prompt.length > 6000) {
    throw new Error('AI 분석 내용을 확인하지 못했습니다.')
  }
  return result
}
