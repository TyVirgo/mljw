<script setup>
import { ref } from 'vue'
import ImplementedYnSearchSelect from '../common/ImplementedYnSearchSelect.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { movementQueryTypeOptions, movementQueryTypeLabelKeys } from '../../data/movementQueryQueue.js'
import { movementListStudentCategoryOptions } from '../../data/movementListSearchFilters.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  modelValue: { type: Object, required: true },
  statusOptions: { type: Array, default: () => [] },
  effectiveSessionOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const { t } = useAppI18n()
const searchExpanded = ref(false)

function updateField(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function handleSearch() {
  emit('search')
}

function handleReset() {
  emit('reset')
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function statusLabel(status) {
  const map = {
    Draft: t('deferment.status.draft'),
    'In Progress': t('deferment.status.inProgress'),
    'Update Required': t('deferment.status.updateRequired'),
    Approved: t('deferment.status.approved'),
    Rejected: t('deferment.status.rejected'),
    Cancelled: t('deferment.status.cancelled'),
    Expired: t('programmeTransfer.status.expired'),
  }
  return map[status] || status
}

function studentCategoryLabel(type) {
  const key = `movementMaintenance.studentType.${type}`
  const translated = t(key)
  return translated !== key ? translated : type
}
</script>

<template>
  <div class="search-bar">
    <div class="search-row">
      <div class="search-fields">
        <div class="search-item">
          <label>{{ t('movementList.search.studentId') }}</label>
          <input
            :value="modelValue.studentId"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="updateField('studentId', $event.target.value)"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementList.search.studentName') }}</label>
          <input
            :value="modelValue.studentName"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="updateField('studentName', $event.target.value)"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementList.search.movementCategory') }}</label>
          <select
            :value="modelValue.movementType"
            class="search-select"
            :class="{ 'is-empty': !modelValue.movementType }"
            @change="updateField('movementType', $event.target.value)"
          >
            <option value="">{{ t('common.all') }}</option>
            <option v-for="opt in movementQueryTypeOptions" :key="opt" :value="opt">
              {{ t(movementQueryTypeLabelKeys[opt]) }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>{{ t('movementList.search.effectiveSession') }}</label>
          <select
            :value="modelValue.effectiveSession"
            class="search-select"
            :class="{ 'is-empty': !modelValue.effectiveSession }"
            @change="updateField('effectiveSession', $event.target.value)"
          >
            <option value="">{{ t('common.all') }}</option>
            <option v-for="session in effectiveSessionOptions" :key="session" :value="session">
              {{ session }}
            </option>
          </select>
        </div>
      </div>

      <div class="search-actions">
        <button type="button" class="btn btn-primary" @click="handleSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {{ t('common.search') }}
        </button>
        <button type="button" class="btn btn-default" @click="handleReset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {{ t('common.reset') }}
        </button>
        <button type="button" class="toggle-link" @click="toggleSearchExpanded">
          {{ searchExpanded ? t('common.collapse') : t('common.more') }}
          <svg :class="{ up: searchExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="searchExpanded" class="search-row search-row-secondary">
      <div class="search-fields">
        <div class="search-item">
          <label>{{ t('movementList.search.effectiveDate') }}</label>
          <input
            :value="modelValue.effectiveDate"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="updateField('effectiveDate', $event.target.value)"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementList.search.approvalStatus') }}</label>
          <select
            :value="modelValue.status"
            class="search-select"
            :class="{ 'is-empty': !modelValue.status }"
            @change="updateField('status', $event.target.value)"
          >
            <option value="">{{ t('common.all') }}</option>
            <option v-for="opt in statusOptions" :key="opt" :value="opt">
              {{ statusLabel(opt) }}
            </option>
          </select>
        </div>
        <ImplementedYnSearchSelect
          :model-value="modelValue.implemented"
          @update:model-value="updateField('implemented', $event)"
        />
        <div class="search-item">
          <label>{{ t('movementList.search.nationality') }}</label>
          <input
            :value="modelValue.nationality"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="updateField('nationality', $event.target.value)"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementList.search.studentCategory') }}</label>
          <select
            :value="modelValue.studentCategory"
            class="search-select"
            :class="{ 'is-empty': !modelValue.studentCategory }"
            @change="updateField('studentCategory', $event.target.value)"
          >
            <option value="">{{ t('common.all') }}</option>
            <option v-for="opt in movementListStudentCategoryOptions" :key="opt" :value="opt">
              {{ studentCategoryLabel(opt) }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
