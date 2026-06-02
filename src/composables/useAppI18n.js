import { computed } from 'vue'
import { locale, t as translate, tr as translateFlat, setLocale, getLocale } from '../i18n/index.js'

export function useAppI18n() {
  const isZh = computed(() => locale.value === 'zh')

  function t(key, params) {
    locale.value
    return translate(key, params)
  }

  function tr(text, params) {
    locale.value
    return translateFlat(text, params)
  }

  function toggleLocale() {
    setLocale(locale.value === 'en' ? 'zh' : 'en')
  }

  return {
    t,
    tr,
    locale,
    isZh,
    toggleLocale,
    setLocale,
    getLocale,
  }
}
