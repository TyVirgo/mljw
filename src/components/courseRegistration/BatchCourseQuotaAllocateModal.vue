<script setup>
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import { DEMO_HEADCOUNT, splitQuotaByHeadcount } from '../../data/courseRegistration/audienceRounds.js'
import {
  isYear2OrSem2OnlyCourse,
  updateCoursesAudienceQuota,
  updateSectionsAudienceQuota,
} from '../../data/courseRegistration/selectableCourses.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
  /** 勾选的课程分组 id；有值时按分组写名额 */
  sectionIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()
const seniorInput = ref('')
const freshmanInput = ref('')
const effectiveCap = ref(0)
const autoSenior = ref(0)
const autoFreshman = ref(0)
const errorKey = ref('')
const confirmVisible = ref(false)

const headFreshman = DEMO_HEADCOUNT.freshman
const headSenior = DEMO_HEADCOUNT.senior

const targetCount = computed(() =>
  props.sectionIds?.length ? props.sectionIds.length : props.courses.length,
)
const hasTargets = computed(() => targetCount.value > 0)
const hasYear2Only = computed(() => props.courses.some((c) => isYear2OrSem2OnlyCourse(c)))

const isQuotaDirty = computed(() => {
  const { senior, freshman } = readQuotaPair()
  return senior !== autoSenior.value || freshman !== autoFreshman.value
})

function resolveSectionCapacity(course, sec) {
  const fromSec = Number(sec?.capacity)
  if (Number.isFinite(fromSec) && fromSec > 0) return Math.floor(fromSec)
  const fromCourse = Number(course?.totalCapacity)
  if (Number.isFinite(fromCourse) && fromCourse > 0) return Math.floor(fromCourse)
  return 0
}

/** @returns {{ course: object, section: object|null, capacity: number }[]} */
function resolveTargets() {
  if (props.sectionIds?.length) {
    const idSet = new Set(props.sectionIds)
    const out = []
    for (const course of props.courses || []) {
      for (const sec of course.sections || []) {
        if (!idSet.has(sec.id)) continue
        out.push({
          course,
          section: sec,
          capacity: resolveSectionCapacity(course, sec),
        })
      }
    }
    return out
  }
  return (props.courses || []).map((course) => ({
    course,
    section: null,
    capacity: Math.max(0, Math.floor(Number(course.totalCapacity) || 0)),
  }))
}

function computeAutoSplit(cap, year2) {
  const split = splitQuotaByHeadcount(cap, headFreshman, headSenior)
  return {
    senior: split.senior,
    freshman: year2 ? 0 : split.freshman,
  }
}

/** 配额重置：强制按在册公式回填 */
function applyAutoSplitToForm() {
  errorKey.value = ''
  confirmVisible.value = false
  const targets = resolveTargets()
  const first = targets[0]
  const cap = first?.capacity || 0
  effectiveCap.value = cap
  const year2 = first ? isYear2OrSem2OnlyCourse(first.course) : false
  const auto = computeAutoSplit(cap, year2)
  autoSenior.value = auto.senior
  autoFreshman.value = auto.freshman
  seniorInput.value = String(auto.senior)
  freshmanInput.value = String(auto.freshman)
}

/** 打开：优先读已存配额；无则初分。auto* 仍按公式，供 dirty / 重置对照 */
function seedFormOnOpen() {
  errorKey.value = ''
  confirmVisible.value = false
  const targets = resolveTargets()
  const first = targets[0]
  const cap = first?.capacity || 0
  effectiveCap.value = cap
  const year2 = first ? isYear2OrSem2OnlyCourse(first.course) : false
  const auto = computeAutoSplit(cap, year2)
  autoSenior.value = auto.senior
  autoFreshman.value = auto.freshman

  const rawSenior = first?.section
    ? Number(first.section.quota?.senior)
    : Number(first?.course?.quota?.senior)
  const rawFresh = first?.section
    ? Number(first.section.quota?.freshman)
    : Number(first?.course?.quota?.freshman)
  if (Number.isFinite(rawSenior) && Number.isFinite(rawFresh)) {
    seniorInput.value = String(Math.max(0, Math.floor(rawSenior)))
    freshmanInput.value = String(year2 ? 0 : Math.max(0, Math.floor(rawFresh)))
  } else {
    seniorInput.value = String(auto.senior)
    freshmanInput.value = String(auto.freshman)
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) seedFormOnOpen()
  },
)

function readQuotaPair() {
  const senior = Math.max(0, Math.floor(Number(seniorInput.value) || 0))
  let freshman = Math.max(0, Math.floor(Number(freshmanInput.value) || 0))
  if (hasYear2Only.value) freshman = 0
  return { senior, freshman }
}

