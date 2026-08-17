<script setup>
import { ref, computed } from 'vue'
import YnSwitch from '../../components/common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  registrationRules,
  updateRegistrationRuleEnabled,
  updateRegistrationRuleValue,
} from '../../data/courseRegistration/registrationRuleSettings.js'
import { preselectWeightSettings } from '../../data/courseRegistration/preselectWeightSettings.js'

const { t } = useAppI18n()

const draftValues = ref({})
const valueErrors = ref({})
const geRDraft = ref(String(preselectWeightSettings.value.geDefaultR))
const defaultRDraft = ref(String(preselectWeightSettings.value.defaultR))
const meProgrammeDraft = ref(
  Object.entries(preselectWeightSettings.value.meByProgramme || {})
    .map(([k, v]) => `${k}:${v}`)
    .join(', '),
)

const switchOnLabel = computed(() => t('registrationRules.switchOn'))
const switchOffLabel = computed(() => t('registrationRules.switchOff'))

function ruleName(row) {
  const key = `registrationRules.items.${row.id}.name`
  const translated = t(key)
  return translated !== key ? translated : row.id
}

function draftValue(row) {
  if (Object.prototype.hasOwnProperty.call(draftValues.value, row.id)) {
    return draftValues.value[row.id]
  }
  return row.params?.value
}

function setDraftValue(row, value) {
  draftValues.value = { ...draftValues.value, [row.id]: value }
  if (valueErrors.value[row.id]) {
    const next = { ...valueErrors.value }
    delete next[row.id]
    valueErrors.value = next
  }
}

function commitValue(row) {
  const raw = draftValue(row)
  const result = updateRegistrationRuleValue(row.id, raw)
  if (!result.ok) {
    valueErrors.value = {
      ...valueErrors.value,
      [row.id]: t(result.errorKey),
    }
    draftValues.value = { ...draftValues.value, [row.id]: row.params?.value }
    return
  }
  const nextDraft = { ...draftValues.value }
  delete nextDraft[row.id]
  draftValues.value = nextDraft
}

function handleToggleEnabled(row, enabled) {
  updateRegistrationRuleEnabled(row.id, enabled)
}

function commitWeightSettings() {
  const ge = Number(geRDraft.value)
  const def = Number(defaultRDraft.value)
  if (Number.isFinite(ge) && ge > 0) preselectWeightSettings.value.geDefaultR = ge
  if (Number.isFinite(def) && def > 0) preselectWeightSettings.value.defaultR = def
  const map = {}
  String(meProgrammeDraft.value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [code, r] = pair.split(':').map((x) => x.trim())
      const n = Number(r)
      if (code && Number.isFinite(n) && n > 0) map[code] = n
    })
  preselectWeightSettings.value.meByProgramme = map
}

function toggleCrossRelease(value) {
  preselectWeightSettings.value.releaseCrossAudienceOnRound3 = Boolean(value)
}
</script>

<template>
  <div class="registration-rules-page">
    <div class="page-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-enabled">{{ t('registrationRules.columns.enabled') }}</th>
              <th class="col-name">{{ t('registrationRules.columns.ruleName') }}</th>
              <th class="col-value">{{ t('registrationRules.columns.ruleValue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in registrationRules" :key="row.id">
              <td class="col-enabled">
                <YnSwitch
                  :model-value="row.enabled"
                  :on-label="switchOnLabel"
                  :off-label="switchOffLabel"
                  @update:model-value="(value) => handleToggleEnabled(row, value)"
                />
              </td>
              <td class="col-name">{{ ruleName(row) }}</td>
              <td class="col-value">
                <input
                  :value="draftValue(row)"
                  type="text"
                  class="value-input"
                  inputmode="numeric"
                  @input="setDraftValue(row, $event.target.value)"
                  @change="commitValue(row)"
                  @blur="commitValue(row)"
                />
                <p v-if="valueErrors[row.id]" class="value-error">{{ valueErrors[row.id] }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="page-card weight-card">
      <h3 class="card-title">{{ t('registrationRules.preselectWeightTitle') }}</h3>
      <p class="card-hint">{{ t('registrationRules.preselectWeightHint') }}</p>
      <div class="weight-fields">
        <div class="field-row">
          <label class="field-label">{{ t('registrationRules.geDefaultR') }}</label>
          <input v-model="geRDraft" type="number" min="1" step="0.1" class="value-input" @change="commitWeightSettings" />
        </div>
        <div class="field-row">
          <label class="field-label">{{ t('registrationRules.defaultR') }}</label>
          <input v-model="defaultRDraft" type="number" min="1" step="0.1" class="value-input" @change="commitWeightSettings" />
        </div>
        <div class="field-row field-row-wide">
          <label class="field-label">{{ t('registrationRules.meByProgramme') }}</label>
          <input
            v-model="meProgrammeDraft"
            type="text"
            class="value-input wide"
            :placeholder="t('registrationRules.meByProgrammePlaceholder')"
            @change="commitWeightSettings"
          />
        </div>
        <div class="field-row">
          <label class="field-label">{{ t('registrationRules.releaseCrossAudience') }}</label>
          <YnSwitch
            :model-value="preselectWeightSettings.releaseCrossAudienceOnRound3"
            :on-label="switchOnLabel"
            :off-label="switchOffLabel"
            @update:model-value="toggleCrossRelease"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.registration-rules-page {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px;
  box-sizing: border-box;
  overflow: auto;
}

.page-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px 24px 16px;
}

.page-card:first-child {
  flex: 1;
}

.weight-card {
  flex: 0 0 auto;
}

.card-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.card-hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.45;
}

.weight-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.field-row-wide .wide {
  width: min(420px, 100%);
}

.field-label {
  min-width: 160px;
  font-size: 13px;
  color: #374151;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #e8eef5;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: center;
  border-bottom: 1px solid #e8eef5;
  vertical-align: middle;
}

.data-table th {
  background: #f5f8fc;
  font-weight: 600;
  color: #374151;
}

.data-table tbody tr:nth-child(even) {
  background: #f8fbff;
}

.data-table tbody tr:nth-child(odd) {
  background: #fff;
}

.col-enabled {
  width: 160px;
}

.col-name {
  text-align: center;
  color: #111827;
  line-height: 1.5;
}

.col-value {
  width: 140px;
}

.value-input {
  width: 72px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.value-input.wide {
  text-align: left;
}

.value-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #dc2626;
}
</style>
