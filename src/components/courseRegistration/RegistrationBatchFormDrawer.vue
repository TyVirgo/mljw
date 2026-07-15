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
  roundsToPicker,
  addDropWindowToPicker,
  roundsFromPicker,
  addDropWindowFromPicker,
  validateBatchFormBasics,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  normalizeRegistrationType,
  registrationBatchTypeOptions,
  getBatchTypeFieldTooltip,
} from '../../data/courseRegistration/registrationTypes.js'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())
const errors = ref({})

function createEmptyForm() {
  return {
    name: '',
    academicSession: '',
    type: 'ME',
    scopeText: '',
    autoImportResumption: true,
    creditMin: 12,
    creditMax: 20,
    billHours: 48,
    dropDeadlineWeek: 5,
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
        scopeText: (batch.scope || []).join(', '),
        autoImportResumption: batch.autoImportResumption ?? true,
        creditMin: batch.creditMin ?? 12,
        creditMax: batch.creditMax ?? 20,
        billHours: batch.billHours ?? 48,
        dropDeadlineWeek: batch.dropDeadlineWeek ?? 5,
        notifyTemplate: batch.notifyTemplate || 'default-m1',
        rounds: roundsToPicker(batch.rounds),
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

const typeFieldTooltip = computed(() => getBatchTypeFieldTooltip(t))

const roundsPreview = computed(() => {
  const rounds = roundsFromPicker(form.value.rounds)
  const addDropWindow = addDropWindowFromPicker(form.value.addDropWindow)
  return formatRoundsSummary(rounds, addDropWindow)
})

function err(field) {
  return errors.value[field] ? t(errors.value[field]) : ''
}

function handleSave() {
  const rounds = roundsFromPicker(form.value.rounds)
  const addDropWindow = addDropWindowFromPicker(form.value.addDropWindow)
  errors.value = validateBatchFormBasics(form.value)
  if (Object.keys(errors.value).length) return

  const scope = form.value.scopeText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  emit('save', {
    name: form.value.name.trim(),
    academicSession: form.value.academicSession,
    type: form.value.type,
    scope,
    autoImportResumption: form.value.autoImportResumption,
    creditMin: Number(form.value.creditMin) || 12,
    creditMax: Number(form.value.creditMax) || 20,
    billHours: Number(form.value.billHours) || 48,
    dropDeadlineWeek: Number(form.value.dropDeadlineWeek) || 5,
    notifyTemplate: form.value.notifyTemplate,
    rounds,
    addDropWindow,
    roundsSummary: formatRoundsSummary(rounds, addDropWindow),
  })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.batch.draftHint') }}</p>
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
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">2</span>
        {{ t('courseRegistration.batch.sectionTime') }}
      </h3>
      <CourseRegistrationCallout variant="rule">
        <p>{{ t('courseRegistration.batch.roundsRule') }}</p>
      </CourseRegistrationCallout>

      <div class="round-block">
        <h4>{{ t('courseRegistration.batch.roundPreselect') }}</h4>
        <div class="round-fields">
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundStart') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.preselect.start" :placeholder="t('common.pleaseSelectDate')" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.preselect.end" :placeholder="t('common.pleaseSelectDate')" />
          </div>
        </div>
      </div>

      <div class="round-block">
        <h4>{{ t('courseRegistration.batch.roundMain') }}</h4>
        <div class="round-fields">
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundStart') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.main.start" :placeholder="t('common.pleaseSelectDate')" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.main.end" :placeholder="t('common.pleaseSelectDate')" />
          </div>
        </div>
      </div>

      <div class="round-block">
        <h4>{{ t('courseRegistration.batch.roundSupplement') }}</h4>
        <div class="round-fields">
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundStart') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.supplement.start" :placeholder="t('common.pleaseSelectDate')" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.rounds.supplement.end" :placeholder="t('common.pleaseSelectDate')" />
          </div>
        </div>
      </div>

      <div class="round-block">
        <h4>{{ t('courseRegistration.batch.addDropWindow') }}</h4>
        <div class="round-fields">
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundStart') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.addDropWindow.start" :placeholder="t('common.pleaseSelectDate')" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
            <DatePickerEn v-model="form.addDropWindow.end" :placeholder="t('common.pleaseSelectDate')" />
          </div>
        </div>
      </div>

      <div class="form-field form-field--narrow">
        <label class="field-label">{{ t('courseRegistration.batch.dropDeadlineWeek') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
        <input v-model="form.dropDeadlineWeek" type="number" class="form-input" min="1" max="12" />
      </div>

      <p v-if="roundsPreview" class="rounds-preview">{{ roundsPreview }}</p>
    </section>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">3</span>
        {{ t('courseRegistration.batch.sectionScope') }}
      </h3>
      <div class="form-field">
        <label class="field-label">{{ t('courseRegistration.batch.scope') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
        <input v-model="form.scopeText" type="text" class="form-input" :placeholder="t('courseRegistration.batch.scopePlaceholder')" />
        <p class="field-hint">{{ t('courseRegistration.batch.scopePublishHint') }}</p>
      </div>
      <label class="checkbox-row">
        <input v-model="form.autoImportResumption" type="checkbox" />
        {{ t('courseRegistration.batch.autoResumption') }}
      </label>
    </section>

    <section class="form-section">
      <h3 class="section-title">
        <span class="step-badge">4</span>
        {{ t('courseRegistration.batch.sectionCredit') }}
      </h3>
      <div class="fields-grid">
        <div class="form-field">
          <label class="field-label">{{ t('courseRegistration.batch.creditMin') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
          <input v-model="form.creditMin" type="number" class="form-input" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('courseRegistration.batch.creditMax') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
          <input v-model="form.creditMax" type="number" class="form-input" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('courseRegistration.batch.billHours') }} {{ t('courseRegistration.batch.optionalTag') }}</label>
          <input v-model="form.billHours" type="number" class="form-input" />
        </div>
      </div>
    </section>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
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

.form-field--narrow {
  max-width: 200px;
  margin-top: 8px;
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

.round-block {
  margin-bottom: 16px;
}

.round-block h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
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

.rounds-preview {
  margin: 12px 0 0;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  color: #374151;
}

@media (max-width: 720px) {
  .fields-grid,
  .round-fields {
    grid-template-columns: 1fr;
  }
}
</style>
