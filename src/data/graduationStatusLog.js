/** Demo / future graduation module snapshot for Status Log remarks. */
export const DEMO_GRADUATION_STATUS_LOG = {
  completionBatch: '202903',
  completionDate: '29/03/2029',
  graduationBatch: '202906',
  graduationDate: '30/06/2029',
}

export function buildGraduationStatusLogRemarkLines(graduation = {}) {
  const source = { ...DEMO_GRADUATION_STATUS_LOG, ...graduation }
  const lines = []

  const completionBatch = String(source.completionBatch || '').trim()
  const completionDate = String(source.completionDate || '').trim()
  const graduationBatch = String(source.graduationBatch || '').trim()
  const graduationDate = String(source.graduationDate || '').trim()

  if (completionBatch) lines.push(`Completion Batch : ${completionBatch}`)
  if (completionDate) lines.push(`Completion Date : ${completionDate}`)
  if (graduationBatch) lines.push(`Graduation Batch : ${graduationBatch}`)
  if (graduationDate) lines.push(`Graduation Date : ${graduationDate}`)

  return lines.length ? lines : ['Completion Batch : —']
}
