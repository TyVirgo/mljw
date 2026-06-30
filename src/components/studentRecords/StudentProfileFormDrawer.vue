<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import SearchableSelect from '../common/SearchableSelect.vue'
import {
  studentFormTabs,
  createEmptyStudent,
  getStudentFormData,
  validateStudentForm,
  resolveCategoryFromNationality,
  clearCategorySpecificFields,
  syncStudentCategoryFromNationality,
} from '../../data/students.js'
import BasicInfoTab from './tabs/BasicInfoTab.vue'
import EnrollmentTab from './tabs/EnrollmentTab.vue'
import ContactTab from './tabs/ContactTab.vue'
import EducationTab from './tabs/EducationTab.vue'
import FamilyTab from './tabs/FamilyTab.vue'
import AccommodationTab from './tabs/AccommodationTab.vue'
import OthersTab from './tabs/OthersTab.vue'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: null },
  existingStudents: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, tr } = useAppI18n()

const activeTab = ref('basic')
const form = ref(createEmptyStudent())
const errors = ref({})
const previousNationality = ref('')
const suppressNationalityWatch = ref(false)
const entrySectionRef = ref(null)

const isEditMode = computed(() => props.mode === 'edit')
const drawerTitle = computed(() =>
  isEditMode.value ? t('studentProfile.form.editTitle') : t('studentProfile.form.createTitle'),
)

const nationalitySelected = computed(() => !!String(form.value.basicInfo?.nationality || '').trim())

const categoryLabel = computed(() => {
  if (!nationalitySelected.value) return '—'
  const category = form.value.studentCategory
  return category ? tr(category) || category : '—'
})

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

function nationalityError() {
  return errors.value['basicInfo.nationality'] || ''
}

watch(
  () => [props.visible, props.mode, props.initialData],
  () => {
    if (!props.visible) return
    activeTab.value = 'basic'
    errors.value = {}
    suppressNationalityWatch.value = true
    form.value =
      isEditMode.value && props.initialData
        ? getStudentFormData(props.initialData)
        : createEmptyStudent()
    previousNationality.value = String(form.value.basicInfo?.nationality || '').trim()
    suppressNationalityWatch.value = false
  },
)

watch(
  () => form.value.basicInfo?.nationality,
  (newVal) => {
    if (suppressNationalityWatch.value) return

    const nationality = String(newVal || '').trim()
    const newCategory = resolveCategoryFromNationality(nationality)
    const oldCategory = form.value.studentCategory

    if (!nationality) {
      form.value.studentCategory = ''
      previousNationality.value = ''
      return
    }

    if (oldCategory && newCategory !== oldCategory && previousNationality.value) {
      if (!window.confirm(t('studentProfile.form.nationalityChangeConfirm'))) {
        suppressNationalityWatch.value = true
        form.value.basicInfo.nationality = previousNationality.value
        suppressNationalityWatch.value = false
        return
      }
      clearCategorySpecificFields(form.value, oldCategory)
    }

    form.value.studentCategory = newCategory
    previousNationality.value = nationality
  },
)

watch(nationalitySelected, (selected, wasSelected) => {
  if (!selected || wasSelected) return
  activeTab.value = 'basic'
  nextTick(() => {
    entrySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

function tabHasError(tabId) {
  const prefixMap = {
    basic: 'basicInfo.',
    enrollment: 'enrollment.',
    contact: 'contact.',
    education: 'education.',
    family: 'family.',
    accommodation: 'accommodation.',
    others: 'others.',
  }
  const prefix = prefixMap[tabId]
  if (!prefix) return false
  return Object.keys(errors.value).some((key) => key.startsWith(prefix))
}

function handleSave() {
  syncStudentCategoryFromNationality(form.value)
  const result = validateStudentForm(form.value, props.existingStudents, form.value.id)
  errors.value = result.errors
  if (!result.valid) {
    if (result.firstErrorTab && nationalitySelected.value) activeTab.value = result.firstErrorTab
    return
  }
  emit('save', { ...form.value })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="drawer-overlay" @click.self="handleClose">
      <aside class="drawer-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="drawer-header">
          <h2 class="drawer-title">{{ drawerTitle }}</h2>
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
                <label class="field-label">
                  <span class="req">*</span> {{ tr('Nationality') }}
                </label>
                <SearchableSelect
                  v-model="form.basicInfo.nationality"
                  :placeholder="tr('please select')"
                  :has-error="!!nationalityError()"
                />
                <p v-if="nationalityError()" class="field-error">{{ t('studentProfile.form.nationalityRequired') }}</p>
              </div>
              <div class="nationality-field">
                <label class="field-label">{{ tr('Student Category') }}</label>
                <div class="category-readonly">{{ categoryLabel }}</div>
              </div>
            </div>
            <p class="nationality-hint">{{ t('studentProfile.form.nationalityHint') }}</p>
          </section>

          <section v-if="nationalitySelected" ref="entrySectionRef" class="form-section entry-section">
            <h3 class="section-title section-title-step2">
              <span class="step-badge">2</span>
              {{ t('studentProfile.form.entrySectionTitle') }}
            </h3>
            <div class="tab-bar">
              <button
                v-for="tab in translatedTabs"
                :key="tab.id"
                type="button"
                class="tab-btn"
                :class="{ active: activeTab === tab.id, 'has-error': tabHasError(tab.id) }"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="tab-content">
              <component
                :is="tabComponents[activeTab]"
                :form="form"
                :errors="errors"
                :read-only="false"
                :nationality-selected="true"
              />
            </div>
          </section>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
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
  align-items: center;
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

.entry-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  scroll-margin-top: 16px;
}

.section-title-step2 {
  margin-bottom: 18px;
}

.nationality-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
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

.req {
  color: #ef4444;
}

.category-readonly {
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.field-error {
  margin: 0;
  font-size: 12px;
  color: #ef4444;
}

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  margin-top: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
  flex-shrink: 0;
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

.tab-btn.has-error {
  color: #ef4444;
}

.tab-content {
  min-height: 200px;
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
