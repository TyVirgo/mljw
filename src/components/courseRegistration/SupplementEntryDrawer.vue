<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { supplementListTypes, updateSupplementEntry } from '../../data/courseRegistration/supplementListQueue.js'

const props = defineProps({
  visible: Boolean,
  entry: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())

function createEmptyForm() {
  return {
    listType: 'supplement',
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassCreditMax: false,
    bypassPrerequisite: false,
    remark: '',
  }
}

watch(
  () => props.entry,
  (entry) => {
    if (entry) {
      form.value = {
        listType: entry.listType,
        canAdd: entry.canAdd,
        canDrop: entry.canDrop,
        canRetake: entry.canRetake,
        bypassCreditMax: entry.bypassCreditMax,
        bypassPrerequisite: entry.bypassPrerequisite,
        remark: entry.remark || '',
      }
    }
  },
  { immediate: true },
)

const title = computed(() => props.entry?.studentName || '')
const subtitle = computed(() =>
  props.entry ? `${props.entry.studentId} · ${props.entry.programme}/${props.entry.intake}` : '',
)

function handleSave() {
  if (!props.entry?.id) return
  updateSupplementEntry(props.entry.id, { ...form.value })
  emit('saved')
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <div class="form-grid">
      <label>{{ t('courseRegistration.supplement.listType') }}</label>
      <select v-model="form.listType" class="form-input">
        <option v-for="opt in supplementListTypes" :key="opt" :value="opt">
          {{ t(`courseRegistration.supplement.types.${opt}`) }}
        </option>
      </select>

      <label>{{ t('courseRegistration.supplement.canAdd') }}</label>
      <input v-model="form.canAdd" type="checkbox" class="checkbox" />

      <label>{{ t('courseRegistration.supplement.canDrop') }}</label>
      <input v-model="form.canDrop" type="checkbox" class="checkbox" />

      <label>{{ t('courseRegistration.supplement.canRetake') }}</label>
      <input v-model="form.canRetake" type="checkbox" class="checkbox" />

      <label>{{ t('courseRegistration.supplement.bypassCreditMax') }}</label>
      <input v-model="form.bypassCreditMax" type="checkbox" class="checkbox" />

      <label>{{ t('courseRegistration.supplement.bypassPrerequisite') }}</label>
      <input v-model="form.bypassPrerequisite" type="checkbox" class="checkbox" />

      <label>{{ t('courseRegistration.supplement.remark') }}</label>
      <textarea v-model="form.remark" class="form-textarea" rows="3" />
    </div>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.checkbox { width: 16px; height: 16px; }
</style>
