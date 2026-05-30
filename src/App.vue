<script setup>
import { ref, computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
import DashboardView from './views/DashboardView.vue'
import BlockManagementView from './views/BlockManagementView.vue'
import ClassroomInfoView from './views/ClassroomInfoView.vue'
import UniversityInfoView from './views/UniversityInfoView.vue'
import UnderConstructionView from './views/UnderConstructionView.vue'
import AcademicPortalView from './views/AcademicPortalView.vue'
import { developedPages, findMenuLabel } from './config/menu.js'

const appView = ref('admin')
const currentPageId = ref('dashboard')

const pageTitle = computed(() => findMenuLabel(currentPageId.value))
const isDashboard = computed(() => currentPageId.value === 'dashboard')
const isBlockManagement = computed(() => currentPageId.value === 'block-management')
const isClassroomInfo = computed(() => currentPageId.value === 'classroom-info')
const isUniversityInfo = computed(() => currentPageId.value === 'university-info')
const isUnderConstruction = computed(() => !developedPages.has(currentPageId.value))

function handleSelect(id) {
  currentPageId.value = id
}

function handleBack() {
  currentPageId.value = 'dashboard'
}

function goToPortal() {
  appView.value = 'portal'
}

function goToAdmin() {
  appView.value = 'admin'
}
</script>

<template>
  <AcademicPortalView v-if="appView === 'portal'" @back-to-admin="goToAdmin" />

  <div v-else class="app-layout">
    <HeaderBar :title="pageTitle" @back-to-portal="goToPortal" />
    <div class="app-body">
      <Sidebar :active-id="currentPageId" @select="handleSelect" />
      <main class="main-content">
        <DashboardView v-if="isDashboard" />
        <BlockManagementView v-else-if="isBlockManagement" />
        <ClassroomInfoView v-else-if="isClassroomInfo" />
        <UniversityInfoView v-else-if="isUniversityInfo" />
        <UnderConstructionView v-else-if="isUnderConstruction" @back="handleBack" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f3f4f6;
  min-width: 0;
}
</style>
