/**
 * 教学分组排课字段：起止周 / 上课时间（展示）/ 地点 / 教师
 * time 保留英文时钟格式供周课表解析；classTime 对齐排课模块展示文案
 */

const DAY_LABEL = {
  Mon: '星期一',
  Tue: '星期二',
  Wed: '星期三',
  Thu: '星期四',
  Fri: '星期五',
  Sat: '星期六',
  Sun: '星期日',
}

function hourToPeriod(hour) {
  if (hour < 10) return 1
  if (hour < 12) return 3
  if (hour < 14) return 5
  if (hour < 16) return 7
  if (hour < 18) return 9
  return 11
}

/** 由 Mon 10:00–12:00 推导 (1-9周 星期一第3-4节) */
export function deriveClassTime(time) {
  const match = String(time || '').match(/^(\w+)\s+(\d+):(\d+)[–-](\d+):(\d+)/)
  if (!match) return time || '—'
  const day = DAY_LABEL[match[1]] || match[1]
  const startP = hourToPeriod(Number(match[2]))
  const endHour = Number(match[4])
  const endP = Math.max(startP, hourToPeriod(endHour) - (endHour % 2 === 0 ? 1 : 0))
  const end = endP < startP ? startP + 1 : endP
  return `(1-9周 ${day}第${startP}-${end}节)`
}

export function enrichSectionScheduleFields(section) {
  if (!section) return section
  return {
    ...section,
    weekRange: section.weekRange || '1-18',
    classTime: section.classTime || deriveClassTime(section.time),
    lecturer: section.lecturer || '',
    room: section.room || '',
  }
}

export function displayClassTime(section) {
  if (!section) return '—'
  return section.classTime || deriveClassTime(section.time) || section.time || '—'
}

export function displayWeekRange(section) {
  return section?.weekRange || '—'
}
