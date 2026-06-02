<script setup>
import { ref, computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'
import PageBreadcrumb from './components/PageBreadcrumb.vue'
import DashboardView from './views/DashboardView.vue'
import BlockManagementView from './views/BlockManagementView.vue'
import ClassroomInfoView from './views/ClassroomInfoView.vue'
import UniversityInfoView from './views/UniversityInfoView.vue'
import DepartmentInfoView from './views/DepartmentInfoView.vue'
import CodeSetManagementView from './views/CodeSetManagementView.vue'
import ProgrammeVersionView from './views/ProgrammeVersionView.vue'
import IntakeSetView from './views/IntakeSetView.vue'
import ProgrammeIntakeView from './views/ProgrammeIntakeView.vue'
import LecturerInformationView from './views/LecturerInformationView.vue'
import SemesterInformationView from './views/SemesterInformationView.vue'
import CalendarView from './views/CalendarView.vue'
import CourseInformationView from './views/CourseInformationView.vue'
import UnderConstructionView from './views/UnderConstructionView.vue'
import AcademicPortalView from './views/AcademicPortalView.vue'
import { developedPages, basicDataModuleKey } from './config/menu.js'

const appView = ref('admin')
const currentPageId = ref('dashboard')

const isDashboard = computed(() => currentPageId.value === 'dashboard')
const isBlockManagement = computed(() => currentPageId.value === 'block-management')
const isClassroomInfo = computed(() => currentPageId.value === 'classroom-info')
const isUniversityInfo = computed(() => currentPageId.value === 'university-info')
const isDepartmentInfo = computed(() => currentPageId.value === 'department-info')
const isCodeSetManagement = computed(() => currentPageId.value === 'code-set-management')
const isProgrammeVersion = computed(() => currentPageId.value === 'programme-version')
const isIntakeSet = computed(() => currentPageId.value === 'intake-set')
const isProgrammeIntake = computed(() => currentPageId.value === 'programme-intake')
const isSemesterInformation = computed(() => currentPageId.value === 'semester-information')
const isCalendar = computed(() => currentPageId.value === 'calendar')
const isCourseInformation = computed(() => currentPageId.value === 'course-information')
const isLecturerInformation = computed(() => currentPageId.value === 'lecturer-information')
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

function openBasicDataAdmin() {
  appView.value = 'admin'
  currentPageId.value = 'dashboard'
}
</script>

<template>
  <AcademicPortalView v-if="appView === 'portal'" @back-to-admin="goToAdmin" @open-basic-data="openBasicDataAdmin" />

  <div v-else class="app-layout">
    <HeaderBar :title-key="basicDataModuleKey" @back-to-portal="goToPortal" @go-home="goToPortal" />
    <div class="app-body">
      <Sidebar :active-id="currentPageId" @select="handleSelect" />
      <div class="content-column">
        <PageBreadcrumb :page-id="currentPageId" />
        <main class="main-content">
          <DashboardView v-if="isDashboard" @navigate="handleSelect" />
          <BlockManagementView v-else-if="isBlockManagement" />
          <ClassroomInfoView v-else-if="isClassroomInfo" />
          <UniversityInfoView v-else-if="isUniversityInfo" />
          <DepartmentInfoView v-else-if="isDepartmentInfo" />
          <CodeSetManagementView v-else-if="isCodeSetManagement" />
          <ProgrammeVersionView v-else-if="isProgrammeVersion" />
          <IntakeSetView v-else-if="isIntakeSet" />
          <ProgrammeIntakeView v-else-if="isProgrammeIntake" />
          <SemesterInformationView v-else-if="isSemesterInformation" />
          <CalendarView v-else-if="isCalendar" />
          <CourseInformationView v-else-if="isCourseInformation" />
          <LecturerInformationView v-else-if="isLecturerInformation" />
          <UnderConstructionView v-else-if="isUnderConstruction" @back="handleBack" />
        </main>
      </div>
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

.content-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f3f4f6;
  min-width: 0;
}
</style>
