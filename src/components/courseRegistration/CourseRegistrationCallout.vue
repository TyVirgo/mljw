<script setup>
defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'warning', 'rule'].includes(v),
  },
})
</script>

<template>
  <div class="cr-callout" :class="`cr-callout--${variant}`">
    <span class="cr-callout__icon" aria-hidden="true">
      <template v-if="variant === 'info'">i</template>
      <template v-else>!</template>
    </span>
    <div class="cr-callout__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cr-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.55;
}

.cr-callout--info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.cr-callout--warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.cr-callout--rule {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.cr-callout__icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  margin-top: 1px;
}

.cr-callout--info .cr-callout__icon {
  background: #2563eb;
  color: #fff;
}

.cr-callout--warning .cr-callout__icon {
  background: #d97706;
  color: #fff;
}

.cr-callout--rule .cr-callout__icon {
  background: #2563eb;
  color: #fff;
}

.cr-callout__body {
  flex: 1;
  min-width: 0;
}

.cr-callout__body :deep(p) {
  margin: 0;
}

.cr-callout__body :deep(p + p),
.cr-callout__body :deep(ul) {
  margin-top: 8px;
}

.cr-callout__body :deep(ul) {
  margin-bottom: 0;
  padding-left: 18px;
}

.cr-callout__body :deep(li + li) {
  margin-top: 4px;
}

.cr-callout__body :deep(strong) {
  font-weight: 600;
}
</style>
