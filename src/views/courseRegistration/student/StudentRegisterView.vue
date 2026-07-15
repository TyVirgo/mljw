<script setup>
import { ref, computed } from 'vue'
import StudentPageShell from '../../../components/courseRegistration/StudentPageShell.vue'
import RoundTimelineBar from '../../../components/courseRegistration/RoundTimelineBar.vue'
import StudentCourseDetailDrawer from '../../../components/courseRegistration/StudentCourseDetailDrawer.vue'
import StudentSectionPickerDrawer from '../../../components/courseRegistration/StudentSectionPickerDrawer.vue'
import { useAppI18n } from '../../../composables/useAppI18n.js'
import { getActiveBatch } from '../../../data/courseRegistration/registrationBatches.js'
import {
  registrationCart,
  cartTotalCredits,
  addToCart,
  addWaitlistToCart,
  removeFromCart,
  submitRegistrationCart,
  getSelectableCoursesForStudent,
  isCourseInCart,
} from '../../../data/courseRegistration/studentRegistrationStore.js'
import {
  getStudentCreditSummary,
  getActiveRoundPhase,
  filterStudentCourseList,
  filterCoursesByRound,
  getRoundPanelNoteKey,
} from '../../../data/courseRegistration/studentRegistrationContext.js'
import { courseTypeOptions, getRegistrationTypeLabel } from '../../../data/courseRegistration/registrationTypes.js'
import '../../../styles/course-registration-list.css'
import '../../../styles/course-registration-student.css'

const emit = defineEmits(['navigate'])

const { t } = useAppI18n()

const activeBatch = computed(() => getActiveBatch())
const creditSummary = computed(() => getStudentCreditSummary())
const selectedRound = ref(getActiveRoundPhase(getActiveBatch()).key)

const searchForm = ref({ keyword: '', type: '', availability: '', eligibility: '' })
const appliedSearch = ref({ keyword: '', type: '', availability: '', eligibility: '' })

const allCourses = computed(() => getSelectableCoursesForStudent())
const roundFilteredCourses = computed(() =>
  filterCoursesByRound(allCourses.value, selectedRound.value),
)
const courses = computed(() =>
  filterStudentCourseList(roundFilteredCourses.value, appliedSearch.value),
)
const isPreselectRound = computed(() => selectedRound.value === 'preselect')
const isCartRound = computed(() => selectedRound.value === 'main' || selectedRound.value === 'supplement')

const roundNoteKey = computed(() => getRoundPanelNoteKey(selectedRound.value))

const submitting = ref(false)
const message = ref('')
const detailCourse = ref(null)
const pickerCourse = ref(null)

const creditRange = computed(() => `${creditSummary.value.min}–${creditSummary.value.max}`)

const cartTitleKey = computed(() =>
  isPreselectRound.value
    ? 'courseRegistration.student.wishlistTitle'
    : 'courseRegistration.student.cartTitle',
)

const submitLabelKey = computed(() => {
  if (isPreselectRound.value) return 'courseRegistration.student.submitPreselect'
  return 'courseRegistration.student.confirmSubmit'
})

const registerActionKey = computed(() =>
  isPreselectRound.value
    ? 'courseRegistration.student.addToWishlist'
    : 'courseRegistration.student.registerNow',
)

function handleSearch() {
  appliedSearch.value = { ...searchForm.value }
}

function handleReset() {
  searchForm.value = { keyword: '', type: '', availability: '', eligibility: '' }
  appliedSearch.value = { keyword: '', type: '', availability: '', eligibility: '' }
}

function eligibilityDetailLabel(course) {
  if (!course.eligibility) return '—'
  if (course.eligibility.eligible) {
    if (course.eligibility.prerequisiteBypassed) {
      return t('courseRegistration.eligibility.eligibleWithBypass')
    }
    return t('courseRegistration.eligibility.eligible')
  }
  const reason = course.eligibility.reasons[0]
  if (!reason) return t('courseRegistration.eligibility.notEligible')
  return t(reason.key, reason.params || {})
}

function eligibilityShortLabel(course) {
  if (!course.eligibility) return '—'
  if (course.eligibility.eligible) return t('courseRegistration.eligibility.eligible')
  return t('courseRegistration.eligibility.notEligible')
}

function seatStatusLabel(course) {
  if (isCourseInCart(course.id)) {
    return t('courseRegistration.student.inCart')
  }
  const status =
    course.remainingCapacity <= 0
      ? t('courseRegistration.waitlist.courseStatus.full')
      : t('courseRegistration.waitlist.courseStatus.open')
  return `${course.remainingCapacity}/${course.totalCapacity} · ${status}`
}

function seatStatusClass(course) {
  if (isCourseInCart(course.id)) return 'tag-blue'
  return course.remainingCapacity <= 0 ? 'tag-red' : 'tag-green'
}