/** 仅当合计超过容量时压回；允许合计 < 有效容量 */
function clampQuotaToCapacity(senior, freshman, capacity) {
  const cap = Math.max(0, Math.floor(Number(capacity) || 0))
  const sum = senior + freshman
  if (cap <= 0) return { senior: 0, freshman: 0 }
  if (sum <= 0) return { senior: 0, freshman: 0 }
  if (sum <= cap) return { senior, freshman }
  const nextSenior = Math.min(cap, Math.round((cap * senior) / sum))
  return { senior: nextSenior, freshman: Math.max(0, cap - nextSenior) }
}

function handleClose() {
  errorKey.value = ''
  confirmVisible.value = false
  emit('close')
}

function persistQuota() {
  const { senior, freshman } = readQuotaPair()
  const targets = resolveTargets()
  if (props.sectionIds?.length) {
    for (const target of targets) {
      const year2 = isYear2OrSem2OnlyCourse(target.course)
      const clamped = clampQuotaToCapacity(senior, freshman, target.capacity)
      updateSectionsAudienceQuota([target.section.id], {
        senior: clamped.senior,
        freshman: year2 ? 0 : clamped.freshman,
      })
    }
  } else {
    for (const target of targets) {
      const year2 = isYear2OrSem2OnlyCourse(target.course)
      const clamped = clampQuotaToCapacity(senior, freshman, target.capacity)
      updateCoursesAudienceQuota([target.course.id], {
        senior: clamped.senior,
        freshman: year2 ? 0 : clamped.freshman,
      })
    }
  }
  confirmVisible.value = false
  emit('saved')
  emit('close')
}

function handleConfirm() {
  if (!hasTargets.value) return
  const { senior, freshman } = readQuotaPair()
  const sum = senior + freshman
  if (sum > effectiveCap.value) {
    errorKey.value = 'courseRegistration.courses.quotaExceedCap'
    return
  }
  errorKey.value = ''
  if (isQuotaDirty.value) {
    confirmVisible.value = true
    return
  }
  persistQuota()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('courseRegistration.courses.quotaAllocate') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">
            ×
          </button>
        </div>

        <div class="modal-body">
          <template v-if="hasTargets">
            <div class="grid-2">
              <div class="readonly-cell">
                <span class="field-label">{{ t('courseRegistration.courses.headcountFreshman') }}</span>
                <span class="field-value">{{ headFreshman }}</span>
              </div>
              <div class="readonly-cell">
                <span class="field-label">{{ t('courseRegistration.courses.headcountSenior') }}</span>
                <span class="field-value">{{ headSenior }}</span>
              </div>
            </div>

            <div class="formula-callout">
              <p class="formula-line">{{ t('courseRegistration.courses.splitByHeadcountHelp') }}</p>
              <p class="formula-line">
                {{ t('courseRegistration.courses.quotaEffectiveCapLabel', { cap: effectiveCap }) }}
              </p>
            </div>

            <div class="grid-2">
              <div class="form-cell">
                <label class="field-label">
                  <span class="req">*</span>
                  {{ t('courseRegistration.courses.seniorQuota') }}
                </label>
                <input v-model="seniorInput" type="number" min="0" class="num-input" />
              </div>
              <div class="form-cell">
                <label class="field-label">
                  <span class="req">*</span>
                  {{ t('courseRegistration.courses.freshmanQuota') }}
                </label>
                <input
                  v-model="freshmanInput"
                  type="number"
                  min="0"
                  class="num-input"
                  :disabled="hasYear2Only"
                />
              </div>
            </div>
            <p v-if="hasYear2Only" class="help warn">
              {{ t('courseRegistration.courses.year2FreshmanZeroTip') }}
            </p>
            <p v-if="errorKey" class="field-error">{{ t(errorKey, { cap: effectiveCap }) }}</p>
          </template>
          <p v-else class="empty-hint">{{ t('courseRegistration.courses.optionalSettingsNeedSelect') }}</p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-default"
            :disabled="!hasTargets"
            @click="applyAutoSplitToForm"
          >
            {{ t('courseRegistration.courses.quotaReset') }}
          </button>
          <div class="footer-actions">
            <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!hasTargets"
              @click="handleConfirm"
            >
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <ConfirmDialog
    :visible="confirmVisible"
    :title="t('courseRegistration.courses.quotaManualConfirmTitle')"
    :message="t('courseRegistration.courses.quotaManualConfirmMessage')"
    :confirm-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    confirm-variant="primary"
    :z-index="1400"
    @confirm="persistQuota"
    @cancel="confirmVisible = false"
  />
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
  max-width: min(520px, calc(100vw - 48px));
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
}

.help.warn {
  margin: 8px 0 0;
  font-size: 12px;
  color: #b45309;
}

.field-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #dc2626;
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin-bottom: 14px;
}

.readonly-cell,
.form-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.field-value {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.formula-callout {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.formula-line {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #1e3a8a;
}

.formula-line + .formula-line {
  margin-top: 4px;
}

.req {
  color: #ef4444;
  margin-right: 2px;
}

.num-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  box-sizing: border-box;
}

.num-input:disabled {
  background: #f3f4f6;
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
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 520px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
