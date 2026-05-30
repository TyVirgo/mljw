<script setup>
import UserProfileMenu from './UserProfileMenu.vue'

defineProps({
  title: {
    type: String,
    default: 'Dashboard',
  },
})

defineEmits(['back-to-portal'])
</script>

<template>
  <header class="header">
    <div class="header-brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">Academic Admin</span>
        <span class="brand-subtitle">Management System</span>
      </div>
    </div>

    <span class="header-divider" aria-hidden="true"></span>

    <h1 class="header-title">{{ title }}</h1>

    <div class="header-actions">
      <button class="notification-btn" aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span class="notification-dot"></span>
      </button>
      <UserProfileMenu variant="admin" @back-to-portal="$emit('back-to-portal')" />
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 56px;
  background: #2563eb;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-brand {
  width: 260px;
  min-width: 260px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  box-sizing: border-box;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-icon svg {
  width: 24px;
  height: 24px;
  color: #fff;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  white-space: nowrap;
}

.brand-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.2;
  white-space: nowrap;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
}

.header-title {
  flex: 1;
  min-width: 0;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-right: 24px;
  flex-shrink: 0;
}

.notification-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 8px;
  transition: background 0.15s;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.notification-btn svg {
  width: 20px;
  height: 20px;
}

.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #2563eb;
}
</style>
