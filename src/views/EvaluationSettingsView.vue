<script setup>
import { ref, onMounted } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import { useAppI18n } from '../composables/useAppI18n.js'
import { categoryOptions, initialLecturers, normalizeLecturer } from '../data/lecturers.js'
import {
  loadEvaluationSettings,
  saveEvaluationSettings,
  validateEvaluationSettings,
  applyEvaluationRules,
  createRuleId,
} from '../data/evaluationSettings.js'

const { t, tr } = useAppI18n()

const form = ref(loadEvaluationSettings())
const saveMessage = ref('')

const deleteConfirmVisible = ref(false)
const saveConfirmVisible = ref(false)
const pendingDeleteRuleId = ref(null)

onMounted(() => {
  form.value = loadEvaluationSettings()
})

function toggleNewLecturer() {
  form.value.newLecturerEvaluationEnabled = !form.value.newLecturerEvaluationEnabled
}

function toggleRule(rule) {
  rule.enabled = !rule.enabled
}

function addRule() {
  form.value.categoryChangeRules.push({
    id: createRuleId(),
    fromCategory: '',
    toCategory: '',
    enabled: true,
  })
}

function requestDeleteRule(ruleId) {
  pendingDeleteRuleId.value = ruleId
  deleteConfirmVisible.value = true
}

function confirmDeleteRule() {
  if (pendingDeleteRuleId.value) {
    form.value.categoryChangeRules = form.value.categoryChangeRules.filter(
      (rule) => rule.id !== pendingDeleteRuleId.value,
    )
  }
  pendingDeleteRuleId.value = null
  deleteConfirmVisible.value = false
}

function requestSave() {
  saveMessage.value = ''
  const error = validateEvaluationSettings(form.value)
  if (error) {
    saveMessage.value = tr(error)
    return
  }
  saveConfirmVisible.value = true
}

function confirmSave() {
  saveConfirmVisible.value = false
  saveEvaluationSettings(form.value)
  const baseLecturers = initialLecturers.map((item) => normalizeLecturer({ ...item }))
  applyEvaluationRules(baseLecturers, form.value)
  saveMessage.value = tr('Saved successfully.')
}
</script>

<template>
  <div class="evaluation-page">
    <div class="page-card">
      <div class="info-banner">
        <span class="info-icon" aria-hidden="true">i</span>
        <p>{{ tr('Any lecturer who meets the following conditions is required to undergo lecture evaluation.') }}</p>
      </div>

      <section class="settings-section">
        <div class="section-row">
          <div class="section-copy">
            <h2 class="section-title">{{ tr('New Lecturer') }}</h2>
            <p class="section-desc">
              {{ tr('New lecturers without any teaching experience are required to undergo teacher evaluation.') }}
            </p>
          </div>
          <button
            type="button"
            class="enable-switch"
            :class="{ on: form.newLecturerEvaluationEnabled }"
            :aria-pressed="form.newLecturerEvaluationEnabled"
            @click="toggleNewLecturer"
          >
            <span class="enable-switch-track">
              <span class="enable-switch-knob" />
            </span>
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title block">{{ tr('Change in Lecturer Category') }}</h2>

        <div v-for="rule in form.categoryChangeRules" :key="rule.id" class="rule-row">
          <p class="rule-text">
            <span class="rule-inline">
              <span>{{ tr('Category change from') }}</span>
              <select v-model="rule.fromCategory" class="rule-select">
                <option value="">{{ tr('please select') }}</option>
                <option v-for="opt in categoryOptions" :key="`from-${rule.id}-${opt}`" :value="opt">{{ opt }}</option>
              </select>
              <span>{{ tr('to') }}</span>
              <select v-model="rule.toCategory" class="rule-select">
                <option value="">{{ tr('please select') }}</option>
                <option v-for="opt in categoryOptions" :key="`to-${rule.id}-${opt}`" :value="opt">{{ opt }}</option>
              </select>
              <span>{{ tr('requires teacher evaluation for providing information.') }}</span>
            </span>
          </p>
          <div class="rule-actions">
            <button type="button" class="link-delete" @click="requestDeleteRule(rule.id)">{{ tr('Delete') }}</button>
            <button
              type="button"
              class="enable-switch"
              :class="{ on: rule.enabled }"
              :aria-pressed="rule.enabled"
              @click="toggleRule(rule)"
            >
              <span class="enable-switch-track">
                <span class="enable-switch-knob" />
              </span>
            </button>
          </div>
        </div>

        <button type="button" class="btn-create" @click="addRule">+ {{ tr('Create') }}</button>
      </section>

      <div class="form-footer">
        <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
        <button type="button" class="btn-save" @click="requestSave">{{ t('common.save') }}</button>
      </div>
    </div>

    <ConfirmDialog
      :visible="deleteConfirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="tr('Are you sure you want to delete this rule?')"
      :confirm-text="t('common.delete')"
      confirm-variant="danger"
      @confirm="confirmDeleteRule"
      @cancel="deleteConfirmVisible = false"
    />

    <ConfirmDialog
      :visible="saveConfirmVisible"
      :title="tr('Save Confirmation')"
      :message="tr('Are you sure you want to save the evaluation settings?')"
      :confirm-text="t('common.confirm')"
      confirm-variant="primary"
      wide
      @confirm="confirmSave"
      @cancel="saveConfirmVisible = false"
    />
  </div>
</template>

<style scoped>
.evaluation-page {
  min-height: calc(100vh - 56px);
  padding: 24px 28px 32px;
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 28px 40px 36px;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 28px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 14px;
  line-height: 1.5;
}

.info-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.settings-section {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.settings-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.section-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.section-title.block {
  margin-bottom: 16px;
}

.section-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  max-width: 720px;
}

.rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f9fafb;
}

.rule-row:last-of-type {
  border-bottom: none;
}

.rule-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.rule-inline {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.rule-select {
  height: 32px;
  min-width: 180px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.link-delete {
  font-size: 14px;
  color: #2563eb;
  padding: 0;
}

.link-delete:hover {
  color: #1d4ed8;
}

.enable-switch {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  flex-shrink: 0;
}

.enable-switch-track {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #d1d5db;
  transition: background 0.2s;
}

.enable-switch.on .enable-switch-track {
  background: #2563eb;
}

.enable-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.enable-switch.on .enable-switch-knob {
  transform: translateX(20px);
}

.btn-create {
  margin-top: 12px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
}

.btn-create:hover {
  background: #1d4ed8;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.save-message {
  font-size: 14px;
  color: #16a34a;
}

.btn-save {
  min-width: 100px;
  height: 36px;
  padding: 0 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
}

.btn-save:hover {
  background: #1d4ed8;
}
</style>
