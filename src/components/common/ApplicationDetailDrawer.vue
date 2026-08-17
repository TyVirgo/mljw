<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'

defineProps({
  visible: Boolean,
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  /** 课表等场景：收紧内边距，减少底部空白与滚动条 */
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="drawer-overlay" :class="{ 'is-dense': dense }" @click.self="handleClose">
      <aside class="drawer-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="drawer-header">
          <div>
            <h2 class="drawer-title">{{ title || t('common.details') }}</h2>
            <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="drawer-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="drawer-scroll">
          <slot />
        </div>

        <div v-if="$slots.footer" class="drawer-footer">
          <slot name="footer" />
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: min(1080px, 92vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.drawer-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}

.drawer-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.drawer-overlay.is-dense .drawer-header {
  padding: 10px 20px;
}

.drawer-overlay.is-dense .drawer-scroll {
  padding: 10px 16px 8px;
}

.drawer-overlay.is-dense .drawer-footer {
  padding: 10px 16px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.drawer-footer :deep(.btn) {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.drawer-footer :deep(.btn-primary) {
  background: #2563eb;
  color: #fff;
  border: 1px solid #2563eb;
}

.drawer-footer :deep(.btn-default) {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.drawer-footer :deep(.btn-outline) {
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
}
</style>
