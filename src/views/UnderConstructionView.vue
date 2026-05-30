<script setup>
defineEmits(['back'])
</script>

<template>
  <div class="under-construction">
    <div class="construction-card">
      <button class="back-btn" type="button" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </button>

      <div class="construction-content">
        <div class="construction-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M8 44 L32 20 L56 44" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <line x1="8" y1="44" x2="56" y2="44" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
            <line x1="20" y1="44" x2="20" y2="52" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
            <line x1="44" y1="44" x2="44" y2="52" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
            <line x1="14" y1="32" x2="18" y2="36" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" />
            <line x1="50" y1="32" x2="46" y2="36" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <p class="construction-title">This page is under construction.</p>
        <p class="construction-subtitle">Please check back later.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.under-construction {
  padding: 24px 28px;
  height: 100%;
}

.construction-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: calc(100vh - 56px - 48px);
  position: relative;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  font-size: 14px;
  color: #4b5563;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.back-btn:hover {
  color: #2563eb;
  background: #f3f4f6;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.construction-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 120px;
}

.construction-icon {
  margin-bottom: 20px;
}

.construction-icon svg {
  width: 72px;
  height: 72px;
}

.construction-title {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.construction-subtitle {
  font-size: 14px;
  color: #9ca3af;
}
</style>
