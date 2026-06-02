<script setup>
import { ref, watch } from 'vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import {
  createVersionFormSteps,
  createEmptyVersionForm,
  typeOfApprovalOptions,
  localFeeColumns,
  internationalFeeColumns,
} from '../../data/programmeVersions.js'

const props = defineProps({
  visible: Boolean,
  programmeName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const currentStep = ref(1)
const form = ref(createEmptyVersionForm())
const errors = ref({})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    currentStep.value = 1
    errors.value = {}
    form.value = createEmptyVersionForm()
  },
)

function setError(key, message) {
  if (message) errors.value[key] = message
  else delete errors.value[key]
}

function requireText(value, key, label) {
  if (!String(value || '').trim()) {
    setError(key, `${label} is required`)
    return false
  }
  setError(key, '')
  return true
}

function requireSelect(value, key, label) {
  if (!value) {
    setError(key, `${label} is required`)
    return false
  }
  setError(key, '')
  return true
}

function validateStep1() {
  const approval = form.value.approvalDetails
  let valid = true
  const checks = [
    () => requireText(approval.mqaCode, 'mqaCode', 'MQA Code'),
    () => requireText(approval.mqaSyorReferencePa, 'mqaSyorReferencePa', 'Syor Reference (PA)'),
    () => requireText(approval.mqaSyorReferenceFa, 'mqaSyorReferenceFa', 'Syor Reference (FA)'),
    () => requireText(approval.mqaStartDate, 'mqaStartDate', 'Start Date'),
    () => requireText(approval.mqaSyorDatePa, 'mqaSyorDatePa', 'Syor Date(PA)'),
    () => requireText(approval.mqaSyorDateFa, 'mqaSyorDateFa', 'Syor Date(FA)'),
    () => requireText(approval.mqaFirstIntakeDuration, 'mqaFirstIntakeDuration', 'First intake duration as in approval'),
    () => requireText(approval.moheCode, 'moheCode', 'MOHE Code'),
    () => requireText(approval.moheApprovalDate, 'moheApprovalDate', 'Approval Date'),
    () => requireText(approval.moheExpiryDate, 'moheExpiryDate', 'Expiry Date'),
    () => requireText(approval.moheApprovalReferenceNo, 'moheApprovalReferenceNo', 'MOHE Approval Reference No.'),
    () => requireText(approval.moheStartDate, 'moheStartDate', 'Start Date'),
  ]
  checks.forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

function validateStep2() {
  return true
}

function validateStep3() {
  return true
}

function validateStep4() {
  const fee = form.value.feeStructure
  let valid = true
  ;[
    () => requireText(fee.durationMinYear, 'durationMinYear', 'Duration (Min. Year)'),
    () => requireSelect(fee.typeOfApproval, 'typeOfApproval', 'Type of Approval'),
  ].forEach((check) => {
    if (!check()) valid = false
  })
  return valid
}

const stepValidators = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
  4: validateStep4,
}

function validateCurrentStep() {
  errors.value = {}
  return stepValidators[currentStep.value]?.() ?? true
}

function handleNext() {
  if (!validateCurrentStep()) return
  if (currentStep.value < createVersionFormSteps.length) {
    currentStep.value += 1
    errors.value = {}
  }
}

function handlePrevious() {
  if (currentStep.value > 1) {
    currentStep.value -= 1
    errors.value = {}
  }
}

function handleSubmit() {
  if (!validateCurrentStep()) return
  emit('save', JSON.parse(JSON.stringify(form.value)))
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}

