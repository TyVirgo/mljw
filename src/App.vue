<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
import EvaluationSettingsView from './views/EvaluationSettingsView.vue'
import SemesterInformationView from './views/SemesterInformationView.vue'
import CalendarView from './views/CalendarView.vue'
import CourseInformationView from './views/CourseInformationView.vue'
import CourseApplicationView from './views/CourseApplicationView.vue'
import CourseApprovalView from './views/CourseApprovalView.vue'
import CourseChangeApplicationView from './views/CourseChangeApplicationView.vue'
import CourseChangeReviewView from './views/CourseChangeReviewView.vue'
import StudentProfileView from './views/studentRecords/StudentProfileView.vue'
import StudentMovementApplicationView from './views/studentRecords/StudentMovementApplicationView.vue'
import MovementApprovalView from './views/studentRecords/MovementApprovalView.vue'
import MovementCategoryView from './views/studentRecords/MovementCategoryView.vue'
import ConsentFormView from './views/studentRecords/ConsentFormView.vue'
import MovementMaintenanceView from './views/studentRecords/MovementMaintenanceView.vue'
import MovementQueryView from './views/studentRecords/MovementQueryView.vue'
import MovementStatisticsView from './views/studentRecords/MovementStatisticsView.vue'
import MovementRuleSettingsView from './views/studentRecords/MovementRuleSettingsView.vue'
import RegistrationBatchView from './views/courseRegistration/RegistrationBatchView.vue'
import RegistrationScheduleView from './views/courseRegistration/RegistrationScheduleView.vue'
import RegistrationRuleSettingsView from './views/courseRegistration/RegistrationRuleSettingsView.vue'
import RegistrationMonitorView from './views/courseRegistration/RegistrationMonitorView.vue'
import AddDropApprovalView from './views/courseRegistration/AddDropApprovalView.vue'
import SupplementListView from './views/courseRegistration/SupplementListView.vue'
import RegistrationResultView from './views/courseRegistration/RegistrationResultView.vue'
import RegistrationLogView from './views/courseRegistration/RegistrationLogView.vue'
import FeeRosterView from './views/courseRegistration/FeeRosterView.vue'
import CourseRegistrationFlowGuideView from './views/courseRegistration/CourseRegistrationFlowGuideView.vue'
import StudentRegisterView from './views/courseRegistration/student/StudentRegisterView.vue'
import StudentAddDropView from './views/courseRegistration/student/StudentAddDropView.vue'
import StudentMyResultView from './views/courseRegistration/student/StudentMyResultView.vue'
import RegistrationQueueOverlay from './components/courseRegistration/RegistrationQueueOverlay.vue'
import ModuleBriefPanel from './components/courseRegistration/ModuleBriefPanel.vue'
import UnderConstructionView from './views/UnderConstructionView.vue'
import AcademicPortalView from './views/AcademicPortalView.vue'
import { developedPages, basicDataModuleKey } from './config/menu.js'
import {
  studentRecordsDevelopedPages,
  studentRecordsMenuItems,
  studentRecordsModuleKey,
} from './config/studentRecordsMenu.js'
import {
  courseRegistrationDevelopedPages,
  courseRegistrationMenuItems,
  courseRegistrationModuleKey,
} from './config/courseRegistrationMenu.js'
import { processDueImplementations } from './data/movementImplementationScheduler.js'
import { seedStudentRegistrationDemo } from './data/courseRegistration/studentDemoSeed.js'
import { useAppI18n } from './composables/useAppI18n.js'

const { t } = useAppI18n()

onMounted(() => {
  processDueImplementations()
  seedStudentRegistrationDemo()
})

const appView = ref('portal')
const currentPageId = ref('dashboard')
const crsRegisterViewRef = ref(null)
const crsRegisterListActive = ref(false)
const crsRegisterExtraCrumbs = ref([])

const isStudentRecordsApp = computed(() => appView.value === 'student-records')
const isCourseRegistrationApp = computed(() => appView.value === 'course-registration')

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
const isCourseApplication = computed(() => currentPageId.value === 'course-application')
const isCourseApproval = computed(() => currentPageId.value === 'course-approval-process')
const isCourseChangeApplication = computed(() => currentPageId.value === 'course-change-application')
const isCourseChangeReview = computed(() => currentPageId.value === 'course-change-review')
const isLecturerInformation = computed(() => currentPageId.value === 'lecturer-information')
const isEvaluationSettings = computed(() => currentPageId.value === 'evaluation-settings')
const isUnderConstruction = computed(() => !developedPages.has(currentPageId.value))

