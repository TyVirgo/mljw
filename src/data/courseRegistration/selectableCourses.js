import { ref } from 'vue'
import { enrichSectionScheduleFields } from './sectionScheduleFields.js'
import { schoolElectiveCategoryOptions } from '../departments.js'
import { DEMO_HEADCOUNT, splitQuotaByHeadcount } from './audienceRounds.js'

/** 校选类别：ME demo 统一一类（模拟按学生过滤）；GE 可混杂 */
function resolveSchoolElectiveCategory(course) {
  if (course.schoolElectiveCategory) return course.schoolElectiveCategory
  if (course.type === 'ME') return 'arts'
  const cats = schoolElectiveCategoryOptions.map((o) => o.value)
  const id = String(course.id || course.code || '')
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return cats[h % cats.length]
}

/**
 * Demo 课表（batch-2504-m1）覆盖情况（相对 demo 学生：SWE/2409、已修 COMP101）：
 * 1. 已满 + 可选 → 申请候补（置顶）
 * 2. 有余量 + 可选 → 立即选课
 * 3. 已修 → 不可选
 * 4. 缺先修 → 不可选（各缺一门样例）
 * 5. 专业限制 / Intake 限制 → 不可选
 * 6. 已满 + 缺先修 → 不可选（非候补）
 * 7. isSelectable：默认 true；少数 demo 课为 false（不可选）
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
      {
        id: 'sec-it102-2',
        code: '02',
        time: 'Thu 14:00–16:00',
        room: 'D5-1-106',
        lecturer: 'Mr. Tan',
        enrolled: 40,
        capacity: 40,
      },
    ],
    quota: { total: 80, senior: 50, freshman: 30, releaseToFreshman: false, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-engl201',
    batchId: 'batch-2504-g1',
    code: 'ENGL201',
    name: 'Academic Writing',
    credits: 3,
    type: 'GE',
    isHot: true,
    rating: 4,
    sectionCount: 3,
    totalCapacity: 90,
    remainingCapacity: 27,
    quotaSummary: 'Total 90 · GE Humanities',
    prerequisites: ['COMP101'],
    g1Category: 'Humanities',
    sections: [
      {
        id: 'sec-16',
        code: '01',
        time: 'Mon 09:00–12:00',
        room: 'A2-1-101',
        weekRange: '1-5',
        lecturer: 'Dr. Sarah',
        enrolled: 28,
        capacity: 30,
        meetings: [
          { time: 'Mon 14:00–16:00', room: 'A3-509', weekRange: '1-5' },
          { time: 'Tue 10:00–12:00', room: 'A4-105', weekRange: '1-5' },
          { time: 'Thu 15:00–17:00', room: 'A3-602', weekRange: '1-5' },
        ],
      },
      {
        id: 'sec-engl201-2',
        code: '02',
        time: 'Tue 14:00–16:00',
        room: 'A1-G01',
        weekRange: '1-5',
        lecturer: 'Dr. Brown',
        enrolled: 20,
        capacity: 30,
        meetings: [
          { time: 'Tue 14:00–16:00', room: 'A1-G01', weekRange: '1-5' },
          { time: 'Wed 09:00–11:00', room: 'A4-G01', weekRange: '1-5' },
          { time: 'Thu 09:00–11:00', room: 'A3-602', weekRange: '1-5' },
        ],
      },
      {
        id: 'sec-engl201-3',
        code: '03',
        time: 'Fri 09:00–12:00',
        room: 'A2-2-105',
        lecturer: 'Ms. Chan',
        enrolled: 15,
        capacity: 30,
      },
    ],
    quota: { total: 90, senior: 50, freshman: 40, releaseToFreshman: false, byIntake: {} },
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
    sectionCount: 3,
    totalCapacity: 75,
    remainingCapacity: 13,
    quotaSummary: 'Total 75 · Senior 45 · Freshman 30',
    prerequisites: ['COMP101'],
    g1Category: null,
    sections: [
      { id: 'sec-1', code: '01', time: 'Mon 16:00–18:00', room: 'D5-3-201', lecturer: 'Dr. Lee', enrolled: 22, capacity: 25 },
      { id: 'sec-2', code: '02', time: 'Wed 14:00–16:00', room: 'D5-3-202', lecturer: 'Dr. Tan', enrolled: 20, capacity: 25 },
      { id: 'sec-comp201-3', code: '03', time: 'Fri 08:00–10:00', room: 'D5-3-203', lecturer: 'Dr. Yap', enrolled: 20, capacity: 25 },
    ],
    quota: { total: 75, senior: 45, freshman: 30, releaseToFreshman: true, byIntake: { '2409': 20, '2504': 25, '2509': 30 } },
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
    sectionCount: 2,
    totalCapacity: 80,
    remainingCapacity: 30,
    quotaSummary: 'Total 80',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-14', code: '01', time: 'Fri 09:00–11:00', room: 'S1-2-101', lecturer: 'Dr. Rahman', enrolled: 28, capacity: 40 },
      { id: 'sec-phys101-2', code: '02', time: 'Tue 14:00–16:00', room: 'S1-2-102', lecturer: 'Dr. Ismail', enrolled: 22, capacity: 40 },
    ],
    quota: { total: 80, senior: 45, freshman: 35, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-bus201',
    batchId: 'batch-2504-g2',
    code: 'BUS201',
    name: 'Business Ethics',
    credits: 3,
    type: 'GE',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 80,
    remainingCapacity: 24,
    quotaSummary: 'Total 80 · GE Business',
    prerequisites: [],
    g1Category: 'Business',
    sections: [
      { id: 'sec-18', code: '01', time: 'Tue 14:00–17:00', room: 'B3-2-101', lecturer: 'Dr. Hassan', enrolled: 28, capacity: 40 },
      { id: 'sec-bus201-2', code: '02', time: 'Thu 09:00–12:00', room: 'B3-2-102', lecturer: 'Dr. Lim', enrolled: 28, capacity: 40 },
    ],
    quota: { total: 80, senior: 45, freshman: 35, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
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
    sectionCount: 3,
    totalCapacity: 90,
    remainingCapacity: 22,
    quotaSummary: 'Total 90 · Senior 50 · Freshman 40',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-5', code: '01', time: 'Thu 14:00–16:00', room: 'D5-2-101', weekRange: '1-14', lecturer: 'Dr. Lim', enrolled: 20, capacity: 30, meetings: [
        { time: 'Thu 14:00–16:00', room: 'D5-2-101', weekRange: '1-14' },
        { time: 'Fri 10:00–12:00', room: 'D5-2-102', weekRange: '1-7' },
      ] },
      { id: 'sec-6', code: '02', time: 'Fri 10:00–12:00', room: 'D5-2-102', lecturer: 'Dr. Lim', enrolled: 25, capacity: 30 },
      { id: 'sec-comp101-3', code: '03', time: 'Mon 16:00–18:00', room: 'D5-2-103', lecturer: 'Ms. Teo', enrolled: 23, capacity: 30 },
    ],
    quota: { total: 90, senior: 50, freshman: 40, releaseToFreshman: true, byIntake: { '2409': 40, '2504': 50 } },
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
    sectionCount: 5,
    totalCapacity: 175,
    remainingCapacity: 33,
    quotaSummary: 'Total 175 · Needs COMP201',
    prerequisites: ['COMP201'],
    g1Category: null,
    sections: [
      { id: 'sec-3', code: '01', time: 'Wed 14:00–16:00', room: 'D5-3-301', lecturer: 'Dr. Wong', enrolled: 32, capacity: 35 },
      { id: 'sec-comp3192-2', code: '02', time: 'Thu 10:00–12:00', room: 'D5-3-302', lecturer: 'Dr. Goh', enrolled: 30, capacity: 35 },
      { id: 'sec-comp3192-3', code: '03', time: 'Mon 08:00–10:00', room: 'D5-3-303', lecturer: 'Dr. Lim', enrolled: 28, capacity: 35 },
      { id: 'sec-comp3192-4', code: '04', time: 'Fri 14:00–16:00', room: 'D5-2-201', lecturer: 'Dr. Tan', enrolled: 35, capacity: 35 },
      { id: 'sec-comp3192-5', code: '05', time: 'Tue 16:00–18:00', room: 'D5-2-202', lecturer: 'Ms. Ong', enrolled: 17, capacity: 35 },
    ],
    quota: { total: 175, senior: 100, freshman: 75, releaseToFreshman: false, byIntake: { '2409': 90, '2504': 85 } },
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
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 28,
    quotaSummary: 'Total 70 · Needs MATH101',
    prerequisites: ['MATH101'],
    g1Category: null,
    sections: [
      { id: 'sec-12', code: '01', time: 'Tue 10:00–12:00', room: 'D5-1-301', lecturer: 'Dr. Ng', enrolled: 22, capacity: 35 },
      { id: 'sec-comp220-2', code: '02', time: 'Fri 14:00–16:00', room: 'D5-1-302', lecturer: 'Dr. Chua', enrolled: 20, capacity: 35 },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
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
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 20,
    quotaSummary: 'Total 70 · Needs MATH101',
    prerequisites: ['MATH101'],
    g1Category: null,
    sections: [
      { id: 'sec-7', code: '01', time: 'Fri 14:00–16:00', room: 'D5-1-201', lecturer: 'Dr. Chen', enrolled: 25, capacity: 35 },
      { id: 'sec-math201-2', code: '02', time: 'Mon 08:00–10:00', room: 'D5-1-202', lecturer: 'Dr. Ong', enrolled: 25, capacity: 35 },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: false, byIntake: {} },
  },
  // —— 可选半池增补（无先修 / 有余量）——
  {
    id: 'course-stat201',
    batchId: 'batch-2504-m1',
    code: 'STAT201',
    name: 'Probability & Statistics',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 28,
    quotaSummary: 'Total 70',
    prerequisites: [],
    g1Category: null,
    sections: [
      {
        id: 'sec-stat201-1',
        code: '01',
        time: 'Mon 14:00–16:00',
        room: 'D5-1-110',
        lecturer: 'Dr. Koh',
        enrolled: 22,
        capacity: 35,
      },
      {
        id: 'sec-stat201-2',
        code: '02',
        time: 'Wed 16:00–18:00',
        room: 'D5-1-111',
        lecturer: 'Dr. Yeo',
        enrolled: 20,
        capacity: 35,
      },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  // —— 先修未修读 demo：ECE101 不在 passed/failed ——
  {
    id: 'course-emb210',
    batchId: 'batch-2504-m1',
    code: 'EMB210',
    name: 'Embedded Systems',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 60,
    remainingCapacity: 20,
    quotaSummary: 'Total 60 · Needs ECE101',
    prerequisites: ['ECE101'],
    g1Category: null,
    sections: [
      { id: 'sec-emb210-1', code: '01', time: 'Mon 14:00–16:00', room: 'D5-6-101', lecturer: 'Dr. Chew', enrolled: 20, capacity: 30 },
      { id: 'sec-emb210-2', code: '02', time: 'Wed 14:00–16:00', room: 'D5-6-102', lecturer: 'Dr. Poh', enrolled: 20, capacity: 30 },
    ],
    quota: { total: 60, senior: 35, freshman: 25, releaseToFreshman: true, byIntake: {} },
  },
  // —— 先修不及格 demo：STAT100 在 failedCourses ——
  {
    id: 'course-stat301',
    batchId: 'batch-2504-m1',
    code: 'STAT301',
    name: 'Advanced Statistics',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 60,
    remainingCapacity: 22,
    quotaSummary: 'Total 60 · Needs STAT100',
    prerequisites: ['STAT100'],
    g1Category: null,
    sections: [
      {
        id: 'sec-stat301-1',
        code: '01',
        time: 'Tue 08:00–10:00',
        room: 'D5-1-210',
        lecturer: 'Dr. Lee',
        enrolled: 20,
        capacity: 30,
      },
      {
        id: 'sec-stat301-2',
        code: '02',
        time: 'Thu 16:00–18:00',
        room: 'D5-1-211',
        lecturer: 'Dr. Yap',
        enrolled: 18,
        capacity: 30,
      },
    ],
    quota: { total: 60, senior: 35, freshman: 25, releaseToFreshman: true, byIntake: {} },
  },
  // —— 可选有余量增补 ——
  {
    id: 'course-ai110',
    batchId: 'batch-2504-m1',
    code: 'AI110',
    name: 'Introduction to AI',
    credits: 3,
    type: 'ME',
    isHot: true,
    rating: 5,
    sectionCount: 2,
    totalCapacity: 80,
    remainingCapacity: 36,
    quotaSummary: 'Total 80',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-ai110-1', code: '01', time: 'Mon 10:00–12:00', room: 'D5-4-101', lecturer: 'Dr. Foo', enrolled: 22, capacity: 40 },
      { id: 'sec-ai110-2', code: '02', time: 'Wed 10:00–12:00', room: 'D5-4-102', lecturer: 'Dr. Teo', enrolled: 22, capacity: 40 },
    ],
    quota: { total: 80, senior: 45, freshman: 35, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-web210',
    batchId: 'batch-2504-m1',
    code: 'WEB210',
    name: 'Web Development',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 24,
    quotaSummary: 'Total 70',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-web210-1', code: '01', time: 'Tue 14:00–16:00', room: 'D5-4-201', lecturer: 'Ms. Low', enrolled: 23, capacity: 35 },
      { id: 'sec-web210-2', code: '02', time: 'Fri 10:00–12:00', room: 'D5-4-202', lecturer: 'Mr. Sim', enrolled: 23, capacity: 35 },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-se220',
    batchId: 'batch-2504-m1',
    code: 'SE220',
    name: 'Requirements Engineering',
    credits: 2,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 60,
    remainingCapacity: 18,
    quotaSummary: 'Total 60',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-se220-1', code: '01', time: 'Wed 08:00–10:00', room: 'B2-1-101', lecturer: 'Dr. Ho', enrolled: 21, capacity: 30 },
      { id: 'sec-se220-2', code: '02', time: 'Thu 08:00–10:00', room: 'B2-1-102', lecturer: 'Dr. Quah', enrolled: 21, capacity: 30 },
    ],
    quota: { total: 60, senior: 35, freshman: 25, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-ge201',
    batchId: 'batch-2504-g1',
    code: 'GE201',
    name: 'Critical Thinking',
    credits: 2,
    type: 'GE',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 90,
    remainingCapacity: 40,
    quotaSummary: 'Total 90',
    prerequisites: [],
    g1Category: 'Humanities',
    sections: [
      { id: 'sec-ge201-1', code: '01', time: 'Mon 16:00–18:00', room: 'A2-3-101', lecturer: 'Dr. Ng', enrolled: 25, capacity: 45 },
      { id: 'sec-ge201-2', code: '02', time: 'Fri 16:00–18:00', room: 'A2-3-102', lecturer: 'Ms. Tay', enrolled: 25, capacity: 45 },
    ],
    quota: { total: 90, senior: 50, freshman: 40, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-net110',
    batchId: 'batch-2504-m1',
    code: 'NET110',
    name: 'Computer Networks Basics',
    credits: 4,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 0,
    quotaSummary: 'Total 70 · Full',
    prerequisites: [],
    g1Category: null,
    sections: [
      { id: 'sec-net110-1', code: '01', time: 'Tue 09:00–11:00', room: 'D5-5-101', lecturer: 'Dr. Chai', enrolled: 35, capacity: 35 },
      { id: 'sec-net110-2', code: '02', time: 'Thu 09:00–11:00', room: 'D5-5-102', lecturer: 'Dr. Beh', enrolled: 35, capacity: 35 },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: false, byIntake: {} },
  },
  {
    id: 'course-db110',
    batchId: 'batch-2504-m1',
    code: 'DB110',
    name: 'Intro to Databases',
    credits: 3,
    type: 'ME',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 16,
    quotaSummary: 'Total 70 · Needs COMP201',
    prerequisites: ['COMP201'],
    g1Category: null,
    sections: [
      { id: 'sec-db110-1', code: '01', time: 'Wed 14:00–16:00', room: 'D5-5-201', lecturer: 'Dr. Ong', enrolled: 27, capacity: 35 },
      { id: 'sec-db110-2', code: '02', time: 'Fri 14:00–16:00', room: 'D5-5-202', lecturer: 'Dr. Lim', enrolled: 27, capacity: 35 },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: true, byIntake: {} },
    visibleFromRound: 'main',
  },
  {
    id: 'course-hum110',
    batchId: 'batch-2504-g1',
    code: 'HUM110',
    name: 'Introduction to Humanities',
    credits: 3,
    type: 'GE',
    isHot: false,
    rating: 4,
    sectionCount: 2,
    totalCapacity: 70,
    remainingCapacity: 30,
    quotaSummary: 'Total 70 · GE Humanities',
    prerequisites: [],
    g1Category: 'Humanities',
    sections: [
      {
        id: 'sec-hum110-1',
        code: '01',
        time: 'Wed 09:00–12:00',
        room: 'A2-2-201',
        lecturer: 'Dr. Lim',
        enrolled: 25,
        capacity: 35,
      },
      {
        id: 'sec-hum110-2',
        code: '02',
        time: 'Thu 14:00–17:00',
        room: 'A2-2-202',
        lecturer: 'Dr. Park',
        enrolled: 15,
        capacity: 35,
      },
    ],
    quota: { total: 70, senior: 40, freshman: 30, releaseToFreshman: true, byIntake: {} },
    isSelectable: false,
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
    sectionCount: 2,
    totalCapacity: 60,
    remainingCapacity: 18,
    quotaSummary: 'Total 60 · COS only',
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
        capacity: 30,
      },
      {
        id: 'sec-cos210-2',
        code: '02',
        time: 'Tue 16:00–18:00',
        room: 'D5-2-302',
        lecturer: 'Dr. Aziz',
        enrolled: 17,
        capacity: 30,
      },
    ],
    quota: { total: 60, senior: 35, freshman: 25, releaseToFreshman: true, byIntake: {} },
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
    sectionCount: 2,
    totalCapacity: 120,
    remainingCapacity: 55,
    quotaSummary: 'Total 120 · Intake 2509 only',
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
        capacity: 60,
      },
      {
        id: 'sec-swe110-2',
        code: '02',
        time: 'Fri 15:00–16:00',
        room: 'A1-1-002',
        lecturer: 'Student Affairs',
        enrolled: 25,
        capacity: 60,
      },
    ],
    quota: { total: 120, senior: 0, freshman: 120, releaseToFreshman: true, byIntake: { '2509': 120 } },
    audience: { intakes: ['2509'] },
  },
  // —— 主批补齐至 25 门 ——
  ...buildActiveBatchDemoCourses(
    'batch-2504-m1',
    'PAD',
    ['Practice Studio I', 'Design Thinking Lab', 'Industry Seminar', 'Portfolio Workshop'],
    { codeStart: 301 },
  ),
  // —— GE 批次课：HUM(g1) / BUS(g2) / MPU(g3) 分挂，切换批次列表不同 ——
  {
    id: 'course-mpu318',
    batchId: 'batch-2504-g3',
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
      { id: 'sec-mpu318-2', code: '02', time: 'Wed 14:00–17:00', room: 'A3-1-102', lecturer: 'Dr. Siti', enrolled: 25, capacity: 40 },
      { id: 'sec-mpu318-3', code: '03', time: 'Fri 09:00–12:00', room: 'A3-2-101', lecturer: 'Mr. Kumar', enrolled: 25, capacity: 40 },
    ],
    quota: { total: 120, senior: 60, freshman: 60, releaseToFreshman: true, byIntake: {} },
  },
  ...buildActiveBatchDemoCourses(
    'batch-2504-g1',
    'HUM',
    [
      'Philosophy and Current Issues',
      'Creative Arts Appreciation',
      'Intercultural Communication',
      'Media Literacy',
      'Global Perspectives',
      'Public Speaking',
      'Academic Writing Skills',
      'Critical Thinking Skills',
      'Ethics in Society',
      'World Literature Intro',
    ],
    { type: 'GE', codeStart: 201 },
  ),
  ...buildActiveBatchDemoCourses(
    'batch-2504-g2',
    'BUS',
    [
      'Principles of Management',
      'Personal Finance Literacy',
      'Entrepreneurship Basics',
      'Marketing Fundamentals',
      'Business Communication',
      'Organizational Behavior',
      'Intro to Accounting',
      'Digital Commerce Basics',
    ],
    { type: 'GE', codeStart: 301 },
  ),
  ...buildActiveBatchDemoCourses(
    'batch-2504-g3',
    'MPU',
    [
      'Integrity and Anti-Corruption',
      'Community Service',
      'Civic Engagement',
      'National Language Appreciation',
      'Constitutional Literacy',
      'Social Responsibility',
    ],
    { type: 'GE', codeStart: 401 },
  ),
  // 原 GEC 大杂烩列表已拆到 HUM/BUS/MPU，避免三批课表雷同
  // ...buildActiveBatchDemoCourses('batch-2504-g1', 'GEC', [...], { type: 'GE', codeStart: 201 }),
  // —— 其他「进行中」批次列表 demo 课程（不参与学生主链路）——
  ...buildActiveBatchDemoCourses('batch-me-cst-i', 'CST', [
    'Discrete Structures',
    'Computer Networks',
    'Operating Systems',
    'Database Systems',
    'Software Testing',
    'Cloud Computing',
    'Mobile Development',
    'UI/UX Design',
    'IT Project Management',
    'Cyber Hygiene',
    'Web Architecture',
    'Systems Analysis',
    'Enterprise Applications',
    'DevOps Practices',
    'API Design',
    'Data Engineering Intro',
    'Human-Computer Interaction',
    'Software Quality',
    'Requirements Engineering',
    'Agile Delivery',
    'Network Administration',
    'Storage Systems',
    'IT Governance',
    'Service Desk Operations',
    'Capstone Planning',
  ]),
  ...buildActiveBatchDemoCourses('batch-me-cos', 'COS', [
    'Algorithms',
    'Compiler Design',
    'Computer Graphics',
    'Parallel Computing',
    'Machine Learning Intro',
    'Information Retrieval',
    'Distributed Systems',
    'Secure Coding',
    'Data Visualization',
    'Capstone Prep',
    'Theory of Computation',
    'Advanced Databases',
    'Natural Language Processing',
    'Computer Vision Basics',
    'Reinforcement Learning Intro',
    'Graph Algorithms',
    'Optimization Methods',
    'Scientific Computing',
    'Knowledge Graphs',
    'Edge Computing',
    'Realtime Systems',
    'Formal Methods',
    'Program Analysis',
    'Research Methods',
    'Industry Project Studio',
  ]),
  ...buildActiveBatchDemoCourses('batch-me-cys-i', 'CYS', [
    'Network Security',
    'Cryptography Basics',
    'Ethical Hacking',
    'Digital Forensics',
    'Security Policies',
    'Malware Analysis',
    'Identity Management',
    'Secure Software',
    'Risk Assessment',
    'Incident Response',
    'Threat Intelligence',
    'Cloud Security',
    'Application Security',
    'Security Operations',
    'Privacy Engineering',
    'Penetration Testing Lab',
    'Wireless Security',
    'IoT Security',
    'Security Architecture',
    'Compliance and Audit',
    'Social Engineering Defense',
    'Secure Coding Lab',
    'Security Metrics',
    'Zero Trust Fundamentals',
    'Cyber Law Awareness',
  ]),
  // —— 选课结果页：其余批次轻量课表，保证切换批次三 Tab 均有数据 ——
  ...buildActiveBatchDemoCourses('batch-me-chs-junior', 'CHSJ', [
    'Intro to Health Sciences',
    'Basic Anatomy',
    'Community Health',
    'Study Skills for CHS',
  ], { codeStart: 101 }),
  ...buildActiveBatchDemoCourses('batch-me-chs-senior-i', 'CHS1', [
    'Clinical Practice I',
    'Pathophysiology',
    'Health Informatics',
    'Evidence-Based Care',
  ], { codeStart: 201 }),
  ...buildActiveBatchDemoCourses('batch-me-chs-senior-ii', 'CHS2', [
    'Clinical Practice II',
    'Advanced Nursing Topics',
    'Public Health Project',
    'Professional Ethics in Health',
  ], { codeStart: 301 }),
  ...buildActiveBatchDemoCourses('batch-me-cst-ii', 'CST2', [
    'Advanced Networks',
    'Enterprise Systems',
    'IT Strategy',
    'Capstone Delivery',
  ], { codeStart: 401 }),
  ...buildActiveBatchDemoCourses('batch-me-swe-ii', 'SWE2', [
    'Software Architecture',
    'DevOps Pipeline',
    'Quality Assurance Lab',
    'Team Project Studio',
  ], { codeStart: 401 }),
  ...buildActiveBatchDemoCourses('batch-me-cys-ii', 'CYS2', [
    'Advanced Cryptography',
    'Red Team Lab',
    'Security Governance',
    'Incident Command',
  ], { codeStart: 401 }),
  ...buildActiveBatchDemoCourses('batch-me-dsc-i', 'DSC', [
    'Data Wrangling',
    'Statistical Computing',
    'ML Pipelines',
    'Dashboard Design',
  ], { codeStart: 201 }),
  ...buildActiveBatchDemoCourses('batch-me-eee-i', 'EEE1', [
    'Circuit Analysis',
    'Digital Logic',
    'Signals and Systems',
    'Embedded Basics',
  ], { codeStart: 201 }),
  ...buildActiveBatchDemoCourses('batch-me-eee-ii', 'EEE2', [
    'Power Electronics',
    'Control Systems',
    'Communications Lab',
    'Capstone Electronics',
  ], { codeStart: 401 }),
  ...buildActiveBatchDemoCourses('batch-2502-me-closed', 'MECL', [
    'Legacy Systems Review',
    'Archive Project Seminar',
    'Closed Batch Elective A',
    'Closed Batch Elective B',
  ], { codeStart: 101 }),
]

/** 列表 demo：为批次生成轻量课程种子（每课 2 个教学分组） */
function buildActiveBatchDemoCourses(batchId, codePrefix, titles, options = {}) {
  const lecturers = ['Demo Lecturer A', 'Demo Lecturer B', 'Demo Lecturer C']
  const times = [
    ['Wed 10:00–12:00', 'Fri 14:00–16:00'],
    ['Mon 08:00–10:00', 'Thu 16:00–18:00'],
    ['Tue 14:00–16:00', 'Fri 09:00–11:00'],
  ]
  const type = options.type || 'ME'
  const codeStart = options.codeStart || 201
  return titles.map((name, index) => {
    const n = index + 1
    const perCap = 30 + (index % 3) * 5
    const enrolled1 = 8 + index
    const enrolled2 = 6 + (index % 5)
    const [t1, t2] = times[index % times.length]
    return {
      id: `course-${codePrefix.toLowerCase()}-demo-${n}`,
      batchId,
      code: `${codePrefix}${codeStart + index}`,
      name,
      credits: 2 + (index % 3),
      type,
      isHot: index < 2,
      rating: 3 + (index % 3),
      sectionCount: 2,
      totalCapacity: perCap * 2,
      remainingCapacity: Math.max(0, perCap * 2 - enrolled1 - enrolled2),
      quotaSummary: `Total ${perCap * 2}`,
      prerequisites: [],
      g1Category: type === 'GE' ? 'General' : null,
      sections: [
        {
          id: `sec-${codePrefix.toLowerCase()}-demo-${n}-1`,
          code: '01',
          time: t1,
          room: 'B2-2-201',
          lecturer: lecturers[index % lecturers.length],
          enrolled: enrolled1,
          capacity: perCap,
          ...(() => {
            const split = splitQuotaByHeadcount(
              perCap,
              DEMO_HEADCOUNT.freshman,
              DEMO_HEADCOUNT.senior,
            )
            return {
              enrolledFreshman: Math.min(split.freshman, enrolled1),
              enrolledSenior: Math.max(0, enrolled1 - Math.min(split.freshman, enrolled1)),
              quota: { total: perCap, freshman: split.freshman, senior: split.senior },
            }
          })(),
        },
        {
          id: `sec-${codePrefix.toLowerCase()}-demo-${n}-2`,
          code: '02',
          time: t2,
          room: 'B2-2-202',
          lecturer: lecturers[(index + 1) % lecturers.length],
          enrolled: enrolled2,
          capacity: perCap,
          ...(() => {
            const split = splitQuotaByHeadcount(
              perCap,
              DEMO_HEADCOUNT.freshman,
              DEMO_HEADCOUNT.senior,
            )
            return {
              enrolledFreshman: Math.min(split.freshman, enrolled2),
              enrolledSenior: Math.max(0, enrolled2 - Math.min(split.freshman, enrolled2)),
              quota: { total: perCap, freshman: split.freshman, senior: split.senior },
            }
          })(),
        },
      ],
      quota: (() => {
        const split = splitQuotaByHeadcount(
          perCap,
          DEMO_HEADCOUNT.freshman,
          DEMO_HEADCOUNT.senior,
        )
        return {
          total: perCap * 2,
          senior: split.senior * 2,
          freshman: split.freshman * 2,
          releaseToFreshman: true,
          byIntake: {},
        }
      })(),
    }
  })
}

