<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { updateSupplementEntry } from '../../data/courseRegistration/supplementListQueue.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'

const props = defineProps({
  visible: Boolean,
  entry: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())

function createEmptyForm() {
  return {
    canAdd: true,
    canDrop: true,
    canRetake: true,
    remark: '',
  }
}

watch(
  () => props.entry,
  (entry) => {
    if (entry) {
      form.value = {
        canAdd: entry.canAdd,
        canDrop: entry.canDrop,
        canRetake: entry.canRetake,
        remark: entry.remark || '',
      }
    }
  },
  { immediate: true },
)

const title = computed(() => props.entry?.studentName || '')
const subtitle = computed(() => {
  if (!props.entry) return ''
  const intake = formatIntakeBatch(props.entry.intake) || props.entry.intake
  return `${props.entry.studentId} · ${props.entry.programme}/${intake}`
})

function handleSave() {
  if (!props.entry?.id) return
  updateSupplementEntry(props.entry.id, { ...form.value, listType: 'supplement' })
  emit('saved')
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <div class="form-body">
      <div class="permission-grid">
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.canAdd" type="checkbox" />
          {{ t('courseRegistration.supplement.canAdd') }}
        </label>
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.canDrop" type="checkbox" />
          {{ t('courseRegistration.supplement.canDrop') }}
        </label>
        <label class="checkbox-row checkbox-row--inline">
          <input v-model="form.canRetake" type="checkbox" />
          {{ t('courseRegistration.supplement.canRetake') }}
        </label>
      </div>

      <label class="field-label">{{ t('courseRegistration.supplement.remark') }}</label>
      <textarea v-model="form.remark" class="form-input" rows="3" />
    </div>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  align-items: center;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-row--inline {
  margin-top: 0;
}

.field-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font: inherit;
  box-sizing: border-box;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

@media (max-width: 720px) {
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
