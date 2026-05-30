export const categoryOptions = ['School', 'Department']
export const yesNoOptions = ['Yes', 'No']

const currentYear = new Date().getFullYear()
export const yearOptions = Array.from({ length: 41 }, (_, i) => String(currentYear - 30 + i))

let previousRecordSeq = 1

export function createEmptyPreviousRecord() {
  return {
    id: previousRecordSeq++,
    yearFrom: '',
    yearTo: '',
    departmentName: '',
  }
}

export function normalizeDepartment(item) {
  return {
    departmentHead: '',
    officeExtension: '',
    officeNo: '',
    email: '',
    established: '',
    remarks: '',
    previousRecords: [],
    ...item,
    previousRecords: (item.previousRecords || []).map((row) => ({
      id: row.id ?? previousRecordSeq++,
      yearFrom: row.yearFrom || '',
      yearTo: row.yearTo || '',
      departmentName: row.departmentName || '',
    })),
  }
}

export const initialDepartments = [
  {
    id: 1,
    deptId: 'RGZN2025',
    code: 'OSA',
    nameEn: 'School of Artificial Intelligence and Robotics',
    nameZh: '人工智能与机器人学院',
    category: 'School',
    reportTo: '',
    departmentHead: 'Tan Mei Ling',
    officeExtension: '+60 3-8888 7777',
    officeNo: 'Salak Tinggi, Sepang, Selangor',
    email: 'XMUM@123.com',
    established: '09/2021',
    offering: 'Yes',
    teaching: 'Yes',
    active: 'Yes',
    remarks: 'Here is the note information...',
    previousRecords: [
      { id: 1, yearFrom: '2023', yearTo: '2024', departmentName: 'School of Electrical Engineering and Artificial Intelligence' },
      { id: 2, yearFrom: '2022', yearTo: '2022', departmentName: 'Department of Electrical and Electronic Engineering' },
    ],
  },
  {
    id: 2,
    deptId: 'ZYXY2025',
    code: 'SOF',
    nameEn: 'School of Traditional Chinese Medicine',
    nameZh: '中医学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
  },
  {
    id: 3,
    deptId: 'DMHY2024',
    code: 'CAC',
    nameEn: 'College of Accounting',
    nameZh: '会计学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
  },
  {
    id: 4,
    deptId: 'KXJS2023',
    code: 'SOA',
    nameEn: 'School of Arts',
    nameZh: '艺术学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
  },
  {
    id: 5,
    deptId: 'TMCM2025',
    code: 'TCM',
    nameEn: 'Department of Clinical Medicine',
    nameZh: '临床医学系',
    category: 'Department',
    reportTo: 'SOF',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
  },
  {
    id: 6,
    deptId: 'ACC2024',
    code: 'ACC',
    nameEn: 'Department of Accounting',
    nameZh: '会计系',
    category: 'Department',
    reportTo: 'CAC',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
  },
].map(normalizeDepartment)

let nextId = 7

export function createDepartmentId() {
  return nextId++
}

export function formatReportTo(value) {
  if (!value) return '--'
  return value
}

export function formatEstablished(value) {
  if (!value) return '--'
  const trimmed = value.trim()
  const slash = trimmed.match(/^(0[1-9]|1[0-2])\/(\d{4})$/)
  if (slash) return `${slash[1]}.${slash[2]}`
  return trimmed
}

export function getReportToOptions(departments) {
  const codes = departments.map((item) => item.code).filter(Boolean)
  return [...new Set(codes)].sort()
}
