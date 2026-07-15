import { ref } from 'vue'

export const supplementListTypes = [
  'supplement',
  'supplementDrop',
  'retake',
  'resumption',
  'graduateSpecial',
]

const initialSupplementList = [
  {
    id: 'sup-001',
    studentId: 'AIT2409010',
    studentName: 'Siti Nurhaliza',
    programme: 'AIT',
    intake: '2409',
    listType: 'resumption',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '28-Aug-2025',
    addedBy: 'AC AIT',
    source: 'batch-auto',
    remark: '复学自动纳入',
  },
  {
    id: 'sup-002',
    studentId: 'COS2504015',
    studentName: 'Tan Mei Ling',
    programme: 'COS',
    intake: '2504',
    listType: 'supplement',
    canAdd: true,
    canDrop: false,
    canRetake: false,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '10-Sep-2025',
    addedBy: 'AC COS',
    source: 'academic-alert',
    remark: '未选课补注册',
  },
  {
    id: 'sup-003',
    studentId: 'DSA2504002',
    studentName: 'Lee Wei Ming',
    programme: 'DSA',
    intake: '2504',
    listType: 'supplementDrop',
    canAdd: false,
    canDrop: true,
    canRetake: false,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '09-Sep-2025',
    addedBy: 'AC DSA',
    source: 'manual',
    remark: '补退课窗口',
  },
  {
    id: 'sup-004',
    studentId: 'COS2409005',
    studentName: 'Wong Kah Wai',
    programme: 'COS',
    intake: '2409',
    listType: 'retake',
    canAdd: false,
    canDrop: false,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    addedAt: '08-Sep-2025',
    addedBy: 'AC COS',
    source: 'manual',
    remark: '重修 COMP201 F',
  },
  {
    id: 'sup-005',
    studentId: 'DSA2409012',
    studentName: 'Nurul Aina',
    programme: 'DSA',
    intake: '2409',
    listType: 'graduateSpecial',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: true,
    bypassPrerequisite: true,
    addedAt: '07-Sep-2025',
    addedBy: 'AC DSA',
    source: 'manual',
    remark: '毕业生特殊审批',
  },
]

export const supplementListQueue = ref(initialSupplementList.map((item) => ({ ...item })))

let supplementSeq = 6

export function createSupplementId() {
  return `sup-${String(supplementSeq++).padStart(3, '0')}`
}

export function isStudentInSupplementList(studentId) {
  return supplementListQueue.value.some((item) => item.studentId === studentId)
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
    listType: options.listType || 'supplement',
    canAdd: options.canAdd ?? true,
    canDrop: options.canDrop ?? true,
    canRetake: options.canRetake ?? true,
    bypassCreditMax: options.bypassCreditMax ?? false,
    bypassPrerequisite: options.bypassPrerequisite ?? false,
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
  if (filters.listType) list = list.filter((r) => r.listType === filters.listType)
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
  supplementListQueue.value[index] = { ...supplementListQueue.value[index], ...patch }
  return { ok: true, item: supplementListQueue.value[index] }
}
