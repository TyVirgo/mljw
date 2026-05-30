export const codeSetTree = [
  {
    id: 'dynamic-form',
    label: 'Dynamic Form Code Sets',
    children: [],
  },
  {
    id: 'project-course',
    label: 'Project Courses',
    children: [],
  },
  {
    id: 'online-exam',
    label: 'Online Exam Code Sets',
    children: [],
  },
  {
    id: 'public',
    label: 'Public Code Sets',
    children: [
      { id: 'gender', label: 'Gender Code', nodeCode: 'XB_M', nodeName: 'Gender Code' },
      { id: 'country', label: 'Country/Region Code', nodeCode: 'GJDQ_M', nodeName: 'Country/Region Code' },
      { id: 'id-type', label: 'ID Card Type Code', nodeCode: 'SFZJLX_M', nodeName: 'ID Card Type Code' },
      { id: 'education', label: 'Education Code', nodeCode: 'XL_M', nodeName: 'Education Code' },
    ],
  },
  {
    id: 'student',
    label: 'Student Code Sets',
    children: [],
  },
  {
    id: 'teacher',
    label: 'Teacher Code Sets',
    children: [],
  },
  {
    id: 'teaching',
    label: 'Teaching Code Sets',
    children: [
      { id: 'ktlx', label: 'Topic Type', nodeCode: 'BSGL_KTLX', nodeName: 'Topic Type' },
      { id: 'ktly', label: 'Topic Source', nodeCode: 'BSGL_KTLY', nodeName: 'Topic Source' },
      { id: 'ktxz', label: 'Topic Nature', nodeCode: 'BSGL_KTXZ', nodeName: 'Topic Nature' },
    ],
  },
  {
    id: 'teaching-aux',
    label: 'Teaching Auxiliary',
    children: [],
  },
  {
    id: 'teaching-project',
    label: 'Teaching Project Code Sets',
    children: [],
  },
]

const STORAGE_KEY = 'jw-code-set-entries'

let entrySeq = 100

export function createCodeEntryId() {
  entrySeq += 1
  return entrySeq
}

export function flattenCodeSetLeaves(nodes = codeSetTree, list = []) {
  nodes.forEach((node) => {
    if (node.children?.length) {
      flattenCodeSetLeaves(node.children, list)
    } else if (node.nodeCode) {
      list.push(node)
    }
  })
  return list
}

export function getCodeSetById(id) {
  return flattenCodeSetLeaves().find((item) => item.id === id) || null
}

export const initialCodeEntries = [
  { id: 1, codeSetId: 'ktlx', nodeCode: 'BSGL_KTLX', nodeName: 'Topic Type', code: '0', codeName: 'Other', parentCode: '' },
  { id: 2, codeSetId: 'ktlx', nodeCode: 'BSGL_KTLX', nodeName: 'Topic Type', code: '1', codeName: 'Theoretical Research', parentCode: '' },
  { id: 3, codeSetId: 'ktlx', nodeCode: 'BSGL_KTLX', nodeName: 'Topic Type', code: '2', codeName: 'Design & Development', parentCode: '' },
  { id: 4, codeSetId: 'ktlx', nodeCode: 'BSGL_KTLX', nodeName: 'Topic Type', code: '3', codeName: 'Scientific Experiment', parentCode: '' },
  { id: 5, codeSetId: 'ktly', nodeCode: 'BSGL_KTLY', nodeName: 'Topic Source', code: '0', codeName: 'Other', parentCode: '' },
  { id: 6, codeSetId: 'ktly', nodeCode: 'BSGL_KTLY', nodeName: 'Topic Source', code: '1', codeName: 'Research Project', parentCode: '' },
  { id: 7, codeSetId: 'gender', nodeCode: 'XB_M', nodeName: 'Gender Code', code: '1', codeName: 'Male', parentCode: '' },
  { id: 8, codeSetId: 'gender', nodeCode: 'XB_M', nodeName: 'Gender Code', code: '2', codeName: 'Female', parentCode: '' },
]

export function loadCodeEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const maxId = parsed.reduce((max, row) => Math.max(max, row.id || 0), 0)
        entrySeq = Math.max(entrySeq, maxId)
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return initialCodeEntries.map((row) => ({ ...row }))
}

export function saveCodeEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function formatParentCode(value) {
  if (!value?.trim()) return '--'
  return value
}

export function getParentCodeOptions(entries, codeSetId, excludeCode = '') {
  return entries
    .filter((row) => row.codeSetId === codeSetId && row.code !== excludeCode)
    .map((row) => ({ value: row.code, label: `${row.code} — ${row.codeName}` }))
}

export function validateCodeEntry(payload, entries, editingId = null) {
  const errors = {}
  if (!payload.codeSetId) errors.codeSetId = 'Code Set is required'
  if (!payload.code?.trim()) errors.code = 'Code is required'
  if (!payload.codeName?.trim()) errors.codeName = 'Code Name is required'

  const duplicate = entries.find(
    (row) =>
      row.codeSetId === payload.codeSetId &&
      row.code === payload.code.trim() &&
      row.id !== editingId,
  )
  if (duplicate) errors.code = 'Code already exists in this code set'

  return errors
}
