<script setup>
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import MeQuotaRowsEditor from './MeQuotaRowsEditor.vue'
import { getBatchRound1Quota, syncMeQuotaRowCounts } from '../../data/courseRegistration/batchRound1Quota.js'
import { listBatchRosterStudents } from '../../data/courseRegistration/batchStudentRoster.js'
import {
  getCourseRound1SeniorQuota,
  getCourseSeniorQuotaTotal,
  selectableCourses,
  updateCourseRound1SeniorQuota,
} from '../../data/courseRegistration/selectableCourses.js'

const props = defineProps({
  visible: Boolean,
  /** 勾选去重后的课程；按课配置须恰好一门 */
  courses: { type: Array, default: () => [] },
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const draftRows = ref([])
const meQuotaEditorRef = ref(null)
const formError = ref('')

const singleCourse = computed(() => (props.courses.length === 1 ? props.courses[0] : null))
const hasSingleCourse = computed(() => !!singleCourse.value)

/** 实时读 store，保证打开后名额分配变更也能反映 */
const liveCourse = computed(() => {
  const id = singleCourse.value?.id
  if (!id) return null
  void selectableCourses.value
  return selectableCourses.value.find((c) => c.id === id) || singleCourse.value
})

const totalCap = computed(() => getCourseSeniorQuotaTotal(liveCourse.value))

const meQuotaValidationContext = computed(() => {
  const ctx = { hasSpecialStudents: false, requiredIntakes: [] }
  const batchId = props.batch?.id
  if (!batchId) return ctx
  ctx.hasSpecialStudents = listBatchRosterStudents(batchId, 'special').length > 0
  return ctx
})

watch(
  () => [props.visible, singleCourse.value?.id, props.batch?.id],
  () => {
    if (!props.visible) return
    formError.value = ''
    const course = liveCourse.value
    if (!course) {
      draftRows.value = []
      return
    }
    const current = getCourseRound1SeniorQuota(course)
    if (current.hasOverride && current.meQuotaRows.length) {
      draftRows.value = current.meQuotaRows.map((r) => ({ ...r, intakes: [...(r.intakes || [])] }))
      return
    }
    const batchRows = getBatchRound1Quota(props.batch)?.meQuotaRows || []
    const cap = getCourseSeniorQuotaTotal(course)
    draftRows.value = syncDraftCounts(
      batchRows.map((r) => ({ ...r, intakes: [...(r.intakes || [])] })),
      cap,
    )
  },
  { immediate: true },
)

watch(totalCap, (cap) => {
  if (!props.visible || !hasSingleCourse.value) return
  draftRows.value = syncDraftCounts(draftRows.value, cap)
})

function syncDraftCounts(rows, cap) {
  const n = Math.max(0, Math.floor(Number(cap) || 0))
  if (n <= 0) return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, count: 0 }))
  return syncMeQuotaRowCounts(rows, n)
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  formError.value = ''
  if (!singleCourse.value) return
  if (totalCap.value <= 0) {
    formError.value = t('courseRegistration.courses.round1SeniorQuotaNeedSenior')
    return
  }
  if (!meQuotaEditorRef.value?.validate?.()) return
  updateCourseRound1SeniorQuota(singleCourse.value.id, { meQuotaRows: draftRows.value })
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('courseRegistration.courses.round1SeniorQuota') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <template v-if="hasSingleCourse">
            <MeQuotaRowsEditor
              ref="meQuotaEditorRef"
              v-model="draftRows"
              :total-cap="totalCap"
              :academic-session="batch?.academicSession || batch?.semester || ''"
              :programme="batch?.programme || ''"
              :validation-context="meQuotaValidationContext"
            />
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </template>
          <p v-else class="empty-hint">{{ t('courseRegistration.courses.round1SeniorQuotaNeedOne') }}</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!hasSingleCourse"
            @click="handleConfirm"
          >
            {{ t('common.confirm') }}
          </button>
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
  z-index: 1300;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: min(720px, calc(100vw - 48px));
  max-height: min(90vh, 880px);
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.form-error {
  margin: 10px 0 0;
  font-size: 13px;
  color: #dc2626;
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
</style>
