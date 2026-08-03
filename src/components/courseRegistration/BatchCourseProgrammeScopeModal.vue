<script setup>
/**
 * 管理课程「专业范围设置」：专业 + 学生类别 + 校选类别（后两维必选≥1，本轮仅存档）
 */
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  COURSE_PROGRAMME_UNLIMITED,
  courseProgrammeScopeOptions,
} from '../../data/courseRegistration/batchScopeRules.js'
import {
  getCourseProgrammeScopeCodes,
  getCourseAudienceStudentCategories,
  getCourseAudienceSchoolElectiveCategories,
  updateCoursesAudienceScope,
} from '../../data/courseRegistration/selectableCourses.js'
import { studentCategoryOptions } from '../../data/students.js'
import {
  schoolElectiveCategoryOptions,
  getSchoolElectiveCategoryLabel,
} from '../../data/departments.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const { t, isZh } = useAppI18n()
/** @type {import('vue').Ref<string[]>} */
const selected = ref([COURSE_PROGRAMME_UNLIMITED])
/** @type {import('vue').Ref<string[]>} 学生类别 Local/China/International */
const selectedStudentCategories = ref([])
/** @type {import('vue').Ref<string[]>} 校选类别 arts/business/science */
const selectedSchoolElectives = ref([])
/** 当前展开的多选面板 key */
const openKey = ref('')
const errorKey = ref('')

const hasCourses = computed(() => props.courses.length > 0)
const programmeOptions = computed(() => [COURSE_PROGRAMME_UNLIMITED, ...courseProgrammeScopeOptions])

const canConfirm = computed(
  () =>
    hasCourses.value &&
    selected.value.length > 0 &&
    selectedStudentCategories.value.length > 0 &&
    selectedSchoolElectives.value.length > 0,
)

function scopeLabel(value) {
  if (value === COURSE_PROGRAMME_UNLIMITED) return t('courseRegistration.courses.programmeScopeUnlimited')
  return value
}

/**
 * 学生类别展示文案
 * @param {string} value
 */
function studentCategoryLabel(value) {
  const key = `courseRegistration.courses.studentCategoryOption.${value}`
  const translated = t(key)
  return translated !== key ? translated : value
}

/**
 * 校选类别展示文案（基础数据：文科/商科/理科）
 * @param {string} value
 */
function schoolElectiveLabel(value) {
  return getSchoolElectiveCategoryLabel(value, isZh.value)
}

/**
 * 多课一致则回填，否则回退值
 * @param {object[]} courses
 * @param {(c: object) => string[]} getter
 * @param {string[]} fallback
 */
function sharedListOr(courses, getter, fallback) {
  if (!courses?.length) return [...fallback]
  const serialized = courses.map((c) => getter(c).slice().sort().join('|'))
  const first = serialized[0]
  if (serialized.every((s) => s === first)) {
    return first ? first.split('|') : [...fallback]
  }
  return [...fallback]
}

function defaultProgrammeSelection(courses) {
  if (!courses?.length) return [COURSE_PROGRAMME_UNLIMITED]
  const serialized = courses.map((c) => getCourseProgrammeScopeCodes(c).slice().sort().join('|'))
  const first = serialized[0]
  if (serialized.every((s) => s === first)) {
    return first ? first.split('|') : [COURSE_PROGRAMME_UNLIMITED]
  }
  return [COURSE_PROGRAMME_UNLIMITED]
}

watch(
  () => [props.visible, props.courses],
  () => {
    if (!props.visible) return
    selected.value = defaultProgrammeSelection(props.courses)
    // 不一致或未配置时置空，强制用户至少选一项
    selectedStudentCategories.value = sharedListOr(
      props.courses,
      getCourseAudienceStudentCategories,
      [],
    )
    selectedSchoolElectives.value = sharedListOr(
      props.courses,
      getCourseAudienceSchoolElectiveCategories,
      [],
    )
    openKey.value = ''
    errorKey.value = ''
  },
)

function togglePanel(key) {
  openKey.value = openKey.value === key ? '' : key
}

