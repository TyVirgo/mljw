<script setup>
import { ref, watch } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { whitelistTypes, addWhitelistEntry } from '../../data/courseRegistration/whitelistQueue.js'

const props = defineProps({
  visible: Boolean,
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const form = ref(createEmptyForm())

function createEmptyForm() {
  return {
    studentId: '',
    studentName: '',
    programme: '',
    intake: '',
    type: 'prerequisiteException',
    courseCode: '',
    reason: '',
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) form.value = createEmptyForm()
  },
)

function handleSave() {
  if (!form.value.studentId || !form.value.courseCode) {
    window.alert(t('common.pleaseInput'))
    return
  }
  addWhitelistEntry({ ...form.value })
  emit('saved')
  emit('close')
}
</script>

<template>
  <ApplicationDetailDrawer
    :visible="visible"
    :title="t('courseRegistration.whitelistBoa.createTitle')"
    @close="emit('close')"
  >
    <div class="form-grid">
      <label>{{ t('courseRegistration.whitelistBoa.studentId') }}</label>
      <input v-model="form.studentId" type="text" class="form-input" />

      <label>{{ t('courseRegistration.whitelistBoa.studentName') }}</label>
      <input v-model="form.studentName" type="text" class="form-input" />

      <label>{{ t('courseRegistration.whitelistBoa.programme') }}</label>
      <input v-model="form.programme" type="text" class="form-input" />

      <label>{{ t('courseRegistration.whitelistBoa.intake') }}</label>
      <input v-model="form.intake" type="text" class="form-input" />

      <label>{{ t('courseRegistration.whitelistBoa.type') }}</label>
      <select v-model="form.type" class="form-input">
        <option v-for="opt in whitelistTypes" :key="opt" :value="opt">
          {{ t(`courseRegistration.whitelistBoa.types.${opt}`) }}
        </option>
      </select>

      <label>{{ t('courseRegistration.courses.code') }}</label>
      <input v-model="form.courseCode" type="text" class="form-input" />

      <label>{{ t('courseRegistration.whitelistBoa.reason') }}</label>
      <textarea v-model="form.reason" class="form-textarea" rows="3" />
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
  grid-template-columns: 120px 1fr;
  gap: 10px 12px;
  align-items: center;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.form-textarea {
  grid-column: 2;
  resize: vertical;
}
</style>
