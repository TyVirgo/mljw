import { ref } from 'vue'

/** 本期仅保留单一「补注册」开门名单 */
export const supplementListTypes = ['supplement']

const initialSupplementList = [
  {
    id: 'sup-001',
    studentId: 'COS2504015',
    studentName: 'Tan Mei Ling',
    programme: 'COS',
    intake: '2025/04',
    listType: 'supplement',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '10-Sep-2025',
    addedBy: 'AC COS',
    source: 'registration-monitor',
    remark: '未选课补注册',
  },
  {
    id: 'sup-002',
    studentId: 'DSA2504002',
    studentName: 'Lee Wei Ming',
    programme: 'DSA',
    intake: '2025/04',
    listType: 'supplement',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '09-Sep-2025',
    addedBy: 'AC DSA',
    source: 'manual',
    remark: '学分不足，开放加退课申请',
  },
  {
    id: 'sup-003',
    studentId: 'XMUM2309001',
    studentName: 'Tan Wei Ming',
    programme: 'SWE',
    intake: '2023/09',
    listType: 'supplement',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '12-Sep-2025',
    addedBy: 'AC Demo',
    source: 'manual',
    remark: '演示学生：窗口外也可申请',
  },
]

export const supplementListQueue = ref(initialSupplementList.map((item) => ({ ...item })))

let supplementSeq = 4

export function createSupplementId() {
  return `sup-${String(supplementSeq++).padStart(3, '0')}`
}

export function isStudentInSupplementList(studentId) {
  return supplementListQueue.value.some((item) => item.studentId === studentId)
}

export function getSupplementEntry(studentId) {
  return supplementListQueue.value.find((item) => item.studentId === studentId) || null
}

export function addStudentToSupplementList(student, options = {}) {
  if (!student?.studentId) return { ok: false, errorKey: 'courseRegistration.supplement.invalidStudent' }
  if (isStudentInSupplementList(student.studentId)) {
    return { ok: false, errorKey: 'courseRegistration.supplement.alreadyExists' }
  }
  const item = {
    id: createSupplementId(),
    studentId: student.studentId,
    studentName: student.studentName,
    programme: student.programme,
    intake: student.intake,
    listType: 'supplement',
    canAdd: options.canAdd ?? true,
    canDrop: options.canDrop ?? true,
    canRetake: options.canRetake ?? true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: new Date().toISOString().slice(0, 10),
    addedBy: options.addedBy || 'AC Demo',
    source: options.source || 'manual',
    remark: options.remark || '',
  }
  supplementListQueue.value.unshift(item)
  return { ok: true, item }
}

export function removeSupplementEntry(id) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  supplementListQueue.value.splice(index, 1)
  return { ok: true }
}

export function filterSupplementList(rows, filters = {}) {
  let list = [...rows]
  if (filters.programme) {
    list = list.filter((r) => r.programme.toLowerCase().includes(filters.programme.toLowerCase()))
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function updateSupplementEntry(id, patch) {
  const index = supplementListQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const next = { ...supplementListQueue.value[index], ...patch, listType: 'supplement' }
  supplementListQueue.value[index] = next
  return { ok: true, item: next }
}
