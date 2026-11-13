<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '' },
  /**
   * 课表等场景：学号/Staff ID + 姓名（过长省略，完整看 title 属性）
   */
  personLine: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  /** 课表等场景：收紧内边距，减少底部空白与滚动条 */
  dense: { type: Boolean, default: false },
  /** 内容区撑满剩余高度（课表抽屉） */
  fillBody: { type: Boolean, default: false },
  /**
   * 盖过申请弹窗等更高层遮罩（默认抽屉 1000，申请弹窗约 1100）
   * 用于「课程预览」从弹窗内打开时置顶可见
   */
  elevate: { type: Boolean, default: false },
  /**
   * 增量 bh：自定义遮罩 z-index（如审批弹窗 1400 时需 ≥1500）
   * 有值时优先于 elevate 默认档
   */
  overlayZIndex: { type: [Number, String], default: null },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

/** 遮罩样式：优先 overlayZIndex */
const overlayStyle = computed(() => {
  const z = Number(props.overlayZIndex)
  if (Number.isFinite(z) && z > 0) return { zIndex: z }
  return undefined
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="drawer-overlay"
      :class="{ 'is-dense': dense, 'is-elevate': elevate }"
      :style="overlayStyle"
      @click.self="handleClose"
    >
      <aside class="drawer-panel" role="dialog" aria-modal="true" @click.stop>
        <div class="drawer-header">
          <div class="drawer-header-text">
            <h2 class="drawer-title">{{ title || t('common.details') }}</h2>
            <p
              v-if="personLine"
              class="drawer-person-line"
              :title="personLine"
            >
              {{ personLine }}
            </p>
            <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="drawer-close" :aria-label="t('common.close')" @click="handleClose">×</button>
        </div>

        <div class="drawer-scroll" :class="{ 'is-fill': fillBody }">
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

/** 高于申请弹窗（约 1100），保证从弹窗内打开预览时完整可见 */
.drawer-overlay.is-elevate {
  z-index: 1200;
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

.drawer-header-text {
  min-width: 0;
  flex: 1;
  padding-right: 12px;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.drawer-person-line {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.drawer-scroll.is-fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.drawer-scroll.is-fill > :deep(*) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
