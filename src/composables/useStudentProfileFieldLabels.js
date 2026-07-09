import { locale } from '../i18n/index.js'
import {
  getStudentProfileFieldHintKey,
  getStudentProfileFieldLabelKey,
  studentProfileFieldDefs,
} from '../data/studentProfileFieldLabels.js'
import { useAppI18n } from './useAppI18n.js'

export function useStudentProfileFieldLabels() {
  const { tr } = useAppI18n()

  function fieldLabel(fieldId) {
    locale.value
    return tr(getStudentProfileFieldLabelKey(fieldId))
  }

  function fieldSearchLabel(fieldId) {
    locale.value
    const label = fieldLabel(fieldId)
    return locale.value === 'zh' ? `${label}：` : `${label}:`
  }

  function fieldHint(fieldId) {
    locale.value
    const key = getStudentProfileFieldHintKey(fieldId)
    return key ? tr(key) : ''
  }

  function hasFieldHint(fieldId) {
    return Boolean(studentProfileFieldDefs[fieldId]?.hint)
  }

  return {
    fieldLabel,
    fieldSearchLabel,
    fieldHint,
    hasFieldHint,
    fieldLabelKey: getStudentProfileFieldLabelKey,
    fieldHintKey: getStudentProfileFieldHintKey,
  }
}
