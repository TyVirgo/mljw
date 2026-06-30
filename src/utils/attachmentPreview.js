const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const PDF_EXTENSIONS = new Set(['pdf'])
const DOCX_EXTENSIONS = new Set(['docx', 'doc'])

export function getAttachmentExtension(fileName) {
  const trimmed = String(fileName || '').trim()
  const index = trimmed.lastIndexOf('.')
  if (index === -1) return ''
  return trimmed.slice(index + 1).toLowerCase()
}

function extensionFromFile(localFile) {
  if (!localFile) return ''
  const fromName = getAttachmentExtension(localFile.name)
  if (fromName) return fromName
  const mime = String(localFile.type || '').toLowerCase()
  if (mime.includes('pdf')) return 'pdf'
  if (mime.startsWith('image/')) return 'jpg'
  return ''
}

export function resolvePreviewMode(fileName, localFile = null) {
  const ext = localFile ? extensionFromFile(localFile) : getAttachmentExtension(fileName)

  if (localFile) {
    if (PDF_EXTENSIONS.has(ext) || localFile.type === 'application/pdf') return 'blob-pdf'
    if (IMAGE_EXTENSIONS.has(ext) || String(localFile.type || '').startsWith('image/')) {
      return 'blob-image'
    }
  }

  if (PDF_EXTENSIONS.has(ext)) return 'mock-pdf'
  if (IMAGE_EXTENSIONS.has(ext)) return 'mock-image'
  if (DOCX_EXTENSIONS.has(ext)) return 'mock-docx'
  return 'unsupported'
}

export function createBlobPreviewUrl(localFile) {
  if (!localFile) return ''
  return URL.createObjectURL(localFile)
}

export function revokeBlobPreviewUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function buildMockPreviewHtml(fileName, fileMeta = null) {
  const sizeLabel =
    fileMeta?.size != null ? `${Math.max(1, Math.round(fileMeta.size / 1024))} KB` : '—'
  const safeName = String(fileName || 'attachment').replace(/[<>&"]/g, '')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111827; }
    .card { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    p { margin: 8px 0; font-size: 14px; line-height: 1.5; color: #374151; }
    .notice { margin-top: 16px; padding: 12px; background: #eff6ff; border-radius: 6px; color: #1d4ed8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${safeName}</h1>
    <p>Mock attachment preview for demonstration.</p>
    <p>Size: ${sizeLabel}</p>
    <div class="notice">Demo preview — file content is simulated.</div>
  </div>
</body>
</html>`
}

export function downloadAttachmentMock(fileName, label = 'Attachment') {
  if (!fileName) return
  const content = `Mock attachment: ${label}\nFile: ${fileName}\n`
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
