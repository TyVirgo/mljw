<script setup>
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import TablePagination from '../common/TablePagination.vue'
import {
  programmeCatalogue,
  programmeIntakeSchools,
  getActiveIntakeOptions,
  startingSemesterOptions,
  validateProgrammeIntakeCreateForm,
  buildProgrammeIntakeRecords,
} from '../../data/programmeIntakes.js'

const props = defineProps({
  visible: Boolean,
  allItems: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()

const schoolId = ref('')
const programmeCodeFilter = ref('')
const selectedProgrammeIds = ref([])
const intake = ref('')
const startingSemester = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const errors = ref({})

const activeIntakeOptions = getActiveIntakeOptions()

const filteredProgrammes = computed(() => {
  if (!schoolId.value) return []
  const keyword = programmeCodeFilter.value.trim().toLowerCase()
  return programmeCatalogue.filter((item) => {
    if (item.schoolId !== schoolId.value) return false
    if (!keyword) return true
    return item.programmeCode.toLowerCase().includes(keyword)
  })
})

const totalCount = computed(() => filteredProgrammes.value.length)

const paginatedProgrammes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProgrammes.value.slice(start, start + pageSize.value)
})

const allPageSelected = computed(() => {
  if (!paginatedProgrammes.value.length) return false
  return paginatedProgrammes.value.every((item) => selectedProgrammeIds.value.includes(item.id))
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    schoolId.value = ''
    programmeCodeFilter.value = ''
    selectedProgrammeIds.value = []
    intake.value = ''
    startingSemester.value = ''
    currentPage.value = 1
    pageSize.value = 10
    errors.value = {}
  },
)

watch(schoolId, () => {
  selectedProgrammeIds.value = []
  currentPage.value = 1
})

watch([programmeCodeFilter, pageSize], () => {
  currentPage.value = 1
})

function toggleSelectAll(event) {
  const pageIds = paginatedProgrammes.value.map((item) => item.id)
  if (event.target.checked) {
    selectedProgrammeIds.value = [...new Set([...selectedProgrammeIds.value, ...pageIds])]
  } else {
    selectedProgrammeIds.value = selectedProgrammeIds.value.filter((id) => !pageIds.includes(id))
  }
}

function toggleSelect(id) {
  if (selectedProgrammeIds.value.includes(id)) {
    selectedProgrammeIds.value = selectedProgrammeIds.value.filter((item) => item !== id)
  } else {
    selectedProgrammeIds.value = [...selectedProgrammeIds.value, id]
  }
}

