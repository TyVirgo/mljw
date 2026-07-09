<script setup>
import { ref, computed } from 'vue'
import YnSwitch from '../../components/common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  movementRules,
  updateMovementRuleEnabled,
  updateMovementRuleValue,
} from '../../data/movementRules.js'

const { t, tr } = useAppI18n()

const editingId = ref(null)
const draftValue = ref('')
const valueError = ref('')

const switchOnLabel = computed(() => t('common.yes'))
const switchOffLabel = computed(() => t('common.no'))

function ruleName(row) {
  const key = `movementRules.items.${row.id}.name`
  const translated = t(key, { value: row.ruleValue })
  return translated !== key ? translated : row.id
}

function isEditing(id) {
  return editingId.value === id
}

function startEdit(row) {
  editingId.value = row.id
  draftValue.value = String(row.ruleValue)
  valueError.value = ''
}

function cancelEdit() {
  editingId.value = null
  draftValue.value = ''
  valueError.value = ''
}

function saveEdit(row) {
  const result = updateMovementRuleValue(row.id, draftValue.value)
  if (!result.ok) {
    valueError.value = tr(result.errorKey)
    return
  }
  cancelEdit()
}

function handleToggleEnabled(row, enabled) {
  if (isEditing(row.id)) cancelEdit()
  updateMovementRuleEnabled(row.id, enabled)
}
</script>

<template>
  <div class="movement-rules-page">
    <div class="page-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">{{ t('common.serialNo') }}</th>
              <th class="col-name">{{ t('movementRules.columns.ruleName') }}</th>
              <th class="col-value">{{ t('movementRules.columns.ruleValue') }}</th>
              <th class="col-enabled">{{ t('movementRules.columns.enabled') }}</th>
              <th class="col-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in movementRules" :key="row.id">
              <td class="col-no">{{ index + 1 }}</td>
              <td class="col-name">{{ ruleName(row) }}</td>
              <td class="col-value">
                <input
                  v-if="isEditing(row.id)"
                  v-model="draftValue"
                  type="text"
                  class="value-input"
                  inputmode="numeric"
                  @keyup.enter="saveEdit(row)"
                />
                <span v-else>{{ row.ruleValue }}</span>
                <p v-if="isEditing(row.id) && valueError" class="value-error">{{ valueError }}</p>
              </td>
              <td class="col-enabled">
                <YnSwitch
                  :model-value="row.enabled"
                  :on-label="switchOnLabel"
                  :off-label="switchOffLabel"
                  @update:model-value="(value) => handleToggleEnabled(row, value)"
                />
              </td>
              <td class="col-actions">
                <template v-if="isEditing(row.id)">
                  <button type="button" class="link-btn link-save" @click="saveEdit(row)">
                    {{ t('common.save') }}
                  </button>
                  <span class="sep">|</span>
                  <button type="button" class="link-btn link-cancel" @click="cancelEdit">
                    {{ t('common.cancel') }}
                  </button>
                </template>
                <button v-else type="button" class="link-btn" @click="startEdit(row)">
                  {{ t('common.edit') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movement-rules-page {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  box-sizing: border-box;
  overflow: hidden;
}

.page-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px 24px 16px;
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
  text-align: left;
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

.col-no {
  width: 64px;
  text-align: center;
}

.col-value {
  width: 120px;
  text-align: center;
}

.col-enabled {
  width: 120px;
  text-align: center;
}

.col-actions {
  width: 140px;
  text-align: center;
  white-space: nowrap;
}

.col-name {
  line-height: 1.5;
  color: #111827;
}

.value-input {
  width: 72px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
}

.value-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.value-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.link-btn {
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  color: #2563eb;
}

.link-save {
  color: #16a34a;
}

.link-cancel {
  color: #dc2626;
}

.sep {
  margin: 0 6px;
  color: #d1d5db;
}
</style>
