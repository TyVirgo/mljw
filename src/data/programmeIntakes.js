import { intakeOptions, initialIntakeSets } from './intakeSets.js'
import { initialProgrammes } from './programmeVersions.js'

export { intakeOptions }

export const startingSemesterOptions = [
  '2025/2026 Semester 1',
  '2025/2026 Semester 2',
  '2024/2025 Semester 1',
  '2024/2025 Semester 2',
  '2023/2024 Semester 1',
  '2023/2024 Semester 2',
]

export function getActiveIntakeOptions() {
  return [...new Set(initialIntakeSets.filter((item) => item.active === 'Yes').map((item) => item.intake))]
}

export const programmeIntakeSchools = [
  { id: 'soc', label: 'School of Communication' },
  { id: 'soa', label: 'School of Arts' },
  { id: 'sob', label: 'School of Business' },
  { id: 'stcm', label: 'School of Traditional Chinese Medicine' },
  { id: 'some', label: 'School of Mechanical Engineering' },
  { id: 'soi', label: 'School of Information' },
]

export function getSchoolLabel(schoolId) {
  return programmeIntakeSchools.find((item) => item.id === schoolId)?.label || schoolId
}

const extraProgrammeCatalogue = [
  {
    id: 'cat-mct',
    programmeCode: 'MCT',
    programmeName: 'Bachelor of Traditional Chinese Medicine (Honours)',
    years: 4,
    schoolId: 'stcm',
    school: 'School of Traditional Chinese Medicine',
  },
  {
    id: 'cat-ege',
    programmeCode: 'EGE',
    programmeName: 'Bachelor of Electronic and Electrical Engineering (Honours)',
    years: 5,
    schoolId: 'some',
    school: 'School of Mechanical Engineering',
  },
]

export const programmeCatalogue = [
  ...initialProgrammes.map((item) => ({
    id: `cat-${item.id}`,
    programmeCode: item.code,
    programmeName: item.name,
    years: item.years,
    schoolId: item.schoolId,
    school: getSchoolLabel(item.schoolId),
  })),
  ...extraProgrammeCatalogue,
]

export const activeOptions = ['Yes', 'No']

export const yearsOptions = ['3', '4', '5']

export const initialProgrammeIntakes = [
  {
    id: 1,
    programmeIntake: '202509IBU',
    intake: '202509',
    years: 3,
    programmeCode: 'IBU',
    programmeName: 'Bachelor of Management in International Business (Honours)',
    schoolId: 'sob',
    school: 'School of Business',
    active: 'Yes',
  },
  {
    id: 2,
    programmeIntake: '202504IBU',
    intake: '202504',
    years: 3,
    programmeCode: 'IBU',
    programmeName: 'Bachelor of Management in International Business (Honours)',
    schoolId: 'sob',
    school: 'School of Business',
    active: 'Yes',
  },
  {
    id: 3,
    programmeIntake: '202204MCT',
    intake: '202204',
    years: 4,
    programmeCode: 'MCT',
    programmeName: 'Bachelor of Traditional Chinese Medicine (Honours)',
    schoolId: 'stcm',
    school: 'School of Traditional Chinese Medicine',
    active: 'Yes',
  },
  {
    id: 4,
    programmeIntake: '202204EGE',
    intake: '202204',
    years: 5,
    programmeCode: 'EGE',
    programmeName: 'Bachelor of Electronic and Electrical Engineering (Honours)',
    schoolId: 'some',
    school: 'School of Mechanical Engineering',
    active: 'No',
  },
  {
    id: 5,
    programmeIntake: '202403MCT',
    intake: '202403',
    years: 4,
    programmeCode: 'MCT',
    programmeName: 'Bachelor of Traditional Chinese Medicine (Honours)',
    schoolId: 'stcm',
    school: 'School of Traditional Chinese Medicine',
    active: 'Yes',
  },
  {
    id: 6,
    programmeIntake: '202309IBU',
    intake: '202309',
    years: 3,
    programmeCode: 'IBU',
    programmeName: 'Bachelor of Management in International Business (Honours)',
    schoolId: 'soc',
    school: 'School of Communication',
    startingSemester: '2023/2024 Semester 1',
    active: 'No',
  },
]

initialProgrammeIntakes.forEach((item, index) => {
  if (!item.startingSemester) {
    item.startingSemester = startingSemesterOptions[index % startingSemesterOptions.length]
  }
})

let programmeIntakeSeq = initialProgrammeIntakes.length

export function createProgrammeIntakeId() {
  programmeIntakeSeq += 1
  return programmeIntakeSeq
}

export function buildProgrammeIntakeTree(items) {
  const schoolMap = new Map()

  items.forEach((item) => {
    if (!schoolMap.has(item.schoolId)) {
      schoolMap.set(item.schoolId, {
        id: item.schoolId,
        label: item.school,
        type: 'school',
        schoolId: item.schoolId,
        children: new Map(),
      })
    }

    const schoolNode = schoolMap.get(item.schoolId)
    if (!schoolNode.children.has(item.programmeCode)) {
      schoolNode.children.set(item.programmeCode, {
        id: `${item.schoolId}-${item.programmeCode}`,
        label: item.programmeCode,
        type: 'programme',
        schoolId: item.schoolId,
        programmeCode: item.programmeCode,
        children: new Map(),
      })
    }

    const programmeNode = schoolNode.children.get(item.programmeCode)
    const intakeYear = String(item.intake).slice(0, 4)
    if (!programmeNode.children.has(intakeYear)) {
      programmeNode.children.set(intakeYear, {
        id: `${item.schoolId}-${item.programmeCode}-${intakeYear}`,
        label: intakeYear,
        type: 'year',
        schoolId: item.schoolId,
        programmeCode: item.programmeCode,
        intakeYear,
      })
    }
  })

  const mapToArray = (map) =>
    [...map.values()].map((node) => ({
      ...node,
      children: node.children instanceof Map ? mapToArray(node.children) : node.children,
    }))

  return mapToArray(schoolMap)
}

