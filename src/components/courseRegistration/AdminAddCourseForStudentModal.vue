<script setup>
/**
 * 学生维度「新增」代选：批次只读 + 选择课程班/学生按钮 → 选择器回填（可超额；学生可多选）
 */
import { ref, computed, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getBatchById } from '../../data/courseRegistration/registrationBatches.js'
import {
  listTargetCourseSectionOptions,
  addAdminStudentRegistrations,
} from '../../data/courseRegistration/registrationResult.js'
import AdminAddSectionPickModal from './AdminAddSectionPickModal.vue'
import AdminAddStudentPickModal from './AdminAddStudentPickModal.vue'

const props = defineProps({
  visible: Boolean,
  batchId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'success'])

const { t } = useAppI18n()

const selectedStudents = ref([])
const selectedSection = ref(null)
const sectionPickerOpen = ref(false)
const studentPickerOpen = ref(false)
const errorKey = ref('')

const sectionOptions = computed(() =>
  listTargetCourseSectionOptions('', {
    batchId: props.batchId || '',
    onlyAvailable: false,
  }),
)

const selectedSectionFull = computed(() => Boolean(selectedSection.value?.isFull))

const batchDisplayName = computed(() => {
  const id = String(props.batchId || '').trim()
  if (!id) return '—'
  const batch = getBatchById(id)
  return batch?.name || id
})

const sectionLabel = computed(() => selectedSection.value?.label || '')

function removeStudent(studentId) {
  selectedStudents.value = selectedStudents.value.filter((s) => s.studentId !== studentId)
  errorKey.value = ''
}

watch(
  () => [props.visible, props.batchId],
  ([visible]) => {
    if (!visible) return
    selectedStudents.value = []
    selectedSection.value = null
    sectionPickerOpen.value = false
    studentPickerOpen.value = false
    errorKey.value = ''
  },
)

watch(
  () => props.batchId,
  () => {
    selectedSection.value = null
  },
)

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}

function openSectionPicker() {
  if (!props.batchId || !sectionOptions.value.length) return
  sectionPickerOpen.value = true
}

function openStudentPicker() {
  studentPickerOpen.value = true
}

function onPickSection(row) {
  selectedSection.value = row
  errorKey.value = ''
}

function onPickStudents(rows) {
  selectedStudents.value = Array.isArray(rows) ? rows : []
  errorKey.value = ''
}

