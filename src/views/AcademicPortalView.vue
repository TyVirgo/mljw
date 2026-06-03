<script setup>
import { ref, computed } from 'vue'
import UserProfileMenu from '../components/UserProfileMenu.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { useAppI18n } from '../composables/useAppI18n.js'

const emit = defineEmits(['open-basic-data'])

const { t } = useAppI18n()

const searchKeyword = ref('')
const activeTab = ref('all')
const portalScreen = ref('home')
const activeAppName = ref('')

const applications = [
  {
    id: 'basic-data',
    nameKey: 'portal.apps.basicData',
    category: 'basic',
    developed: true,
    icon: 'grid',
  },
  {
    id: 'student-records',
    nameKey: 'portal.apps.studentRecords',
    category: 'basic',
    developed: false,
    icon: 'student',
  },
]

const applicationsWithLabels = computed(() =>
  applications.map((app) => ({
    ...app,
    name: t(app.nameKey),
  })),
)

const filteredApplications = computed(() => {
  let list = applicationsWithLabels.value
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
  if (app.developed && app.id === 'basic-data') {
    emit('open-basic-data')
    return
  }
  if (!app.developed) {
    activeAppName.value = app.name
    portalScreen.value = 'under-construction'
  }
}

function backFromUnderConstruction() {
  portalScreen.value = 'home'
  activeAppName.value = ''
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

      <div class="header-title">{{ t('portal.title') }}</div>

      <div class="header-actions">
        <LanguageSwitcher />
        <UserProfileMenu variant="portal" />
      </div>
    </header>

    <main class="portal-main">
      <div class="portal-card">
        <template v-if="portalScreen === 'under-construction'">
          <div class="under-construction-panel">
            <button type="button" class="back-btn" @click="backFromUnderConstruction">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {{ t('common.back') }}
            </button>

            <div class="under-construction-body">
              <p v-if="activeAppName" class="under-app-name">{{ activeAppName }}</p>
              <div class="under-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" fill="none">
                  <path
                    d="M8 44 L32 20 L56 44"
                    stroke="#9ca3af"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                  <line x1="8" y1="44" x2="56" y2="44" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
                  <line x1="20" y1="44" x2="20" y2="52" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
                  <line x1="44" y1="44" x2="44" y2="52" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />
                  <line x1="14" y1="32" x2="18" y2="36" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" />
                  <line x1="50" y1="32" x2="46" y2="36" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" />
                </svg>
              </div>
              <p class="under-title">{{ t('underConstruction.title') }}</p>
              <p class="under-subtitle">{{ t('underConstruction.subtitle') }}</p>
              <span class="under-badge">{{ t('portal.underDevelopment') }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="card-title">
            <span class="title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <h1>{{ t('portal.title') }}</h1>
          </div>

          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              :placeholder="t('portal.searchPlaceholder')"
            />
          </div>

          <div class="tab-group">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeTab === 'all' }"
              @click="activeTab = 'all'"
            >
              {{ t('portal.tabAll') }}
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeTab === 'basic' }"
              @click="activeTab = 'basic'"
            >
              {{ t('portal.tabBasicService') }}
            </button>
          </div>

          <div class="section-heading">
            <span class="section-bar"></span>
            <span>{{ t('portal.sectionBasicService') }}</span>
          </div>

          <div class="service-grid">
            <button
              v-for="app in filteredApplications"
              :key="app.id"
              type="button"
              class="service-card"
              :class="{ pending: !app.developed }"
              @click="openApplication(app)"
            >
              <span class="service-icon" :class="{ 'icon-student': app.icon === 'student' }" aria-hidden="true">
                <svg
                  v-if="app.icon === 'student'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 19v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 11v3" />
                  <path d="M10 14h4" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span class="service-name">{{ app.name }}</span>
              <span v-if="!app.developed" class="service-badge">{{ t('portal.underDevelopment') }}</span>
              <span class="service-deco" aria-hidden="true"></span>
            </button>
          </div>
        </template>
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
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
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

.service-card.pending {
  border-style: dashed;
  border-color: #cbd5e1;
}

.service-card.pending:hover {
  border-color: #93c5fd;
  border-style: solid;
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

.service-icon.icon-student {
  background: #1d4ed8;
}

.service-icon svg {
  width: 20px;
  height: 20px;
}

.service-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
}

.service-badge {
  font-size: 11px;
  font-weight: 500;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 2px 8px;
  border-radius: 4px;
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

.under-construction-panel {
  min-height: 420px;
  position: relative;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  margin-bottom: 24px;
  font-size: 14px;
  color: #4b5563;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.back-btn:hover {
  color: #2563eb;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.under-construction-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px 64px;
  text-align: center;
}

.under-app-name {
  font-size: 16px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 20px;
}

.under-icon svg {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.under-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.under-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.under-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 4px 12px;
  border-radius: 999px;
}
</style>