/**
 * 按在册新老人数初分公式，为单个分组写入新老容量（合计 = capacity）。
 * @param {object} sec
 * @param {object} [course]
 */
function applyHeadcountQuotaToSection(sec, course = null) {
  const cap = Math.max(0, Math.floor(Number(sec?.capacity) || 0))
  const enrolled = Number(sec?.enrolled) || 0
  const split = splitQuotaByHeadcount(cap, DEMO_HEADCOUNT.freshman, DEMO_HEADCOUNT.senior)
  const year2 = course ? isYear2OrSem2OnlyCourse(course) : false
  const freshmanCap = year2 ? 0 : split.freshman
  const seniorCap = year2 ? cap : split.senior
  const splitSum = freshmanCap + seniorCap || 1
  let enrolledFreshman =
    sec.enrolledFreshman != null
      ? Number(sec.enrolledFreshman)
      : Math.min(freshmanCap, Math.round((enrolled * freshmanCap) / splitSum))
  let enrolledSenior =
    sec.enrolledSenior != null
      ? Number(sec.enrolledSenior)
      : Math.max(0, enrolled - enrolledFreshman)
  if (!Number.isFinite(enrolledFreshman)) enrolledFreshman = 0
  if (!Number.isFinite(enrolledSenior)) enrolledSenior = Math.max(0, enrolled - enrolledFreshman)
  return {
    ...sec,
    enrolledFreshman,
    enrolledSenior,
    quota: {
      ...(sec.quota || {}),
      total: cap,
      freshman: freshmanCap,
      senior: seniorCap,
    },
  }
}