export function filterTreeNodes(nodes, keyword) {
  const target = keyword.trim().toLowerCase()
  if (!target) return nodes

  return nodes
    .map((node) => {
      const children = node.children?.length ? filterTreeNodes(node.children, keyword) : []
      const selfMatch = node.label.toLowerCase().includes(target)
      if (selfMatch || children.length) {
        return { ...node, children }
      }
      return null
    })
    .filter(Boolean)
}

export function validateProgrammeIntakeForm(form, allItems, excludeId = null) {
  const errors = {}
  const programmeIntake = String(form.programmeIntake || '').trim()
  const intake = String(form.intake || '').trim()
  const programmeCode = String(form.programmeCode || '').trim()
  const programmeName = String(form.programmeName || '').trim()

  if (!programmeIntake) {
    errors.programmeIntake = 'Programme Intake is required'
  } else if (!/^[A-Za-z0-9]{1,20}$/.test(programmeIntake)) {
    errors.programmeIntake = 'Programme Intake must be alphanumeric with at most 20 characters'
  } else {
    const duplicate = allItems.some(
      (item) => item.id !== excludeId && item.programmeIntake.toLowerCase() === programmeIntake.toLowerCase(),
    )
    if (duplicate) errors.programmeIntake = 'Programme Intake already exists and must be globally unique'
  }

  if (!intake) {
    errors.intake = 'Intake is required'
  } else if (!/^\d{6}$/.test(intake)) {
    errors.intake = 'Intake must be 6 digits in Year+Month format (e.g. 202509)'
  }

  if (!form.years) errors.years = 'Years is required'

  if (!programmeCode) {
    errors.programmeCode = 'Programme Code is required'
  } else if (!/^[A-Za-z0-9]{1,10}$/.test(programmeCode)) {
    errors.programmeCode = 'Programme Code must be alphanumeric with at most 10 characters'
  }

  if (!programmeName) errors.programmeName = 'Programme Name is required'

  if (!form.schoolId) errors.schoolId = 'School is required'

  if (!form.startingSemester) errors.startingSemester = 'Starting Semester is required'

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}

export function suggestProgrammeIntake(intake, programmeCode) {
  const intakeValue = String(intake || '').trim()
  const codeValue = String(programmeCode || '').trim().toUpperCase()
  if (!intakeValue || !codeValue) return ''
  return `${intakeValue}${codeValue}`
}

export function validateProgrammeIntakeEditForm(form) {
  const errors = {}

  if (!form.startingSemester) errors.startingSemester = 'Starting Semester is required'

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}

export function validateProgrammeIntakeCreateForm(form) {
  const errors = {}
  const programmeCode = String(form.programmeCodeFilter || '').trim()

  if (!form.schoolId) errors.schoolId = 'School is required'

  if (programmeCode && programmeCode.length > 20) {
    errors.programmeCodeFilter = 'Programme Code must be at most 20 characters'
  }

  if (!form.selectedProgrammeIds?.length) {
    errors.programmes = 'Please select at least one programme record'
  }

  if (!form.intake) errors.intake = 'Intake is required'

  if (!form.startingSemester) errors.startingSemester = 'Starting Semester is required'

  return errors
}

export function buildProgrammeIntakeRecords(selectedProgrammes, intake, startingSemester, allItems) {
  const records = []
  const duplicates = []

  selectedProgrammes.forEach((programme) => {
    const programmeIntake = suggestProgrammeIntake(intake, programme.programmeCode)
    const exists = allItems.some((item) => item.programmeIntake.toLowerCase() === programmeIntake.toLowerCase())
    if (exists) {
      duplicates.push(programmeIntake)
      return
    }
    records.push({
      programmeIntake,
      intake,
      startingSemester,
      years: programme.years,
      programmeCode: programme.programmeCode,
      programmeName: programme.programmeName,
      schoolId: programme.schoolId,
      school: programme.school,
      active: 'Yes',
    })
  })

  return { records, duplicates }
}

export function validateProgrammeIntakeCopyForm(form) {
  const errors = {}

  if (!form.sourceRecords?.length) {
    errors.sources = 'Please select at least one programme intake record to copy'
  }

  if (!form.intake) errors.intake = 'Intake is required'

  if (!form.startingSemester) errors.startingSemester = 'Starting Semester is required'

  if (!form.active) {
    errors.active = 'Active is required'
  } else if (!activeOptions.includes(form.active)) {
    errors.active = 'Active must be Yes or No'
  }

  return errors
}

export function buildProgrammeIntakeCopyRecords(sourceRecords, intake, startingSemester, active, allItems) {
  const records = []
  const duplicates = []
  const pendingCodes = new Set()

  sourceRecords.forEach((source) => {
    const programmeIntake = suggestProgrammeIntake(intake, source.programmeCode)
    const normalized = programmeIntake.toLowerCase()
    const exists =
      allItems.some((item) => item.programmeIntake.toLowerCase() === normalized) || pendingCodes.has(normalized)
    if (exists) {
      duplicates.push(programmeIntake)
      return
    }
    pendingCodes.add(normalized)
    records.push({
      programmeIntake,
      intake,
      startingSemester,
      years: source.years,
      programmeCode: source.programmeCode,
      programmeName: source.programmeName,
      schoolId: source.schoolId,
      school: source.school,
      active,
    })
  })

  return { records, duplicates }
}
