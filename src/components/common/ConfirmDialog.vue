<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
  title: {
    type: String,
    default: 'Confirm',
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?',
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  confirmVariant: {
    type: String,
    default: 'danger',
    validator: (value) => ['danger', 'primary'].includes(value),
  },
  wide: {
    type: Boolean,
    default: false,
  },
  /** 覆盖默认 1100，用于压过更高层级弹窗 */
  zIndex: {
    type: [Number, String],
    default: 1100,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

const { tr } = useAppI18n()

const displayTitle = computed(() => tr(props.title))
const displayMessage = computed(() => tr(props.message))
const displayConfirmText = computed(() => tr(props.confirmText))
const displayCancelText = computed(() => tr(props.cancelText))
const overlayStyle = computed(() => ({ zIndex: Number(props.zIndex) || 1100 }))

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="confirm-overlay"
      :style="overlayStyle"
      @click="handleOverlayClick"
    >
      <div class="confirm-panel" :class="{ wide }" role="alertdialog" aria-modal="true">
        <h3 class="confirm-title">{{ displayTitle }}</h3>
        <p class="confirm-message">{{ displayMessage }}</p>
        <div class="confirm-footer">
          <button type="button" class="btn btn-default" @click="emit('cancel')">
            {{ displayCancelText }}
          </button>
          <button
            type="button"
            class="btn"
            :class="confirmVariant === 'primary' ? 'btn-primary' : 'btn-danger'"
            @click="emit('confirm')"
          >
            {{ displayConfirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.confirm-panel {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 24px;
}

.confirm-panel.wide {
  max-width: 560px;
}

.confirm-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 24px;
}

.confirm-panel.wide .confirm-message {
  white-space: nowrap;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.btn-default {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-default:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