function showWaitlistAction(course) {
  return (
    course.remainingCapacity <= 0 &&
    !isPreselectRound.value &&
    course.eligibility?.eligible &&
    !isCourseInCart(course.id)
  )
}

function canRegister(course) {
  return course.remainingCapacity > 0 && course.eligibility?.eligible && !isCourseInCart(course.id)
}

function openDetail(course) {
  detailCourse.value = course
}

function handleSectionSelect({ course, section }) {
  const result = addToCart(course, section)
  if (!result.ok && result.errorKey) {
    message.value = t(result.errorKey, result.errorParams || {})
  } else {
    message.value = ''
    pickerCourse.value = null
  }
}

function handleQuickRegister(course) {
  if (!canRegister(course)) return
  pickerCourse.value = course
}

function handleWaitlist(course) {
  const result = addWaitlistToCart(course)
  if (!result.ok && result.errorKey) message.value = t(result.errorKey)
  else message.value = t('courseRegistration.student.waitlistAddedToCart')
}

function handleRoundChange(key) {
  if (key === 'addDrop') {
    emit('navigate', 'crs-adddrop')
    return
  }
  selectedRound.value = key
}

async function handleSubmit() {
  if (!registrationCart.value.length) return

  if (isPreselectRound.value) {
    submitting.value = true
    message.value = ''
    await new Promise((resolve) => setTimeout(resolve, 400))
    registrationCart.value = []
    submitting.value = false
    message.value = t('courseRegistration.student.preselectSubmitted')
    return
  }

  if (!isCartRound.value) return

  submitting.value = true
  message.value = ''
  const result = await submitRegistrationCart()
  submitting.value = false
  if (result.cancelled) return
  if (!result.ok && result.errorKey) {
    message.value = t(result.errorKey)
    return
  }
  if (result.waitlistOnly) {
    message.value = t('courseRegistration.student.waitlistSubmitted', {
      count: result.waitlistCount || 0,
    })
    return
  }
  if (result.waitlistCount) {
    message.value = t('courseRegistration.student.waitlistSubmittedWithRegister', {
      count: result.waitlistCount,
    })
    return
  }
  message.value = ''
}
</script>

