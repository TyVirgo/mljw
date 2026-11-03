/**
 * 修读方式：正常 / 同课号重修 / 同课程组重修（名单与重修汇总表共用）
 */

/** 全量键（名单等） */
export const STUDY_MODE_KEYS = ['normal', 'retakeSameCourse', 'retakeSameGroup']

/** 重修表仅两种重修 */
export const STUDY_MODE_RETAKE_KEYS = ['retakeSameCourse', 'retakeSameGroup']

/**
 * 修读方式本地化文案
 * @param {string} key
 * @param {(k: string) => string} t
 * @returns {string}
 */
export function studyModeLabel(key, t) {
  const raw = String(key || '').trim()
  if (!raw) return '—'
  // 兼容旧 demo：Normal / Retake
  if (raw === 'Normal') return t('courseRegistration.studyMode.normal')
  if (raw === 'Retake') return t('courseRegistration.studyMode.retakeSameCourse')
  const map = {
    normal: 'courseRegistration.studyMode.normal',
    retakeSameCourse: 'courseRegistration.studyMode.retakeSameCourse',
    retakeSameGroup: 'courseRegistration.studyMode.retakeSameGroup',
  }
  const i18nKey = map[raw]
  return i18nKey ? t(i18nKey) : raw
}

/**
 * 由重修课号与曾修课号解析重修类修读方式
 * @param {string} retakeCourseCode
 * @param {string} originalCourseCode
 * @returns {'retakeSameCourse'|'retakeSameGroup'}
 */
export function resolveRetakeStudyModeKey(retakeCourseCode, originalCourseCode) {
  const retake = String(retakeCourseCode || '')
    .trim()
    .toUpperCase()
  const original = String(originalCourseCode || '')
    .trim()
    .toUpperCase()
  if (!retake || !original) return 'retakeSameCourse'
  return retake === original ? 'retakeSameCourse' : 'retakeSameGroup'
}
