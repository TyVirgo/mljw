<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { studentDetailTabs, getStudentFormData, createEmptyStudent } from '../../data/students.js'
import BasicInfoTab from './tabs/BasicInfoTab.vue'
import EnrollmentTab from './tabs/EnrollmentTab.vue'
import ContactTab from './tabs/ContactTab.vue'
import EducationTab from './tabs/EducationTab.vue'
import FamilyTab from './tabs/FamilyTab.vue'
import AccommodationTab from './tabs/AccommodationTab.vue'
import OthersTab from './tabs/OthersTab.vue'
import StatusLogTab from './tabs/StatusLogTab.vue'

const props = defineProps({
  visible: Boolean,
  data: { type: Object, default: null },
})

const emit = defineEmits(['close', 'edit'])

const { t, tr } = useAppI18n()

const activeTab = ref('basic')
const form = ref(createEmptyStudent())

const tabComponents = {
  basic: BasicInfoTab,
  enrollment: EnrollmentTab,
  contact: ContactTab,
  education: EducationTab,
  family: FamilyTab,
  accommodation: AccommodationTab,
  others: OthersTab,
  statusLog: StatusLogTab,
}

const translatedTabs = computed(() =>
  studentDetailTabs.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
)

const nationalityDisplay = computed(() => form.value.basicInfo?.nationality || '—')
const categoryLabel = computed(() => {
  const category = form.value.studentCategory
  return category ? tr(category) || category : '—'
})

watch(
  () => [props.visible, props.data],
  () => {
    if (!props.visible) return
    activeTab.value = 'basic'
    form.value = props.data ? getStudentFormData(props.data) : createEmptyStudent()
  },
)

function handleClose() {
  emit('close')
}

function handleEdit() {
  emit('edit', props.data)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="drawer-overlay" @click.self="handleClose">
      <aside class="drawer-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="drawer-header">
          <div>
            <h2 class="drawer-title">{{ t('studentProfile.form.detailTitle') }}</h2>
            <p v-if="form.basicInfo.studentId" class="drawer-subtitle">
              {{ form.basicInfo.studentId }} · {{ form.basicInfo.fullName }}
            </p>
          </div>
          <button type="button" class="drawer-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="drawer-body">
          <section class="form-section">
            <h3 class="section-title">
              <span class="step-badge">1</span>
              {{ t('studentProfile.form.nationalitySectionTitle') }}
            </h3>
            <div class="nationality-grid">
              <div class="nationality-field">
                <span class="field-label">{{ tr('Nationality') }}</span>
                <div class="readonly-value">{{ nationalityDisplay }}</div>
              </div>
              <div class="nationality-field">
                <span class="field-label">{{ tr('Student Category') }}</span>
                <div class="readonly-value">{{ categoryLabel }}</div>
              </div>
            </div>
          </section>

          <section class="form-section entry-section-readonly">
            <h3 class="section-title">
              <span class="step-badge">2</span>
              {{ t('studentProfile.form.entrySectionTitle') }}
            </h3>
            <div class="tab-bar">
              <button
                v-for="tab in translatedTabs"
                :key="tab.id"
                type="button"
                class="tab-btn"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="tab-content">
              <component
                :is="tabComponents[activeTab]"
                :form="form"
                :read-only="true"
                :nationality-selected="true"
              />
            </div>
          </section>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.close') }}</button>
          <button type="button" class="btn btn-primary" @click="handleEdit">{{ t('common.edit') }}</button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: min(960px, 90vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.drawer-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.form-section + .form-section {
  margin-top: 24px;
}

.entry-section-readonly {
  margin-top: 32px;
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

.nationality-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.nationality-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 14px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
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

@media (max-width: 720px) {
  .nationality-grid {
    grid-template-columns: 1fr;
  }
}
</style>
