import { ref } from 'vue'
import { enrichSectionScheduleFields } from './sectionScheduleFields.js'

/**
 * Demo 课表（batch-2504-m1）覆盖情况（相对 demo 学生：SWE/2409、已修 COMP101）：
 * 1. 已满 + 可选 → 申请候补（置顶）
 * 2. 有余量 + 可选 → 立即选课
 * 3. 已修 → 不可选
 * 4. 缺先修 → 不可选（各缺一门样例）
 * 5. 专业限制 / Intake 限制 → 不可选
 * 6. 已满 + 缺先修 → 不可选（非候补）
 */
const initialCourses = [
  // —— 已满 + 先修满足（候补）——
  {
    id: 'course-it102',
    batchId: 'batch-2504-m1',
    code: 'IT102',
    name: 'Digital Literacy Workshop',
    credits: 2,
    type: 'ME',
    isHot: true,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 40,
    remainingCapacity: 0,
    quotaSummary: 'Total 40 · Full · Waitlist open',
    prerequisites: [],
    g1Category: null,
    sections: [
      {
        id: 'sec-it102-1',
        code: '01',
        time: 'Mon 09:00–11:00',
        room: 'D5-1-105',
        lecturer: 'Ms. Ong',
        enrolled: 40,
        capacity: 40,
      },
    ],
    quota: { total: 40, senior: 25, freshman: 15, releaseToFreshman: false, byIntake: {} },
  },
  {
    id: 'course-engl201',
    batchId: 'batch-2504-m1',
    code: 'ENGL201',
    name: 'Academic Writing',
    credits: 3,
    type: 'GE',
    isHot: true,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 40,
    remainingCapacity: 0,
    quotaSummary: 'Total 40 · Full · GE Humanities',
    prerequisites: ['COMP101'],
    g1Category: 'Humanities',
    sections: [
      {
        id: 'sec-16',
        code: '01',
        time: 'Mon 09:00–12:00',
        room: 'A2-1-101',
        lecturer: 'Dr. Sarah',
        enrolled: 40,
        capacity: 40,
      },
    ],
    quota: { total: 40, senior: 25, freshman: 15, releaseToFreshman: false, byIntake: {} },
  },
  // —— 有余量 + 可选 ——
  {
    id: 'course-comp201',
    batchId: 'batch-2504-m1',
    code: 'COMP201',
    name: 'Data Structures',
    credits: 4,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 50,
    remainingCapacity: 8,
    quotaSummary: 'Total 50 · Senior 30 · Freshman 20',
    prerequisites: ['COMP101'],
    g1Category: null,
    sections: [
      { id: 'sec-1', code: '01', time: 'Mon 10:00–12:00', room: 'D5-3-201', lecturer: 'Dr. Lee', enrolled: 22, capacity: 25 },
      { id: 'sec-2', code: '02', time: 'Wed 14:00–16:00', room: 'D5-3-202', lecturer: 'Dr. Tan', enrolled: 20, capacity: 25 },
    ],
    quota: { total: 50, senior: 30, freshman: 20, releaseToFreshman: true, byIntake: { '2409': 15, '2504': 15, '2509': 20 } },
  },
  {
    id: 'course-phys101',
    batchId: 'batch-2504-m1',
    code: 'PHYS101',
    name: 'Physics I',
    credits: 4,
    type: 'ME',
    isHot: false,
    rating: 3,
    sectionCount: 1,
    totalCapacity: 50,
    remainingCapacity: 22,
    quotaSummary: 'Total 50',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-14', code: '01', time: 'Fri 09:00–11:00', room: 'S1-2-101', lecturer: 'Dr. Rahman', enrolled: 28, capacity: 50 },
    ],
    quota: { total: 50, senior: 30, freshman: 20, releaseToFreshman: true, byIntake: {} },
  },
  {
    id: 'course-bus201',
    batchId: 'batch-2504-m1',
    code: 'BUS201',
    name: 'Business Ethics',
    credits: 3,
    type: 'GE',
    isHot: false,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 55,
    remainingCapacity: 14,
    quotaSummary: 'Total 55 · GE Business',
    prerequisites: [],
    g1Category: 'Business',
    sections: [
      { id: 'sec-18', code: '01', time: 'Tue 14:00–17:00', room: 'B3-2-101', lecturer: 'Dr. Hassan', enrolled: 41, capacity: 55 },
    ],
    quota: { total: 55, senior: 30, freshman: 25, releaseToFreshman: true, byIntake: {} },
  },
  // —— 已修 ——
  {
    id: 'course-comp101',
    batchId: 'batch-2504-m1',
    code: 'COMP101',
    name: 'Introduction to Programming',
    credits: 4,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 60,
    remainingCapacity: 15,
    quotaSummary: 'Total 60 · Senior 35 · Freshman 25',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-5', code: '01', time: 'Thu 14:00–16:00', room: 'D5-2-101', lecturer: 'Dr. Lim', enrolled: 20, capacity: 30 },
      { id: 'sec-6', code: '02', time: 'Fri 10:00–12:00', room: 'D5-2-102', lecturer: 'Dr. Lim', enrolled: 25, capacity: 30 },
    ],
    quota: { total: 60, senior: 35, freshman: 25, releaseToFreshman: true, byIntake: { '2409': 30, '2504': 30 } },
  },
  // —— 缺先修（样例各 1）——
  {
    id: 'course-comp3192',
    batchId: 'batch-2504-m1',
    code: 'COMP3192',
    name: 'Algorithm Design',
    credits: 4,
    type: 'ME',
    isHot: true,
    rating: 5,
    sectionCount: 1,
    totalCapacity: 40,
    remainingCapacity: 3,
    quotaSummary: 'Total 40 · Needs COMP201',
    prerequisites: ['COMP201'],
    g1Category: null,
    sections: [
      { id: 'sec-3', code: '01', time: 'Wed 14:00–16:00', room: 'D5-3-301', lecturer: 'Dr. Wong', enrolled: 37, capacity: 40 },
    ],
    quota: { total: 40, senior: 25, freshman: 15, releaseToFreshman: false, byIntake: { '2409': 20, '2504': 20 } },
  },
  {
    id: 'course-comp220',
    batchId: 'batch-2504-m1',
    code: 'COMP220',
    name: 'Discrete Mathematics',
    credits: 4,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 40,
    remainingCapacity: 18,
    quotaSummary: 'Total 40 · Needs MATH101',
    prerequisites: ['MATH101'],
    g1Category: null,
    sections: [
      { id: 'sec-12', code: '01', time: 'Tue 10:00–12:00', room: 'D5-1-301', lecturer: 'Dr. Ng', enrolled: 22, capacity: 40 },
    ],
    quota: { total: 40, senior: 25, freshman: 15, releaseToFreshman: true, byIntake: {} },
  },
  // —— 已满 + 缺先修（不可候补）——
  {
    id: 'course-math201',
    batchId: 'batch-2504-m1',
    code: 'MATH201',
    name: 'Linear Algebra',
    credits: 4,
    type: 'ME',
    isHot: true,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 35,
    remainingCapacity: 0,
    quotaSummary: 'Total 35 · Full · Needs MATH101',
    prerequisites: ['MATH101'],
    g1Category: null,
    sections: [
      { id: 'sec-7', code: '01', time: 'Fri 14:00–16:00', room: 'D5-1-201', lecturer: 'Dr. Chen', enrolled: 35, capacity: 35 },
    ],
    quota: { total: 35, senior: 20, freshman: 15, releaseToFreshman: false, byIntake: {} },
  },
  // —— 专业限制 ——
  {
    id: 'course-cos210',
    batchId: 'batch-2504-m1',
    code: 'COS210',
    name: 'Cybersecurity Fundamentals',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 1,
    totalCapacity: 35,
    remainingCapacity: 10,
    quotaSummary: 'Total 35 · COS only',
    prerequisites: [],
    g1Category: null,
    sections: [
      {
        id: 'sec-cos210-1',
        code: '01',
        time: 'Thu 09:00–11:00',
        room: 'D5-2-301',
        lecturer: 'Dr. Farah',
        enrolled: 25,
        capacity: 35,
      },
    ],
    quota: { total: 35, senior: 20, freshman: 15, releaseToFreshman: true, byIntake: {} },
    audience: { programmes: ['COS'] },
  },
  // —— Intake 限制 ——
  {
    id: 'course-swe110',
    batchId: 'batch-2504-m1',
    code: 'SWE110',
    name: 'Freshman Orientation (SWE)',
    credits: 1,
    type: 'ME',
    isHot: false,
    rating: 3,
    sectionCount: 1,
    totalCapacity: 80,
    remainingCapacity: 40,
    quotaSummary: 'Total 80 · Intake 2509 only',
    prerequisites: [],
    g1Category: null,
    sections: [
      {
        id: 'sec-swe110-1',
        code: '01',
        time: 'Fri 14:00–15:00',
        room: 'A1-1-001',
        lecturer: 'Academic Office',
        enrolled: 40,
        capacity: 80,
      },
    ],
    quota: { total: 80, senior: 0, freshman: 80, releaseToFreshman: true, byIntake: { '2509': 80 } },
    audience: { intakes: ['2509'] },
  },
  // —— GE 批次课（非当前 active M1 批次时可见性受限；保留给 G1 批次演示）——
  {
    id: 'course-mpu318',
    batchId: 'batch-2504-g1',
    code: 'MPU3183',
    name: 'Malaysian Studies',
    credits: 3,
    type: 'GE',
    sectionCount: 3,
    totalCapacity: 120,
    remainingCapacity: 45,
    quotaSummary: 'Total 120',
    prerequisites: [],
    g1Category: 'Humanities',
    sections: [
      { id: 'sec-4', code: '01', time: 'Tue 09:00–12:00', room: 'A3-1-101', lecturer: 'Dr. Ahmad', enrolled: 25, capacity: 40 },
    ],
    quota: { total: 120, senior: 60, freshman: 60, releaseToFreshman: true, byIntake: {} },
  },
]

