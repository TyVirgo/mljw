import { computed } from 'vue'
import { locale, translateExportFields } from '../i18n/index.js'
import { useAppI18n } from './useAppI18n.js'

/** 列表页通用 i18n：t / tr / 导出字段翻译 */
export function useListPageI18n(exportFields) {
  const { t, tr, toggleLocale, setLocale } = useAppI18n()
  const translatedExportFields = computed(() => {
    locale.value
    return translateExportFields(exportFields)
  })

  return {
    t,
    tr,
    locale,
    toggleLocale,
    setLocale,
    translatedExportFields,
  }
}
