<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  createVersionFormSteps,
  formatCheckTotalDisplay,
  localFeeColumns,
  internationalFeeColumns,
} from '../../data/programmeVersions.js'

const props = defineProps({
  visible: Boolean,
  programmeName: { type: String, default: '' },
  version: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t, tr, isZh } = useAppI18n()

const currentStep = ref(1)

watch(
  () => props.visible,
  (visible) => {
    if (visible) currentStep.value = 1
  },
)

const form = computed(() => props.version?.formData || {})
const approval = computed(() => form.value.approvalDetails || {})
const entry = computed(() => form.value.entryRequirements || {})
const threshold = computed(() => form.value.thresholdMarks || {})
const fee = computed(() => form.value.feeStructure || {})

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function checkTotalText(value) {
  return formatCheckTotalDisplay(value, { tr, isZh: isZh.value })
}

function goToStep(stepId) {
  currentStep.value = stepId
}

function stepClass(stepId) {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && version" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('modal.versionDetails') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <p class="programme-name">{{ tr('Programme:') }} {{ programmeName }}</p>

        <div class="stepper">
          <template v-for="(step, index) in createVersionFormSteps" :key="step.id">
            <button type="button" class="step-item" :class="stepClass(step.id)" @click="goToStep(step.id)">
              <span class="step-circle">{{ step.id }}</span>
              <span class="step-label">{{ tr(step.title) }}</span>
            </button>
            <div v-if="index < createVersionFormSteps.length - 1" class="step-line" :class="{ completed: step.id < currentStep }" />
          </template>
        </div>

        <div class="modal-body">
          <!-- Step 1: Approval Details -->
          <section v-show="currentStep === 1">
            <h3 class="section-title"><span class="section-bar"></span>{{ tr('MQA Info') }}</h3>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">MQA Code:</span>
                <span class="detail-value">{{ display(approval.mqaCode) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date (MQA):</span>
                <span class="detail-value">{{ display(approval.mqaStartDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Expiry Date (MQA):</span>
                <span class="detail-value">{{ display(approval.mqaExpiryDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Syor Date(PA):</span>
                <span class="detail-value">{{ display(approval.mqaSyorDatePa) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Syor Reference (PA):</span>
                <span class="detail-value">{{ display(approval.mqaSyorReferencePa) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Syor Date(FA):</span>
                <span class="detail-value">{{ display(approval.mqaSyorDateFa) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Syor Reference (FA):</span>
                <span class="detail-value">{{ display(approval.mqaSyorReferenceFa) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">First intake duration as in approval:</span>
                <span class="detail-value">{{ display(approval.mqaFirstIntakeDuration) }}</span>
              </div>
            </div>

            <h3 class="section-title section-title-spaced"><span class="section-bar"></span>MOHE Info</h3>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">MOHE Code:</span>
                <span class="detail-value">{{ display(approval.moheCode) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">MOHE Approval Reference No.:</span>
                <span class="detail-value">{{ display(approval.moheApprovalReferenceNo) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approval Date (MOHE):</span>
                <span class="detail-value">{{ display(approval.moheApprovalDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date (MOHE):</span>
                <span class="detail-value">{{ display(approval.moheStartDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Expiry Date (MOHE):</span>
                <span class="detail-value">{{ display(approval.moheExpiryDate) }}</span>
              </div>
            </div>
          </section>

          <!-- Step 2: Entry Requirements -->
          <section v-show="currentStep === 2">
            <h3 class="section-title"><span class="section-bar"></span>Entry Requirements</h3>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">MUET:</span>
                <span class="detail-value">{{ display(entry.muet) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IELTS:</span>
                <span class="detail-value">{{ display(entry.elts) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">TOEFL IBT:</span>
                <span class="detail-value">{{ display(entry.toeflIbt) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">TOEFL Essentials (Online):</span>
                <span class="detail-value">{{ display(entry.toeflEssentials) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">PEARSON TEST OF ENGLISH:</span>
                <span class="detail-value">{{ display(entry.pearsonTestOfEnglish) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">CAMBRIDGE ENGLISH(i/ii):</span>
                <span class="detail-value">{{ display(entry.cambridgeEnglishIi) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">CAMBRIDGE ENGLISH(iii):</span>
                <span class="detail-value">{{ display(entry.cambridgeEnglishIii) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">ELS:</span>
                <span class="detail-value">{{ display(entry.els) }}</span>
              </div>
            </div>
          </section>

          <!-- Step 3: Threshold Marks -->
          <section v-show="currentStep === 3">
            <h3 class="section-title"><span class="section-bar"></span>Threshold Marks</h3>
            <table class="threshold-table">
              <thead>
                <tr>
                  <th>Total Continuous Assessment</th>
                  <th>Total Final Assessment</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ display(threshold.totalContinuousAssessment) }}</td>
                  <td>{{ display(threshold.totalFinalAssessment) }}</td>
                  <td>{{ display(threshold.overallScore) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Step 4: Fee Structure -->
          <section v-show="currentStep === 4">
            <h3 class="section-title"><span class="section-bar"></span>Fee Structure</h3>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Duration (Min. Year):</span>
                <span class="detail-value">{{ display(fee.durationMinYear) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type of Approval:</span>
                <span class="detail-value">{{ display(fee.typeOfApproval) }}</span>
              </div>
            </div>

            <h3 class="section-title section-title-spaced"><span class="section-bar"></span>Local Student (RM)</h3>
            <div class="fee-table-wrap">
              <table class="fee-table">
                <thead>
                  <tr>
                    <th v-for="col in localFeeColumns" :key="`local-head-${col.key}`">{{ col.label }}</th>
                    <th class="col-check-total">{{ tr('Check Total (Local Student)') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="col in localFeeColumns" :key="`local-${col.key}`">
                      {{ display(fee.localStudent?.[col.key]) }}
                    </td>
                    <td class="col-check-total check-total-value">{{ checkTotalText(fee.localStudent?.checkTotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="section-title section-title-spaced"><span class="section-bar"></span>International Student (RM)</h3>
            <div class="fee-table-wrap">
              <table class="fee-table">
                <thead>
                  <tr>
                    <th v-for="col in internationalFeeColumns" :key="`intl-head-${col.key}`">{{ col.label }}</th>
                    <th class="col-check-total">{{ tr('Check Total (International Student)') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="col in internationalFeeColumns" :key="`intl-${col.key}`">
                      {{ display(fee.internationalStudent?.[col.key]) }}
                    </td>
                    <td class="col-check-total check-total-value">{{ checkTotalText(fee.internationalStudent?.checkTotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
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
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  --modal-pad-x: 28px;
  width: 100%;
  max-width: 1080px;
  max-height: 92vh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--modal-pad-x);
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f0f0f0;
}

.programme-name {
  padding: 12px var(--modal-pad-x) 0;
  font-size: 14px;
  color: #374151;
  flex-shrink: 0;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 16px var(--modal-pad-x) 16px;
  flex-shrink: 0;
  gap: 4px 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 0 1 auto;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.step-label {
  font-size: 12px;
  color: #9ca3af;
  white-space: normal;
  text-align: center;
  max-width: 110px;
  line-height: 1.3;
}

.step-item.active .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 500;
}

.step-item.completed .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.step-item.completed .step-label {
  color: #2563eb;
}

.step-line {
  flex: 1;
  max-width: 80px;
  min-width: 32px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px 24px;
}

.step-line.completed {
  background: #2563eb;
}

.modal-body {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 var(--modal-pad-x) 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.section-title-spaced {
  margin-top: 28px;
}

.section-bar {
  width: 4px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
}

.detail-row {
  display: flex;
  gap: 12px;
  min-width: 0;
  font-size: 14px;
  line-height: 1.6;
}

.detail-label {
  flex-shrink: 0;
  width: 220px;
  color: #6b7280;
}

.detail-value {
  flex: 1;
  min-width: 0;
  color: #111827;
  word-break: break-word;
}

.threshold-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.threshold-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.threshold-table td {
  padding: 12px;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.fee-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.fee-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: 13px;
}

.fee-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  white-space: nowrap;
}

.fee-table td {
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  color: #111827;
}

.col-check-total {
  width: 96px;
  min-width: 96px;
}

.check-total-value {
  font-weight: 600;
}
</style>
