<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { movementApplicationImplementedOptions } from '../../data/movementApplicationSearch.js'
import '../../styles/list-page-search.css'

const props = defineProps({
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
  modelValue: {
    type: Object,
    required: true,
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  statusLabelFn: {
    type: Function,
    required: true,
  },
  keywordLabelKey: {
    type: String,
    default: 'programmeTransfer.searchFieldLabel',
  },
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const { t, tr } = useAppI18n()

const searchExpanded = ref(true)

function patchFields(patch) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function implementedLabel(value) {
  if (value === 'Pending' || value === 'Implemented') {
    const key = `movementMaintenance.implemented.${value}`
    const translated = t(key)
    return translated !== key ? translated : value
  }
  return value
}

function toggleSearchExpanded() {
  searchExpanded.value = !searchExpanded.value
}

function handleSearch() {
  emit('search')
}

function handleReset() {
  emit('reset')
}
</script>

<template>
  <div class="search-bar">
    <div class="search-row">
      <div class="search-fields">
        <div v-if="applicantMode === 'teacher'" class="search-item">
          <label>{{ t(keywordLabelKey) }}</label>
          <input
            :value="modelValue.keyword"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="patchFields({ keyword: $event.target.value })"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementApplication.search.programmeCode') }}</label>
          <input
            :value="modelValue.programmeCode"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="patchFields({ programmeCode: $event.target.value })"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ t('movementQuery.search.academicSession') }}</label>
          <input
            :value="modelValue.applicationSession"
            type="text"
            class="search-input"
            :placeholder="t('common.pleaseInput')"
            @input="patchFields({ applicationSession: $event.target.value })"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-item">
          <label>{{ tr('Status') }}</label>
          <select
            :value="modelValue.status"
            class="search-select"
            :class="{ 'is-empty': !modelValue.status }"
            @change="patchFields({ status: $event.target.value })"
          >
            <option value="">{{ t('common.all') }}</option>
            <option v-for="opt in statusOptions" :key="opt" :value="opt">
              {{ statusLabelFn(opt) }}
            </option>
          </select>
        </div>
      </div>

      <div class="search-actions">
        <button type="button" class="btn btn-primary" @click="handleSearch">
          {{ t('common.search') }}
        </button>
        <button type="button" class="btn btn-default" @click="handleReset">
          {{ t('common.reset') }}
        </button>
        <button type="button" class="btn btn-text" @click="toggleSearchExpanded">
          {{ searchExpanded ? t('common.collapse') : t('common.more') }}
          <svg
            class="collapse-icon"
            :class="{ up: searchExpanded }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="search-expand">
      <div v-if="searchExpanded" class="search-row search-row-secondary">
        <div class="search-fields">
          <div class="search-item">
            <label>{{ t('movementApplication.search.implemented') }}</label>
            <select
              :value="modelValue.implemented"
              class="search-select"
              :class="{ 'is-empty': !modelValue.implemented }"
              @change="patchFields({ implemented: $event.target.value })"
            >
              <option value="">{{ t('common.all') }}</option>
              <option
                v-for="opt in movementApplicationImplementedOptions"
                :key="opt"
                :value="opt"
              >
                {{ implementedLabel(opt) }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.collapse-icon.up {
  transform: rotate(180deg);
}

.search-expand-enter-active,
.search-expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