function getRowNumber(index) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function handleConfirm() {
  const validationErrors = validateProgrammeIntakeCreateForm({
    schoolId: schoolId.value,
    programmeCodeFilter: programmeCodeFilter.value,
    selectedProgrammeIds: selectedProgrammeIds.value,
    intake: intake.value,
    startingSemester: startingSemester.value,
  })
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) return

  const selectedProgrammes = programmeCatalogue.filter((item) => selectedProgrammeIds.value.includes(item.id))
  const { records, duplicates } = buildProgrammeIntakeRecords(
    selectedProgrammes,
    intake.value,
    startingSemester.value,
    props.allItems,
  )

  if (!records.length) {
    errors.value = {
      programmes: duplicates.length
        ? tr(`All selected records already exist: ${duplicates.join(', ')}`)
        : tr('No programme records can be created'),
    }
    return
  }

  if (duplicates.length) {
    window.alert(tr(`Skipped duplicate Programme Intake code(s): ${duplicates.join(', ')}`))
  }

  emit('confirm', records)
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
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('modal.newProgrammeIntake') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div class="filter-row">
            <div class="filter-item">
              <label><span class="required">*</span> School:</label>
              <select v-model="schoolId" class="filter-input" :class="{ error: errors.schoolId, 'is-empty': !schoolId }">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="school in programmeIntakeSchools" :key="school.id" :value="school.id">
                  {{ tr(school.label) }}
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label>Programme:</label>
              <input
                v-model="programmeCodeFilter"
                type="text"
                class="filter-input"
                :class="{ error: errors.programmeCodeFilter }"
                maxlength="20"
                :placeholder="t('common.pleaseInput')"
              />
            </div>
          </div>
          <p v-if="errors.schoolId" class="inline-error">{{ errors.schoolId }}</p>
          <p v-if="errors.programmeCodeFilter" class="inline-error">{{ errors.programmeCodeFilter }}</p>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :disabled="!paginatedProgrammes.length"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>No.</th>
                  <th>Programme Code</th>
                  <th>Programme</th>
                  <th>Years</th>
                  <th>School</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!schoolId">
                  <td colspan="6" class="empty-cell">Please select a school to load programmes</td>
                </tr>
                <tr v-else-if="!paginatedProgrammes.length">
                  <td colspan="6" class="empty-cell">No programme found</td>
                </tr>
                <tr v-for="(item, index) in paginatedProgrammes" :key="item.id">
                  <td class="col-check">
                    <input
                      type="checkbox"
                      :checked="selectedProgrammeIds.includes(item.id)"
                      @change="toggleSelect(item.id)"
                    />
                  </td>
                  <td>{{ getRowNumber(index) }}</td>
                  <td>{{ item.programmeCode }}</td>
                  <td>{{ item.programmeName }}</td>
                  <td>{{ item.years }}</td>
                  <td>{{ item.school }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="errors.programmes" class="inline-error table-error">{{ errors.programmes }}</p>

          <TablePagination
            :total="totalCount"
            v-model="currentPage"
            v-model:page-size="pageSize"
          />

          <div class="bottom-form">
            <div class="bottom-form-fields">
              <div class="form-field">
                <label class="form-label"><span class="required">*</span> Intake:</label>
                <div class="form-field-control">
                  <select v-model="intake" class="form-input" :class="{ error: errors.intake, 'is-empty': !intake }">
                    <option value="">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="opt in activeIntakeOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <p v-if="errors.intake" class="field-error">{{ errors.intake }}</p>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label"><span class="required">*</span> {{ tr('Starting Academic Session:') }}</label>
                <div class="form-field-control">
                  <select
                    v-model="startingSemester"
                    class="form-input"
                    :class="{ error: errors.startingSemester, 'is-empty': !startingSemester }"
                  >
                    <option value="">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="opt in startingSemesterOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <p v-if="errors.startingSemester" class="field-error">{{ errors.startingSemester }}</p>
                  <p class="form-note">{{ t('modal.intakeFormNote') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ t('common.confirm') }}</button>
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
  width: 100%;
  max-width: 920px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
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
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.filter-input {
  width: 220px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}

.filter-input.is-empty {
  color: #9ca3af;
}

.filter-input.error,
.form-input.error {
  border-color: #ef4444;
}

.table-wrap {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  overflow: auto;
  max-height: 280px;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-check {
  width: 48px;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 32px !important;
}

.inline-error {
  margin: 0 0 8px;
  font-size: 12px;
  color: #ef4444;
}

.table-error {
  margin-top: 8px;
}

.bottom-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.bottom-form-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
}

.form-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 320px;
}

.form-field .form-label {
  width: auto;
  padding-top: 7px;
  line-height: 18px;
}

.form-field-control {
  flex: 1;
  min-width: 0;
  max-width: 240px;
}

.form-field .form-input {
  width: 100%;
}

.form-field .field-error {
  margin: 4px 0 0;
}

.form-field .form-note {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.form-label {
  width: 180px;
  flex-shrink: 0;
  font-size: 13px;
  color: #374151;
  text-align: right;
  white-space: nowrap;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input {
  width: 280px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #fff;
}

.form-input.is-empty {
  color: #9ca3af;
}

.field-error {
  margin: 0 0 10px 192px;
  font-size: 12px;
  color: #ef4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
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

.btn-primary {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
