<script setup>
import { computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseSectionCard from './CourseSectionCard.vue'
import ExternalDataHint from './ExternalDataHint.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getRegistrationTypeLabel } from '../../data/courseRegistration/registrationTypes.js'

const props = defineProps({
  visible: Boolean,
  course: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const title = computed(() => props.course?.name || '')
const subtitle = computed(() =>
  props.course ? `${props.course.code} · ${props.course.credits} cr` : '',
)

function readonlyField(labelKey, value) {
  return { labelKey, value: value ?? '—' }
}

const basicFields = computed(() => {
  if (!props.course) return []
  const c = props.course
  return [
    readonlyField('courseRegistration.courses.code', c.code),
    readonlyField('courseRegistration.courses.name', c.name),
    readonlyField('courseRegistration.courses.credits', c.credits),
    readonlyField('courseRegistration.courses.type', getRegistrationTypeLabel(c.type, t)),
    readonlyField('courseRegistration.courses.g1Category', c.g1Category || '—'),
  ]
})
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    class="student-course-detail-drawer"
    @close="emit('close')"
  >
    <template v-if="course">
      <section class="form-section">
        <h3 class="section-title">
          <span class="step-badge">1</span>
          {{ t('courseRegistration.student.detailSectionBasic') }}
        </h3>
        <div class="detail-grid">
          <div v-for="field in basicFields" :key="field.labelKey" class="detail-field">
            <span class="field-label">{{ t(field.labelKey) }}</span>
            <div class="readonly-value">{{ field.value }}</div>
          </div>
        </div>
      </section>

      <section class="form-section">
        <h3 class="section-title">
          <span class="step-badge">2</span>
          {{ t('courseRegistration.student.detailSectionSections') }}
        </h3>
        <p class="section-hint">
          {{ t('courseRegistration.student.detailSectionHintReadonly') }}
          <ExternalDataHint source-key="scheduling" />
        </p>
        <div class="section-list">
          <CourseSectionCard
            v-for="sec in course.sections"
            :key="sec.id"
            :section="sec"
            :section-code-label="t('courseRegistration.courses.sectionCode')"
            :selectable="false"
          />
          <p v-if="!course.sections?.length" class="empty-note">{{ t('common.noData') }}</p>
        </div>
      </section>

      <section class="form-section">
        <h3 class="section-title">
          <span class="step-badge">3</span>
          {{ t('courseRegistration.student.detailSectionNotes') }}
        </h3>
        <div class="detail-grid">
          <div class="detail-field span-2">
            <span class="field-label">{{ t('courseRegistration.courses.prerequisites') }}</span>
            <div class="readonly-value">
              {{ (course.prerequisites || []).join(', ') || '—' }}
            </div>
          </div>
        </div>
        <p class="notes-callout">{{ t('courseRegistration.student.detailSyllabusPlaceholder') }}</p>
      </section>
    </template>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">
        {{ t('common.close') }}
      </button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.student-course-detail-drawer :deep(.drawer-panel) {
  width: min(960px, 90vw);
}

.form-section + .form-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.detail-field.span-2 {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.readonly-value {
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  color: #111827;
}

.section-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notes-callout {
  margin: 12px 0 0;
  padding: 10px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  color: #0369a1;
}

.empty-note {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
}

@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-field.span-2 {
    grid-column: auto;
  }
}
</style>
