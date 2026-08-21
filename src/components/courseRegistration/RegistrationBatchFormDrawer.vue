<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatRoundsSummary } from '../../data/courseRegistration/registrationBatches.js'
import {
  registrationAcademicSessionOptions,
  normalizeBatchAcademicSession,
  emptyRoundsPicker,
  emptyAddDropWindowPicker,
  addDropWindowToPicker,
  addDropWindowFromPicker,
  validateBatchFormBasics,
  getBatchScheduleMinDates,
  clearInvalidBatchScheduleAfter,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  normalizeRegistrationType,
  registrationBatchTypeOptions,
  getBatchTypeFieldTooltip,
} from '../../data/courseRegistration/registrationTypes.js'
import {
  getBatchScopeRules,
  cloneScopeRules,
  scopeLabelsFromRules,
  batchScopeProgrammeOptions,
} from '../../data/courseRegistration/batchScopeRules.js'
import {
  defaultBatchLocalRules,
  normalizeBatchLocalRules,
} from '../../data/courseRegistration/batchLocalRules.js'
import {
  resolveBatchTermKind,
  resolveDropDeadlineWeek,
} from '../../data/courseRegistration/batchTermKind.js'
import { countGlobalBatchParticipants } from '../../data/courseRegistration/batchStudentRoster.js'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-student-list'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})

function createEmptyForm() {
  return {
    name: '',
    academicSession: '',
    type: 'ME',
    programme: '',
    isSelectable: true,
    localRules: defaultBatchLocalRules(),
    creditMin: 12,
    creditMax: 20,
    dropDeadlineWeek: 2,
    termKind: 'long',
    notifyTemplate: 'default-m1',
    rounds: emptyRoundsPicker(),
    addDropWindow: emptyAddDropWindowPicker(),
  }
}

watch(
  () => props.batch,
  (batch) => {
    errors.value = {}
    if (batch) {
      form.value = {
        name: batch.name,
        academicSession: normalizeBatchAcademicSession(batch.academicSession || batch.semester),
        type: normalizeRegistrationType(batch.type),
        programme: batch.programme || '',
        isSelectable: batch.isSelectable !== false,
        localRules: normalizeBatchLocalRules(batch.localRules),
        creditMin: batch.creditMin ?? 12,
        creditMax: batch.creditMax ?? 20,
        dropDeadlineWeek: resolveDropDeadlineWeek(batch),
        termKind: resolveBatchTermKind(batch),
        notifyTemplate: batch.notifyTemplate || 'default-m1',
        rounds: emptyRoundsPicker(),
        addDropWindow: addDropWindowToPicker(batch.addDropWindow),
      }
    } else {
      form.value = createEmptyForm()
    }
  },
  { immediate: true },
)

const title = computed(() =>
  props.batch ? t('courseRegistration.batch.edit') : t('courseRegistration.batch.new'),
)

const isEdit = computed(() => !!props.batch)

const typeFieldTooltip = computed(() => getBatchTypeFieldTooltip(t))

const showProgrammeField = computed(() => form.value.type === 'ME')

/** 编辑态用表单当前学期/专业推导全局人数 */
const globalScopePreviewBatch = computed(() => {
  if (!props.batch) return null
  return {
    ...props.batch,
    academicSession: form.value.academicSession,
    type: form.value.type,
    programme: form.value.type === 'ME' ? form.value.programme : '',
  }
})

const globalParticipantCount = computed(() =>
  countGlobalBatchParticipants(globalScopePreviewBatch.value),
)

/** 跳转批次学生清单 · 全局选课名单（不另开清单抽屉） */
function openGlobalStudentList() {
  if (!props.batch) return
  emit('open-student-list', {
    batch: globalScopePreviewBatch.value || props.batch,
    round: 'global',
  })
}

watch(
  () => form.value.type,
  (type) => {
    if (type !== 'ME') form.value.programme = ''
  },
)

const scheduleMinDates = computed(() => getBatchScheduleMinDates(form.value))

function err(field) {
  return errors.value[field] ? t(errors.value[field]) : ''
}

function onAddDropDateChange(index, value) {
  if (index === 6) form.value.addDropWindow.start = value || ''
  if (index === 7) form.value.addDropWindow.end = value || ''
  clearInvalidBatchScheduleAfter(form.value, index)
}

function emptyRounds() {
  return {
    preselect: { start: '', end: '' },
    main: { start: '', end: '' },
    supplement: { start: '', end: '' },
  }
}