<template>
  <StudentPageShell page-id="crs-register">
    <RoundTimelineBar :model-value="selectedRound" interactive @update:model-value="handleRoundChange" />

    <div class="page-card">
      <p v-if="activeBatch" class="page-note">
        <strong>{{ activeBatch.name }}</strong> — {{ t(roundNoteKey) }}
      </p>

      <div class="cr-student-register-layout">
        <section class="cr-student-main-panel">
          <div class="cr-student-panel-header">
            <h3>{{ t('courseRegistration.student.courseListTitle') }}</h3>
            <span class="cr-student-panel-meta">
              {{ t('courseRegistration.student.courseListMeta', { count: courses.length }) }}
            </span>
          </div>

          <div class="search-bar">
            <div class="search-row">
              <div class="search-fields">
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.code') }}</label>
                  <input
                    v-model="searchForm.keyword"
                    type="text"
                    class="search-input"
                    :placeholder="t('courseRegistration.student.searchPlaceholder')"
                  />
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.courses.type') }}</label>
                  <select v-model="searchForm.type" class="search-select">
                    <option value="">{{ t('common.all') }}</option>
                    <option v-for="opt in courseTypeOptions" :key="opt.value" :value="opt.value">
                      {{ t(opt.labelKey) }}
                    </option>
                  </select>
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.student.availability') }}</label>
                  <select v-model="searchForm.availability" class="search-select">
                    <option value="">{{ t('common.all') }}</option>
                    <option value="open">{{ t('courseRegistration.waitlist.courseStatus.open') }}</option>
                    <option value="full">{{ t('courseRegistration.waitlist.courseStatus.full') }}</option>
                  </select>
                </div>
                <div class="search-item">
                  <label>{{ t('courseRegistration.student.eligibilityFilter') }}</label>
                  <select v-model="searchForm.eligibility" class="search-select">
                    <option value="">{{ t('common.all') }}</option>
                    <option value="eligible">{{ t('courseRegistration.eligibility.filterEligible') }}</option>
                    <option value="blocked">{{ t('courseRegistration.eligibility.filterBlocked') }}</option>
                  </select>
                </div>
              </div>
              <div class="search-actions">
                <button type="button" class="btn btn-primary" @click="handleSearch">{{ t('common.search') }}</button>
                <button type="button" class="btn btn-default" @click="handleReset">{{ t('common.reset') }}</button>
              </div>
            </div>
          </div>

          <div class="table-section">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ t('common.serialNo') }}</th>
                    <th>{{ t('courseRegistration.courses.code') }}</th>
                    <th>{{ t('courseRegistration.courses.name') }}</th>
                    <th>{{ t('courseRegistration.courses.type') }}</th>
                    <th>{{ t('courseRegistration.courses.credits') }}</th>
                    <th>{{ t('courseRegistration.student.availability') }}</th>
                    <th>{{ t('courseRegistration.courses.prerequisites') }}</th>
                    <th>{{ t('courseRegistration.student.eligibility') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(course, index) in courses"
                    :key="course.id"
                    :class="{ 'cr-row-blocked': course.eligibility && !course.eligibility.eligible }"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>{{ course.code }}</td>
                    <td>
                      <div class="cr-student-course-name">
                        <span>{{ course.name }}</span>
                        <span v-if="course.isHot" class="tag-hot">{{ t('courseRegistration.student.hotCourse') }}</span>
                      </div>
                    </td>
                    <td>{{ getRegistrationTypeLabel(course.type, t) }}</td>
                    <td>{{ course.credits }}</td>
                    <td>
                      <span :class="seatStatusClass(course)">{{ seatStatusLabel(course) }}</span>
                    </td>
                    <td>{{ course.prerequisites?.join(', ') || '—' }}</td>
                    <td>
                      <span
                        :class="course.eligibility?.eligible ? 'tag-green' : 'tag-red'"
                        class="cr-eligibility-tag"
                        :title="eligibilityDetailLabel(course)"
                      >
                        {{ eligibilityShortLabel(course) }}
                      </span>
                    </td>
                    <td class="cr-student-actions">
                      <div class="actions-inner">
                        <button type="button" class="link-btn" @click="openDetail(course)">
                          {{ t('common.details') }}
                        </button>
                        <button
                          v-if="showWaitlistAction(course)"
                          type="button"
                          class="link-btn"
                          @click="handleWaitlist(course)"
                        >
                          {{ t('courseRegistration.student.joinWaitlistAction') }}
                        </button>
                        <button
                          v-else-if="isCourseInCart(course.id)"
                          type="button"
                          class="link-btn"
                          disabled
                        >
                          {{ t('courseRegistration.student.inCart') }}
                        </button>
                        <button
                          v-else
                          type="button"
                          class="link-btn"
                          :disabled="submitting || !canRegister(course)"
                          :title="!canRegister(course) ? eligibilityDetailLabel(course) : undefined"
                          @click="handleQuickRegister(course)"
                        >
                          {{ t(registerActionKey) }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!courses.length">
                    <td colspan="9" class="empty-cell">{{ t('common.noData') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside class="cr-student-cart-panel">
          <h3 class="cr-student-section-title">{{ t(cartTitleKey) }}</h3>
          <p class="cr-student-cart-meta">
            {{ t('courseRegistration.student.cartCredits', { current: cartTotalCredits, range: creditRange }) }}
          </p>
          <ul v-if="registrationCart.length" class="cr-student-cart-list">
            <li v-for="item in registrationCart" :key="item.courseId" class="cr-student-cart-item">
              <div class="cr-student-cart-item-body">
                <div class="cr-student-cart-item-head">
                  <strong>
                    {{ item.courseCode }} · {{ item.credits }} cr
                    <span v-if="item.intent === 'waitlist'" class="tag-hot cr-cart-intent-tag">
                      {{ t('courseRegistration.student.waitlistCartTag') }}
                    </span>
                  </strong>
                  <button type="button" class="link-btn danger" @click="removeFromCart(item.courseId)">
                    {{ t('common.delete') }}
                  </button>
                </div>
                <span>{{ item.courseName }}</span>
                <small v-if="item.intent === 'waitlist'">
                  {{ t('courseRegistration.student.waitlistEstimatedPosition', { n: item.estimatedPosition }) }}
                  · {{ t('courseRegistration.student.waitlistAnySection') }}
                </small>
                <small v-else>
                  {{ item.sectionCode }}
                  · {{ item.lecturer || '—' }}
                  · {{ item.weekRange || '—' }}
                  · {{ item.classTime || item.time }}
                  · {{ item.room || '—' }}
                </small>
              </div>
            </li>
          </ul>
          <p v-else class="cr-student-empty">{{ t('courseRegistration.student.cartEmpty') }}</p>
          <button
            type="button"
            class="btn btn-primary cr-student-submit"
            :disabled="!registrationCart.length || submitting"
            @click="handleSubmit"
          >
            {{ t(submitLabelKey) }}
          </button>
          <p v-if="message" class="cr-student-message">{{ message }}</p>
        </aside>
      </div>
    </div>

    <StudentCourseDetailDrawer
      :visible="!!detailCourse"
      :course="detailCourse"
      @close="detailCourse = null"
    />

    <StudentSectionPickerDrawer
      :visible="!!pickerCourse"
      :course="pickerCourse"
      @close="pickerCourse = null"
      @select="handleSectionSelect"
    />
  </StudentPageShell>
</template>