function applyHeadcountQuotaToSections(sections, course = null) {
  return (sections || []).map((sec) => applyHeadcountQuotaToSection(sec, course))
}

/**
 * 按课级新老名额拆到各分组；已有 section.quota 则保留（仅超额压回 capacity）；末行吃差额。
 */
function distributeSectionAudience(sections, courseFreshman, courseSenior) {
  const totalCap = sections.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0) || 1
  let usedFresh = 0
  let usedSenior = 0
  const out = []

  for (let index = 0; index < sections.length; index += 1) {
    const sec = sections[index]
    const cap = Number(sec.capacity) || 0
    const enrolled = Number(sec.enrolled) || 0
    const isLast = index === sections.length - 1
    const hasOwn =
      sec.quota &&
      (Number.isFinite(Number(sec.quota.freshman)) || Number.isFinite(Number(sec.quota.senior)))

    let freshmanCap
    let seniorCap

    if (hasOwn) {
      freshmanCap = Math.max(0, Math.floor(Number(sec.quota.freshman) || 0))
      seniorCap = Math.max(0, Math.floor(Number(sec.quota.senior) || 0))
      // 仅当合计超过有效容量时压回；允许合计 < capacity（手改未凑满）
      if (cap > 0 && freshmanCap + seniorCap > cap) {
        const sum = freshmanCap + seniorCap || 1
        seniorCap = Math.round((cap * seniorCap) / sum)
        freshmanCap = Math.max(0, cap - seniorCap)
      }
    } else if (isLast) {
      freshmanCap = Math.max(0, courseFreshman - usedFresh)
      seniorCap = Math.max(0, courseSenior - usedSenior)
      // 末行吃差额；仅当超出本组容量时压回，不强制凑满 capacity
      if (cap > 0 && freshmanCap + seniorCap > cap) {
        seniorCap = Math.min(
          cap,
          Math.round((cap * courseSenior) / (courseFreshman + courseSenior || 1)),
        )
        freshmanCap = Math.max(0, cap - seniorCap)
      }
    } else {
      seniorCap = Math.round((cap * courseSenior) / totalCap)
      freshmanCap = Math.round((cap * courseFreshman) / totalCap)
      if (cap > 0 && freshmanCap + seniorCap > cap) {
        seniorCap = Math.min(cap, seniorCap)
        freshmanCap = Math.max(0, cap - seniorCap)
      }
    }

    usedFresh += freshmanCap
    usedSenior += seniorCap

    const splitSum = freshmanCap + seniorCap || 1
    let enrolledFreshman =
      sec.enrolledFreshman != null
        ? Number(sec.enrolledFreshman)
        : Math.min(freshmanCap, Math.round((enrolled * freshmanCap) / splitSum))
    let enrolledSenior =
      sec.enrolledSenior != null
        ? Number(sec.enrolledSenior)
        : Math.max(0, enrolled - enrolledFreshman)
    if (!Number.isFinite(enrolledFreshman)) enrolledFreshman = 0
    if (!Number.isFinite(enrolledSenior)) enrolledSenior = Math.max(0, enrolled - enrolledFreshman)

    out.push({
      ...sec,
      enrolledFreshman,
      enrolledSenior,
      quota: {
        ...(sec.quota || {}),
        total: cap,
        freshman: freshmanCap,
        senior: seniorCap,
      },
    })
  }

  return out
}