const isStudentProfile = computed(() => currentPageId.value === 'sr-student-profile')
const isMovementApplicationTeacher = computed(
  () => currentPageId.value === 'sr-movement-application-teacher',
)
const isMovementApplicationStudent = computed(
  () => currentPageId.value === 'sr-movement-application-student',
)
const isMovementApproval = computed(() => currentPageId.value === 'sr-movement-approval')
const isMovementCategory = computed(() => currentPageId.value === 'sr-movement-category')
const isConsentForm = computed(() => currentPageId.value === 'sr-consent-form')
const isMovementRules = computed(() => currentPageId.value === 'sr-movement-rules')
const isMovementMaintenance = computed(() => currentPageId.value === 'sr-movement-maintenance')
const isMovementQuery = computed(() => currentPageId.value === 'sr-movement-query')
const isMovementStatistics = computed(() => currentPageId.value === 'sr-movement-statistics')
const isSrUnderConstruction = computed(() => !studentRecordsDevelopedPages.has(currentPageId.value))

const isCrFlowGuide = computed(() => currentPageId.value === 'cr-flow-guide')
const isCrBatch = computed(() => currentPageId.value === 'cr-batch')
const isCrSchedule = computed(() => currentPageId.value === 'cr-schedule')
const isCrRules = computed(() => currentPageId.value === 'cr-rules')
const isCrMonitor = computed(() => currentPageId.value === 'cr-monitor')
const isCrApproval = computed(() => currentPageId.value === 'cr-approval')
const isCrSupplement = computed(() => currentPageId.value === 'cr-supplement')
const isCrResult = computed(() => currentPageId.value === 'cr-result')
const isCrLog = computed(() => currentPageId.value === 'cr-log')
const isCrFeeRoster = computed(() => currentPageId.value === 'cr-fee-roster')
const isCrsRegister = computed(() => currentPageId.value === 'crs-register')
const isCrsAddDrop = computed(() => currentPageId.value === 'crs-adddrop')
const isCrsResult = computed(() => currentPageId.value === 'crs-result')
const isCrUnderConstruction = computed(() => !courseRegistrationDevelopedPages.has(currentPageId.value))

const headerModuleKey = computed(() => {
  if (isStudentRecordsApp.value) return studentRecordsModuleKey
  if (isCourseRegistrationApp.value) return courseRegistrationModuleKey
  return basicDataModuleKey
})

/** 顶栏左侧品牌随三模块切换：basicData | studentRecords | courseRegistration */
const headerBrandModule = computed(() => {
  if (isStudentRecordsApp.value) return 'studentRecords'
  if (isCourseRegistrationApp.value) return 'courseRegistration'
  return 'basicData'
})

const sidebarItems = computed(() => {
  if (isStudentRecordsApp.value) return studentRecordsMenuItems
  if (isCourseRegistrationApp.value) return courseRegistrationMenuItems
  return undefined
})

const sidebarExpandedGroups = computed(() => {
  if (isStudentRecordsApp.value) return ['sr-mgmt-group', 'sr-movement-group']
  if (isCourseRegistrationApp.value) {
    return ['cr-guide-group', 'cr-student-group', 'cr-config-group', 'cr-process-group', 'cr-result-group']
  }
  return undefined
})

function handleSelect(id) {
  currentPageId.value = id === 'cr-courses' ? 'cr-batch' : id
}

function handleBack() {
  currentPageId.value = 'dashboard'
}

function handleSrBack() {
  currentPageId.value = 'sr-student-profile'
}

function goToPortal() {
  appView.value = 'portal'
}

function openBasicDataAdmin() {
  appView.value = 'admin'
  currentPageId.value = 'dashboard'
}

function openStudentRecordsApp() {
  appView.value = 'student-records'
  currentPageId.value = 'sr-student-profile'
}

function openCourseRegistrationApp() {
  appView.value = 'course-registration'
  currentPageId.value = 'crs-register'
}

function handleCrBack() {
  currentPageId.value = 'cr-batch'
}

function handleCrNavigate(pageId) {
  currentPageId.value = pageId === 'cr-courses' ? 'cr-batch' : pageId
}

function onCrsRegisterListActive(active) {
  crsRegisterListActive.value = Boolean(active)
}

function onCrsRegisterBreadcrumbExtra(crumbs) {
  crsRegisterExtraCrumbs.value = Array.isArray(crumbs) ? crumbs.filter(Boolean) : []
}

function handleCrsRegisterBack() {
  crsRegisterViewRef.value?.backToCatalog?.()
}

watch(isCrsRegister, (on) => {
  if (!on) {
    crsRegisterListActive.value = false
    crsRegisterExtraCrumbs.value = []
  }
})

function openStudentPreviewPortal() {
  currentPageId.value = 'sr-movement-application-student'
}
</script>

