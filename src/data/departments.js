export const categoryOptions = ['School', 'Department']
export const yesNoOptions = ['Yes', 'No']
/** 校选课类型：文科 / 理科 / 商科 / AI与开放选修（value 与学科领域枚举隔离） */
export const schoolElectiveCategoryOptions = [
  { value: 'arts', en: 'Arts', zh: '文科' },
  { value: 'science', en: 'Science', zh: '理科' },
  { value: 'business', en: 'Business', zh: '商科' },
  { value: 'ai_open', en: 'AI & Open Electives', zh: 'AI与开放选修' },
]

export function getSchoolElectiveCategoryLabel(value, isZh = false) {
  const opt = schoolElectiveCategoryOptions.find((item) => item.value === value)
  if (!opt) return value || '—'
  return isZh ? opt.zh : opt.en
}

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
    schoolElectiveCategory: '',
    previousRecords: [],
    ...item,
    schoolElectiveCategory: item.schoolElectiveCategory || '',
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
    deptId: 'CAMS2025',
    code: 'CAMS',
    nameEn: 'China-ASEAN College of Marine Sciences',
    nameZh: '中国-东盟海洋科学学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'science',
  },
  {
    id: 2,
    deptId: 'SASS2025',
    code: 'SASS',
    nameEn: 'School of Arts and Social Sciences',
    nameZh: '艺术与社会科学学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'arts',
  },
  {
    id: 3,
    deptId: 'SCDS2025',
    code: 'SCDS',
    nameEn: 'School of Computing and Data Science',
    nameZh: '计算机与数据科学学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'Yes',
    active: 'Yes',
    schoolElectiveCategory: 'science',
  },
  {
    id: 4,
    deptId: 'SECE2025',
    code: 'SECE',
    nameEn: 'School of Energy and Chemical Engineering',
    nameZh: '能源与化学工程学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'science',
  },
  {
    id: 5,
    deptId: 'SEEAI2025',
    code: 'SEEAI',
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
    schoolElectiveCategory: 'science',
    remarks: 'Here is the note information...',
    previousRecords: [
      { id: 1, yearFrom: '2023', yearTo: '2024', departmentName: 'School of Electrical Engineering and Artificial Intelligence' },
      { id: 2, yearFrom: '2022', yearTo: '2022', departmentName: 'Department of Electrical and Electronic Engineering' },
    ],
  },
  {
    id: 6,
    deptId: 'SEM2025',
    code: 'SEM',
    nameEn: 'School of Economics and Management',
    nameZh: '经济与管理学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'business',
  },
  {
    id: 7,
    deptId: 'SMP2025',
    code: 'SMP',
    nameEn: 'School of Mathematics and Physics',
    nameZh: '数学与物理学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'science',
  },
  {
    id: 8,
    deptId: 'SOC2025',
    code: 'SOC',
    nameEn: 'School of Communication',
    nameZh: '传播学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'arts',
  },
  {
    id: 9,
    deptId: 'STCM2025',
    code: 'STCM',
    nameEn: 'School of Traditional Chinese Medicine',
    nameZh: '中医学院',
    category: 'School',
    reportTo: '',
    offering: 'Yes',
    teaching: 'No',
    active: 'Yes',
    schoolElectiveCategory: 'science',
  },
  {
    id: 10,
    deptId: 'TMCM2025',
    code: 'TCM',
    nameEn: 'Department of Clinical Medicine',
    nameZh: '临床医学系',
    category: 'Department',
    reportTo: 'STCM',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
    schoolElectiveCategory: 'science',
  },
  {
    id: 11,
    deptId: 'ACC2024',
    code: 'ACC',
    nameEn: 'Department of Accounting',
    nameZh: '会计系',
    category: 'Department',
    reportTo: 'SEM',
    offering: 'Yes',
    teaching: 'No',
    active: 'No',
    schoolElectiveCategory: 'business',
  },
].map(normalizeDepartment)

let nextId = 12

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
