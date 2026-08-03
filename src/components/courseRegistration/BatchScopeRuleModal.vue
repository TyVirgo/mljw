<script setup>
/**
 * 新增/编辑学生范围：学院 + 专业批次（默认全部、非必填、多选；无联动）
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  batchScopeFacultyOptions,
  batchScopeProgrammeIntakeOptions,
  batchScopeRoundOptions,
  emptyScopeRule,
  normalizeScopeRule,
  SCOPE_DIM_ALL,
} from '../../data/courseRegistration/batchScopeRules.js'

const props = defineProps({
  visible: Boolean,
  /** 从某轮卡片打开时固定轮次 */
  fixedRound: { type: String, default: '' },
  /** 编辑时回填；为空则新增 */
  initialRule: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const { t } = useAppI18n()

const form = ref(emptyScopeRule())
const errors = ref({})
const openKey = ref('')

const isEdit = computed(() => Boolean(props.initialRule))
const modalTitle = computed(() =>
  isEdit.value
    ? t('courseRegistration.batch.scopeEditTitle')
    : t('courseRegistration.batch.scopeAddTitle'),
)

const facultyOptions = computed(() => [SCOPE_DIM_ALL, ...batchScopeFacultyOptions])
const programmeIntakeOptions = computed(() => [SCOPE_DIM_ALL, ...batchScopeProgrammeIntakeOptions])
const roundOptions = computed(() => {
  if (!props.fixedRound) return batchScopeRoundOptions
  return batchScopeRoundOptions.filter((opt) => opt.value === props.fixedRound)
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    if (props.initialRule) {
      const normalized = normalizeScopeRule(props.initialRule)
      form.value = {
        faculties: [...normalized.faculties],
        programmeIntakes: [...normalized.programmeIntakes],
        programmes: [],
        intakes: [],
        groupName: '',
        round: props.fixedRound || normalized.round || '',
      }
    } else {
      form.value = emptyScopeRule()
      if (props.fixedRound) form.value.round = props.fixedRound
    }
    errors.value = {}
    openKey.value = ''
  },
)

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function dimLabel(value) {
  if (value === SCOPE_DIM_ALL) return t('courseRegistration.batch.scopeDimAll')
  return value
}

function togglePanel(key) {
  openKey.value = openKey.value === key ? '' : key
}

function closePanels() {
  openKey.value = ''
}