<template>
  <AcademicPortalView
    v-if="appView === 'portal'"
    @open-basic-data="openBasicDataAdmin"
    @open-student-records="openStudentRecordsApp"
    @open-course-registration="openCourseRegistrationApp"
  />

  <div v-else class="app-layout">
    <HeaderBar
      :title-key="headerModuleKey"
      :brand-module="headerBrandModule"
      @back-to-portal="goToPortal"
      @go-home="goToPortal"
    />
    <div class="app-body">
      <Sidebar
        :active-id="currentPageId"
        :items="sidebarItems"
        :default-expanded-groups="sidebarExpandedGroups"
        @select="handleSelect"
      />
      <div class="content-column">
        <PageBreadcrumb
          :page-id="currentPageId"
          :module-key="headerModuleKey"
          :items="sidebarItems ?? undefined"
          :extra-crumbs="isCrsRegister ? crsRegisterExtraCrumbs : []"
        >
          <template v-if="isCourseRegistrationApp" #trailing>
            <button
              v-if="isCrsRegister && crsRegisterListActive"
              type="button"
              class="crs-register-back-btn"
              @click="handleCrsRegisterBack"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {{ t('courseRegistration.student.typeEntry.backToCatalog') }}
            </button>
            <ModuleBriefPanel v-else-if="!isCrsRegister" :page-id="currentPageId" />
          </template>
        </PageBreadcrumb>
        <main class="main-content">
          <template v-if="isStudentRecordsApp">
            <StudentProfileView v-if="isStudentProfile" @preview-student="openStudentPreviewPortal" />
            <MovementCategoryView v-else-if="isMovementCategory" />
            <ConsentFormView v-else-if="isConsentForm" />
            <MovementRuleSettingsView v-else-if="isMovementRules" />
            <StudentMovementApplicationView
              v-else-if="isMovementApplicationTeacher"
              applicant-mode="teacher"
            />
            <StudentMovementApplicationView
              v-else-if="isMovementApplicationStudent"
              applicant-mode="student"
            />
            <MovementApprovalView v-else-if="isMovementApproval" />
            <MovementMaintenanceView v-else-if="isMovementMaintenance" />
            <MovementQueryView v-else-if="isMovementQuery" />
            <MovementStatisticsView v-else-if="isMovementStatistics" />
            <UnderConstructionView v-else-if="isSrUnderConstruction" @back="handleSrBack" />
          </template>

          <template v-else-if="isCourseRegistrationApp">
            <CourseRegistrationFlowGuideView v-if="isCrFlowGuide" @navigate="handleCrNavigate" />
            <RegistrationScheduleView v-else-if="isCrSchedule" />
            <RegistrationBatchView v-else-if="isCrBatch" @navigate="handleCrNavigate" />
            <RegistrationRuleSettingsView v-else-if="isCrRules" />
            <RegistrationMonitorView v-else-if="isCrMonitor" @navigate="handleCrNavigate" />
            <AddDropApprovalView v-else-if="isCrApproval" />
            <SupplementListView v-else-if="isCrSupplement" />
            <RegistrationResultView v-else-if="isCrResult" />
            <RegistrationLogView v-else-if="isCrLog" />
            <FeeRosterView v-else-if="isCrFeeRoster" />
            <StudentRegisterView
              v-else-if="isCrsRegister"
              ref="crsRegisterViewRef"
              @navigate="handleCrNavigate"
              @list-active="onCrsRegisterListActive"
              @breadcrumb-extra="onCrsRegisterBreadcrumbExtra"
            />
            <StudentAddDropView v-else-if="isCrsAddDrop" @navigate="handleCrNavigate" />
            <StudentMyResultView v-else-if="isCrsResult" @navigate="handleCrNavigate" />
            <UnderConstructionView v-else-if="isCrUnderConstruction" @back="handleCrBack" />
          </template>

          <template v-else>
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
            <CourseApplicationView v-else-if="isCourseApplication" />
            <CourseApprovalView v-else-if="isCourseApproval" />
            <CourseChangeApplicationView v-else-if="isCourseChangeApplication" />
            <CourseChangeReviewView v-else-if="isCourseChangeReview" />
            <LecturerInformationView v-else-if="isLecturerInformation" />
            <EvaluationSettingsView v-else-if="isEvaluationSettings" />
            <UnderConstructionView v-else-if="isUnderConstruction" @back="handleBack" />
          </template>
        </main>
      </div>
    </div>
  </div>

  <RegistrationQueueOverlay
    v-if="isCourseRegistrationApp"
    @view-round-status="handleCrNavigate('crs-register')"
  />
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

.crs-register-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.crs-register-back-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.crs-register-back-btn:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

</style>
