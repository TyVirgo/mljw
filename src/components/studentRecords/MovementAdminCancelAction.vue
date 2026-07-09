<script setup>
import { ref } from 'vue'
import ConfirmDialog from '../common/ConfirmDialog.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  canAdminCancelMovement,
  applyAdminCancelInStore,
} from '../../data/movementApplicationCancel.js'

const props = defineProps({
  sourceKey: { type: String, required: true },
  item: { type: Object, required: true },
  entryPoint: {
    type: String,
    default: 'approval-history',
    validator: (value) => ['approval-history'].includes(value),
  },
})

const emit = defineEmits(['cancelled'])

const { t } = useAppI18n()

const tooltipItem1Key = 'movementAdminCancel.tooltipApprovalHistoryItem1'

const confirmVisible = ref(false)
const tooltipVisible = ref(false)
const tooltipStyle = ref({ top: '0px', left: '0px' })

function showTooltip(event) {
  const target = event.currentTarget
  if (!target?.getBoundingClientRect) return
  const rect = target.getBoundingClientRect()
  tooltipStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.min(rect.left, window.innerWidth - 320)}px`,
  }
  tooltipVisible.value = true
}

function hideTooltip() {
  tooltipVisible.value = false
}

function openConfirm() {
  confirmVisible.value = true
}

function handleConfirm() {
  confirmVisible.value = false
  applyAdminCancelInStore(props.sourceKey, props.item)
  emit('cancelled')
}

function handleDismissConfirm() {
  confirmVisible.value = false
}
</script>

<template>
  <span v-if="canAdminCancelMovement(item)" class="movement-admin-cancel">
    <span class="movement-admin-cancel__trigger">
      <button type="button" class="link-btn" @click="openConfirm">
        {{ t('movementAdminCancel.action') }}
      </button>
      <span
        class="movement-admin-cancel__tip-wrap"
        tabindex="0"
        :aria-label="t('movementAdminCancel.tooltipTitle')"
        @mouseenter="showTooltip"
        @mouseleave="hideTooltip"
        @focusin="showTooltip"
        @focusout="hideTooltip"
      >
        <span class="movement-admin-cancel__tip-icon" aria-hidden="true">?</span>
      </span>
    </span>
    <Teleport to="body">
      <div
        v-if="tooltipVisible"
        class="movement-admin-cancel__tooltip"
        role="tooltip"
        :style="tooltipStyle"
      >
        <p class="movement-admin-cancel__tooltip-title">{{ t('movementAdminCancel.tooltipTitle') }}</p>
        <ul>
          <li>{{ t(tooltipItem1Key) }}</li>
          <li>{{ t('movementAdminCancel.tooltipItem2') }}</li>
        </ul>
      </div>
    </Teleport>
    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('movementAdminCancel.confirmTitle')"
      :message="t('movementAdminCancel.confirmMessage')"
      :confirm-text="t('movementAdminCancel.action')"
      :cancel-text="t('common.cancel')"
      @confirm="handleConfirm"
      @cancel="handleDismissConfirm"
    />
  </span>
</template>

<style scoped>
.link-btn {
  font-size: 13px;
  color: #2563eb;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.movement-admin-cancel__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.movement-admin-cancel__tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  outline: none;
}

.movement-admin-cancel__tip-icon {
  width: 14px;
  height: 14px;
  border: 1px solid #9ca3af;
  border-radius: 50%;
  background: #f3f4f6;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: help;
}

.movement-admin-cancel__tooltip {
  position: fixed;
  z-index: 1100;
  width: min(320px, calc(100vw - 32px));
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  color: #374151;
  pointer-events: none;
}

.movement-admin-cancel__tooltip-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: #111827;
}

.movement-admin-cancel__tooltip ul {
  margin: 0;
  padding-left: 18px;
}

.movement-admin-cancel__tooltip li + li {
  margin-top: 4px;
}
</style>