function stepClass(stepId) {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

function fieldError(key) {
  return errors.value[key] ? 'error' : ''
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Create Version</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="handleClose">×</button>
        </div>

        <p class="programme-name">Programme: {{ programmeName }}</p>

        <div class="stepper">
          <template v-for="(step, index) in createVersionFormSteps" :key="step.id">
            <div class="step-item" :class="stepClass(step.id)">
              <span class="step-circle">{{ step.id }}</span>
              <span class="step-label">{{ step.title }}</span>
            </div>
            <div v-if="index < createVersionFormSteps.length - 1" class="step-line" :class="{ completed: step.id < currentStep }" />
          </template>
        </div>

        <div class="modal-body">
          <!-- Step 1: Approval Details -->
          <section v-show="currentStep === 1" class="approval-details-section">
            <div class="programme-info-form approval-details-form">
              <h3 class="section-title"><span class="section-bar"></span>MQA Info</h3>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> MQA Code:</label>
                  <input v-model="form.approvalDetails.mqaCode" type="text" class="pi-input" :class="fieldError('mqaCode')" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Start Date:</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaStartDate" placeholder="please select date" :has-error="!!errors.mqaStartDate" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">Expiry Date:</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaExpiryDate" placeholder="please select date" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Syor Date(PA):</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorDatePa" placeholder="please select date" :has-error="!!errors.mqaSyorDatePa" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Syor Reference (PA):</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorReferencePa" placeholder="please select date" :has-error="!!errors.mqaSyorReferencePa" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Syor Date(FA):</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorDateFa" placeholder="please select date" :has-error="!!errors.mqaSyorDateFa" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Syor Reference (FA):</label>
                  <DatePickerEn v-model="form.approvalDetails.mqaSyorReferenceFa" placeholder="please select date" :has-error="!!errors.mqaSyorReferenceFa" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> First intake duration as in approval :</label>
                  <input v-model="form.approvalDetails.mqaFirstIntakeDuration" type="text" class="pi-input" :class="fieldError('mqaFirstIntakeDuration')" placeholder="please input" />
                </div>
              </div>

              <h3 class="section-title section-title-spaced"><span class="section-bar"></span>MOHE Info</h3>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> MOHE Code:</label>
                  <input v-model="form.approvalDetails.moheCode" type="text" class="pi-input" :class="fieldError('moheCode')" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> MOHE Approval Reference No.:</label>
                  <input v-model="form.approvalDetails.moheApprovalReferenceNo" type="text" class="pi-input" :class="fieldError('moheApprovalReferenceNo')" placeholder="please input" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Approval Date:</label>
                  <DatePickerEn v-model="form.approvalDetails.moheApprovalDate" placeholder="please select date" :has-error="!!errors.moheApprovalDate" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Start Date:</label>
                  <DatePickerEn v-model="form.approvalDetails.moheStartDate" placeholder="please select date" :has-error="!!errors.moheStartDate" />
                </div>
              </div>

              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Expiry Date:</label>
                  <DatePickerEn v-model="form.approvalDetails.moheExpiryDate" placeholder="please select date" :has-error="!!errors.moheExpiryDate" />
                </div>
                <div class="pi-field pi-field-empty"></div>
              </div>
            </div>
          </section>

          <!-- Step 2: Entry Requirements -->
          <section v-show="currentStep === 2" class="entry-requirements-section">
            <div class="programme-info-form">
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">MUET:</label>
                  <input v-model="form.entryRequirements.muet" type="text" class="pi-input" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">ELTS:</label>
                  <input v-model="form.entryRequirements.elts" type="text" class="pi-input" placeholder="please input" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">TOEFL IBT:</label>
                  <input v-model="form.entryRequirements.toeflIbt" type="text" class="pi-input" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">TOEFL Essentials (Online):</label>
                  <input v-model="form.entryRequirements.toeflEssentials" type="text" class="pi-input" placeholder="please input" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">PEARSON TEST OF ENGLISH:</label>
                  <input v-model="form.entryRequirements.pearsonTestOfEnglish" type="text" class="pi-input" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">CAMBRIDGE ENGLISH(i/ii):</label>
                  <input v-model="form.entryRequirements.cambridgeEnglishIi" type="text" class="pi-input" placeholder="please input" />
                </div>
              </div>
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label">CAMBRIDGE ENGLISH(iii):</label>
                  <input v-model="form.entryRequirements.cambridgeEnglishIii" type="text" class="pi-input" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label">ELS:</label>
                  <input v-model="form.entryRequirements.els" type="text" class="pi-input" placeholder="please input" />
                </div>
              </div>
            </div>
          </section>

          <!-- Step 3: Threshold Marks -->
          <section v-show="currentStep === 3" class="threshold-marks-section">
            <div class="programme-info-form">
              <div class="threshold-table-wrap">
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
                      <td>
                        <input v-model="form.thresholdMarks.totalContinuousAssessment" type="text" class="threshold-input" placeholder="please input" />
                      </td>
                      <td>
                        <input v-model="form.thresholdMarks.totalFinalAssessment" type="text" class="threshold-input" placeholder="please input" />
                      </td>
                      <td>
                        <input v-model="form.thresholdMarks.overallScore" type="text" class="threshold-input" placeholder="please input" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Step 4: Fee Structure -->
          <section v-show="currentStep === 4" class="fee-structure-section">
            <div class="programme-info-form fee-structure-form">
              <div class="pi-row">
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Duration (Min. Year):</label>
                  <input v-model="form.feeStructure.durationMinYear" type="text" class="pi-input" :class="fieldError('durationMinYear')" placeholder="please input" />
                </div>
                <div class="pi-field">
                  <label class="pi-label"><span class="required">*</span> Type of Approval:</label>
                  <select v-model="form.feeStructure.typeOfApproval" class="pi-input pi-select" :class="fieldError('typeOfApproval')">
                    <option value="">please select</option>
                    <option v-for="opt in typeOfApprovalOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>

              <h3 class="section-title section-title-spaced"><span class="section-bar"></span>Local Student (RM)</h3>
              <div class="fee-table-wrap">
                <table class="fee-table">
                  <thead>
                    <tr>
                      <th v-for="col in localFeeColumns" :key="`local-head-${col.key}`">{{ col.label }}</th>
                      <th class="col-check-total">Check Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="col in localFeeColumns" :key="`local-${col.key}`">
                        <input v-model="form.feeStructure.localStudent[col.key]" type="text" class="fee-input" placeholder="please input" />
                      </td>
                      <td class="col-check-total">
                        <label class="tf-switch" :class="{ on: form.feeStructure.localStudent.checkTotal }">
                          <input v-model="form.feeStructure.localStudent.checkTotal" type="checkbox" class="tf-switch-input" />
                          <span class="tf-switch-track">
                            <span class="tf-switch-letter tf-switch-letter-t">T</span>
                            <span class="tf-switch-knob"></span>
                            <span class="tf-switch-letter tf-switch-letter-f">F</span>
                          </span>
                        </label>
                      </td>
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
                      <th class="col-check-total">Check Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="col in internationalFeeColumns" :key="`intl-${col.key}`">
                        <input v-model="form.feeStructure.internationalStudent[col.key]" type="text" class="fee-input" placeholder="please input" />
                      </td>
                      <td class="col-check-total">
                        <label class="tf-switch" :class="{ on: form.feeStructure.internationalStudent.checkTotal }">
                          <input v-model="form.feeStructure.internationalStudent.checkTotal" type="checkbox" class="tf-switch-input" />
                          <span class="tf-switch-track">
                            <span class="tf-switch-letter tf-switch-letter-t">T</span>
                            <span class="tf-switch-knob"></span>
                            <span class="tf-switch-letter tf-switch-letter-f">F</span>
                          </span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">Cancel</button>
          <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">Previous</button>
          <button v-if="currentStep < createVersionFormSteps.length" type="button" class="btn btn-primary" @click="handleNext">Next</button>
          <button v-else type="button" class="btn btn-primary" @click="handleSubmit">Confirm</button>
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
  padding: 0 var(--modal-pad-x) 8px;
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

.programme-info-form {
  --pi-label-left: clamp(148px, 24%, 240px);
  --pi-label-right: clamp(148px, 24%, 240px);
  --pi-row-gap: 14px;
  --pi-field-gap: clamp(8px, 1.2vw, 12px);
  --pi-col-gap: clamp(16px, 4vw, 48px);
  min-width: 0;
  width: 100%;
}

.programme-info-form .pi-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pi-row-gap) var(--pi-col-gap);
  margin-bottom: var(--pi-row-gap);
}

