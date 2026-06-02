<script setup>
import { ref, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseSLTStepPanel from './CourseSLTStepPanel.vue'
import CourseGeneralInfoDetail from './CourseGeneralInfoDetail.vue'
import CourseDetailStepper from './CourseDetailStepper.vue'
import TablePagination from '../common/TablePagination.vue'
import {
  courseDetailSteps,
  formatMethodList,
} from '../../data/courses.js'

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

    <CourseDetailStepper v-model="currentStep" :steps="courseDetailSteps" />

    <div class="panel-body">
      <!-- Step 1: General Information -->
      <section v-show="currentStep === 1" class="step-section">
        <CourseGeneralInfoDetail :data="course" />
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

.panel-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 24px 28px;
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