function enrichCourse(course) {
  let sections = (course.sections || []).map((sec) => enrichSectionScheduleFields(sec))
  const sectionCapacity = sections.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0)
  const sectionEnrolled = sections.reduce((sum, item) => sum + (Number(item.enrolled) || 0), 0)
  // 有分组时以分组容量合计为准（容量设置会同步改分组）；无分组时用课程总容量
  const totalCapacity = sections.length ? sectionCapacity : Number(course.totalCapacity) || 0
  const enrolled = sections.length
    ? sectionEnrolled
    : Math.max(0, totalCapacity - (Number(course.remainingCapacity) || 0))
  const remainingCapacity = Math.max(0, totalCapacity - enrolled)

  const quotaIn = course.quota || {}
  let freshman = Number(quotaIn.freshman)
  let senior = Number(quotaIn.senior)
  if (!Number.isFinite(freshman) || !Number.isFinite(senior) || freshman + senior <= 0) {
    const split = splitQuotaByHeadcount(
      totalCapacity,
      DEMO_HEADCOUNT.freshman,
      DEMO_HEADCOUNT.senior,
    )
    senior = split.senior
    freshman = split.freshman
  } else if (totalCapacity > 0 && freshman + senior > totalCapacity) {
    // 仅超额时按比例压回有效容量；允许合计小于有效容量
    const sum = freshman + senior || 1
    senior = Math.round((totalCapacity * senior) / sum)
    freshman = Math.max(0, totalCapacity - senior)
  }

  if (sections.length) {
    const needHeadcount = sections.some((sec) => {
      const f = Number(sec.quota?.freshman)
      const s = Number(sec.quota?.senior)
      return !Number.isFinite(f) || !Number.isFinite(s)
    })
    sections = needHeadcount
      ? applyHeadcountQuotaToSections(sections, course)
      : distributeSectionAudience(sections, freshman, senior)
    freshman = sections.reduce((s, sec) => s + (Number(sec.quota?.freshman) || 0), 0)
    senior = sections.reduce((s, sec) => s + (Number(sec.quota?.senior) || 0), 0)
  }

  const sourceCapacity =
    course.sourceCapacity != null && Number(course.sourceCapacity) > 0
      ? Number(course.sourceCapacity)
      : totalCapacity || sectionCapacity

  const enrolledFreshman = sections.length
    ? sections.reduce((s, sec) => s + (Number(sec.enrolledFreshman) || 0), 0)
    : course.enrolledFreshman != null
      ? Number(course.enrolledFreshman)
      : Math.min(freshman, Math.round((enrolled * freshman) / (freshman + senior || 1)))
  const enrolledSenior = sections.length
    ? sections.reduce((s, sec) => s + (Number(sec.enrolledSenior) || 0), 0)
    : course.enrolledSenior != null
      ? Number(course.enrolledSenior)
      : Math.max(0, enrolled - enrolledFreshman)

  const capacityPercent =
    course.capacityPercent != null
      ? Number(course.capacityPercent)
      : sourceCapacity > 0
        ? Math.round((totalCapacity / sourceCapacity) * 100)
        : 100

  return {
    ...course,
    isSelectable: course.isSelectable !== false,
    schoolElectiveCategory: resolveSchoolElectiveCategory(course),
    sections,
    sectionCount: sections.length || course.sectionCount || 0,
    totalCapacity,
    remainingCapacity,
    sourceCapacity,
    capacityPercent,
    enrolledFreshman,
    enrolledSenior,
    quota: {
      ...quotaIn,
      total: totalCapacity,
      freshman,
      senior,
      releaseToFreshman: quotaIn.releaseToFreshman !== false,
      byIntake: quotaIn.byIntake || {},
    },
  }
}

