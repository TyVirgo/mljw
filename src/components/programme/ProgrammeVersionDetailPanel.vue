<script setup>
import { ref, computed } from 'vue'
import {
  createFormSteps,
  getDepartmentLabel,
  localFeeColumns,
  internationalFeeColumns,
} from '../../data/programmeVersions.js'

const props = defineProps({
  programme: {
    type: Object,
    required: true,
  },
  version: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['back'])

const currentStep = ref(1)

const form = computed(() => props.version.formData || {})

const info = computed(() => form.value.programmeInfo || {})
const approval = computed(() => form.value.approvalDetails || {})
const entry = computed(() => form.value.entryRequirements || {})
const threshold = computed(() => form.value.thresholdMarks || {})
const fee = computed(() => form.value.feeStructure || {})
const attachments = computed(() => form.value.attachments || [])

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function goToStep(stepId) {
  currentStep.value = stepId
}

function stepClass(stepId) {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

function getFileIconType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['doc', 'docx'].includes(ext)) return 'word'
  return 'file'
}
</script>

<template>
  <div class="detail-panel">
    <div class="detail-header">
      <button type="button" class="back-btn" aria-label="Back" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h2 class="detail-title">{{ programme.name }}</h2>
      <span class="version-tag" :class="version.isCurrent ? 'current' : 'history'">
        {{ version.isCurrent ? 'Current Version' : 'Historical Version' }}
      </span>
    </div>

    <div class="stepper">
      <template v-for="(step, index) in createFormSteps" :key="step.id">
        <button type="button" class="step-item" :class="stepClass(step.id)" @click="goToStep(step.id)">
          <span class="step-circle">{{ step.id }}</span>
          <span class="step-label">{{ step.title }}</span>
        </button>
        <div v-if="index < createFormSteps.length - 1" class="step-line" :class="{ completed: step.id < currentStep }" />
      </template>
    </div>

    <div class="detail-body">
      <!-- Step 1 -->
      <section v-show="currentStep === 1">
        <h3 class="section-title"><span class="section-bar"></span>Programme Info</h3>
        <div class="detail-grid">
          <div class="detail-row detail-row-full">
            <span class="detail-label">Programme Name:</span>
            <span class="detail-value">{{ display(info.programmeName) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Programme Code:</span>
            <span class="detail-value">{{ display(info.programmeCode) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">National Education Code (NEC):</span>
            <span class="detail-value">{{ display(info.nec) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ID Code:</span>
            <span class="detail-value">{{ display(info.idCode) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Years:</span>
            <span class="detail-value">{{ display(info.years) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Study Duration for Chinese Students:</span>
            <span class="detail-value">{{ display(info.studyDurationChinese) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Level:</span>
            <span class="detail-value">{{ display(info.level) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Level of Study:</span>
            <span class="detail-value">{{ display(info.levelOfStudy) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type of Programme:</span>
            <span class="detail-value">{{ display(info.typeOfProgramme) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Field of Study:</span>
            <span class="detail-value">{{ display(info.fieldOfStudy) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mode of Study:</span>
            <span class="detail-value">{{ display(info.modeOfStudy) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Method of Learning and Teaching:</span>
            <span class="detail-value">{{ display(info.methodOfLearning) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Method of Delivery:</span>
            <span class="detail-value">{{ display(info.methodOfDelivery) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Medium of Instruction:</span>
            <span class="detail-value">{{ display(info.mediumOfInstruction) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mode of Offer:</span>
            <span class="detail-value">{{ display(info.modeOfOffer) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Awarding body:</span>
            <span class="detail-value">{{ display(info.awardingBody) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Department:</span>
            <span class="detail-value">{{ getDepartmentLabel(info.department) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Prog. Commence:</span>
            <span class="detail-value">{{ display(info.progCommence) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Advertisement Code:</span>
            <span class="detail-value">{{ display(info.advertisementCode) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Acc. Status:</span>
            <span class="detail-value">{{ display(info.accStatus) }}</span>
          </div>
        </div>

        <div class="semester-block">
          <p class="semester-label">No. of weeks and semester:</p>
          <table class="semester-table">
            <thead>
              <tr>
                <th colspan="2">Long Semester</th>
                <th colspan="2">Short Semester</th>
                <th colspan="2">Industrial Training</th>
              </tr>
              <tr>
                <th>No. of weeks</th>
                <th>No. of semester</th>
                <th>No. of weeks</th>
                <th>No. of semester</th>
                <th>No. of weeks</th>
                <th>No. of semester</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ display(info.longSemesterWeeks) }}</td>
                <td>{{ display(info.longSemesterCount) }}</td>
                <td>{{ display(info.shortSemesterWeeks) }}</td>
                <td>{{ display(info.shortSemesterCount) }}</td>
                <td>{{ display(info.industrialTrainingWeeks) }}</td>
                <td>{{ display(info.industrialTrainingCount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="attachments.length" class="attachments-block">
          <p class="attachments-label">Attachments:</p>
          <div
            v-for="item in attachments"
            :key="item.id"
            class="attachment-card"
          >
            <div class="attachment-head">
              <div class="file-icon" :class="`file-icon-${getFileIconType(item.fileName)}`">
                <span v-if="getFileIconType(item.fileName) === 'word'" class="file-icon-letter">W</span>
              </div>
              <div class="attachment-meta">
                <p class="attachment-name">{{ item.fileName }}</p>
                <p class="attachment-info">
                  <span>{{ item.fileSizeLabel || '--' }}</span>
                  <span>Uploaded at: {{ item.uploadedAt || '--' }}</span>
                </p>
              </div>
            </div>
            <p v-if="item.description" class="attachment-desc">{{ item.description }}</p>
          </div>
        </div>
      </section>

      <!-- Step 2 -->
      <section v-show="currentStep === 2">
        <h3 class="section-title"><span class="section-bar"></span>MQA Info</h3>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">MQA Code:</span>
            <span class="detail-value">{{ display(approval.mqaCode) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start Date:</span>
            <span class="detail-value">{{ display(approval.mqaStartDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expiry Date:</span>
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
            <span class="detail-label">First intake duration as in approval :</span>
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
            <span class="detail-label">Approval Date:</span>
            <span class="detail-value">{{ display(approval.moheApprovalDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start Date:</span>
            <span class="detail-value">{{ display(approval.moheStartDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expiry Date:</span>
            <span class="detail-value">{{ display(approval.moheExpiryDate) }}</span>
          </div>
        </div>
      </section>

      <!-- Step 3 -->
      <section v-show="currentStep === 3">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">MUET:</span>
            <span class="detail-value">{{ display(entry.muet) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ELTS:</span>
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

      <!-- Step 4 -->
      <section v-show="currentStep === 4">
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

      <!-- Step 5 -->
      <section v-show="currentStep === 5">
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
                <th class="col-check-total">Check Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td v-for="col in localFeeColumns" :key="`local-${col.key}`">
                  {{ display(fee.localStudent?.[col.key]) }}
                </td>
                <td class="col-check-total">
                  <span class="tf-switch readonly" :class="{ on: fee.localStudent?.checkTotal }">
                    <span class="tf-switch-track">
                      <span class="tf-switch-letter tf-switch-letter-t">T</span>
                      <span class="tf-switch-knob"></span>
                      <span class="tf-switch-letter tf-switch-letter-f">F</span>
                    </span>
                  </span>
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
                  {{ display(fee.internationalStudent?.[col.key]) }}
                </td>
                <td class="col-check-total">
                  <span class="tf-switch readonly" :class="{ on: fee.internationalStudent?.checkTotal }">
                    <span class="tf-switch-track">
                      <span class="tf-switch-letter tf-switch-letter-t">T</span>
                      <span class="tf-switch-knob"></span>
                      <span class="tf-switch-letter tf-switch-letter-f">F</span>
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 4px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #374151;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f3f4f6;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.version-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.version-tag.current {
  background: #eff6ff;
  color: #2563eb;
}

.version-tag.history {
  background: #f3f4f6;
  color: #6b7280;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 8px 0 20px;
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
  max-width: 96px;
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
  max-width: 64px;
  min-width: 24px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px 24px;
}

.step-line.completed {
  background: #2563eb;
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 16px;
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
  width: 3px;
  height: 14px;
  background: #2563eb;
  border-radius: 2px;
  flex-shrink: 0;
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

.detail-row-full {
  grid-column: 1 / -1;
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

.semester-block,
.attachments-block {
  margin-top: 24px;
}

.semester-label,
.attachments-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.semester-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.semester-table th,
.semester-table td {
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  text-align: center;
}

.semester-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}

.semester-table td {
  color: #111827;
}

.attachment-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.attachment-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon-word {
  background: #2563eb;
}

.file-icon-letter {
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.attachment-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.attachment-info {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.attachment-desc {
  margin-top: 12px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
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

.tf-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tf-switch.readonly {
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
  user-select: none;
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
</style>
