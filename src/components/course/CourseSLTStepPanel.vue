<script setup>
import { ref, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import CourseOutlineFormModal from './CourseOutlineFormModal.vue'
import CourseAssessmentFormModal from './CourseAssessmentFormModal.vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import {
  sltHourKeys,
  computeSLTStats,
  sumOutlineColumnTotals,
  sumAssessmentColumnTotals,
  sumOutlineRowSLT,
  sumSimpleAssessmentSLT,
  createOutlineId,
  createContinuousAssessmentId,
  createFinalAssessmentId,
} from '../../data/courses.js'

const props = defineProps({
  slt: { type: Object, required: true },
  clos: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:slt'])

const { t, tr } = useAppI18n()

const sectionOpen = ref({
  outline: true,
  continuous: true,
  final: true,
})

const outlineModalVisible = ref(false)
const outlineModalMode = ref('create')
const editingOutline = ref(null)

const assessmentModalVisible = ref(false)
const assessmentModalKind = ref('continuous')
const assessmentModalMode = ref('create')
const editingAssessment = ref(null)

const deleteConfirmVisible = ref(false)
const deleteMessage = ref('')
const pendingDelete = ref(null)

const stats = computed(() => computeSLTStats(props.slt))
const outlineTotals = computed(() => sumOutlineColumnTotals(props.slt.contentOutlines))
const continuousTotals = computed(() => sumAssessmentColumnTotals(props.slt.continuousAssessments))
const finalTotals = computed(() => sumAssessmentColumnTotals(props.slt.finalAssessments))

function updateSLT(next) {
  emit('update:slt', next)
}

function toggleSection(key) {
  sectionOpen.value[key] = !sectionOpen.value[key]
}

function handleImport(section) {
  window.alert(tr('Import is not available in the demo yet.') + ` (${section})`)
}

function openCreateOutline() {
  outlineModalMode.value = 'create'
  editingOutline.value = null
  outlineModalVisible.value = true
}

function openEditOutline(item) {
  outlineModalMode.value = 'edit'
  editingOutline.value = { ...item }
  outlineModalVisible.value = true
}

function handleOutlineSave(data) {
  const outlines = [...props.slt.contentOutlines]
  if (outlineModalMode.value === 'edit' && editingOutline.value) {
    const index = outlines.findIndex((item) => item.id === editingOutline.value.id)
    if (index !== -1) outlines[index] = { ...outlines[index], ...data }
  } else {
    outlines.push({ id: createOutlineId(outlines), ...data })
  }
  updateSLT({ ...props.slt, contentOutlines: outlines })
  outlineModalVisible.value = false
}

function openCreateAssessment(kind) {
  assessmentModalKind.value = kind
  assessmentModalMode.value = 'create'
  editingAssessment.value = null
  assessmentModalVisible.value = true
}

function openEditAssessment(kind, item) {
  assessmentModalKind.value = kind
  assessmentModalMode.value = 'edit'
  editingAssessment.value = { ...item }
  assessmentModalVisible.value = true
}

function handleAssessmentSave(data) {
  const key = assessmentModalKind.value === 'continuous' ? 'continuousAssessments' : 'finalAssessments'
  const list = [...props.slt[key]]
  const createId =
    assessmentModalKind.value === 'continuous' ? createContinuousAssessmentId : createFinalAssessmentId

  if (assessmentModalMode.value === 'edit' && editingAssessment.value) {
    const index = list.findIndex((item) => item.id === editingAssessment.value.id)
    if (index !== -1) list[index] = { ...list[index], ...data }
  } else {
    list.push({ id: createId(list), ...data })
  }
  updateSLT({ ...props.slt, [key]: list })
  assessmentModalVisible.value = false
}

function requestDelete(type, id) {
  pendingDelete.value = { type, id }
  deleteMessage.value = tr('Are you sure you want to delete this record?')
  deleteConfirmVisible.value = true
}

function confirmDelete() {
  if (!pendingDelete.value) return
  const { type, id } = pendingDelete.value
  if (type === 'outline') {
    updateSLT({
      ...props.slt,
      contentOutlines: props.slt.contentOutlines.filter((item) => item.id !== id),
    })
  } else if (type === 'continuous') {
    updateSLT({
      ...props.slt,
      continuousAssessments: props.slt.continuousAssessments.filter((item) => item.id !== id),
    })
  } else {
    updateSLT({
      ...props.slt,
      finalAssessments: props.slt.finalAssessments.filter((item) => item.id !== id),
    })
  }
  pendingDelete.value = null
  deleteConfirmVisible.value = false
}

function formatCLO(codes) {
  if (!codes?.length) return '--'
  return codes.join(',')
}

function hourCell(row, group, key) {
  return row[group]?.[key] ?? 0
}
</script>

<template>
  <section class="slt-step">
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">{{ tr('Total') }}</span>
        <strong class="stat-value">{{ stats.totalSLT }} SLT</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ tr('Assessment') }}</span>
        <strong class="stat-value">{{ stats.assessmentSLT }} SLT</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ tr('Online+Indep.') }}</span>
        <strong class="stat-value">{{ stats.onlineIndepPct }}%</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ tr('Physical') }}</span>
        <strong class="stat-value">{{ stats.physicalPct }}%</strong>
      </div>
      <span class="info-tip-wrap" tabindex="0" :aria-label="tr('SLT percentage calculation formulas')">
        <span class="info-icon" aria-hidden="true">i</span>
        <span class="info-tooltip">
          <p class="tooltip-item">
            <span class="tooltip-title">1. {{ tr('% SLT for F2F Physical Component:') }}</span>
            {{ tr('[Total F2F Physical / (Total F2F Physical + Total F2F Online + Total Independent Learning) x 100]') }}
          </p>
          <p class="tooltip-item">
            <span class="tooltip-title">2. {{ tr('% SLT for Online & Independent Learning Component:') }}</span>
            {{ tr('[(Total F2F Online + Total Independent Learning) / (Total F2F Physical + Total F2F Online + Total Independent Learning) x 100]') }}
          </p>
        </span>
      </span>
    </div>

    <!-- Outline section -->
    <div class="slt-section">
      <div class="section-header">
        <button type="button" class="collapse-btn" @click="toggleSection('outline')">
          <svg :class="{ up: sectionOpen.outline }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {{ tr('Course Content Outline and Subtopics') }}
        </button>
        <div class="section-actions">
          <template v-if="!readonly">
            <button type="button" class="btn btn-default" @click="handleImport('outline')">{{ t('common.import') }}</button>
            <button type="button" class="btn btn-primary" @click="openCreateOutline">{{ t('common.create') }}</button>
          </template>
        </div>
      </div>

      <div v-show="sectionOpen.outline" class="table-wrap">
        <table class="slt-table outline-table">
          <thead>
            <tr>
              <th rowspan="3" class="col-no">{{ t('common.serialNo') }}</th>
              <th rowspan="3" class="col-content">{{ tr('Course Content Outline and Subtopics') }}</th>
              <th rowspan="3" class="col-clo">{{ tr('CLO') }}</th>
              <th colspan="8">{{ tr('Face-to-Face (F2F)') }}</th>
              <th rowspan="3" class="col-nf2f">{{ tr('NF2F Independent Learning (Asynchronous)') }}</th>
              <th rowspan="3" class="col-total-slt">{{ tr('Total SLT') }}</th>
              <th v-if="!readonly" rowspan="3" class="col-actions">{{ t('common.actions') }}</th>
            </tr>
            <tr>
              <th colspan="4">{{ tr('Physical') }}</th>
              <th colspan="4">{{ tr('Online/Technology-mediated (Synchronous)') }}</th>
            </tr>
            <tr>
              <th v-for="key in sltHourKeys" :key="`ph-${key}`">{{ key }}</th>
              <th v-for="key in sltHourKeys" :key="`on-${key}`">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!slt.contentOutlines.length">
              <td :colspan="readonly ? 13 : 14" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
            <tr v-for="(row, index) in slt.contentOutlines" :key="row.id">
              <td>{{ index + 1 }}</td>
              <td class="col-content">{{ row.courseContent }}</td>
              <td>{{ formatCLO(row.cloCodes) }}</td>
              <td v-for="key in sltHourKeys" :key="`${row.id}-p-${key}`">{{ hourCell(row, 'physical', key) }}</td>
              <td v-for="key in sltHourKeys" :key="`${row.id}-o-${key}`">{{ hourCell(row, 'online', key) }}</td>
              <td>{{ row.nf2f }}</td>
              <td>{{ sumOutlineRowSLT(row) }}</td>
              <td v-if="!readonly" class="actions-cell">
                <button type="button" class="link-btn" @click="openEditOutline(row)">{{ t('common.edit') }}</button>
                <button type="button" class="link-btn delete" @click="requestDelete('outline', row.id)">{{ t('common.delete') }}</button>
              </td>
            </tr>
            <tr v-if="slt.contentOutlines.length" class="total-row">
              <td colspan="3">{{ tr('Total') }}</td>
              <td v-for="key in sltHourKeys" :key="`tp-${key}`">{{ outlineTotals.physical[key] }}</td>
              <td v-for="key in sltHourKeys" :key="`to-${key}`">{{ outlineTotals.online[key] }}</td>
              <td>{{ outlineTotals.nf2f }}</td>
              <td>{{ outlineTotals.rowTotal }}</td>
              <td v-if="!readonly"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Continuous Assessment -->
    <div class="slt-section">
      <div class="section-header">
        <button type="button" class="collapse-btn" @click="toggleSection('continuous')">
          <svg :class="{ up: sectionOpen.continuous }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {{ tr('Continuous Assessment') }}
        </button>
        <div class="section-actions">
          <template v-if="!readonly">
            <button type="button" class="btn btn-default" @click="handleImport('continuous')">{{ t('common.import') }}</button>
            <button type="button" class="btn btn-primary" @click="openCreateAssessment('continuous')">{{ t('common.create') }}</button>
          </template>
        </div>
      </div>

      <div v-show="sectionOpen.continuous" class="table-wrap">
        <table class="slt-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-no">{{ t('common.serialNo') }}</th>
              <th rowspan="2">{{ tr('Continuous Assessment') }}</th>
              <th rowspan="2" class="col-pct">%</th>
              <th colspan="2">{{ tr('Face-to-Face (F2F)') }}</th>
              <th rowspan="2">{{ tr('NF2F Independent Learning (Asynchronous)') }}</th>
              <th rowspan="2" class="col-total-slt">{{ tr('Total SLT') }}</th>
              <th v-if="!readonly" rowspan="2" class="col-actions">{{ t('common.actions') }}</th>
            </tr>
            <tr>
              <th>{{ tr('Physical') }}</th>
              <th>{{ tr('Online/Technology-mediated (Synchronous)') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!slt.continuousAssessments.length">
              <td :colspan="readonly ? 7 : 8" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
            <tr v-for="(row, index) in slt.continuousAssessments" :key="row.id">
              <td>{{ index + 1 }}</td>
              <td>{{ tr(row.assessmentType) }}</td>
              <td>{{ row.percentage }}</td>
              <td>{{ row.physical }}</td>
              <td>{{ row.online }}</td>
              <td>{{ row.nf2f }}</td>
              <td>{{ sumSimpleAssessmentSLT(row) }}</td>
              <td v-if="!readonly" class="actions-cell">
                <button type="button" class="link-btn" @click="openEditAssessment('continuous', row)">{{ t('common.edit') }}</button>
                <button type="button" class="link-btn delete" @click="requestDelete('continuous', row.id)">{{ t('common.delete') }}</button>
              </td>
            </tr>
            <tr v-if="slt.continuousAssessments.length" class="total-row">
              <td colspan="2">{{ tr('Total') }}</td>
              <td>{{ continuousTotals.percentage }}</td>
              <td>{{ continuousTotals.physical }}</td>
              <td>{{ continuousTotals.online }}</td>
              <td>{{ continuousTotals.nf2f }}</td>
              <td>{{ continuousTotals.slt }}</td>
              <td v-if="!readonly"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Final Assessment -->
    <div class="slt-section">
      <div class="section-header">
        <button type="button" class="collapse-btn" @click="toggleSection('final')">
          <svg :class="{ up: sectionOpen.final }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {{ tr('Final Assessment') }}
        </button>
        <div class="section-actions">
          <template v-if="!readonly">
            <button type="button" class="btn btn-default" @click="handleImport('final')">{{ t('common.import') }}</button>
            <button type="button" class="btn btn-primary" @click="openCreateAssessment('final')">{{ t('common.create') }}</button>
          </template>
        </div>
      </div>

      <div v-show="sectionOpen.final" class="table-wrap">
        <table class="slt-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-no">{{ t('common.serialNo') }}</th>
              <th rowspan="2">{{ tr('Final Assessment') }}</th>
              <th rowspan="2" class="col-pct">%</th>
              <th colspan="2">{{ tr('Face-to-Face (F2F)') }}</th>
              <th rowspan="2">{{ tr('NF2F Independent Learning (Asynchronous)') }}</th>
              <th rowspan="2" class="col-total-slt">{{ tr('Total SLT') }}</th>
              <th v-if="!readonly" rowspan="2" class="col-actions">{{ t('common.actions') }}</th>
            </tr>
            <tr>
              <th>{{ tr('Physical') }}</th>
              <th>{{ tr('Online/Technology-mediated (Synchronous)') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!slt.finalAssessments.length">
              <td :colspan="readonly ? 7 : 8" class="empty-cell">{{ t('common.noData') }}</td>
            </tr>
            <tr v-for="(row, index) in slt.finalAssessments" :key="row.id">
              <td>{{ index + 1 }}</td>
              <td>{{ tr(row.assessmentType) }}</td>
              <td>{{ row.percentage }}</td>
              <td>{{ row.physical }}</td>
              <td>{{ row.online }}</td>
              <td>{{ row.nf2f }}</td>
              <td>{{ sumSimpleAssessmentSLT(row) }}</td>
              <td v-if="!readonly" class="actions-cell">
                <button type="button" class="link-btn" @click="openEditAssessment('final', row)">{{ t('common.edit') }}</button>
                <button type="button" class="link-btn delete" @click="requestDelete('final', row.id)">{{ t('common.delete') }}</button>
              </td>
            </tr>
            <tr v-if="slt.finalAssessments.length" class="total-row">
              <td colspan="2">{{ tr('Total') }}</td>
              <td>{{ finalTotals.percentage }}</td>
              <td>{{ finalTotals.physical }}</td>
              <td>{{ finalTotals.online }}</td>
              <td>{{ finalTotals.nf2f }}</td>
              <td>{{ finalTotals.slt }}</td>
              <td v-if="!readonly"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CourseOutlineFormModal
      v-if="!readonly"
      :visible="outlineModalVisible"
      :mode="outlineModalMode"
      :initial-data="editingOutline"
      :clos="clos"
      @close="outlineModalVisible = false"
      @save="handleOutlineSave"
    />

    <CourseAssessmentFormModal
      v-if="!readonly"
      :visible="assessmentModalVisible"
      :kind="assessmentModalKind"
      :mode="assessmentModalMode"
      :initial-data="editingAssessment"
      @close="assessmentModalVisible = false"
      @save="handleAssessmentSave"
    />

    <ConfirmDialog
      v-if="!readonly"
      :visible="deleteConfirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="deleteMessage"
      :confirm-text="t('common.delete')"
      @confirm="confirmDelete"
      @cancel="deleteConfirmVisible = false"
    />
  </section>
</template>

<style scoped>
.slt-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.info-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  width: 18px;
  height: 18px;
  border: 1px solid #2563eb;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  cursor: help;
}

.info-tooltip {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: min(420px, calc(100vw - 48px));
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.55;
  font-weight: 400;
  color: #374151;
  text-align: left;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 10;
}

.tooltip-item {
  margin: 0;
}

.tooltip-item + .tooltip-item {
  margin-top: 10px;
}

.tooltip-title {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  color: #111827;
}

.info-tip-wrap:hover .info-tooltip,
.info-tip-wrap:focus-within .info-tooltip {
  opacity: 1;
  visibility: visible;
}

.stat-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  color: #2563eb;
  font-weight: 600;
}

.slt-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

.collapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  padding: 0;
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.collapse-btn svg.up {
  transform: rotate(180deg);
}

.section-actions {
  display: flex;
  gap: 8px;
}

.table-wrap {
  overflow: auto;
}

.slt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.slt-table th,
.slt-table td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
  vertical-align: middle;
}

.slt-table th {
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

.col-content {
  min-width: 220px;
  text-align: left;
  white-space: pre-line;
}

.col-no {
  width: 56px;
}

.col-clo {
  width: 72px;
}

.col-nf2f {
  min-width: 120px;
}

.col-pct {
  width: 56px;
}

.col-actions {
  min-width: 120px;
}

.total-row td {
  font-weight: 600;
  background: #fafafa;
}

.empty-cell {
  color: #9ca3af;
  padding: 32px !important;
}

.actions-cell {
  white-space: nowrap;
}

.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0 4px;
  border: none;
  background: none;
}

.link-btn.delete {
  color: #ef4444;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}
</style>