function buildPayload(statusPatch = {}) {
  const rounds = props.batch?.rounds
    ? {
        preselect: {
          start: props.batch.rounds.preselect?.start || '',
          end: props.batch.rounds.preselect?.end || '',
        },
        main: {
          start: props.batch.rounds.main?.start || '',
          end: props.batch.rounds.main?.end || '',
        },
        supplement: {
          start: props.batch.rounds.supplement?.start || '',
          end: props.batch.rounds.supplement?.end || '',
        },
      }
    : emptyRounds()
  const addDropWindow = addDropWindowFromPicker(form.value.addDropWindow)
  const scopeRules = props.batch ? cloneScopeRules(getBatchScopeRules(props.batch)) : []
  const localRules = normalizeBatchLocalRules(form.value.localRules)

  return {
    name: form.value.name.trim(),
    academicSession: form.value.academicSession,
    type: form.value.type,
    programme: form.value.type === 'ME' ? String(form.value.programme || '').trim() : '',
    isSelectable: form.value.isSelectable !== false,
    localRules,
    scopeRules,
    scope: scopeLabelsFromRules(scopeRules, t),
    creditMin: Number(form.value.creditMin) || 12,
    creditMax: Number(form.value.creditMax) || 20,
    dropDeadlineWeek: Number(form.value.dropDeadlineWeek) || resolveDropDeadlineWeek(form.value),
    termKind: form.value.termKind || resolveBatchTermKind(form.value),
    notifyTemplate: form.value.notifyTemplate,
    rounds,
    addDropWindow,
    roundsSummary: formatRoundsSummary(rounds, addDropWindow),
    preselectPriority: {
      preferSenior: false,
      minSemestersAbove: 1,
    },
    volunteerFinalConfirmedAt: props.batch?.volunteerFinalConfirmedAt || null,
    ...statusPatch,
  }
}

function handleSaveDraft() {
  errors.value = validateBatchFormBasics(form.value)
  if (Object.keys(errors.value).length) return
  emit('save', buildPayload({ status: 'draft' }))
}