export function getCourseEnrolledTotal(course) {
  const total = Number(course?.totalCapacity) || 0
  const remaining = Number(course?.remainingCapacity)
  if (Number.isFinite(remaining) && total >= 0) return Math.max(0, total - remaining)
  return (course?.sections || []).reduce((sum, sec) => sum + (Number(sec.enrolled) || 0), 0)
}

/** 新生/老生已选与容量（展示用） */
export function getCourseAudienceCapacity(course) {
  const freshmanCap = Number(course?.quota?.freshman) || 0
  const seniorCap = Number(course?.quota?.senior) || 0
  const enrolled = getCourseEnrolledTotal(course)
  const splitSum = freshmanCap + seniorCap || 1
  const enrolledFreshman =
    course?.enrolledFreshman != null
      ? Number(course.enrolledFreshman)
      : Math.min(freshmanCap, Math.round((enrolled * freshmanCap) / splitSum))
  const enrolledSenior =
    course?.enrolledSenior != null
      ? Number(course.enrolledSenior)
      : Math.max(0, enrolled - enrolledFreshman)
  return {
    freshmanCap,
    seniorCap,
    enrolledFreshman,
    enrolledSenior,
    sourceCapacity: Number(course?.sourceCapacity) || Number(course?.totalCapacity) || 0,
  }
}

