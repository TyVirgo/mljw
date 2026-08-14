import * as XLSX from 'xlsx'
import {
  getOfferingLabel,
  getCourseOwnerLabel,
  getAffiliatedProgrammeLabel,
  formatMethodList,
  computeSLTStats,
  sumOutlineRowSLT,
  sumSimpleAssessmentSLT,
  createEmptySLTData,
} from '../data/courses.js'
import { initialDepartments } from '../data/departments.js'

const SHEET_NAME_MAX = 31

function truncateSheetName(name) {
  const text = String(name || 'Sheet')
  return text.length > SHEET_NAME_MAX ? text.slice(0, SHEET_NAME_MAX) : text
}

export const courseExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'courseCode', header: 'Course Code', width: 14 },
  { key: 'courseName', header: 'Course Name', width: 36 },
  { key: 'offering', header: 'Offering Unit', width: 34 },
  { key: 'affiliatedProgramme', header: 'Affiliated Programme', width: 40 },
  { key: 'courseOwner', header: 'Course Owner', width: 24 },
  { key: 'courseClassification', header: 'Course Classification', width: 22 },
  { key: 'credit', header: 'Credit', width: 10 },
  { key: 'mediumOfInstruction', header: 'Medium of Instruction', width: 22 },
  { key: 'semesterType', header: 'Semester Type', width: 14 },
  { key: 'prerequisite', header: 'Pre-requisite / co-requisite', width: 28 },
  { key: 'synopsis', header: 'Synopsis', width: 40 },
  { key: 'references', header: 'References', width: 40 },
  { key: 'cloCount', header: 'CLO Count', width: 12 },
  { key: 'cloSummary', header: 'CLO Summary', width: 56 },
  { key: 'totalSLT', header: 'Total SLT', width: 12 },
  { key: 'assessmentSLT', header: 'Assessment SLT', width: 16 },
  { key: 'outlineSLT', header: 'Content Outline SLT', width: 20 },
  { key: 'onlineIndepPct', header: 'Online+Indep. (%)', width: 18 },
  { key: 'physicalPct', header: 'Physical (%)', width: 14 },
  { key: 'continuousAssessmentPct', header: 'Continuous Assessment (%)', width: 26 },
  { key: 'finalAssessmentPct', header: 'Final Assessment (%)', width: 22 },
]

export const courseExportFields = courseExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))

function formatReferences(item) {
  if (item.references) return item.references
  const parts = [item.requiredReferences, item.furtherReadings].filter(Boolean)
  return parts.join('\n\n')
}

function formatCLOSummary(clos = []) {
  if (!clos.length) return ''
  return clos.map((item) => `${item.cloCode}: ${item.outcome}`).join('\n')
}

function formatSLTSummary(slt = createEmptySLTData()) {
  const stats = computeSLTStats(slt)
  const outlineSLT = stats.totalSLT - stats.assessmentSLT
  const continuousPct = (slt.continuousAssessments || []).reduce(
    (sum, row) => sum + (Number(row.percentage) || 0),
    0,
  )
  const finalPct = (slt.finalAssessments || []).reduce(
    (sum, row) => sum + (Number(row.percentage) || 0),
    0,
  )
  return {
    totalSLT: stats.totalSLT || '',
    assessmentSLT: stats.assessmentSLT || '',
    outlineSLT: outlineSLT || '',
    onlineIndepPct: stats.totalSLT ? stats.onlineIndepPct : '',
    physicalPct: stats.totalSLT ? stats.physicalPct : '',
    continuousAssessmentPct: continuousPct || '',
    finalAssessmentPct: finalPct || '',
  }
}

function formatCourseRow(item, index) {
  const slt = item.slt || createEmptySLTData()
  const sltSummary = formatSLTSummary(slt)
  const clos = item.clos || []

  return {
    no: index + 1,
    courseCode: item.courseCode,
    courseName: item.courseName,
    offering: getOfferingLabel(item.offering, initialDepartments),
    affiliatedProgramme: getAffiliatedProgrammeLabel(item.affiliatedProgramme),
    courseOwner: item.courseOwnerDisplay || getCourseOwnerLabel(item.courseOwner),
    courseClassification: item.courseClassification,
    credit: item.credit,
    mediumOfInstruction: item.mediumOfInstruction,
    semesterType: item.semesterType,
    prerequisite: item.prerequisite || '',
    synopsis: item.synopsis || '',
    references: formatReferences(item),
    cloCount: clos.length || '',
    cloSummary: formatCLOSummary(clos),
    ...sltSummary,
  }
}

