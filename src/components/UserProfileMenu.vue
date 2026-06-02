<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppI18n } from '../composables/useAppI18n.js'

defineProps({
  variant: {
    type: String,
    default: 'admin',
    validator: (value) => ['admin', 'portal'].includes(value),
  },
})

const emit = defineEmits(['back-to-portal', 'back-to-admin'])

const { t } = useAppI18n()
const open = ref(false)
const menuRef = ref(null)

function toggleMenu() {
  open.value = !open.value
}

function closeMenu() {
  open.value = false
}

function handleBackToPortal() {
  emit('back-to-portal')
  closeMenu()
}

function handleBackToAdmin() {
  emit('back-to-admin')
  closeMenu()
}

function handleDocumentClick(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onUnmounted(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <div ref="menuRef" class="user-menu">
    <button type="button" class="user-trigger" @click.stop="toggleMenu">
      <div class="user-avatar">A</div>
      <span class="user-name">{{ variant === 'portal' ? t('user.adminUserUpper') : t('user.adminUser') }}</span>
    </button>

    <div v-if="open" class="dropdown-panel">
      <button type="button" class="menu-item" @click="closeMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {{ t('user.userRole') }}
      </button>

      <button
        v-if="variant === 'admin'"
        type="button"
        class="menu-item"
        @click="handleBackToPortal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {{ t('user.backToPortal') }}
      </button>

      <button
        v-else
        type="button"
        class="menu-item"
        @click="handleBackToAdmin"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {{ t('user.backToAdmin') }}
      </button>

      <button type="button" class="menu-item menu-item-danger" @click="closeMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {{ t('user.logout') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  color: #fff;
  border-radius: 8px;
  transition: opacity 0.15s;
}

.user-trigger:hover {
  opacity: 0.92;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  padding: 6px 0;
  z-index: 100;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
  color: #374151;
  text-align: left;
  transition: background 0.15s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.menu-item-danger {
  color: #ef4444;
}
</style>