.programme-info-form .pi-field {
  display: grid;
  grid-template-columns: var(--pi-label-left) 1fr;
  align-items: center;
  gap: var(--pi-field-gap);
  min-width: 0;
}

.programme-info-form .pi-field-empty {
  visibility: hidden;
}

.pi-label {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.pi-input {
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.pi-input.error {
  border-color: #ef4444;
}

.pi-input::placeholder {
  color: #9ca3af;
}

.pi-select {
  appearance: auto;
}

.approval-details-form .pi-field :deep(.date-picker-en) {
  width: 100%;
  min-width: 0;
}

.threshold-table-wrap {
  min-width: 0;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.threshold-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.threshold-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.threshold-table td {
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.threshold-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
}

.fee-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 4px;
}

.fee-table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  font-size: 12px;
}

.fee-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  line-height: 1.3;
}

.fee-table td {
  padding: 8px 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.fee-input {
  width: 100%;
  min-width: 72px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
}

.col-check-total {
  width: 96px;
  min-width: 96px;
  text-align: center;
}

.tf-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tf-switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.tf-switch-track {
  position: relative;
  width: 54px;
  height: 26px;
  background: #cbd5e1;
  border-radius: 999px;
  flex-shrink: 0;
}

.tf-switch.on .tf-switch-track {
  background: #2563eb;
}

.tf-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
  transition: left 0.2s ease;
  z-index: 2;
}

.tf-switch.on .tf-switch-knob {
  left: calc(100% - 24px);
}

.tf-switch-letter {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  z-index: 1;
}

.tf-switch-letter-t {
  left: 9px;
}

.tf-switch-letter-f {
  right: 9px;
}

.tf-switch:not(.on) .tf-switch-letter-t {
  opacity: 0;
}

.tf-switch.on .tf-switch-letter-f {
  opacity: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px var(--modal-pad-x);
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