/** year2 / sem2 才开放的课：不给新生名额 */
export function isYear2OrSem2OnlyCourse(course) {
  if (!course) return false
  if (course.minStudentSemester != null && Number(course.minStudentSemester) >= 2) return true
  if (course.year2OrSem2Only) return true
  const code = String(course.code || '').toUpperCase()
  // demo：部分进阶课
  return /^(SWE3|COS3|DSA3|FIN3)/.test(code)
}

/**
 * 手调或按比例初分后写回新老名额；year2 课强制 freshman=0
 * @param {string[]} courseIds
 * @param {{ senior: number, freshman: number }} quota
 */
export function updateCoursesAudienceQuota(courseIds = [], quota = {}) {
  const idSet = new Set(courseIds)
  let senior = Math.max(0, Math.floor(Number(quota.senior) || 0))
  let freshman = Math.max(0, Math.floor(Number(quota.freshman) || 0))
  let count = 0

  selectableCourses.value = selectableCourses.value.map((course) => {
    if (!idSet.has(course.id)) return course
    let nextFresh = isYear2OrSem2OnlyCourse(course) ? 0 : freshman
    let nextSenior = senior
    const cap = Math.max(0, Math.floor(Number(course.totalCapacity) || 0))
    // 仅超额压回；不改 capacity，允许合计 < 有效容量
    if (cap > 0 && nextFresh + nextSenior > cap) {
      nextSenior = Math.min(cap, Math.round((cap * nextSenior) / (nextFresh + nextSenior || 1)))
      nextFresh = isYear2OrSem2OnlyCourse(course) ? 0 : Math.max(0, cap - nextSenior)
    }
    const bareSections = (course.sections || []).map((sec) => {
      const { quota: _q, enrolledFreshman: _ef, enrolledSenior: _es, ...rest } = sec
      return rest
    })
    const sections =
      bareSections.length > 0
        ? distributeSectionAudience(bareSections, nextFresh, nextSenior)
        : bareSections
    const enrolled = sections.length
      ? sections.reduce((s, sec) => s + (Number(sec.enrolled) || 0), 0)
      : getCourseEnrolledTotal(course)
    const enrolledFreshman = sections.length
      ? sections.reduce((s, sec) => s + (Number(sec.enrolledFreshman) || 0), 0)
      : Math.min(nextFresh, Math.round((enrolled * nextFresh) / (nextFresh + nextSenior || 1)))
    const enrolledSenior = sections.length
      ? sections.reduce((s, sec) => s + (Number(sec.enrolledSenior) || 0), 0)
      : Math.max(0, enrolled - enrolledFreshman)
    const totalCapacity = sections.length
      ? sections.reduce((s, sec) => s + (Number(sec.capacity) || 0), 0)
      : cap
    count += 1
    return {
      ...course,
      totalCapacity,
      remainingCapacity: Math.max(0, totalCapacity - enrolled),
      enrolledFreshman,
      enrolledSenior,
      sections,
      sectionCount: sections.length || course.sectionCount,
      quota: {
        ...(course.quota || {}),
        total: totalCapacity,
        freshman: sections.length
          ? sections.reduce((s, sec) => s + (Number(sec.quota?.freshman) || 0), 0)
          : nextFresh,
        senior: sections.length
          ? sections.reduce((s, sec) => s + (Number(sec.quota?.senior) || 0), 0)
          : nextSenior,
        releaseToFreshman: course.quota?.releaseToFreshman !== false,
        byIntake: course.quota?.byIntake || {},
      },
    }
  })
  return count
}

