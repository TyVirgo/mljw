<script setup>
import { ref, watch, computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { studentFormTabs, getStudentFormData, createEmptyStudent } from '../../data/students.js'
import BasicInfoTab from './tabs/BasicInfoTab.vue'
import EnrollmentTab from './tabs/EnrollmentTab.vue'
import ContactTab from './tabs/ContactTab.vue'
import EducationTab from './tabs/EducationTab.vue'
import FamilyTab from './tabs/FamilyTab.vue'
import AccommodationTab from './tabs/AccommodationTab.vue'
import OthersTab from './tabs/OthersTab.vue'

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
}

const translatedTabs = computed(() =>
  studentFormTabs.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
)

const categoryLabel = computed(() => tr(form.value.studentCategory) || form.value.studentCategory)

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
          <div class="category-row">
            <span class="category-label">{{ tr('Student Category') }}</span>
            <span class="category-value">{{ categoryLabel }}</span>
          </div>

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
            <component :is="tabComponents[activeTab]" :form="form" :read-only="true" />
          </div>
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

.category-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.category-label {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

.category-value {
  font-size: 15px;
  font-weight: 500;
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
</style>
