/** Export drawer body to PDF (client-side mock). */

async function captureElementToPdfDocument(element) {
  if (!element) return null

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * contentWidth) / canvas.width

  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  return pdf
}

export async function buildMovementDetailPdfBlob(element) {
  const pdf = await captureElementToPdfDocument(element)
  if (!pdf) return null

  const blob = pdf.output('blob')
  return {
    blob,
    blobUrl: URL.createObjectURL(blob),
    pdf,
  }
}

export function revokeMovementDetailPdfBlob(blobUrl) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
}

export function downloadMovementDetailPdfBlob(blob, filename) {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'movement-application.pdf'
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportMovementDetailPdf(element, filename) {
  const pdf = await captureElementToPdfDocument(element)
  if (!pdf) return
  pdf.save(filename || 'movement-application.pdf')
}
