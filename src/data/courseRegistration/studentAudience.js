/**
 * 学生新老身份与学期 GE/ME 学分帽（演示）
 */
import { getCurrentStudent } from '../mockCurrentStudent.js'
import { normalizeRegistrationType } from './registrationTypes.js'
import { AUDIENCE_FRESHMAN, AUDIENCE_SENIOR } from './audienceRounds.js'

/** studentId → 注册学期序号（1=新生） */
const DEMO_REGISTRATION_SEMESTER_INDEX = {
  XMUM2309001: 4,
  COS2409001: 4,
  DSA2504002: 2,
  AIT2409010: 4,
  COS2504015: 1,
  SWE2504002: 1,
  AIT2504003: 1,
}

/** 本学期可选 GE/ME 学分上限（演示）
 * 演示生 XMUM2309001：ME 帽 16，已选约 6，默认可继续提交志愿
 */
const DEMO_TERM_CREDIT_CAPS = {
  default: { geMax: 12, meMax: 16 },
  XMUM2309001: { geMax: 12, meMax: 16 },
  COS2504015: { geMax: 12, meMax: 12 },
}

/** 毕业生标记（末学期仍有 GE，演示） */
const DEMO_GRADUATE_IDS = new Set(['ACC2409003', 'FIN2409007', 'FIN2409011', 'SWE2409025'])

function resolveDemoStudentId(studentId) {
  if (studentId) return String(studentId)
  return getCurrentStudent()?.basicInfo?.studentId || ''
}

export function getRegistrationSemesterIndex(studentId) {
  const id = resolveDemoStudentId(studentId)
  if (DEMO_REGISTRATION_SEMESTER_INDEX[id] != null) return DEMO_REGISTRATION_SEMESTER_INDEX[id]
  if (/2509|2504/.test(id) && /015|002$/.test(id)) return 1
  return 3
}

export function getStudentAudience(studentId) {
  return getRegistrationSemesterIndex(studentId) <= 1 ? AUDIENCE_FRESHMAN : AUDIENCE_SENIOR
}

export function isFreshmanStudent(studentId) {
  return getStudentAudience(studentId) === AUDIENCE_FRESHMAN
}

export function isSeniorStudent(studentId) {
  return getStudentAudience(studentId) === AUDIENCE_SENIOR
}

export function isGraduateStudent(studentId) {
  return DEMO_GRADUATE_IDS.has(String(resolveDemoStudentId(studentId)))
}

export function getTermCreditCaps(studentId) {
  const id = resolveDemoStudentId(studentId)
  return DEMO_TERM_CREDIT_CAPS[id] || DEMO_TERM_CREDIT_CAPS.default
}

export function creditCapForCourseType(type, caps = getTermCreditCaps()) {
  const kind = normalizeRegistrationType(type)
  if (kind === 'GE') return caps.geMax
  if (kind === 'ME' || kind === 'Mandatory') return caps.meMax
  return caps.meMax
}
