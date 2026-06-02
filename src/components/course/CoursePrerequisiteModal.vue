<script setup>
import { ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
  courses: { type: Array, default: () => [] },
  selectedCodes: { type: String, default: '' },
  excludeCode: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const { t, tr } = useAppI18n()

const checkedCodes = ref([])

watch(
  () => [props.visible, props.selectedCodes],
  () => {
    if (!props.visible) return
    checkedCodes.value = props.selectedCodes
      ? props.selectedCodes.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  },
)

function toggleCode(code) {
  if (checkedCodes.value.includes(code)) {
    checkedCodes.value = checkedCodes.value.filter((item) => item !== code)
  } else {
    checkedCodes.value = [...checkedCodes.value, code]
  }
}

function handleConfirm() {
  emit('confirm', checkedCodes.value.join(', '))
}

function handleClose() {
  emit('close')
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">{{ tr('Pre-requisite / co-requisite') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <p v-if="!courses.length" class="empty-hint">{{ t('common.noData') }}</p>
          <ul v-else class="course-list">
            <li v-for="course in courses" :key="course.id">
              <label class="course-option">
                <input
                  type="checkbox"
                  :checked="checkedCodes.includes(course.courseCode)"
                  :disabled="course.courseCode === excludeCode"
                  @change="toggleCode(course.courseCode)"
                />
                <span>{{ course.courseCode }} - {{ course.courseName }}</span>
              </label>
            </li>
          </ul>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="handleClose">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="handleConfirm">{{ tr('Choose') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.modal-panel {
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 80px);
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  border: none;
  background: none;
  font-size: 24px;
}

.modal-body {
  padding: 16px 24px;
  overflow: auto;
}

.empty-hint {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}

.course-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.course-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.btn-default {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
}
</style>
