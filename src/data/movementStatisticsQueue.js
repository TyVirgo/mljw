import { mergeMovementQueryQueue, filterQueryBySearch } from './movementQueryQueue.js'
import { movementStatisticsSeeds } from './movementStatisticsSeeds.js'
import {
  STAT_COUNT_KEYS,
  SOURCE_TO_COLUMN,
  createEmptyStatCounts,
} from './movementStatisticsColumns.js'
import {
  resolveStatDimensions,
  buildGroupKey,
} from './movementStatisticsDimensions.js'
import { movementApprovalStatusOptions } from './movementApprovalQueue.js'

export { movementApprovalStatusOptions as movementStatisticsStatusOptions }

function matchText(value, keyword) {
  if (!keyword) return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase())
}

export function filterStatisticsSeeds(seeds, search) {
  const s = search || {}
  return seeds.filter((seed) => {
    if (s.academicSession && !matchText(seed.applicationSession, s.academicSession)) return false
    if (s.programmeCode && seed.programmeCode && !matchText(seed.programmeCode, s.programmeCode)) {
      return false
    }
    if (s.status && seed.status && seed.status !== s.status) return false
    if (s.studentId && seed.studentId && !matchText(seed.studentId, s.studentId)) return false
    if (s.studentName && seed.studentName && !matchText(seed.studentName, s.studentName)) return false
    return true
  })
}

function ensureGroup(map, schoolCode, programmeCode, intake) {
  if (!schoolCode || !programmeCode || !intake) return null
  const key = buildGroupKey(schoolCode, programmeCode, intake)
  if (!map.has(key)) {
    map.set(key, {
      groupKey: key,
      schoolCode,
      programmeCode,
      intake,
      ...createEmptyStatCounts(),
    })
  }
  return map.get(key)
}

export function buildStatisticsRows(t, search) {
  const map = new Map()
  const applications = filterQueryBySearch(mergeMovementQueryQueue(t), search || {})
  const supplements = filterStatisticsSeeds(movementStatisticsSeeds, search || {})

  for (const app of applications) {
    const dim = resolveStatDimensions(app.sourceKey, app.raw || app, app)
    const columnKey = SOURCE_TO_COLUMN[app.sourceKey]
    if (!columnKey) continue
    const row = ensureGroup(map, dim.schoolCode, dim.programmeCode, dim.intake)
    if (row) row[columnKey] += 1
  }

  for (const seed of supplements) {
    const row = ensureGroup(map, seed.schoolCode, seed.programmeCode, seed.intake)
    if (row && seed.statColumn && row[seed.statColumn] != null) {
      row[seed.statColumn] += 1
    }
  }

  return [...map.values()]
    .filter((row) => STAT_COUNT_KEYS.some((key) => row[key] > 0))
    .sort(
      (a, b) =>
        a.schoolCode.localeCompare(b.schoolCode) ||
        a.programmeCode.localeCompare(b.programmeCode) ||
        a.intake.localeCompare(b.intake),
    )
}
