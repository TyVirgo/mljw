<script setup>
defineProps({
  visible: Boolean,
})

const emit = defineEmits(['close'])

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="notice-overlay" @click="handleOverlayClick">
      <div class="notice-panel" role="dialog" aria-modal="true">
        <div class="notice-header">
          <h2 class="notice-title">Notice</h2>
          <button type="button" class="notice-close" aria-label="Close" @click="emit('close')">×</button>
        </div>

        <div class="notice-body">
          <p>
            1. Please note whether the venue is a public one or a borrowable one. If the venue is a public one,
            the time/number conflict of this venue will no longer be considered during the course scheduling process;
          </p>
          <p>
            2. If the venue is a borrowable one, the usage permission of this venue will no longer be checked
            during the course scheduling process.
          </p>
        </div>

        <div class="notice-footer">
          <button type="button" class="btn-ok" @click="emit('close')">OK</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.notice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 24px;
}

.notice-panel {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 24px 28px 20px;
}

.notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.notice-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.notice-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.notice-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-body p {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.notice-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

.btn-ok {
  height: 38px;
  padding: 0 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: #2563eb;
  color: #fff;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.btn-ok:hover {
  background: #1d4ed8;
}
</style>