/**
 * 按课程分组写回新老名额，并汇总回所属课程。
 * @param {string[]} sectionIds
 * @param {{ senior: number, freshman: number }} quota
 */
export function updateSectionsAudienceQuota(sectionIds = [], quota = {}) {
  const idSet = new Set(sectionIds)
  let senior = Math.max(0, Math.floor(Number(quota.senior) || 0))
  let freshman = Math.max(0, Math.floor(Number(quota.freshman) || 0))
  let count = 0

  selectableCourses.value = selectableCourses.value.map((course) => {
    const year2 = isYear2OrSem2OnlyCourse(course)
    let touched = false
    const sections = (course.sections || []).map((sec) => {
      if (!idSet.has(sec.id)) return sec
      touched = true
      count += 1
      let nextFresh = year2 ? 0 : freshman
      let nextSenior = senior
      const secCap = Math.max(0, Math.floor(Number(sec.capacity) || 0))
      if (secCap > 0 && nextFresh + nextSenior > secCap) {
        nextSenior = Math.min(secCap, Math.round((secCap * nextSenior) / (nextFresh + nextSenior || 1)))
        nextFresh = year2 ? 0 : Math.max(0, secCap - nextSenior)
      }
      const enrolled = Number(sec.enrolled) || 0
      const splitSum = nextFresh + nextSenior || 1
      const enrolledFreshman = Math.min(nextFresh, Math.round((enrolled * nextFresh) / splitSum))
      const enrolledSenior = Math.max(0, enrolled - enrolledFreshman)
      return {
        ...sec,
        enrolledFreshman,
        enrolledSenior,
        quota: {
          ...(sec.quota || {}),
          total: secCap,
          freshman: nextFresh,
          senior: nextSenior,
        },
      }
    })
    if (!touched) return course

    const totalCapacity = sections.reduce((s, sec) => s + (Number(sec.capacity) || 0), 0)
    const enrolled = sections.reduce((s, sec) => s + (Number(sec.enrolled) || 0), 0)
    const nextFresh = sections.reduce((s, sec) => s + (Number(sec.quota?.freshman) || 0), 0)
    const nextSenior = sections.reduce((s, sec) => s + (Number(sec.quota?.senior) || 0), 0)
    const enrolledFreshman = sections.reduce((s, sec) => s + (Number(sec.enrolledFreshman) || 0), 0)
    const enrolledSenior = sections.reduce((s, sec) => s + (Number(sec.enrolledSenior) || 0), 0)

    return {
      ...course,
      sections,
      sectionCount: sections.length,
      totalCapacity,
      remainingCapacity: Math.max(0, totalCapacity - enrolled),
      enrolledFreshman,
      enrolledSenior,
      quota: {
        ...(course.quota || {}),
        total: totalCapacity,
        freshman: nextFresh,
        senior: nextSenior,
        releaseToFreshman: course.quota?.releaseToFreshman !== false,
        byIntake: course.quota?.byIntake || {},
      },
    }
  })

  return count
}

/**
 * R3 互释：本池剩余 +（开关开时）对方池剩余
 * @returns {{ ownRemaining: number, peerRemaining: number, effective: number }}
 */
export function getRound3EffectiveRemaining(course, audience, releaseCross = true) {
  const { freshmanCap, seniorCap, enrolledFreshman, enrolledSenior } = getCourseAudienceCapacity(course)
  const seniorRem = Math.max(0, seniorCap - enrolledSenior)
  const freshRem = Math.max(0, freshmanCap - enrolledFreshman)
  const ownRemaining = audience === 'freshman' ? freshRem : seniorRem
  const peerRemaining = audience === 'freshman' ? seniorRem : freshRem
  const allow =
    releaseCross &&
    course?.quota?.releaseToFreshman !== false &&
    course?.quota?.releaseCrossAudienceOnRound3 !== false
  return {
    ownRemaining,
    peerRemaining: allow ? peerRemaining : 0,
    effective: ownRemaining + (allow ? peerRemaining : 0),
  }
}

/** 往期新老占比 demo（课详情） */
export function getPastAudienceRatioDemo(course) {
  const code = String(course?.code || 'X')
  const seed = code.charCodeAt(0) + (code.charCodeAt(code.length - 1) || 0)
  return [
    { session: '2025/04', seniorPercent: 70 + (seed % 10), freshmanPercent: 30 - (seed % 10) },
    { session: '2025/09', seniorPercent: 65 + (seed % 8), freshmanPercent: 35 - (seed % 8) },
    { session: '2026/02', seniorPercent: 72 + (seed % 5), freshmanPercent: 28 - (seed % 5) },
  ].map((row) => ({
    ...row,
    freshmanPercent: Math.max(0, Math.min(100, row.freshmanPercent)),
    seniorPercent: Math.max(0, Math.min(100, 100 - Math.max(0, Math.min(100, row.freshmanPercent)))),
  }))
}

export function updateCourseSelectable(courseId, isSelectable) {
  const index = selectableCourses.value.findIndex((item) => item.id === courseId)
  if (index === -1) return null
  const next = {
    ...selectableCourses.value[index],
    isSelectable: Boolean(isSelectable),
  }
  selectableCourses.value[index] = next
  return next
}

/** @param {string[]} courseIds @param {boolean} isSelectable */
export function updateCoursesSelectable(courseIds = [], isSelectable) {
  const idSet = new Set(courseIds)
  let count = 0
  for (const course of selectableCourses.value) {
    if (!idSet.has(course.id)) continue
    course.isSelectable = Boolean(isSelectable)
    count += 1
  }
  selectableCourses.value = [...selectableCourses.value]
  return count
}

/**
 * 相对源容量设置总容量百分比，并按比例重算新生/老生配额。
 * @param {string[]} courseIds
 * @param {number} percent 如 100、120
 */