function enrichCourse(course) {
  return {
    ...course,
    sections: (course.sections || []).map((sec) => enrichSectionScheduleFields(sec)),
  }
}

/** 学生端列表：候补候选靠前，其次可选有余量，再是各类不可选 */
export function sortCoursesForStudentDemo(courses) {
  const rank = (course) => {
    const eligible = Boolean(course.eligibility?.eligible)
    const full = (course.remainingCapacity ?? 0) <= 0
    const reason = course.eligibility?.primaryReasonKey || ''
    if (eligible && full) return 0
    if (eligible && !full) return 1
    if (reason.includes('alreadyCompleted')) return 2
    if (reason.includes('prerequisiteMissing')) return 3
    if (reason.includes('programmeRestricted') || reason.includes('intakeRestricted')) return 4
    if (!eligible && full) return 5
    return 6
  }
  return [...courses].sort((a, b) => {
    const d = rank(a) - rank(b)
    if (d !== 0) return d
    return String(a.code).localeCompare(String(b.code))
  })
}

export const selectableCourses = ref(initialCourses.map((item) => enrichCourse(item)))

export function getCoursesByBatch(batchId) {
  if (!batchId) return selectableCourses.value
  return selectableCourses.value.filter((item) => item.batchId === batchId)
}

export function getCourseById(id) {
  return selectableCourses.value.find((item) => item.id === id) || null
}

