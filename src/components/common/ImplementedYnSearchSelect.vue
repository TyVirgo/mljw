<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { movementImplementedYnFilterOptions } from '../../data/movementApprovalQueue.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const { t, tr } = useAppI18n()

const selectClass = computed(() => [
  'search-select',
  'implemented-yn-select',
  {
    'is-empty': !props.modelValue,
    'implemented-yn-select--y': props.modelValue === 'Y',
    'implemented-yn-select--n': props.modelValue === 'N',
  },
])

function onChange(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="search-item">
    <label>{{ tr('Implemented') }}</label>
    <select :value="modelValue" :class="selectClass" @change="onChange">
      <option value="">{{ t('common.all') }}</option>
      <option
        v-for="opt in movementImplementedYnFilterOptions"
        :key="opt"
        :value="opt"
        :class="opt === 'Y' ? 'implemented-yn-option--y' : 'implemented-yn-option--n'"
      >
        {{ opt }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.implemented-yn-select--y {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
  font-weight: 600;
}

.implemented-yn-select--n {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
  font-weight: 600;
}

.implemented-yn-option--y {
  background: #dcfce7;
  color: #166534;
}

.implemented-yn-option--n {
  background: #fee2e2;
  color: #991b1b;
}
</style>