function closePanel() {
  openKey.value = ''
}

function onDocClick() {
  closePanel()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function toggleOption(value) {
  if (value === COURSE_PROGRAMME_UNLIMITED) {
    selected.value = selected.value.includes(COURSE_PROGRAMME_UNLIMITED)
      ? []
      : [COURSE_PROGRAMME_UNLIMITED]
    return
  }
  const withoutUnlimited = selected.value.filter((item) => item !== COURSE_PROGRAMME_UNLIMITED)
  const idx = withoutUnlimited.indexOf(value)
  if (idx >= 0) withoutUnlimited.splice(idx, 1)
  else withoutUnlimited.push(value)
  selected.value = withoutUnlimited
}

function removeOption(value) {
  selected.value = selected.value.filter((item) => item !== value)
}

/**
 * 普通多选切换（学生类别）
 * @param {string} value
 */
function toggleStudentCategory(value) {
  const current = [...selectedStudentCategories.value]
  const idx = current.indexOf(value)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(value)
  selectedStudentCategories.value = current
  errorKey.value = ''
}

/** @param {string} value */
function removeStudentCategory(value) {
  selectedStudentCategories.value = selectedStudentCategories.value.filter((item) => item !== value)
  errorKey.value = ''
}

/**
 * 普通多选切换（校选类别）
 * @param {string} value
 */
function toggleSchoolElective(value) {
  const current = [...selectedSchoolElectives.value]
  const idx = current.indexOf(value)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(value)
  selectedSchoolElectives.value = current
  errorKey.value = ''
}

/** @param {string} value */
function removeSchoolElective(value) {
  selectedSchoolElectives.value = selectedSchoolElectives.value.filter((item) => item !== value)
  errorKey.value = ''
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!hasCourses.value || !selected.value.length) return
  if (!selectedStudentCategories.value.length || !selectedSchoolElectives.value.length) {
    errorKey.value = 'courseRegistration.courses.audienceScopeRequired'
    return
  }
  const codes = selected.value.includes(COURSE_PROGRAMME_UNLIMITED) ? [] : [...selected.value]
  updateCoursesAudienceScope(
    props.courses.map((c) => c.id),
    {
      programmes: codes,
      studentCategories: [...selectedStudentCategories.value],
      schoolElectiveCategories: [...selectedSchoolElectives.value],
    },
  )
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('courseRegistration.courses.programmeScopeSettings') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <template v-if="hasCourses">
            <p class="hint">
              {{ t('courseRegistration.courses.programmeScopeSettingsHint', { count: courses.length }) }}
            </p>

            <div class="field-block">
              <span class="field-label">
                <span class="req">*</span>
                {{ t('courseRegistration.courses.programmeScope') }}:
              </span>
              <div class="multi-select" :class="{ open: openKey === 'programme' }" @click.stop>
                <button
                  type="button"
                  class="multi-select-trigger"
                  :class="{ placeholder: !selected.length }"
                  @click="togglePanel('programme')"
                >
                  <span v-if="!selected.length" class="multi-select-placeholder">
                    {{ t('common.pleaseSelect') }}
                  </span>
                  <span v-else class="multi-select-tags">
                    <span
                      v-for="item in selected"
                      :key="item"
                      class="multi-tag"
                      @click.stop="removeOption(item)"
                    >
                      {{ scopeLabel(item) }}
                      <span class="multi-tag-x">×</span>
                    </span>
                  </span>
                </button>
                <div v-if="openKey === 'programme'" class="multi-select-panel">
                  <button
                    v-for="opt in programmeOptions"
                    :key="opt"
                    type="button"
                    class="multi-select-option"
                    :class="{ selected: selected.includes(opt) }"
                    @click="toggleOption(opt)"
                  >
                    <span>{{ scopeLabel(opt) }}</span>
                    <span v-if="selected.includes(opt)" class="check">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="field-block">
              <span class="field-label">
                <span class="req">*</span>
                {{ t('courseRegistration.courses.audienceStudentCategory') }}:
              </span>
              <div class="multi-select" :class="{ open: openKey === 'studentCategory' }" @click.stop>
                <button
                  type="button"
                  class="multi-select-trigger"
                  :class="{ placeholder: !selectedStudentCategories.length }"
                  @click="togglePanel('studentCategory')"
                >
                  <span v-if="!selectedStudentCategories.length" class="multi-select-placeholder">
                    {{ t('common.pleaseSelect') }}
                  </span>
                  <span v-else class="multi-select-tags">
                    <span
                      v-for="item in selectedStudentCategories"
                      :key="item"
                      class="multi-tag"
                      @click.stop="removeStudentCategory(item)"
                    >
                      {{ studentCategoryLabel(item) }}
                      <span class="multi-tag-x">×</span>
                    </span>
                  </span>
                </button>
                <div v-if="openKey === 'studentCategory'" class="multi-select-panel">
                  <button
                    v-for="opt in studentCategoryOptions"
                    :key="opt"
                    type="button"
                    class="multi-select-option"
                    :class="{ selected: selectedStudentCategories.includes(opt) }"
                    @click="toggleStudentCategory(opt)"
                  >
                    <span>{{ studentCategoryLabel(opt) }}</span>
                    <span v-if="selectedStudentCategories.includes(opt)" class="check">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="field-block">
              <span class="field-label">
                <span class="req">*</span>
                {{ t('courseRegistration.courses.audienceSchoolElective') }}:
              </span>
              <div class="multi-select" :class="{ open: openKey === 'schoolElective' }" @click.stop>
                <button
                  type="button"
                  class="multi-select-trigger"
                  :class="{ placeholder: !selectedSchoolElectives.length }"
                  @click="togglePanel('schoolElective')"
                >
                  <span v-if="!selectedSchoolElectives.length" class="multi-select-placeholder">
                    {{ t('common.pleaseSelect') }}
                  </span>
                  <span v-else class="multi-select-tags">
                    <span
                      v-for="item in selectedSchoolElectives"
                      :key="item"
                      class="multi-tag"
                      @click.stop="removeSchoolElective(item)"
                    >
                      {{ schoolElectiveLabel(item) }}
                      <span class="multi-tag-x">×</span>
                    </span>
                  </span>
                </button>
                <div v-if="openKey === 'schoolElective'" class="multi-select-panel">
                  <button
                    v-for="opt in schoolElectiveCategoryOptions"
                    :key="opt.value"
                    type="button"
                    class="multi-select-option"
                    :class="{ selected: selectedSchoolElectives.includes(opt.value) }"
                    @click="toggleSchoolElective(opt.value)"
                  >
                    <span>{{ schoolElectiveLabel(opt.value) }}</span>
                    <span v-if="selectedSchoolElectives.includes(opt.value)" class="check">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <p class="help">{{ t('courseRegistration.courses.programmeScopeSettingsHelp') }}</p>
            <p v-if="errorKey" class="field-error">{{ t(errorKey) }}</p>
          </template>
          <p v-else class="empty-hint">{{ t('courseRegistration.courses.optionalSettingsNeedSelect') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(520px, calc(100vw - 48px));
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px 20px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.help {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: #374151;
}

.req {
  color: #ef4444;
  margin-right: 2px;
}

.multi-select {
  position: relative;
}

.multi-select-trigger {
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
}

.multi-select.open .multi-select-trigger {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.multi-select-placeholder {
  font-size: 13px;
  color: #9ca3af;
}

.multi-select-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.multi-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  font-size: 12px;
  color: #374151;
}

.multi-tag-x {
  color: #9ca3af;
}

.multi-select-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  z-index: 5;
}

.multi-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 13px;
  color: #111827;
  cursor: pointer;
  text-align: left;
}

.multi-select-option:hover,
.multi-select-option.selected {
  background: #f0f9ff;
}

.multi-select-option .check {
  color: #0284c7;
  font-size: 12px;
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #0284c7;
  border-color: #0284c7;
  color: #fff;
}
</style>
