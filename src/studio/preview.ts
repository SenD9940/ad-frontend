export function safeStudioImageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try { const url = new URL(value, window.location.origin); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined } catch { return undefined }
}

export function studioPreviewHtml(html: string, imageUrl: string | null): string {
  const escaped = (safeStudioImageUrl(imageUrl) || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
  const body = html.replaceAll('{{STUDIO_IMAGE}}', escaped)
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><style>body{margin:0;padding:24px;font:15px/1.8 system-ui,sans-serif;color:#303348;overflow-wrap:anywhere}img{max-width:100%;height:auto}h1,h2,h3{line-height:1.4}</style></head><body>${body}</body></html>`
}
