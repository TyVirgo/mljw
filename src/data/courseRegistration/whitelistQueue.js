import { ref } from 'vue'

export const whitelistTypes = [
  'creditOverflow',
  'prerequisiteException',
  'futureSemester',
  'graduateSpecial',
]

export const whitelistApprovalStages = ['acReview', 'hopReview', 'boaApproved']

const initialWhitelist = [
  {
    id: 'wl-001',
    studentId: 'AIT2409010',
    studentName: 'Siti Nurhaliza',
    programme: 'AIT',
    intake: '2409',
    type: 'creditOverflow',
    status: 'boaApproved',
    currentStage: 'boaApproved',
    courseCode: 'COMP3192',
    reason: 'BOA approved 21 credits for final semester',
    submittedAt: '05-Sep-2025',
    approvalLog: [
      { stage: 'acReview', actor: 'AC AIT', action: 'Approved', at: '06-Sep-2025' },
      { stage: 'hopReview', actor: 'HOP AIT', action: 'Approved', at: '08-Sep-2025' },
      { stage: 'boaApproved', actor: 'BOA', action: 'Approved', at: '10-Sep-2025' },
    ],
  },
  {
    id: 'wl-002',
    studentId: 'DSA2409008',
    studentName: 'Raj Kumar',
    programme: 'DSA',
    intake: '2409',
    type: 'prerequisiteException',
    status: 'hopReview',
    currentStage: 'hopReview',
    courseCode: 'COMP3192',
    reason: 'Completed equivalent module at previous institution',
    submittedAt: '08-Sep-2025',
    approvalLog: [
      { stage: 'acReview', actor: 'AC DSA', action: 'Approved', at: '09-Sep-2025' },
    ],
  },
  {
    id: 'wl-003',
    studentId: 'COS2409022',
    studentName: 'Priya Devi',
    programme: 'COS',
    intake: '2409',
    type: 'futureSemester',
    status: 'acReview',
    currentStage: 'acReview',
    courseCode: 'COMP401',
    reason: 'Accelerated track — register next semester course early',
    submittedAt: '11-Sep-2025',
    approvalLog: [],
  },
  {
    id: 'wl-004',
    studentId: 'DSA2409015',
    studentName: 'Ong Chee Keong',
    programme: 'DSA',
    intake: '2409',
    type: 'graduateSpecial',
    status: 'rejected',
    currentStage: 'hopReview',
    courseCode: 'COMP499',
    reason: 'Final project overload request',
    submittedAt: '01-Sep-2025',
    approvalLog: [
      { stage: 'acReview', actor: 'AC DSA', action: 'Approved', at: '02-Sep-2025' },
      { stage: 'hopReview', actor: 'HOP DSA', action: 'Rejected', at: '04-Sep-2025' },
    ],
  },
  {
    id: 'wl-005',
    studentId: 'COS2504020',
    studentName: 'Fatimah Zahra',
    programme: 'COS',
    intake: '2504',
    type: 'prerequisiteException',
    status: 'draft',
    currentStage: 'acReview',
    courseCode: 'COMP201',
    reason: 'Placement test waived prerequisite COMP101',
    submittedAt: '12-Sep-2025',
    approvalLog: [],
  },
]

export const whitelistQueue = ref(initialWhitelist.map((item) => ({ ...item, approvalLog: [...item.approvalLog] })))

export function filterWhitelist(rows, filters = {}) {
  let list = [...rows]
  if (filters.type) list = list.filter((r) => r.type === filters.type)
  if (filters.status) list = list.filter((r) => r.status === filters.status)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(
      (r) => r.studentId.toLowerCase().includes(kw) || r.studentName.toLowerCase().includes(kw),
    )
  }
  return list
}

export function getWhitelistById(id) {
  return whitelistQueue.value.find((item) => item.id === id) || null
}

export function advanceWhitelistApproval(id, action = 'Approved') {
  const index = whitelistQueue.value.findIndex((item) => item.id === id)
  if (index === -1) return { ok: false }
  const item = whitelistQueue.value[index]
  const stageOrder = ['acReview', 'hopReview', 'boaApproved']
  const currentIdx = stageOrder.indexOf(item.currentStage)
  if (action === 'Rejected') {
    whitelistQueue.value[index] = { ...item, status: 'rejected' }
    return { ok: true }
  }
  if (currentIdx < stageOrder.length - 1) {
    const nextStage = stageOrder[currentIdx + 1]
    const newStatus = nextStage === 'boaApproved' ? 'boaApproved' : nextStage
    whitelistQueue.value[index] = {
      ...item,
      currentStage: nextStage,
      status: newStatus,
      approvalLog: [
        ...item.approvalLog,
        { stage: item.currentStage, actor: 'AC Demo', action: 'Approved', at: new Date().toISOString().slice(0, 10) },
      ],
    }
  } else {
    whitelistQueue.value[index] = { ...item, status: 'boaApproved' }
  }
  return { ok: true }
}

let whitelistSeq = 6

export function addWhitelistEntry(payload) {
  const item = {
    id: `wl-${String(whitelistSeq++).padStart(3, '0')}`,
    status: 'draft',
    currentStage: 'acReview',
    approvalLog: [],
    submittedAt: new Date().toISOString().slice(0, 10),
    ...payload,
  }
  whitelistQueue.value.unshift(item)
  return { ok: true, item }
}
