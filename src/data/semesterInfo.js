import { isValidDdMmYyyy, parseDdMmYyyy } from './universityInfo.js'

export const semesterCodeOptions = ['02', '04', '09']

export const semesterTypeOptions = ['Long', 'Short']

export const weekStartDayOptions = ['Sunday', 'Monday']

export const yesNoOptions = ['Yes', 'No']

export const initialSemesterRecords = [
  {
    id: 1,
    academicYear: '2024',
    semester: '02',
    semesterType: 'Short',
    startDate: '05/02/2024',
    endDate: '05/04/2024',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 2,
    academicYear: '2024',
    semester: '04',
    semesterType: 'Long',
    startDate: '08/04/2024',
    endDate: '02/08/2024',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 3,
    academicYear: '2024',
    semester: '09',
    semesterType: 'Long',
    startDate: '30/09/2024',
    endDate: '19/01/2025',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 4,
    academicYear: '2025',
    semester: '02',
    semesterType: 'Short',
    startDate: '03/02/2025',
    endDate: '04/04/2025',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 5,
    academicYear: '2025',
    semester: '04',
    semesterType: 'Long',
    startDate: '07/04/2025',
    endDate: '01/08/2025',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 6,
    academicYear: '2025',
    semester: '09',
    semesterType: 'Long',
    startDate: '29/09/2025',
    endDate: '18/01/2026',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 7,
    academicYear: '2026',
    semester: '02',
    semesterType: 'Short',
    startDate: '02/02/2026',
    endDate: '03/04/2026',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 8,
    academicYear: '2026',
    semester: '04',
    semesterType: 'Long',
    startDate: '06/04/2026',
    endDate: '31/07/2026',
    currentSemester: 'Yes',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
  {
    id: 9,
    academicYear: '2026',
    semester: '09',
    semesterType: 'Long',
    startDate: '28/09/2026',
    endDate: '17/01/2027',
    currentSemester: 'No',
    generateCalendar: 'No',
    weekStartDay: 'Sunday',
  },
]

let semesterSeq = initialSemesterRecords.length

export function createSemesterRecordId() {
  semesterSeq += 1
  return semesterSeq
}

export function getAcademicYearOptions(records) {
  return [...new Set(records.map((item) => item.academicYear))].sort()
}

export function getSemesterOptions() {
  return [...semesterCodeOptions]
}

export function formatDisplayDate(value) {
  if (!value) return ''
  return value.replace(/\//g, '.')
}

export function formatAcademicYearDisplay(year, locale = 'en') {
  if (!year) return ''
  return locale === 'zh' ? `${year}年` : year
}

export function formatAcademicSession(academicYear, semester) {
  if (!academicYear || !semester) return ''
  return `${String(academicYear).trim()}/${String(semester).trim()}`
}

export function formatSemesterDisplay(semester, locale = 'en') {
  if (!semester) return ''
  return locale === 'zh' ? `${semester}学期` : semester
}

export function validateSemesterForm(form, allItems, excludeId = null) {
  const errors = {}
  const academicYear = String(form.academicYear || '').trim()
  const semester = String(form.semester || '').trim()

  if (!academicYear) {
    errors.academicYear = 'Academic Year is required'
  } else if (!/^\d{4}$/.test(academicYear)) {
    errors.academicYear = 'Academic Year must be a 4-digit year (e.g. 2025)'
  }

  if (!semester) {
    errors.semester = 'Semester is required'
  } else if (!semesterCodeOptions.includes(semester)) {
    errors.semester = 'Semester must be one of: 02, 04, 09'
  }

  if (!form.semesterType) {
    errors.semesterType = 'Semester Type is required'
  } else if (!semesterTypeOptions.includes(form.semesterType)) {
    errors.semesterType = 'Semester Type must be Long or Short'
  }

  if (!form.startDate?.trim()) {
    errors.startDate = 'Start Date is required'
  } else if (!isValidDdMmYyyy(form.startDate)) {
    errors.startDate = 'Start Date format must be dd/mm/yyyy'
  }

  if (!form.endDate?.trim()) {
    errors.endDate = 'End Date is required'
  } else if (!isValidDdMmYyyy(form.endDate)) {
    errors.endDate = 'End Date format must be dd/mm/yyyy'
  }

  if (
    !errors.startDate &&
    !errors.endDate &&
    form.startDate?.trim() &&
    form.endDate?.trim()
  ) {
    const start = parseDdMmYyyy(form.startDate)
    const end = parseDdMmYyyy(form.endDate)
    if (start && end && end <= start) {
      errors.endDate = 'End Date must be later than Start Date'
    }
  }

  if (!form.currentSemester) {
    errors.currentSemester = 'Current Semester is required'
  } else if (!yesNoOptions.includes(form.currentSemester)) {
    errors.currentSemester = 'Current Semester must be Yes or No'
  }

  if (form.generateCalendar && !yesNoOptions.includes(form.generateCalendar)) {
    errors.generateCalendar = 'Generate Academic Calendar must be Yes or No'
  }

  if (!form.weekStartDay) {
    errors.weekStartDay = 'Week Start Day is required'
  } else if (!weekStartDayOptions.includes(form.weekStartDay)) {
    errors.weekStartDay = 'Week Start Day must be Sunday or Monday'
  }

  if (!errors.academicYear && !errors.semester) {
    const duplicate = allItems.some(
      (item) =>
        item.id !== excludeId &&
        item.academicYear === academicYear &&
        item.semester === semester,
    )
    if (duplicate) {
      errors.semester = 'This academic year and semester combination already exists'
    }
  }

  return errors
}

export function normalizeCurrentSemester(records, targetId, value) {
  if (value !== 'Yes') return records
  return records.map((item) => ({
    ...item,
    currentSemester: item.id === targetId ? 'Yes' : 'No',
  }))
}