function handleSave() {
  errors.value = validateBatchFormBasics(form.value)
  if (Object.keys(errors.value).length) return
  emit('save', buildPayload())
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.batch.draftHint') }}{{ t('common.prototypeOnlySuffix') }}</p>
    </CourseRegistrationCallout>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">1</span>
        {{ t('courseRegistration.batch.sectionBasic') }}
      </h3>
      <div class="fields-grid">
        <div class="form-field">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.name') }}
          </label>
          <input v-model="form.name" type="text" class="form-input" :class="{ 'has-error': !!errors.name }" />
          <p v-if="err('name')" class="field-error">{{ err('name') }}</p>
        </div>
        <div class="form-field">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.academicSession') }}
            <ExternalDataHint source-key="scheduling" />
          </label>
          <select
            v-model="form.academicSession"
            class="form-input"
            :class="{ 'has-error': !!errors.academicSession, 'is-empty': !form.academicSession }"
          >
            <option value="">{{ t('common.pleaseSelect') }}</option>
            <option v-for="opt in registrationAcademicSessionOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <p v-if="err('academicSession')" class="field-error">{{ err('academicSession') }}</p>
        </div>
        <div class="form-field">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.type') }}
            <ExternalDataHint :text="typeFieldTooltip" />
          </label>
          <select v-model="form.type" class="form-input" :class="{ 'has-error': !!errors.type }">
            <option v-for="opt in registrationBatchTypeOptions" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
          <p v-if="err('type')" class="field-error">{{ err('type') }}</p>
        </div>
        <div v-if="showProgrammeField" class="form-field">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.programme') }}
          </label>
          <select
            v-model="form.programme"
            class="form-input"
            :class="{ 'has-error': !!errors.programme, 'is-empty': !form.programme }"
          >
            <option value="">{{ t('common.pleaseSelect') }}</option>
            <option v-for="code in batchScopeProgrammeOptions" :key="code" :value="code">
              {{ code }}
            </option>
          </select>
          <p class="field-hint">{{ t('courseRegistration.batch.programmeHint') }}</p>
          <p v-if="err('programme')" class="field-error">{{ err('programme') }}</p>
        </div>
        <div class="form-field">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.isSelectable') }}
          </label>
          <div class="radio-row">
            <label class="radio-option">
              <input v-model="form.isSelectable" type="radio" :value="true" />
              {{ t('common.yes') }}
            </label>
            <label class="radio-option">
              <input v-model="form.isSelectable" type="radio" :value="false" />
              {{ t('common.no') }}
            </label>
          </div>
          <p class="field-hint">
            {{ t('courseRegistration.batch.isSelectableHint') }}{{ t('common.prototypeOnlySuffix') }}
          </p>
        </div>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">2</span>
        {{ t('courseRegistration.batch.localRulesTitle') }}
      </h3>
      <div class="local-rules-grid">
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.localRules.linkPrerequisites" type="checkbox" />
          {{ t('courseRegistration.batch.ruleLinkPrerequisites') }}
        </label>
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.localRules.allowRetakeOnFail" type="checkbox" />
          {{ t('courseRegistration.batch.ruleAllowRetakeOnFail') }}
        </label>
        <label class="checkbox-row checkbox-row--inline local-rule-drop">
          <input v-model="form.localRules.allowDropSelfSelected" type="checkbox" />
          <span class="local-rule-drop-text">
            {{ t('courseRegistration.batch.ruleAllowDropSelfSelectedPrefix') }}
            <input
              v-model.number="form.localRules.dropSelfSelectedMaxPerRound"
              type="number"
              min="1"
              class="inline-number"
              :disabled="!form.localRules.allowDropSelfSelected"
            />
            {{ t('courseRegistration.batch.ruleAllowDropSelfSelectedSuffix') }}
          </span>
        </label>
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.localRules.allowExceedCreditMax" type="checkbox" />
          {{ t('courseRegistration.batch.ruleAllowExceedCreditMax') }}
        </label>
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.localRules.releaseCrossAudienceOnRound3" type="checkbox" />
          {{ t('courseRegistration.batch.ruleReleaseCrossAudienceOnRound3') }}
        </label>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">3</span>
        {{ t('courseRegistration.batch.addDropWindow') }}
      </h3>
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.batch.addDropWindowVsRoundsTip') }}</p>
      </CourseRegistrationCallout>
      <div class="round-card">
        <div class="round-fields">
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundStart') }}</label>
            <DatePickerEn
              mode="datetime"
              :model-value="form.addDropWindow.start"
              :placeholder="t('common.pleaseSelectDateTime')"
              :min-date="scheduleMinDates[6]"
              @update:model-value="(v) => onAddDropDateChange(6, v)"
            />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }}</label>
            <DatePickerEn
              mode="datetime"
              :model-value="form.addDropWindow.end"
              :placeholder="t('common.pleaseSelectDateTime')"
              :min-date="scheduleMinDates[7]"
              @update:model-value="(v) => onAddDropDateChange(7, v)"
            />
          </div>
        </div>
      </div>
    </section>

    <section v-if="isEdit" class="form-section">
      <h3 class="section-title">
        <span class="step-badge">4</span>
        {{ t('courseRegistration.batch.sectionGlobalScope') }}
      </h3>
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.batch.globalScopeTip') }}</p>
      </CourseRegistrationCallout>
      <div class="global-scope-summary">
        <div class="global-scope-count">
          <span class="global-scope-label">{{ t('courseRegistration.batch.globalScopeCount') }}</span>
          <strong>{{ globalParticipantCount }}</strong>
        </div>
        <button type="button" class="btn btn-default" @click="openGlobalStudentList">
          {{ t('courseRegistration.batch.globalScopeViewList') }}
        </button>
      </div>
    </section>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-default" @click="handleSaveDraft">{{ t('common.saveDraft') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.form-section {
  margin-bottom: 24px;
}

.form-section + .form-section {
  padding-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.round-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.req {
  color: #ef4444;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #dc2626;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.round-card {
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input.has-error {
  border-color: #f87171;
}

.form-input.is-empty {
  color: #9ca3af;
}

.form-field :deep(.date-picker-en) {
  width: 100%;
}

.radio-row {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 36px;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  color: #374151;
}

.checkbox-row--inline {
  margin-top: 0;
}

.local-rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  align-items: center;
}

.global-scope-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.global-scope-count {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}

.global-scope-count strong {
  font-size: 18px;
  color: #111827;
}

.global-scope-label {
  color: #6b7280;
}

.local-rule-drop {
  align-items: center;
}

.local-rule-drop-text {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 2px;
  line-height: 1.4;
}

.inline-number {
  width: 56px;
  margin: 0 4px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.inline-number:disabled {
  opacity: 0.5;
  background: #f3f4f6;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

@media (max-width: 720px) {
  .fields-grid,
  .round-fields,
  .local-rules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
