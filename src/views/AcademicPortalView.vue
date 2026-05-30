<script setup>
import { ref, computed } from 'vue'
import UserProfileMenu from '../components/UserProfileMenu.vue'

const emit = defineEmits(['back-to-admin', 'open-basic-data'])

const searchKeyword = ref('')
const activeTab = ref('all')

const applications = [
  {
    id: 'basic-data',
    name: 'Basic Data',
    category: 'basic',
  },
]

const filteredApplications = computed(() => {
  let list = applications
  if (activeTab.value === 'basic') {
    list = list.filter((app) => app.category === 'basic')
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter((app) => app.name.toLowerCase().includes(keyword))
  }
  return list
})

function openApplication(app) {
  if (app.id === 'basic-data') {
    emit('open-basic-data')
  }
}
</script>

<template>
  <div class="portal-page">
    <header class="portal-header">
      <div class="header-brand">
        <div class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 3L2 9l10 6 10-6-10-6z" />
            <path d="M2 15l10 6 10-6" />
            <path d="M2 12l10 6 10-6" />
          </svg>
        </div>
        <div class="brand-text">
          <div class="brand-en">XIAMEN UNIVERSITY MALAYSIA</div>
          <div class="brand-zh">厦门大学马来西亚分校</div>
        </div>
      </div>

      <div class="header-title">Academic Portal</div>

      <div class="header-actions">
        <UserProfileMenu variant="portal" @back-to-admin="$emit('back-to-admin')" />
      </div>
    </header>

    <main class="portal-main">
      <div class="portal-card">
        <div class="card-title">
          <span class="title-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          <h1>Academic Portal</h1>
        </div>

        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Please input application name"
          />
        </div>

        <div class="tab-group">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            All
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'basic' }"
            @click="activeTab = 'basic'"
          >
            Basic Service
          </button>
        </div>

        <div class="section-heading">
          <span class="section-bar"></span>
          <span>Basic Service</span>
        </div>

        <div class="service-grid">
          <button
            v-for="app in filteredApplications"
            :key="app.id"
            type="button"
            class="service-card"
            @click="openApplication(app)"
          >
            <span class="service-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span class="service-name">{{ app.name }}</span>
            <span class="service-deco" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.portal-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 38%, #f8fafc 100%);
}

.portal-header {
  height: 56px;
  background: #2563eb;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.brand-logo svg {
  width: 28px;
  height: 28px;
}

.brand-text {
  min-width: 0;
}

.brand-en {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  line-height: 1.3;
}

.brand-zh {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.3;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.portal-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 36px 0 48px;
  box-sizing: border-box;
}

.portal-card {
  width: 75%;
  min-width: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.08);
  padding: 36px 48px 48px;
  box-sizing: border-box;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon svg {
  width: 24px;
  height: 24px;
}

.card-title h1 {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 44px;
  padding: 0 18px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  margin-bottom: 22px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #111827;
  background: transparent;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.tab-group {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.tab-btn {
  height: 34px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: all 0.15s;
}

.tab-btn.active {
  color: #fff;
  background: #2563eb;
  border-color: #2563eb;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.section-bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: #2563eb;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 200px));
  gap: 20px;
}

.service-card {
  position: relative;
  width: 180px;
  min-height: 88px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.service-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}

.service-card:active {
  border-color: #2563eb;
}

.service-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-icon svg {
  width: 20px;
  height: 20px;
}

.service-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.service-deco {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0) 70%);
}
</style>