export function countCoursesByBatch(batchId) {
  return selectableCourses.value.filter((item) => item.batchId === batchId).length
}

export const courseLibraryDemo = [
  { code: 'COMP101', name: 'Introduction to Programming', credits: 4, type: 'ME' },
  { code: 'COMP201', name: 'Data Structures', credits: 4, type: 'ME' },
  { code: 'COMP301', name: 'Database Systems', credits: 4, type: 'ME' },
  { code: 'COMP3192', name: 'Algorithm Design', credits: 4, type: 'ME' },
  { code: 'IT102', name: 'Digital Literacy Workshop', credits: 2, type: 'ME' },
  { code: 'SWE302', name: 'Software Engineering Practices', credits: 3, type: 'ME' },
  { code: 'MATH201', name: 'Linear Algebra', credits: 4, type: 'ME' },
  { code: 'MATH301', name: 'Discrete Mathematics', credits: 3, type: 'ME' },
  { code: 'STAT201', name: 'Probability & Statistics', credits: 3, type: 'ME' },
  { code: 'MPU3183', name: 'Malaysian Studies', credits: 3, type: 'GE' },
  { code: 'MPU3193', name: 'Philosophy and Current Issues', credits: 2, type: 'GE' },
  { code: 'ENG201', name: 'Academic Writing', credits: 3, type: 'GE' },
  { code: 'BUS101', name: 'Principles of Management', credits: 3, type: 'GE' },
  { code: 'HUM110', name: 'Introduction to Humanities', credits: 3, type: 'GE' },
  { code: 'CSC110', name: 'Computer Organization', credits: 3, type: 'ME' },
  { code: 'DSA210', name: 'Data Analytics Fundamentals', credits: 3, type: 'ME' },
]

export function importCoursesFromLibrary(batchId, codes) {
  const existing = new Set(selectableCourses.value.filter((c) => c.batchId === batchId).map((c) => c.code))
  const added = []
  for (const code of codes) {
    if (existing.has(code)) continue
    const lib = courseLibraryDemo.find((item) => item.code === code)
    if (!lib) continue
    const item = {
      id: `course-${code.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      batchId,
      code: lib.code,
      name: lib.name,
      credits: lib.credits,
      type: lib.type || 'ME',
      isHot: false,
      rating: 4,
      sectionCount: 0,
      totalCapacity: 40,
      remainingCapacity: 40,
      quotaSummary: 'Total 40',
      prerequisites: [],
      g1Category: null,
      sections: [],
      quota: { total: 40, senior: 25, freshman: 15, releaseToFreshman: true, byIntake: {} },
    }
    selectableCourses.value.push(enrichCourse(item))
    added.push(item)
  }
  return added
}
