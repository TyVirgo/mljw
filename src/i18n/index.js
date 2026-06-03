import { ref } from 'vue'
import en from './locales/en.js'
import zh from './locales/zh.js'
import { zhFlat } from './zh-flat.js'

const LOCALE_STORAGE_KEY = 'jw-locale'
const messages = { en, zh }

function getInitialLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // ignore
  }
  return 'en'
}

export const locale = ref(getInitialLocale())

function getByPath(source, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

function interpolate(text, params) {
  if (!params || typeof text !== 'string') return text
  return text.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''))
}

export function t(key, params) {
  const message =
    getByPath(messages[locale.value], key) ?? getByPath(messages.en, key) ?? key
  return interpolate(message, params)
}

function translateFlatText(text) {
  if (zhFlat[text]) return zhFlat[text]

  let match = text.match(/^(.+) is required$/)
  if (match) return `${tr(match[1])}为必填项`

  match = text.match(/^(.+) must be within (\d+) characters$/)
  if (match) return `${tr(match[1])}不能超过 ${match[2]} 个字符`

  match = text.match(/^Code already exists in this code set$/)
  if (match) return '该代码集内编码已存在'

  match = text.match(/^Code already exists and must be globally unique$/)
  if (match) return '编码已存在，须全局唯一'

  match = text.match(/^Programme Intake already exists and must be globally unique$/)
  if (match) return '培养方案入学已存在，须全局唯一'

  match = text.match(/^Programme Intake already exists: (.+)$/)
  if (match) return `培养方案入学已存在：${match[1]}`

  match = text.match(/^Skipped duplicate Programme Intake code\(s\): (.+)$/)
  if (match) return `已跳过重复的培养方案入学编码：${match[1]}`

  match = text.match(/^Are you sure you want to delete (.+)\? This action cannot be undone\. The image will be restored to the system default\.$/)
  if (match) return `确定要删除${tr(match[1])}吗？此操作无法撤销，图片将恢复为系统默认。`

  match = text.match(/^please input department name$/)
  if (match) return '请输入院系名称'

  match = text.match(/^Changed (.+) from (.+) to (.+)$/)
  if (match) return `将 ${tr(match[1])} 由 ${match[2]} 调整为 ${match[3]}`

  match = text.match(/^Added CLO (.+)$/)
  if (match) return `新增 CLO ${match[1]}`

  match = text.match(/^Deleted CLO (.+)$/)
  if (match) return `删除 CLO ${match[1]}`

  match = text.match(/^Updated CLO (.+)$/)
  if (match) return `更新 CLO ${match[1]}`

  match = text.match(/^Updated Student Learning Time \(SLT\) configuration$/)
  if (match) return '更新 Student Learning Time (SLT) 配置'

  match = text.match(/^Duplicate Course Code in import file$/)
  if (match) return '导入文件中课程编号重复'

  match = text.match(/^Are you sure you want to delete (\d+) selected lecturers\? This action cannot be undone\.$/)
  if (match) return `确定要删除选中的 ${match[1]} 位讲师吗？此操作无法撤销。`

  match = text.match(/^Qualification (\d+)$/)
  if (match) return `学历资格 ${match[1]}`

  match = text.match(/^Working Experience (\d+)$/)
  if (match) return `工作经历 ${match[1]}`

  match = text.match(/^(\d{4}\/\d{4}) Semester (\d+)$/)
  if (match) return `${match[1]} 第${match[2]}学期`

  match = text.match(/^Please select at least one classroom\.$/)
  if (match) return '请至少选择一间教室。'

  match = text.match(/^All selected records already exist: (.+)$/)
  if (match) return `所选记录均已存在：${match[1]}`

  match = text.match(/^Set usage department permissions for (\d+) selected classroom\(s\)\.$/)
  if (match) return `为 ${match[1]} 间已选教室设置使用院系权限`

  return text
}

/**
 * 翻译：优先 i18n key（含 .），否则扁平英文映射。
 * 新页面可写 tr('Your English label') 并在 zh-flat.js 补中文。
 */
export function tr(text, params) {
  if (!text) return ''
  if (typeof text === 'string' && text.includes('.')) {
    return t(text, params)
  }
  if (locale.value === 'zh' && typeof text === 'string') {
    return translateFlatText(text)
  }
  return text
}

export function setLocale(nextLocale) {
  if (nextLocale !== 'en' && nextLocale !== 'zh') return
  locale.value = nextLocale
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
  } catch {
    // ignore
  }
  document.documentElement.lang = nextLocale === 'zh' ? 'zh-CN' : 'en'
}

export function getLocale() {
  return locale.value
}

export function translateExportFields(fields) {
  return fields.map((field) => ({
    ...field,
    label: field.labelKey ? t(field.labelKey) : tr(field.label),
  }))
}

setLocale(locale.value)

export { LOCALE_STORAGE_KEY }