function onDocClick() {
  closePanels()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

/**
 * 多选切换；选「全部」时独占
 * @param {'faculties'|'programmeIntakes'} field
 * @param {string} value
 */
function toggleDim(field, value) {
  const current = [...(form.value[field] || [])]
  if (value === SCOPE_DIM_ALL) {
    // 再次点全部：保持至少为全部（非必填默认态）
    form.value[field] = [SCOPE_DIM_ALL]
    return
  }
  const withoutAll = current.filter((item) => item !== SCOPE_DIM_ALL)
  const idx = withoutAll.indexOf(value)
  if (idx >= 0) withoutAll.splice(idx, 1)
  else withoutAll.push(value)
  form.value[field] = withoutAll.length ? withoutAll : [SCOPE_DIM_ALL]
}

/**
 * 移除某一维取值；清空后回全部
 * @param {'faculties'|'programmeIntakes'} field
 * @param {string} value
 */
function removeDim(field, value) {
  const next = (form.value[field] || []).filter((item) => item !== value)
  form.value[field] = next.length ? next : [SCOPE_DIM_ALL]
}

/** 仅校验轮次（学院/专业批次非必填） */
function validate() {
  const next = {}
  if (!form.value.round) {
    next.round = 'courseRegistration.batch.scopeRoundRequired'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function handleConfirm() {
  if (!validate()) return
  const faculties = form.value.faculties?.length ? [...form.value.faculties] : [SCOPE_DIM_ALL]
  const programmeIntakes = form.value.programmeIntakes?.length
    ? [...form.value.programmeIntakes]
    : [SCOPE_DIM_ALL]
  emit('confirm', {
    faculties,
    programmeIntakes,
    programmes: [],
    intakes: [],
    groupName: '',
    round: props.fixedRound || form.value.round,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="scope-modal-overlay" @click="handleOverlayClick">
      <div class="scope-modal-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="scope-modal-header">
          <h2 class="scope-modal-title">{{ modalTitle }}</h2>
          <button
            type="button"
            class="scope-modal-close"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <div class="scope-modal-body">
          <div class="fields-grid">
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.scopeFaculty') }}</label>
              <div
                class="multi-select"
                :class="{ open: openKey === 'faculties' }"
                @click.stop
              >
                <button
                  type="button"
                  class="multi-select-trigger"
                  @click="togglePanel('faculties')"
                >
                  <span class="multi-select-tags">
                    <span
                      v-for="item in form.faculties"
                      :key="item"
                      class="multi-tag"
                      @click.stop="removeDim('faculties', item)"
                    >
                      {{ dimLabel(item) }}
                      <span class="multi-tag-x">×</span>
                    </span>
                  </span>
                </button>
                <div v-if="openKey === 'faculties'" class="multi-select-panel">
                  <button
                    v-for="opt in facultyOptions"
                    :key="opt"
                    type="button"
                    class="multi-select-option"
                    :class="{ selected: form.faculties.includes(opt) }"
                    @click="toggleDim('faculties', opt)"
                  >
                    <span>{{ dimLabel(opt) }}</span>
                    <span v-if="form.faculties.includes(opt)" class="check">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.scopeProgrammeIntake') }}</label>
              <div
                class="multi-select"
                :class="{ open: openKey === 'programmeIntakes' }"
                @click.stop
              >
                <button
                  type="button"
                  class="multi-select-trigger"
                  @click="togglePanel('programmeIntakes')"
                >
                  <span class="multi-select-tags">
                    <span
                      v-for="item in form.programmeIntakes"
                      :key="item"
                      class="multi-tag"
                      @click.stop="removeDim('programmeIntakes', item)"
                    >
                      {{ dimLabel(item) }}
                      <span class="multi-tag-x">×</span>
                    </span>
                  </span>
                </button>
                <div v-if="openKey === 'programmeIntakes'" class="multi-select-panel">
                  <button
                    v-for="opt in programmeIntakeOptions"
                    :key="opt"
                    type="button"
                    class="multi-select-option"
                    :class="{ selected: form.programmeIntakes.includes(opt) }"
                    @click="toggleDim('programmeIntakes', opt)"
                  >
                    <span>{{ dimLabel(opt) }}</span>
                    <span v-if="form.programmeIntakes.includes(opt)" class="check">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!fixedRound" class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.scopeRound') }}
              </label>
              <select
                v-model="form.round"
                class="form-input"
                :class="{ 'has-error': !!errors.round }"
              >
                <option value="" disabled>{{ t('common.pleaseSelect') }}</option>
                <option
                  v-for="opt in roundOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ t(opt.labelKey) }}
                </option>
              </select>
              <p v-if="errors.round" class="field-error">{{ t(errors.round) }}</p>
            </div>
          </div>

          <div class="scope-rule-note">
            <p class="note-title">{{ t('courseRegistration.batch.scopeRuleNoteTitle') }}</p>
            <ol class="note-list">
              <li>{{ t('courseRegistration.batch.scopeRuleNote1') }}</li>
              <li>{{ t('courseRegistration.batch.scopeRuleNote2') }}</li>
              <li>{{ t('courseRegistration.batch.scopeRuleNote3') }}</li>
            </ol>
          </div>
        </div>

        <div class="scope-modal-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.scope-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}

.scope-modal-panel {
  width: min(720px, 100%);
  max-height: min(90vh, 760px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.scope-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.scope-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.scope-modal-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  padding: 0 4px;
}

.scope-modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}

.form-input.has-error,
.multi-select.has-error .multi-select-trigger {
  border-color: #f87171;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.multi-select {
  position: relative;
}

.multi-select-trigger {
  width: 100%;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
}

.multi-select.open .multi-select-trigger {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.multi-select-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.multi-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}

.multi-tag-x {
  font-size: 14px;
  line-height: 1;
  color: #64748b;
}

.multi-select-panel {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  max-height: 220px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
}

.multi-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.multi-select-option:hover {
  background: #f8fafc;
}

.multi-select-option.selected {
  background: #eff6ff;
  color: #1d4ed8;
}

.check {
  color: #2563eb;
  font-weight: 600;
}

.scope-rule-note {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.note-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #c2410c;
}

.note-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #9a3412;
  line-height: 1.6;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

/* 与专业范围设置等弹窗按钮样式对齐 */
.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
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