function handleConfirm() {
  errorKey.value = ''
  if (!selectedStudents.value.length) {
    errorKey.value = 'courseRegistration.result.addStudentRequired'
    return
  }
  if (!selectedSection.value?.value) {
    errorKey.value = 'courseRegistration.result.addSectionRequired'
    return
  }
  if (selectedSectionFull.value) {
    const opt = selectedSection.value
    const ok = window.confirm(
      t('courseRegistration.result.addOverCapacityConfirm', {
        section: opt?.label || opt?.value,
        enrolled: opt?.enrolled ?? '—',
        capacity: opt?.capacity || '—',
      }),
    )
    if (!ok) return
  }
  const result = addAdminStudentRegistrations({
    targetValue: selectedSection.value.value,
    studentIds: selectedStudents.value.map((s) => s.studentId),
    allowOverCapacity: true,
  })
  if (!result.ok) {
    errorKey.value = result.errorKey
    return
  }
  emit('success', result)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="add-reg-overlay" @click="handleOverlayClick">
      <div class="add-reg-panel" role="dialog" aria-modal="true">
        <div class="add-reg-header">
          <h2 class="add-reg-title">{{ t('courseRegistration.result.addCourseForStudentTitle') }}</h2>
          <button type="button" class="add-reg-close" :aria-label="t('common.close')" @click="emit('close')">
            ×
          </button>
        </div>

        <div class="add-reg-body">
          <div class="form-row">
            <label class="field-label">{{ t('courseRegistration.batch.name') }}</label>
            <div class="readonly-field" :title="batchDisplayName">{{ batchDisplayName }}</div>
          </div>

          <div class="form-row">
            <label class="field-label">
              {{ t('courseRegistration.result.targetSection') }}
              <span class="req">*</span>
            </label>
            <div class="field-control with-btn">
              <input
                type="text"
                class="form-input"
                readonly
                :value="sectionLabel"
                :placeholder="t('courseRegistration.result.pickSectionPlaceholder')"
              />
              <button
                type="button"
                class="btn btn-default"
                :disabled="!batchId || !sectionOptions.length"
                @click="openSectionPicker"
              >
                {{
                  sectionLabel
                    ? t('courseRegistration.result.changeSection')
                    : t('courseRegistration.result.pickSectionButton')
                }}
              </button>
            </div>
            <p v-if="batchId && !sectionOptions.length" class="field-hint">
              {{ t('courseRegistration.result.addNoSectionInBatch') }}
            </p>
            <p v-else-if="selectedSectionFull" class="field-hint field-hint--warn">
              {{ t('courseRegistration.result.addOverCapacityHint') }}
            </p>
          </div>

          <div class="form-row">
            <label class="field-label">
              {{ t('courseRegistration.result.pickStudentField') }}
              <span class="req">*</span>
            </label>
            <div class="field-control with-btn">
              <div
                class="tag-field"
                :class="{ 'tag-field--empty': !selectedStudents.length }"
                @click="openStudentPicker"
              >
                <template v-if="selectedStudents.length">
                  <span
                    v-for="stu in selectedStudents"
                    :key="stu.studentId"
                    class="tag-chip"
                    :title="`${stu.studentName}（${stu.studentId}）`"
                    @click.stop
                  >
                    <span class="tag-chip-text">{{ stu.studentName }}</span>
                    <button
                      type="button"
                      class="tag-chip-remove"
                      :aria-label="t('common.delete')"
                      @click.stop="removeStudent(stu.studentId)"
                    >
                      ×
                    </button>
                  </span>
                </template>
                <span v-else class="tag-placeholder">
                  {{ t('courseRegistration.result.pickStudentPlaceholder') }}
                </span>
              </div>
              <button type="button" class="btn btn-default" @click="openStudentPicker">
                {{
                  selectedStudents.length
                    ? t('courseRegistration.result.changeStudent')
                    : t('courseRegistration.result.pickStudentButton')
                }}
              </button>
            </div>
          </div>

          <p v-if="errorKey" class="field-error">{{ t(errorKey) }}</p>
        </div>

        <div class="add-reg-footer">
          <button type="button" class="btn btn-default" @click="emit('close')">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <AdminAddSectionPickModal
    :visible="sectionPickerOpen"
    :batch-id="batchId"
    @close="sectionPickerOpen = false"
    @select="onPickSection"
  />
  <AdminAddStudentPickModal
    :visible="studentPickerOpen"
    :initial-selected="selectedStudents"
    @close="studentPickerOpen = false"
    @select="onPickStudents"
  />
</template>

<style scoped>
.add-reg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 24px;
}

.add-reg-panel {
  width: min(560px, 96vw);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.add-reg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.add-reg-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.add-reg-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}

.add-reg-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.readonly-field {
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-control.with-btn {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #111827;
}

.form-input[readonly] {
  background: #f9fafb;
  cursor: default;
}

.tag-field {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;
}

.tag-field--empty {
  align-items: center;
}

.tag-placeholder {
  font-size: 13px;
  color: #9ca3af;
  line-height: 24px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  height: 24px;
  padding: 0 4px 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f3f4f6;
  font-size: 12px;
  color: #374151;
  line-height: 1;
}

.tag-chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-chip-remove {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.tag-chip-remove:hover {
  color: #111827;
  background: #e5e7eb;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.field-hint--warn {
  color: #b45309;
}

.field-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

.add-reg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
