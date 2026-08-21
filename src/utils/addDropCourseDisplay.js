/** 加退课申请课程展示：编码 + 名称 */

const COURSE_NAME_BY_CODE = {
  COMP101: 'Introduction to Programming',
  COMP201: 'Data Structures',
  COMP220: 'Discrete Mathematics',
  COMP3192: 'Algorithm Design',
  PHYS101: 'Physics I',
  IT102: 'Digital Literacy Workshop',
  BUS201: 'Business Ethics',
  MPU3183: 'Malaysian Studies',
  AI110: 'Introduction to AI',
  WEB210: 'Web Development',
  DB110: 'Intro to Databases',
  ENGL201: 'Academic Writing',
  STAT201: 'Probability & Statistics',
  MATH201: 'Linear Algebra',
  HUM110: 'Introduction to Humanities',
  NET110: 'Computer Networks Basics',
  SWE110: 'Freshman Orientation (SWE)',
  COS210: 'Cybersecurity Fundamentals',
  SE220: 'Requirements Engineering',
  EMB210: 'Embedded Systems',
  STAT301: 'Advanced Statistics',
  GE201: 'Critical Thinking',
  SCI110: 'Scientific Reasoning',
  FIN110: 'Personal Finance Literacy',
}

export function resolveAddDropCourseName(item) {
  if (!item?.courseCode) return ''
  return item.courseName || COURSE_NAME_BY_CODE[item.courseCode] || ''
}

/** 统一格式：课程编码 + 课程名称 */
export function formatAddDropCourseText(item) {
  if (!item?.courseCode) return '—'
  const name = resolveAddDropCourseName(item)
  if (!name || name === item.courseCode) return item.courseCode
  return `${item.courseCode} ${name}`
}

/** 详情拆列：名称 / 编码 */
export function resolveAddDropCourseParts(item, snapshot = null) {
  const code = snapshot?.code || snapshot?.courseCode || item?.courseCode || ''
  const name =
    snapshot?.name ||
    snapshot?.courseName ||
    resolveAddDropCourseName(item) ||
    snapshot?.label ||
    ''
  return { code, name }
}

function joinCourseTexts(items) {
  const texts = (items || []).map(formatAddDropCourseText).filter((text) => text && text !== '—')
  return texts.length ? texts.join(' · ') : '—'
}

export function getAddDropCourseColumnTexts(app) {
  const items = app?.items || []
  return {
    add: joinCourseTexts(items.filter((item) => item.action === 'Add')),
    drop: joinCourseTexts(items.filter((item) => item.action === 'Drop')),
    retake: joinCourseTexts(items.filter((item) => item.action === 'Retake')),
  }
}
