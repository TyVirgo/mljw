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
    children: [
      { id: 'hostel-status', label: 'Hostel Status', nodeCode: 'XS_ZSZT', nodeName: 'Hostel Status' },
      { id: 'room-type', label: 'Room Type', nodeCode: 'XS_FJLX', nodeName: 'Room Type' },
      { id: 'campus', label: 'Campus', nodeCode: 'XS_XQ', nodeName: 'Campus' },
      { id: 'block-no', label: 'Block No', nodeCode: 'XS_LD', nodeName: 'Block No' },
      { id: 'room-no', label: 'Room No', nodeCode: 'XS_FJH', nodeName: 'Room No' },
      { id: 'programme-level', label: 'Programme Level', nodeCode: 'XS_ZYCJ', nodeName: 'Programme Level' },
    ],
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

export const accommodationCodeSetIds = {
  hostelStatus: 'hostel-status',
  roomType: 'room-type',
  campus: 'campus',
  blockNo: 'block-no',
  roomNo: 'room-no',
}

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
  { id: 9, codeSetId: 'hostel-status', nodeCode: 'XS_ZSZT', nodeName: 'Hostel Status', code: '0', codeName: 'Not Applicable', parentCode: '' },
  { id: 10, codeSetId: 'hostel-status', nodeCode: 'XS_ZSZT', nodeName: 'Hostel Status', code: '1', codeName: 'Checked In', parentCode: '' },
  { id: 11, codeSetId: 'hostel-status', nodeCode: 'XS_ZSZT', nodeName: 'Hostel Status', code: '2', codeName: 'Checked Out', parentCode: '' },
  { id: 12, codeSetId: 'hostel-status', nodeCode: 'XS_ZSZT', nodeName: 'Hostel Status', code: '3', codeName: 'Reserved', parentCode: '' },
  { id: 13, codeSetId: 'room-type', nodeCode: 'XS_FJLX', nodeName: 'Room Type', code: '1', codeName: 'Single', parentCode: '' },
  { id: 14, codeSetId: 'room-type', nodeCode: 'XS_FJLX', nodeName: 'Room Type', code: '2', codeName: 'Double', parentCode: '' },
  { id: 15, codeSetId: 'room-type', nodeCode: 'XS_FJLX', nodeName: 'Room Type', code: '3', codeName: 'Triple', parentCode: '' },
  { id: 16, codeSetId: 'campus', nodeCode: 'XS_XQ', nodeName: 'Campus', code: '1', codeName: 'Xiamen University Malaysia Campus', parentCode: '' },
  { id: 17, codeSetId: 'block-no', nodeCode: 'XS_LD', nodeName: 'Block No', code: '1', codeName: 'A08', parentCode: '' },
  { id: 18, codeSetId: 'block-no', nodeCode: 'XS_LD', nodeName: 'Block No', code: '2', codeName: 'B12', parentCode: '' },
  { id: 19, codeSetId: 'block-no', nodeCode: 'XS_LD', nodeName: 'Block No', code: '3', codeName: 'C05', parentCode: '' },
  { id: 20, codeSetId: 'room-no', nodeCode: 'XS_FJH', nodeName: 'Room No', code: '1', codeName: '305', parentCode: '' },
  { id: 21, codeSetId: 'room-no', nodeCode: 'XS_FJH', nodeName: 'Room No', code: '2', codeName: '512', parentCode: '' },
  { id: 22, codeSetId: 'room-no', nodeCode: 'XS_FJH', nodeName: 'Room No', code: '3', codeName: '201', parentCode: '' },
  { id: 23, codeSetId: 'programme-level', nodeCode: 'XS_ZYCJ', nodeName: 'Programme Level', code: '1', codeName: 'Foundation', parentCode: '' },
  { id: 24, codeSetId: 'programme-level', nodeCode: 'XS_ZYCJ', nodeName: 'Programme Level', code: '2', codeName: 'Undergraduate', parentCode: '' },
  { id: 25, codeSetId: 'programme-level', nodeCode: 'XS_ZYCJ', nodeName: 'Programme Level', code: '3', codeName: 'Postgraduate', parentCode: '' },
]

export function loadCodeEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const merged = [...parsed]
        initialCodeEntries.forEach((seed) => {
          const exists = merged.some(
            (row) => row.codeSetId === seed.codeSetId && row.code === seed.code,
          )
          if (!exists) {
            merged.push({ ...seed, id: createCodeEntryId() })
          }
        })
        const maxId = merged.reduce((max, row) => Math.max(max, row.id || 0), 0)
        entrySeq = Math.max(entrySeq, maxId)
        return merged
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

export function getCodeSetOptions(codeSetId, entries = loadCodeEntries()) {
  return entries
    .filter((row) => row.codeSetId === codeSetId)
    .map((row) => ({ value: row.codeName, label: row.codeName }))
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