function buildCLODetailRows(courses) {
  const rows = []
  let serial = 0

  courses.forEach((course) => {
    ;(course.clos || []).forEach((clo) => {
      serial += 1
      rows.push({
        'No.': serial,
        'Course Code': course.courseCode,
        'Course Name': course.courseName,
        CLO: clo.cloCode,
        Outcome: clo.outcome,
        "Bloom's Taxonomy Level": clo.bloomLevel,
        'Teaching Methods': formatMethodList(clo.teachingMethods),
        'Assessment Methods': formatMethodList(clo.assessmentMethods),
      })
    })
  })

  return rows
}

function buildCLODetailSheet(courses) {
  const headers = [
    'No.',
    'Course Code',
    'Course Name',
    'CLO',
    'Outcome',
    "Bloom's Taxonomy Level",
    'Teaching Methods',
    'Assessment Methods',
  ]
  const rows = buildCLODetailRows(courses)
  const worksheet = rows.length
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([headers])
  worksheet['!cols'] = [8, 14, 36, 10, 48, 18, 24, 24].map((wch) => ({ wch }))
  return worksheet
}

function buildSLTDetailRows(courses) {
  const rows = []
  let serial = 0

  courses.forEach((course) => {
    const slt = course.slt || createEmptySLTData()

    ;(slt.contentOutlines || []).forEach((item) => {
      serial += 1
      rows.push({
        'No.': serial,
        'Course Code': course.courseCode,
        'Course Name': course.courseName,
        Section: 'Course Content Outline and Subtopics',
        Item: item.courseContent,
        CLO: (item.cloCodes || []).join(', '),
        'Weight (%)': '',
        'Physical F2F': sumOutlinePhysical(item),
        'Online F2F': sumOutlineOnline(item),
        'NF2F Independent Learning': item.nf2f ?? '',
        'Total SLT': sumOutlineRowSLT(item),
      })
    })

    ;(slt.continuousAssessments || []).forEach((item) => {
      serial += 1
      rows.push({
        'No.': serial,
        'Course Code': course.courseCode,
        'Course Name': course.courseName,
        Section: 'Continuous Assessment',
        Item: item.assessmentType,
        CLO: '',
        'Weight (%)': item.percentage ?? '',
        'Physical F2F': item.physical ?? '',
        'Online F2F': item.online ?? '',
        'NF2F Independent Learning': item.nf2f ?? '',
        'Total SLT': sumSimpleAssessmentSLT(item),
      })
    })

    ;(slt.finalAssessments || []).forEach((item) => {
      serial += 1
      rows.push({
        'No.': serial,
        'Course Code': course.courseCode,
        'Course Name': course.courseName,
        Section: 'Final Assessment',
        Item: item.assessmentType,
        CLO: '',
        'Weight (%)': item.percentage ?? '',
        'Physical F2F': item.physical ?? '',
        'Online F2F': item.online ?? '',
        'NF2F Independent Learning': item.nf2f ?? '',
        'Total SLT': sumSimpleAssessmentSLT(item),
      })
    })
  })

  return rows
}

function sumOutlinePhysical(row) {
  const hours = row.physical || {}
  return (Number(hours.L) || 0) + (Number(hours.T) || 0) + (Number(hours.P) || 0) + (Number(hours.O) || 0)
}

function sumOutlineOnline(row) {
  const hours = row.online || {}
  return (Number(hours.L) || 0) + (Number(hours.T) || 0) + (Number(hours.P) || 0) + (Number(hours.O) || 0)
}

function buildSLTDetailSheet(courses) {
  const headers = [
    'No.',
    'Course Code',
    'Course Name',
    'Section',
    'Item',
    'CLO',
    'Weight (%)',
    'Physical F2F',
    'Online F2F',
    'NF2F Independent Learning',
    'Total SLT',
  ]
  const rows = buildSLTDetailRows(courses)
  const worksheet = rows.length
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([headers])
  worksheet['!cols'] = [8, 14, 36, 28, 40, 14, 12, 14, 14, 24, 12].map((wch) => ({ wch }))
  return worksheet
}

/**
 * Export course list to Excel with basic info, CLO summary and SLT summary sheets.
 */
export function exportCoursesToExcel(
  rows,
  filename = 'course-information.xlsx',
  selectedFieldKeys = courseExportColumns.map((col) => col.key),
) {
  const columns = courseExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const mainRows = rows.map((item, index) => {
    const formatted = formatCourseRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const mainSheet = XLSX.utils.json_to_sheet(mainRows)
  mainSheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, mainSheet, truncateSheetName('Course Info'))
  XLSX.utils.book_append_sheet(workbook, buildCLODetailSheet(rows), truncateSheetName('CLO Summary'))
  XLSX.utils.book_append_sheet(workbook, buildSLTDetailSheet(rows), truncateSheetName('SLT Summary'))
  XLSX.writeFile(workbook, filename)
}
