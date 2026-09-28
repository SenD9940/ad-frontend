export default function StudioDetailPreview({ html, imageUrl }: { html: string; imageUrl: string | null }) {
  const escapedUrl = imageUrl?.startsWith('https://') ? imageUrl.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!) : ''
  const document = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'"><style>body{margin:0;padding:20px;font:15px/1.8 system-ui;color:#26304a;overflow-wrap:anywhere}img{max-width:100%;height:auto}h1,h2,h3{line-height:1.4}</style></head><body>${html.replaceAll('{{STUDIO_IMAGE}}', escapedUrl)}</body></html>`
  return <iframe title="적용할 AI 상품 상세페이지 미리보기" sandbox="" referrerPolicy="no-referrer" srcDoc={document} style={{ width: '100%', minHeight: 440, border: '1px solid #e3e6ed', borderRadius: 12, background: 'white' }} />
}
