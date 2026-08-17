<script setup>
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getCourseCodeSourceLines } from '../../data/courseRegistration/courseCodeSource.js'

const props = defineProps({
  /** 课程代码 */
  code: { type: String, required: true },
})

const { t } = useAppI18n()

const open = ref(false)

const sourceLines = computed(() => getCourseCodeSourceLines(props.code))

function openModal(event) {
  event?.stopPropagation?.()
  open.value = true
}

function closeModal() {
  open.value = false
}

watch(
  () => props.code,
  () => closeModal(),
)
</script>

<template>
  <span class="cr-code-source">
    <button type="button" class="link-btn cr-code-source-trigger" @click="openModal">
      {{ code }}
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        class="cr-code-source-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="code"
      >
        <div class="cr-code-source-panel" @click.stop>
          <div class="cr-code-source-header">
            <h3 class="cr-code-source-title">{{ code }}</h3>
          </div>
          <div class="cr-code-source-body">
            <p v-for="(line, idx) in sourceLines" :key="`${idx}-${line}`">{{ line }}</p>
            <p v-if="!sourceLines.length" class="cr-code-source-empty">{{ t('common.noData') }}</p>
          </div>
          <div class="cr-code-source-footer">
            <button type="button" class="cr-code-source-ok" @click="closeModal">
              {{ t('common.ok') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.cr-code-source {
  display: inline-flex;
  max-width: 100%;
}

.cr-code-source-trigger {
  background: none;
  border: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.cr-code-source-trigger:hover {
  text-decoration: underline;
}

.cr-code-source-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  box-sizing: border-box;
}

.cr-code-source-panel {
  width: min(480px, 100%);
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.28);
  overflow: hidden;
}

.cr-code-source-header {
  padding: 16px 18px 10px;
  border-bottom: 1px solid #f3f4f6;
}

.cr-code-source-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.cr-code-source-body {
  padding: 14px 18px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.55;
  color: #374151;
}

.cr-code-source-body p {
  margin: 0 0 10px;
  word-break: break-word;
}

.cr-code-source-body p:last-child {
  margin-bottom: 0;
}

.cr-code-source-empty {
  color: #9ca3af;
}

.cr-code-source-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px 16px;
  border-top: 1px solid #f3f4f6;
}

.cr-code-source-ok {
  min-width: 88px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cr-code-source-ok:hover {
  background: #1d4ed8;
}
</style>
