<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  labelKey: { type: String, required: true },
  hintKey: { type: String, required: true },
})

const { t } = useAppI18n()

const hintVisible = ref(false)
const hintStyle = ref({ top: '0px', left: '0px' })

function showHint(event) {
  const target = event.currentTarget
  if (!target?.getBoundingClientRect) return
  const rect = target.getBoundingClientRect()
  hintStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left + rect.width / 2}px`,
  }
  hintVisible.value = true
}

function hideHint() {
  hintVisible.value = false
}
</script>

<template>
  <span class="table-header-field-label">
    {{ t(labelKey) }}
    <span
      class="field-hint-tip-wrap"
      tabindex="0"
      :aria-label="t(hintKey)"
      @mouseenter="showHint"
      @mouseleave="hideHint"
      @focusin="showHint"
      @focusout="hideHint"
    >
      <span class="field-hint-icon" aria-hidden="true">?</span>
    </span>
  </span>
  <Teleport to="body">
    <span
      v-if="hintVisible"
      class="table-header-hint-tooltip"
      role="tooltip"
      :style="hintStyle"
    >
      {{ t(hintKey) }}
    </span>
  </Teleport>
</template>

<style scoped>
.table-header-field-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.field-hint-tip-wrap {
  display: inline-flex;
  align-items: center;
  outline: none;
  cursor: help;
}

.field-hint-icon {
  width: 14px;
  height: 14px;
  border: 1px solid #9ca3af;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
</style>

<style>
.table-header-hint-tooltip {
  position: fixed;
  transform: translateX(-50%);
  width: max-content;
  max-width: min(320px, calc(100vw - 24px));
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 400;
  color: #374151;
  text-align: left;
  white-space: normal;
  pointer-events: none;
  z-index: 2000;
}

.table-header-hint-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #fff;
  filter: drop-shadow(0 -1px 0 #e5e7eb);
}
</style>