export function updateCoursesCapacityPercent(courseIds = [], percent) {
  const p = Number(percent)
  if (!Number.isFinite(p) || p <= 0) return 0
  const idSet = new Set(courseIds)
  let count = 0

  selectableCourses.value = selectableCourses.value.map((course) => {
    if (!idSet.has(course.id)) return course
    const source =
      Number(course.sourceCapacity) > 0
        ? Number(course.sourceCapacity)
        : Number(course.totalCapacity) || 0
    if (source <= 0) return course

    const enrolled = getCourseEnrolledTotal(course)
    const newTotal = Math.max(enrolled, Math.round((source * p) / 100))

    const sections = (course.sections || []).map((sec) => {
      const oldCap = Number(sec.capacity) || 0
      const sectionTotal = (course.sections || []).reduce((s, item) => s + (Number(item.capacity) || 0), 0) || 1
      const nextCap = Math.max(Number(sec.enrolled) || 0, Math.round((newTotal * oldCap) / sectionTotal))
      const { quota: _q, enrolledFreshman: _ef, enrolledSenior: _es, ...rest } = sec
      return { ...rest, capacity: nextCap }
    })
    // 修正分组容量合计与 newTotal 的差额
    if (sections.length) {
      const sumCap = sections.reduce((s, item) => s + item.capacity, 0)
      const diff = newTotal - sumCap
      if (diff !== 0) {
        sections[0] = {
          ...sections[0],
          capacity: Math.max(Number(sections[0].enrolled) || 0, sections[0].capacity + diff),
        }
      }
    }

    const withAudience = sections.length
      ? applyHeadcountQuotaToSections(sections, course)
      : sections
    const splitCourse = splitQuotaByHeadcount(
      newTotal,
      DEMO_HEADCOUNT.freshman,
      DEMO_HEADCOUNT.senior,
    )
    let freshman = withAudience.length
      ? withAudience.reduce((s, sec) => s + (Number(sec.quota?.freshman) || 0), 0)
      : isYear2OrSem2OnlyCourse(course)
        ? 0
        : splitCourse.freshman
    let senior = withAudience.length
      ? withAudience.reduce((s, sec) => s + (Number(sec.quota?.senior) || 0), 0)
      : isYear2OrSem2OnlyCourse(course)
        ? newTotal
        : splitCourse.senior
    if (isYear2OrSem2OnlyCourse(course) && !withAudience.length) {
      freshman = 0
      senior = newTotal
    }
    const enrolledFreshman = withAudience.length
      ? withAudience.reduce((s, sec) => s + (Number(sec.enrolledFreshman) || 0), 0)
      : Math.min(freshman, Math.round((enrolled * freshman) / (freshman + senior || 1)))
    const enrolledSenior = withAudience.length
      ? withAudience.reduce((s, sec) => s + (Number(sec.enrolledSenior) || 0), 0)
      : Math.max(0, enrolled - enrolledFreshman)

    count += 1
    return {
      ...course,
      sourceCapacity: source,
      capacityPercent: Math.round(p),
      totalCapacity: newTotal,
      remainingCapacity: Math.max(0, newTotal - enrolled),
      enrolledFreshman,
      enrolledSenior,
      sections: withAudience,
      sectionCount: withAudience.length || course.sectionCount,
      quota: {
        ...(course.quota || {}),
        total: newTotal,
        freshman,
        senior,
        releaseToFreshman: course.quota?.releaseToFreshman !== false,
        byIntake: course.quota?.byIntake || {},
      },
    }
  })

  return count
}

/** @returns {string[]} 空数组 = 不限 */
export function getCourseProgrammeScopeCodes(course) {
  const list = course?.audience?.programmes
  if (!Array.isArray(list)) return []
  return list.filter((code) => code && code !== 'All' && code !== '__unlimited__')
}

/**
 * 读取课程 audience 中的学生类别
 * @param {object} course
 * @returns {string[]}
 */
export function getCourseAudienceStudentCategories(course) {
  const list = course?.audience?.studentCategories
  if (!Array.isArray(list)) return []
  return list.filter(Boolean)
}

/**
 * 读取课程 audience 中的校选类别
 * @param {object} course
 * @returns {string[]}
 */
export function getCourseAudienceSchoolElectiveCategories(course) {
  const list = course?.audience?.schoolElectiveCategories
  if (!Array.isArray(list)) return []
  return list.filter(Boolean)
}

/**
 * 批量设置课程 audience：专业范围 + 学生类别 + 校选类别（本轮仅存档）
 * @param {string[]} courseIds
 * @param {{ programmes?: string[], studentCategories?: string[], schoolElectiveCategories?: string[] }} payload
 * @returns {number} 更新门数
 */
export function updateCoursesAudienceScope(courseIds = [], payload = {}) {
  const idSet = new Set(courseIds)
  const programmes = (payload.programmes || []).filter(
    (code) => code && code !== 'All' && code !== '__unlimited__',
  )
  const studentCategories = (payload.studentCategories || []).filter(Boolean)
  const schoolElectiveCategories = (payload.schoolElectiveCategories || []).filter(Boolean)
  let count = 0

  selectableCourses.value = selectableCourses.value.map((course) => {
    if (!idSet.has(course.id)) return course
    count += 1
    const prev = course.audience || {}
    const nextAudience = { ...prev }

    if (!programmes.length) delete nextAudience.programmes
    else nextAudience.programmes = [...programmes]

    if (!studentCategories.length) delete nextAudience.studentCategories
    else nextAudience.studentCategories = [...studentCategories]

    if (!schoolElectiveCategories.length) delete nextAudience.schoolElectiveCategories
    else nextAudience.schoolElectiveCategories = [...schoolElectiveCategories]

    const hasKeys = Object.keys(nextAudience).some((key) => {
      const val = nextAudience[key]
      return Array.isArray(val) ? val.length > 0 : val != null && val !== ''
    })
    return {
      ...course,
      audience: hasKeys ? nextAudience : undefined,
    }
  })

  return count
}

/**
 * 批量设置专业范围。programmes 为空或仅含不限哨兵时清除限制。
 * @deprecated 请使用 updateCoursesAudienceScope（可同时写学生类别/校选类别）
 * @param {string[]} courseIds
 * @param {string[]} programmes
 */
export function updateCoursesProgrammeScope(courseIds = [], programmes = []) {
  return updateCoursesAudienceScope(courseIds, { programmes })
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
      sourceCapacity: 40,
      capacityPercent: 100,
      enrolledFreshman: 0,
      enrolledSenior: 0,
      quotaSummary: 'Total 40',
      prerequisites: [],
      g1Category: null,
      sections: [],
      quota: (() => {
        const split = splitQuotaByHeadcount(40, DEMO_HEADCOUNT.freshman, DEMO_HEADCOUNT.senior)
        return {
          total: 40,
          senior: split.senior,
          freshman: split.freshman,
          releaseToFreshman: true,
          byIntake: {},
        }
      })(),
      isSelectable: true,
    }
    selectableCourses.value.push(enrichCourse(item))
    added.push(item)
  }
  return added
}
