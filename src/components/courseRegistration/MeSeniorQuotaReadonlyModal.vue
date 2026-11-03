<script setup>
/**
 * 选课结果：ME 课老生名额使用只读弹窗（各层次已分配 / 剩余可选；不写回配置）
 * 原「年级占比」配置表形态已弃用，改结果向使用口径。
 */
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getBatchById } from '../../data/courseRegistration/registrationBatches.js'
import {
  ME_QUOTA_KIND_SPECIAL,
} from '../../data/courseRegistration/batchRound1Quota.js'
import {
  buildMeSeniorQuotaUsageRows,
  RESULT_ROUND_KEYS,
} from '../../data/courseRegistration/registrationResultByRound.js'
import { selectableCourses } from '../../data/courseRegistration/selectableCourses.js'

const props = defineProps({
  visible: Boolean,
  /** 课程 id */
  courseId: { type: String, default: '' },
  /** 批次 id（用于解析批次级 meQuota 回退） */
  batchId: { type: String, default: '' },
  courseCode: { type: String, default: '' },
  courseName: { type: String, default: '' },
  /** 当前结果轮次：preselect|main|supplement */
  roundKey: { type: String, default: 'main' },
  /** 入口老生容量总量（与列表列一致） */
  entrySeniorCap: { type: Number, default: null },
  /** 入口已选老生 */
  entryEnrolledSenior: { type: Number, default: null },
  /** 入口老生容量可选 */
  entryAvailableSenior: { type: Number, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

/** @type {import('vue').Ref<object[]>} */
const usageRows = ref([])
const seniorCap = ref(0)
const allocatedTotal = ref(0)
const remainingTotal = ref(0)

/**
 * 实时课程（含 pad 课则回退 props 文案）
 * @returns {object|null}
 */
const liveCourse = computed(() => {
  const id = String(props.courseId || '').trim()
  if (!id) return null
  void selectableCourses.value
  return selectableCourses.value.find((c) => c.id === id) || null
})

const batch = computed(() => getBatchById(props.batchId) || null)

const displayCode = computed(
  () => liveCourse.value?.code || props.courseCode || '—',
)
const displayName = computed(
  () => liveCourse.value?.name || props.courseName || '—',
)

const hasRows = computed(() => (usageRows.value || []).length > 0)

const resolvedRoundKey = computed(() => {
  const key = String(props.roundKey || '').trim()
  return RESULT_ROUND_KEYS.includes(key) ? key : 'main'
})

/**
 * 刷新使用汇总
 */
function refreshUsage() {
  if (!props.visible) {
    usageRows.value = []
    seniorCap.value = 0
    allocatedTotal.value = 0
    remainingTotal.value = 0
    return
  }
  const course = liveCourse.value || {
    id: props.courseId,
    code: props.courseCode,
    name: props.courseName,
    batchId: props.batchId,
    quota: { senior: 0 },
    sections: [],
  }
  /** @param {unknown} v */
  const isHintNumber = (v) => v != null && v !== '' && Number.isFinite(Number(v))
  const entryHints = {
    seniorCap: isHintNumber(props.entrySeniorCap) ? Number(props.entrySeniorCap) : undefined,
    enrolledSenior: isHintNumber(props.entryEnrolledSenior)
      ? Number(props.entryEnrolledSenior)
      : undefined,
    availableSenior: isHintNumber(props.entryAvailableSenior)
      ? Number(props.entryAvailableSenior)
      : undefined,
  }
  const hasEntryHint =
    entryHints.seniorCap != null ||
    entryHints.enrolledSenior != null ||
    entryHints.availableSenior != null
  const built = buildMeSeniorQuotaUsageRows(
    course,
    batch.value,
    resolvedRoundKey.value,
    hasEntryHint ? entryHints : null,
  )
  usageRows.value = built.rows || []
  seniorCap.value = built.seniorCap || 0
  allocatedTotal.value = built.allocatedTotal || 0
  remainingTotal.value = built.remainingTotal || 0
}

watch(
  () => [
    props.visible,
    props.courseId,
    props.batchId,
    props.roundKey,
    props.entrySeniorCap,
    props.entryEnrolledSenior,
    props.entryAvailableSenior,
  ],
  () => refreshUsage(),
  { immediate: true },
)

/** 关闭弹窗 */
function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ t('courseRegistration.result.meSeniorQuotaUsageTitle') }}
          </h2>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('common.close')"
            @click="handleClose"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p class="course-meta">
            {{
              t('courseRegistration.result.meSeniorQuotaReadonlyCourse', {
                code: displayCode,
                name: displayName,
              })
            }}
          </p>
          <div v-if="hasRows" class="summary-bar">
            <span>
              {{
                t('courseRegistration.result.meSeniorQuotaUsageCapTotal', {
                  n: seniorCap,
                })
              }}
            </span>
            <span>
              {{
                t('courseRegistration.result.meSeniorQuotaUsageAllocatedTotal', {
                  n: allocatedTotal,
                })
              }}
            </span>
            <span>
              {{
                t('courseRegistration.result.meSeniorQuotaUsageRemainingTotal', {
                  n: remainingTotal,
                })
              }}
            </span>
          </div>
          <p v-if="!hasRows" class="empty-hint">
            {{ t('courseRegistration.result.meSeniorQuotaReadonlyEmpty') }}
          </p>
          <div v-else class="table-wrap">
            <table class="data-table usage-table">
              <thead>
                <tr>
                  <th>{{ t('courseRegistration.schedule.meQuotaBucket') }}</th>
                  <th class="col-num">
                    {{ t('courseRegistration.result.meSeniorQuotaUsageQuota') }}
                  </th>
                  <th class="col-num">
                    {{ t('courseRegistration.result.meSeniorQuotaUsageAllocated') }}
                  </th>
                  <th class="col-num">
                    {{ t('courseRegistration.result.meSeniorQuotaUsageRemaining') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in usageRows" :key="row.id">
                  <td>
                    <span
                      v-if="row.kind === ME_QUOTA_KIND_SPECIAL"
                      class="me-special-label"
                    >
                      {{ t('courseRegistration.schedule.meQuotaSpecial') }}
                    </span>
                    <div v-else class="me-intake-chips">
                      <span
                        v-for="intakeKey in row.intakes"
                        :key="intakeKey"
                        class="me-chip"
                      >
                        {{ intakeKey }}
                      </span>
                      <span v-if="!row.intakes?.length" class="me-intake-empty">—</span>
                    </div>
                  </td>
                  <td class="col-num">{{ row.quotaCount }}</td>
                  <td class="col-num">{{ row.allocated }}</td>
                  <td class="col-num col-remaining">{{ row.remaining }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">
            {{ t('common.close') }}
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
  max-width: min(640px, calc(100vw - 48px));
  max-height: min(90vh, 720px);
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
  padding: 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.course-meta {
  margin: 0 0 10px;
  font-size: 13px;
  color: #374151;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin: 0 0 14px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
}

.empty-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.usage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.usage-table th,
.usage-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  vertical-align: middle;
}

.usage-table thead th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.usage-table tbody tr:last-child td {
  border-bottom: none;
}

.col-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  width: 96px;
}

.col-remaining {
  font-weight: 600;
  color: #047857;
}

.me-intake-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.me-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}

.me-special-label {
  color: #111827;
  font-weight: 500;
}

.me-intake-empty {
  color: #9ca3af;
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
