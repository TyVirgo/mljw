const STORAGE_KEY = 'evaluation-settings-v1'
const OVERRIDES_KEY = 'lecturer-evaluation-overrides-v1'

export function createRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function getDefaultEvaluationSettings() {
  return {
    newLecturerEvaluationEnabled: true,
    categoryChangeRules: [
      {
        id: createRuleId(),
        fromCategory: 'Part-time Lecturer',
        toCategory: 'Full-time Lecturer',
        enabled: true,
      },
      {
        id: createRuleId(),
        fromCategory: 'Student Teaching Assistant',
        toCategory: 'Full-time Lecturer',
        enabled: true,
      },
    ],
  }
}

export function loadEvaluationSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultEvaluationSettings()
    const parsed = JSON.parse(raw)
    return {
      ...getDefaultEvaluationSettings(),
      ...parsed,
      categoryChangeRules: Array.isArray(parsed.categoryChangeRules)
        ? parsed.categoryChangeRules
        : getDefaultEvaluationSettings().categoryChangeRules,
    }
  } catch {
    return getDefaultEvaluationSettings()
  }
}

export function saveEvaluationSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function validateEvaluationSettings(settings) {
  const enabledRules = (settings.categoryChangeRules || []).filter((rule) => rule.enabled)
  const seen = new Set()

  for (const rule of enabledRules) {
    if (!rule.fromCategory || !rule.toCategory) {
      return 'Please select both categories for all enabled rules.'
    }
    if (rule.fromCategory === rule.toCategory) {
      return 'From and to categories must be different.'
    }
    const key = `${rule.fromCategory}::${rule.toCategory}`
    if (seen.has(key)) {
      return 'Duplicate category change rules are not allowed.'
    }
    seen.add(key)
  }

  return ''
}

export function loadEvaluationOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Lightweight demo: mark matching lecturers as requiresEvaluation in localStorage overrides. */
export function applyEvaluationRules(lecturers, settings) {
  const overrides = {}

  for (const lecturer of lecturers) {
    let needsEval = false

    if (settings.newLecturerEvaluationEnabled) {
      const hasJoinDate = Boolean(String(lecturer.dateOfJoining || '').trim())
      const noTeachingRecord = lecturer.hasTeachingRecord === false
      if (hasJoinDate && noTeachingRecord) {
        needsEval = true
      }
    }

    if (!needsEval) {
      for (const rule of settings.categoryChangeRules || []) {
        if (!rule.enabled) continue
        if (
          lecturer.previousCategory === rule.fromCategory
          && lecturer.category === rule.toCategory
        ) {
          needsEval = true
          break
        }
      }
    }

    if (needsEval) {
      overrides[lecturer.id] = true
    }
  }

  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
  return overrides
}

export function mergeEvaluationOverrides(lecturer) {
  const overrides = loadEvaluationOverrides()
  if (Object.prototype.hasOwnProperty.call(overrides, lecturer.id)) {
    return { ...lecturer, requiresEvaluation: Boolean(overrides[lecturer.id]) }
  }
  return lecturer
}
