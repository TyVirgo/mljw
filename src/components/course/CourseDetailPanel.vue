<script setup>
import { ref, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseSLTStepPanel from './CourseSLTStepPanel.vue'
import TablePagination from '../common/TablePagination.vue'
import {
  courseDetailSteps,
  getOfferingLabel,
  formatMethodList,
} from '../../data/courses.js'
import { initialDepartments } from '../../data/departments.js'

const props = defineProps({
  course: { type: Object, required: true },
})

const emit = defineEmits(['back'])

const { t, tr } = useAppI18n()

const currentStep = ref(1)
const cloPage = ref(1)
const cloPageSize = ref(10)
const changePage = ref(1)
const changePageSize = ref(10)

const isLastStep = computed(() => currentStep.value === courseDetailSteps.length)

const paginatedCLOs = computed(() => {
  const list = props.course.clos || []
  const start = (cloPage.value - 1) * cloPageSize.value
  return list.slice(start, start + cloPageSize.value)
})

const paginatedChanges = computed(() => {
  const list = props.course.changeRecords || []
  const start = (changePage.value - 1) * changePageSize.value
  return list.slice(start, start + changePageSize.value)
})

function stepClass(stepId) {
  if (stepId === currentStep.value) return 'active'
  if (stepId < currentStep.value) return 'completed'
  return ''
}

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function getRowNumber(index, page, pageSize) {
  return (page - 1) * pageSize + index + 1
}

function handleBack() {
  emit('back')
}

function handlePrevious() {
  if (currentStep.value > 1) currentStep.value -= 1
}

function handleNext() {
  if (currentStep.value < courseDetailSteps.length) currentStep.value += 1
}

function handleExport() {
  window.alert(tr('Export is not available in the demo yet.'))
}
</script>

<template>
  <div class="course-detail-panel">
    <div class="panel-top">
      <button type="button" class="back-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ t('common.back') }}
      </button>

      <div class="panel-actions">
        <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="handlePrevious">
          {{ tr('Previous') }}
        </button>
        <button v-if="!isLastStep" type="button" class="btn btn-default" @click="handleNext">
          {{ tr('Next') }}
        </button>
        <button type="button" class="btn btn-primary" @click="handleExport">{{ t('common.export') }}</button>
      </div>
    </div>

    <h1 class="course-title">{{ course.courseName }}</h1>

    <div class="stepper">
      <template v-for="(step, index) in courseDetailSteps" :key="step.id">
        <div class="step-item" :class="stepClass(step.id)">
          <span class="step-circle">{{ step.id }}</span>
          <span class="step-label">{{ tr(step.title) }}</span>
        </div>
        <div v-if="index < courseDetailSteps.length - 1" class="step-line" :class="{ completed: step.id < currentStep }" />
      </template>
    </div>

    <div class="panel-body">
      <!-- Step 1: General Information -->
      <section v-show="currentStep === 1" class="step-section">
        <div class="detail-grid">
          <div class="detail-col">
            <div class="detail-row">
              <span class="detail-label">{{ tr('Course Code:') }}</span>
              <span class="detail-value">{{ display(course.courseCode) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Offering Unit:') }}</span>
              <span class="detail-value">{{ getOfferingLabel(course.offering, initialDepartments) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Course Classification:') }}</span>
              <span class="detail-value">
                {{ course.courseClassification ? tr(course.courseClassification) : '--' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Medium of Instruction:') }}</span>
              <span class="detail-value">
                {{ course.mediumOfInstruction ? tr(course.mediumOfInstruction) : '--' }}
              </span>
            </div>
          </div>

          <div class="detail-col">
            <div class="detail-row">
              <span class="detail-label">{{ tr('Course Name:') }}</span>
              <span class="detail-value">{{ display(course.courseName) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Course Owner:') }}</span>
              <span class="detail-value">{{ display(course.courseOwnerDisplay) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Credit:') }}</span>
              <span class="detail-value">{{ display(course.credit) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ tr('Semester Type:') }}</span>
              <span class="detail-value">{{ course.semesterType ? tr(course.semesterType) : '--' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-block">
          <span class="detail-label">{{ tr('Pre-requisite / co-requisite:') }}</span>
          <span class="detail-value">{{ display(course.prerequisite) }}</span>
        </div>

        <div class="detail-block">
          <span class="detail-label">{{ tr('Synopsis:') }}</span>
          <p class="detail-text">{{ display(course.synopsis) }}</p>
        </div>

        <div class="detail-block">
          <span class="detail-label ref-label">
            {{ tr('References:') }}
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <div v-if="course.requiredReferences || course.furtherReadings" class="ref-sections">
            <div v-if="course.requiredReferences" class="ref-group">
              <h4 class="ref-subtitle">{{ tr('Required References') }}</h4>
              <p class="detail-text">{{ course.requiredReferences }}</p>
            </div>
            <div v-if="course.furtherReadings" class="ref-group">
              <h4 class="ref-subtitle">{{ tr('Further Readings') }}</h4>
              <p class="detail-text">{{ course.furtherReadings }}</p>
            </div>
          </div>
          <p v-else class="detail-text">{{ display(course.references) }}</p>
        </div>
      </section>

      <!-- Step 2: CLO -->
      <section v-show="currentStep === 2" class="step-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('common.serialNo') }}</th>
                <th>{{ tr('CLO') }}</th>
                <th>{{ tr('Outcome') }}</th>
                <th>{{ tr("Bloom's Taxonomy Level") }}</th>
                <th>{{ tr('Teaching Methods') }}</th>
                <th>{{ tr('Assessment Methods') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!course.clos?.length">
                <td colspan="6" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="(item, index) in paginatedCLOs" :key="item.id">
                <td>{{ getRowNumber(index, cloPage, cloPageSize) }}</td>
                <td>{{ item.cloCode }}</td>
                <td class="col-outcome">{{ item.outcome }}</td>
                <td>{{ item.bloomLevel }}</td>
                <td>{{ formatMethodList(item.teachingMethods, tr) }}</td>
                <td>{{ formatMethodList(item.assessmentMethods, tr) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-if="course.clos?.length"
          v-model="cloPage"
          v-model:page-size="cloPageSize"
          :total="course.clos.length"
        />
      </section>

      <!-- Step 3: SLT -->
      <section v-show="currentStep === 3" class="step-section step-section-slt">
        <CourseSLTStepPanel :slt="course.slt" :clos="course.clos || []" readonly />
      </section>

      <!-- Step 4: Change Records -->
      <section v-show="currentStep === 4" class="step-section">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ tr('Modified Date and Time') }}</th>
                <th>{{ tr('Modified by') }}</th>
                <th>{{ tr('Modification Details') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!course.changeRecords?.length">
                <td colspan="3" class="empty-cell">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="item in paginatedChanges" :key="item.id">
                <td>{{ item.modifiedAt }}</td>
                <td>{{ item.modifiedBy }}</td>
                <td>{{ tr(item.detail) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-if="course.changeRecords?.length"
          v-model="changePage"
          v-model:page-size="changePageSize"
          :total="course.changeRecords.length"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.course-detail-panel {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  box-sizing: border-box;
  background: #fff;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  padding: 0;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.course-title {
  margin: 12px 0 0;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  flex-shrink: 0;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 0 20px;
  flex-shrink: 0;
  gap: 4px 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
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
  text-align: center;
  max-width: 120px;
  line-height: 1.3;
}

.step-item.active .step-circle {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 600;
}

.step-item.completed .step-circle {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.step-item.completed .step-label {
  color: #2563eb;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px 20px;
}

.step-line.completed {
  background: #2563eb;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 20px 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;
}

.detail-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  align-items: start;
}

.detail-block {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
}

.ref-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  width: 14px;
  height: 14px;
  color: #9ca3af;
}

.detail-value {
  font-size: 13px;
  color: #111827;
  word-break: break-word;
}

.detail-text {
  margin: 0;
  font-size: 13px;
  color: #111827;
  line-height: 1.6;
  white-space: pre-line;
}

.ref-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ref-subtitle {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
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
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
}

.col-outcome {
  max-width: 320px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

.step-section-slt {
  padding: 0;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}
</style>
