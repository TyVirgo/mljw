<script setup>
import { ref, computed, onMounted } from 'vue'
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
import RegistrationMonitorView from './views/courseRegistration/RegistrationMonitorView.vue'
import AddDropApprovalView from './views/courseRegistration/AddDropApprovalView.vue'
import SupplementListView from './views/courseRegistration/SupplementListView.vue'
import RegistrationResultView from './views/courseRegistration/RegistrationResultView.vue'
import AcademicAlertView from './views/courseRegistration/AcademicAlertView.vue'
import WaitlistView from './views/courseRegistration/WaitlistView.vue'
import WhitelistView from './views/courseRegistration/WhitelistView.vue'
import RegistrationReportView from './views/courseRegistration/RegistrationReportView.vue'
import CourseRegistrationFlowGuideView from './views/courseRegistration/CourseRegistrationFlowGuideView.vue'
import StudentRegisterView from './views/courseRegistration/student/StudentRegisterView.vue'
import StudentScheduleView from './views/courseRegistration/student/StudentScheduleView.vue'
import StudentAddDropView from './views/courseRegistration/student/StudentAddDropView.vue'
import StudentMyWaitlistView from './views/courseRegistration/student/StudentMyWaitlistView.vue'
import StudentMyResultView from './views/courseRegistration/student/StudentMyResultView.vue'
import RegistrationQueueOverlay from './components/courseRegistration/RegistrationQueueOverlay.vue'
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

onMounted(() => {
  processDueImplementations()
  seedStudentRegistrationDemo()
})

const appView = ref('student-records')
const currentPageId = ref('sr-student-profile')

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
const isCrMonitor = computed(() => currentPageId.value === 'cr-monitor')
const isCrApproval = computed(() => currentPageId.value === 'cr-approval')
const isCrSupplement = computed(() => currentPageId.value === 'cr-supplement')
const isCrResult = computed(() => currentPageId.value === 'cr-result')
const isCrAlert = computed(() => currentPageId.value === 'cr-alert')
const isCrWaitlist = computed(() => currentPageId.value === 'cr-waitlist')
const isCrWhitelist = computed(() => currentPageId.value === 'cr-whitelist')
const isCrReport = computed(() => currentPageId.value === 'cr-report')
const isCrsRegister = computed(() => currentPageId.value === 'crs-register')
const isCrsSchedule = computed(() => currentPageId.value === 'crs-schedule')
const isCrsAddDrop = computed(() => currentPageId.value === 'crs-adddrop')
const isCrsWaitlist = computed(() => currentPageId.value === 'crs-waitlist')
const isCrsResult = computed(() => currentPageId.value === 'crs-result')
const isCrUnderConstruction = computed(() => !courseRegistrationDevelopedPages.has(currentPageId.value))

const headerModuleKey = computed(() => {
  if (isStudentRecordsApp.value) return studentRecordsModuleKey
  if (isCourseRegistrationApp.value) return courseRegistrationModuleKey
  return basicDataModuleKey
})

const sidebarItems = computed(() => {
  if (isStudentRecordsApp.value) return studentRecordsMenuItems
  if (isCourseRegistrationApp.value) return courseRegistrationMenuItems
  return undefined
})

const sidebarExpandedGroups = computed(() => {
  if (isStudentRecordsApp.value) return ['sr-mgmt-group', 'sr-movement-group']
  if (isCourseRegistrationApp.value) {
    return ['cr-guide-group', 'cr-student-group', 'cr-config-group', 'cr-process-group', 'cr-result-group', 'cr-governance-group']
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
    <HeaderBar :title-key="headerModuleKey" @back-to-portal="goToPortal" @go-home="goToPortal" />
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
        />
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
            <RegistrationBatchView v-else-if="isCrBatch" @navigate="handleCrNavigate" />
            <RegistrationMonitorView v-else-if="isCrMonitor" @navigate="handleCrNavigate" />
            <AddDropApprovalView v-else-if="isCrApproval" />
            <SupplementListView v-else-if="isCrSupplement" />
            <RegistrationResultView v-else-if="isCrResult" />
            <AcademicAlertView v-else-if="isCrAlert" @navigate="handleCrNavigate" />
            <WaitlistView v-else-if="isCrWaitlist" />
            <WhitelistView v-else-if="isCrWhitelist" />
            <RegistrationReportView v-else-if="isCrReport" />
            <StudentRegisterView v-else-if="isCrsRegister" @navigate="handleCrNavigate" />
            <StudentScheduleView v-else-if="isCrsSchedule" />
            <StudentAddDropView v-else-if="isCrsAddDrop" />
            <StudentMyWaitlistView v-else-if="isCrsWaitlist" />
            <StudentMyResultView v-else-if="isCrsResult" />
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

  <RegistrationQueueOverlay v-if="isCourseRegistrationApp" @view-schedule="handleCrNavigate('crs-schedule')" />
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
