<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import YnSwitch from '../common/YnSwitch.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  roundsToPicker,
  addDropWindowToPicker,
  addDropWindowFromPicker,
  roundsFromPicker,
  getManageRoundsScheduleMinDates,
  clearInvalidManageRoundsScheduleAfter,
  pickerToBatchDate,
  batchDateToPicker,
  registrationAcademicSessionOptions,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  AUDIENCE_FRESHMAN,
  AUDIENCE_SENIOR,
  cloneRounds,
  defaultAudienceRounds,
} from '../../data/courseRegistration/audienceRounds.js'
import {
  normalizeSessionRound1Quota,
  previewDaySharePercents,
  DEMO_ROUND1_OPEN_DAYS,
  DEFAULT_DECAY_R,
} from '../../data/courseRegistration/batchRound1Quota.js'
import { emptySchedule, getSessionSchedule, formatUnitLabel, listUsedAcademicSessions } from '../../data/courseRegistration/sessionRegistrationSchedules.js'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, default: 'session' },
  academicSession: { type: String, default: '' },
  schedule: { type: Object, default: null },
  batch: { type: Object, default: null },
  unitCode: { type: String, default: '' },
  unitCodes: { type: Array, default: () => [] },
  /** 新建学期时可选项（已占用学期应在外部过滤） */
  sessionOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const { t, locale } = useAppI18n()

const form = ref({
  rounds: roundsToPicker(),
  seniorRounds: roundsToPicker(),
  freshmanRounds: roundsToPicker(),
  seniorResultReleaseAt: '',
  addDropWindow: { start: '', end: '' },
  enabled: true,
  round1Quota: normalizeSessionRound1Quota(null),
})
const audienceTab = ref(AUDIENCE_SENIOR)
const preselectExpanded = ref(true)
const mainExpanded = ref(true)
const supplementExpanded = ref(true)
const addDropExpanded = ref(true)
const roundSaveError = ref('')
const localSession = ref('')

const isSessionMode = computed(() => props.mode === 'session')
const isOverrideMode = computed(() => props.mode === 'override')
const isUnitMode = computed(() => props.mode === 'unit')
const showGeQuota = computed(() => isSessionMode.value)

const sessionKey = computed(() => {
  if (isSessionMode.value && !props.schedule) {
    return String(localSession.value || props.academicSession || '').trim()
  }
  return String(props.academicSession || props.schedule?.academicSession || localSession.value || '').trim()
})

const isCreateSession = computed(() => isSessionMode.value && !props.schedule)

const createSessionOptions = computed(() => {
  if (props.sessionOptions?.length) return props.sessionOptions
  const used = new Set(listUsedAcademicSessions())
  return registrationAcademicSessionOptions.filter((opt) => !used.has(opt))
})

const title = computed(() => {
  if (isUnitMode.value) {
    const codes =
      props.unitCodes?.length > 0
        ? props.unitCodes
        : props.unitCode
          ? [props.unitCode]
          : []
    if (codes.length > 1) {
      return t('courseRegistration.schedule.editTitleUnitsBulk', {
        count: codes.length,
        session: sessionKey.value || '—',
      })
    }
    const unitLabel = formatUnitLabel(codes[0] || props.unitCode, locale.value === 'zh')
    return t('courseRegistration.schedule.editTitleUnit', {
      unit: unitLabel,
      session: sessionKey.value || '—',
    })
  }
  if (isOverrideMode.value) {
    return t('courseRegistration.batch.manageRoundsTitle', {
      name: props.batch?.name || '',
    })
  }
  return t('courseRegistration.schedule.editTitle')
})

function loadAudienceIntoForm(audience) {
  const source =
    audience === AUDIENCE_FRESHMAN ? form.value.freshmanRounds : form.value.seniorRounds
  form.value.rounds = {
    preselect: { ...source.preselect },
    main: { ...source.main },
    supplement: { ...source.supplement },
  }
}

function persistCurrentAudienceFromForm() {
  const snapshot = {
    preselect: { ...form.value.rounds.preselect },
    main: { ...form.value.rounds.main },
    supplement: { ...form.value.rounds.supplement },
  }
  if (audienceTab.value === AUDIENCE_FRESHMAN) {
    form.value.freshmanRounds = snapshot
  } else {
    form.value.seniorRounds = snapshot
  }
}

function switchAudienceTab(next) {
  if (next === audienceTab.value) return
  persistCurrentAudienceFromForm()
  audienceTab.value = next
  loadAudienceIntoForm(next)
}

function resolveInitialRoundsByAudience() {
  const session = sessionKey.value
  if (isUnitMode.value) {
    if (props.schedule?.roundsByAudience) {
      return props.schedule.roundsByAudience
    }
    return {
      senior: defaultAudienceRounds(),
      freshman: defaultAudienceRounds(),
    }
  }
  if (isOverrideMode.value) {
    if (props.schedule?.roundsByAudience) {
      return props.schedule.roundsByAudience
    }
    const global = getSessionSchedule(session)
    if (global?.roundsByAudience) {
      return {
        senior: {
          ...global.roundsByAudience.senior,
          resultReleaseAt: global.roundsByAudience.senior?.resultReleaseAt || '',
        },
        freshman: { ...global.roundsByAudience.freshman },
      }
    }
    return emptySchedule(session).roundsByAudience
  }
  const sched = props.schedule || emptySchedule(session)
  return sched.roundsByAudience
}

watch(
  () => [props.visible, props.mode, props.academicSession, props.schedule, props.batch, props.unitCode, props.unitCodes],
  () => {
    if (!props.visible) return
    preselectExpanded.value = true
    mainExpanded.value = true
    supplementExpanded.value = true
    addDropExpanded.value = true
    audienceTab.value = AUDIENCE_SENIOR
    roundSaveError.value = ''

    localSession.value = String(props.academicSession || props.schedule?.academicSession || '').trim()
    const session = sessionKey.value
    const by = resolveInitialRoundsByAudience()
    const sched = props.schedule || emptySchedule(session)
    const round1Quota = isSessionMode.value
      ? normalizeSessionRound1Quota(sched.round1Quota)
      : normalizeSessionRound1Quota(null)

    const addDropSource =
      isSessionMode.value && props.schedule?.addDropWindow
        ? props.schedule.addDropWindow
        : isSessionMode.value
          ? emptySchedule(session).addDropWindow
          : { start: '', end: '' }

    form.value = {
      rounds: roundsToPicker(by.senior),
      seniorRounds: roundsToPicker(by.senior),
      freshmanRounds: roundsToPicker(by.freshman),
      seniorResultReleaseAt: batchDateToPicker(by.senior?.resultReleaseAt || ''),
      addDropWindow: addDropWindowToPicker(addDropSource),
      enabled: props.schedule?.enabled !== false,
      round1Quota,
    }
  },
  { immediate: true },
)

const round1OpenDays = computed(() => DEMO_ROUND1_OPEN_DAYS)

const daySharePreview = computed(() =>
  previewDaySharePercents(DEMO_ROUND1_OPEN_DAYS, form.value.round1Quota?.decayR ?? DEFAULT_DECAY_R),
)

function setDecayR(value) {
  const n = Number(value)
  form.value.round1Quota = normalizeSessionRound1Quota({
    decayR: Number.isFinite(n) && n > 0 ? n : DEFAULT_DECAY_R,
  })
}

const includeResultRelease = computed(
  () => (isSessionMode.value || isUnitMode.value) && audienceTab.value === AUDIENCE_SENIOR,
)
const scheduleOpts = computed(() => ({ includeResultRelease: includeResultRelease.value }))
const scheduleMinDates = computed(() => getManageRoundsScheduleMinDates(form.value, scheduleOpts.value))

const idx = computed(() => {
  if (includeResultRelease.value) {
    return { r1s: 0, r1e: 1, release: 2, r2s: 3, r2e: 4, r3s: 5, r3e: 6 }
  }
  return { r1s: 0, r1e: 1, release: -1, r2s: 2, r2e: 3, r3s: 4, r3e: 5 }
})

function onScheduleDateChange(index, value) {
  const includeRelease = includeResultRelease.value
  const setters = includeRelease
    ? [
        (v) => {
          form.value.rounds.preselect.start = v
        },
        (v) => {
          form.value.rounds.preselect.end = v
        },
        (v) => {
          form.value.seniorResultReleaseAt = v
        },
        (v) => {
          form.value.rounds.main.start = v
        },
        (v) => {
          form.value.rounds.main.end = v
        },
        (v) => {
          form.value.rounds.supplement.start = v
        },
        (v) => {
          form.value.rounds.supplement.end = v
        },
      ]
    : [
        (v) => {
          form.value.rounds.preselect.start = v
        },
        (v) => {
          form.value.rounds.preselect.end = v
        },
        (v) => {
          form.value.rounds.main.start = v
        },
        (v) => {
          form.value.rounds.main.end = v
        },
        (v) => {
          form.value.rounds.supplement.start = v
        },
        (v) => {
          form.value.rounds.supplement.end = v
        },
      ]
  const setter = setters[index]
  if (!setter) return
  setter(value || '')
  clearInvalidManageRoundsScheduleAfter(form.value, index, scheduleOpts.value)
}

function isEmptyTime(value) {
  return !String(value || '').trim()
}

function handleSave() {
  if (isOverrideMode.value && !props.batch) return
  if ((isSessionMode.value || isUnitMode.value) && !sessionKey.value) {
    roundSaveError.value = t('courseRegistration.batch.academicSessionRequired')
    return
  }
  if (isSessionMode.value && isCreateSession.value) {
    const used = new Set(listUsedAcademicSessions())
    if (used.has(sessionKey.value)) {
      roundSaveError.value = t('courseRegistration.schedule.sessionAlreadyExists')
      return
    }
  }
  if (isUnitMode.value) {
    const codes =
      props.unitCodes?.length > 0
        ? props.unitCodes
        : props.unitCode
          ? [props.unitCode]
          : []
    if (!codes.length) return
  }

  roundSaveError.value = ''
  persistCurrentAudienceFromForm()

  const senior = form.value.seniorRounds
  const freshman = form.value.freshmanRounds

  const seniorRoundRequired =
    isEmptyTime(senior.preselect.start) ||
    isEmptyTime(senior.preselect.end) ||
    isEmptyTime(senior.main.start) ||
    isEmptyTime(senior.main.end) ||
    isEmptyTime(senior.supplement.start) ||
    isEmptyTime(senior.supplement.end)

  if (isUnitMode.value) {
    if (seniorRoundRequired || isEmptyTime(form.value.seniorResultReleaseAt)) {
      roundSaveError.value = t('courseRegistration.batch.roundTimeRequired')
      return
    }
    if (
      isEmptyTime(freshman.preselect.start) ||
      isEmptyTime(freshman.preselect.end) ||
      isEmptyTime(freshman.main.start) ||
      isEmptyTime(freshman.main.end) ||
      isEmptyTime(freshman.supplement.start) ||
      isEmptyTime(freshman.supplement.end)
    ) {
      roundSaveError.value = t('courseRegistration.batch.roundTimeRequired')
      return
    }
    const seniorFromForm = roundsFromPicker(form.value.seniorRounds)
    const freshmanFromForm = roundsFromPicker(form.value.freshmanRounds)
    emit('save', {
      academicSession: sessionKey.value,
      unitCode: props.unitCode || '',
      unitCodes: props.unitCodes?.length ? [...props.unitCodes] : props.unitCode ? [props.unitCode] : [],
      roundsByAudience: {
        senior: {
          preselect: seniorFromForm.preselect,
          main: seniorFromForm.main,
          supplement: seniorFromForm.supplement,
          resultReleaseAt: pickerToBatchDate(String(form.value.seniorResultReleaseAt || '').trim()),
        },
        freshman: {
          preselect: freshmanFromForm.preselect,
          main: freshmanFromForm.main,
          supplement: freshmanFromForm.supplement,
        },
      },
    })
    return
  }

  if (
    seniorRoundRequired ||
    (!isUnitMode.value && isEmptyTime(form.value.seniorResultReleaseAt))
  ) {
    roundSaveError.value = t('courseRegistration.batch.roundTimeRequired')
    return
  }

  const freshmanAny =
    !isEmptyTime(freshman.preselect.start) ||
    !isEmptyTime(freshman.preselect.end) ||
    !isEmptyTime(freshman.main.start) ||
    !isEmptyTime(freshman.main.end) ||
    !isEmptyTime(freshman.supplement.start) ||
    !isEmptyTime(freshman.supplement.end)

  if (isSessionMode.value) {
    if (
      isEmptyTime(freshman.preselect.start) ||
      isEmptyTime(freshman.preselect.end) ||
      isEmptyTime(freshman.main.start) ||
      isEmptyTime(freshman.main.end) ||
      isEmptyTime(freshman.supplement.start) ||
      isEmptyTime(freshman.supplement.end)
    ) {
      roundSaveError.value = t('courseRegistration.batch.roundTimeRequired')
      return
    }
    if (
      isEmptyTime(form.value.addDropWindow.start) ||
      isEmptyTime(form.value.addDropWindow.end)
    ) {
      roundSaveError.value = t('courseRegistration.schedule.addDropRequired')
      return
    }
  } else if (
    freshmanAny &&
    (isEmptyTime(freshman.preselect.start) ||
      isEmptyTime(freshman.preselect.end) ||
      isEmptyTime(freshman.main.start) ||
      isEmptyTime(freshman.main.end) ||
      isEmptyTime(freshman.supplement.start) ||
      isEmptyTime(freshman.supplement.end))
  ) {
    roundSaveError.value = t('courseRegistration.batch.roundTimeRequired')
    return
  }

  if (showGeQuota.value) {
    const decay = Number(form.value.round1Quota?.decayR)
    if (!Number.isFinite(decay) || decay <= 0) {
      roundSaveError.value = t('courseRegistration.batch.roundDecayRequired')
      return
    }
  }

  const seniorFromForm = roundsFromPicker(form.value.seniorRounds)
  const freshmanFromForm = roundsFromPicker(form.value.freshmanRounds)

  const roundsByAudience = {
    senior: {
      preselect: seniorFromForm.preselect,
      main: seniorFromForm.main,
      supplement: seniorFromForm.supplement,
      resultReleaseAt: pickerToBatchDate(String(form.value.seniorResultReleaseAt || '').trim()),
    },
    freshman: {
      preselect: freshmanFromForm.preselect,
      main: freshmanFromForm.main,
      supplement: freshmanFromForm.supplement,
    },
  }

  const session = sessionKey.value

  if (isSessionMode.value) {
    emit('save', {
      academicSession: session,
      id: props.schedule?.id,
      enabled: form.value.enabled !== false,
      roundsByAudience,
      round1Quota: normalizeSessionRound1Quota(form.value.round1Quota),
      addDropWindow: addDropWindowFromPicker(form.value.addDropWindow),
    })
    return
  }

  emit('save', {
    batchId: props.batch.id,
    academicSession: session,
    id: props.schedule?.id,
    roundsByAudience,
    batchType: props.batch.type,
    programme: props.batch.programme || '',
  })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>
        {{
          isUnitMode
            ? t('courseRegistration.schedule.unitEditHint')
            : isSessionMode
              ? t('courseRegistration.schedule.sessionHint')
              : t('courseRegistration.schedule.overrideHint')
        }}{{ t('common.prototypeOnlySuffix') }}
      </p>
      <p>{{ t('courseRegistration.batch.audienceRoundsHint') }}</p>
    </CourseRegistrationCallout>
    <CourseRegistrationCallout v-if="roundSaveError" variant="warning">
      <p>{{ roundSaveError }}</p>
    </CourseRegistrationCallout>

    <div v-if="isSessionMode" class="session-adddrop-row">
      <div class="session-adddrop-session form-field compact">
        <label class="field-label session-label">
          <span v-if="isCreateSession" class="req">*</span>
          {{ t('courseRegistration.batch.academicSession') }}
        </label>
        <select v-if="isCreateSession" v-model="localSession" class="session-select">
          <option value="">{{ t('common.pleaseSelect') }}</option>
          <option v-for="opt in createSessionOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        <select v-else class="session-select" disabled :value="sessionKey">
          <option :value="sessionKey">{{ sessionKey }}</option>
        </select>
      </div>
      <div class="session-adddrop-fields">
        <div class="form-field compact">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.addDropWindow') }}
            {{ t('courseRegistration.batch.roundStart') }}
          </label>
          <DatePickerEn
            mode="datetime"
            :model-value="form.addDropWindow.start"
            :placeholder="t('common.pleaseSelectDateTime')"
            @update:model-value="(v) => (form.addDropWindow.start = v || '')"
          />
        </div>
        <div class="form-field compact">
          <label class="field-label">
            <span class="req">*</span> {{ t('courseRegistration.batch.roundEnd') }}
          </label>
          <DatePickerEn
            mode="datetime"
            :model-value="form.addDropWindow.end"
            :placeholder="t('common.pleaseSelectDateTime')"
            @update:model-value="(v) => (form.addDropWindow.end = v || '')"
          />
        </div>
        <div class="form-field compact session-enabled-field">
          <label class="field-label">{{ t('courseRegistration.schedule.colEnabled') }}</label>
          <YnSwitch v-model="form.enabled" />
        </div>
      </div>
    </div>

    <div class="audience-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="audience-tab"
        :class="{ active: audienceTab === AUDIENCE_SENIOR }"
        :aria-selected="audienceTab === AUDIENCE_SENIOR"
        @click="switchAudienceTab(AUDIENCE_SENIOR)"
      >
        {{ t('courseRegistration.batch.audienceSeniorRounds') }}
      </button>
      <button
        type="button"
        role="tab"
        class="audience-tab"
        :class="{ active: audienceTab === AUDIENCE_FRESHMAN }"
        :aria-selected="audienceTab === AUDIENCE_FRESHMAN"
        @click="switchAudienceTab(AUDIENCE_FRESHMAN)"
      >
        {{ t('courseRegistration.batch.audienceFreshmanRounds') }}
      </button>
    </div>

    <section class="form-section round-section">
      <button
        type="button"
        class="round-section-toggle"
        :aria-expanded="preselectExpanded"
        @click="preselectExpanded = !preselectExpanded"
      >
        <h3 class="section-title">
          <span class="step-badge">1</span>
          {{ t('courseRegistration.batch.roundPreselect') }}
        </h3>
        <span class="round-section-chevron" :class="{ 'is-expanded': preselectExpanded }">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <div v-show="preselectExpanded" class="round-section-body">
        <div class="round-card">
          <div class="round-fields">
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundStart') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.preselect.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r1s]"
                @update:model-value="(v) => onScheduleDateChange(idx.r1s, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundEnd') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.preselect.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r1e]"
                @update:model-value="(v) => onScheduleDateChange(idx.r1e, v)"
              />
            </div>
            <div
              v-if="audienceTab === AUDIENCE_SENIOR && (isSessionMode || isOverrideMode || isUnitMode)"
              class="form-field form-field-full"
            >
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.seniorResultReleaseAt') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.seniorResultReleaseAt"
                :placeholder="t('courseRegistration.batch.seniorResultReleaseAtPlaceholder')"
                :min-date="scheduleMinDates[idx.release]"
                @update:model-value="(v) => onScheduleDateChange(idx.release, v)"
              />
            </div>
          </div>

          <div
            v-if="audienceTab === AUDIENCE_SENIOR && !isUnitMode && showGeQuota"
            class="round1-quota-block"
          >
            <h4 class="round1-quota-title">{{ t('courseRegistration.batch.round1QuotaTitle') }}</h4>

            <div class="round1-formula">
              <p class="round1-formula-title">{{ t('courseRegistration.batch.round1FormulaTitle') }}</p>
              <ul class="round1-formula-defs">
                <li>{{ t('courseRegistration.batch.round1FormulaWi') }}</li>
                <li>{{ t('courseRegistration.batch.round1FormulaR') }}</li>
                <li>{{ t('courseRegistration.batch.round1FormulaN') }}</li>
                <li>{{ t('courseRegistration.batch.round1FormulaI') }}</li>
              </ul>
            </div>
            <div class="form-field" style="max-width: 220px">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.round1DecayR') }}
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                class="inline-number"
                :value="form.round1Quota.decayR"
                @change="setDecayR($event.target.value)"
              />
            </div>
            <p class="round1-quota-preview">
              {{
                t('courseRegistration.batch.round1DaySharePreview', {
                  days: round1OpenDays,
                  shares: daySharePreview.map((p) => `${p}%`).join(' / '),
                })
              }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="form-section round-section">
      <button
        type="button"
        class="round-section-toggle"
        :aria-expanded="mainExpanded"
        @click="mainExpanded = !mainExpanded"
      >
        <h3 class="section-title">
          <span class="step-badge">2</span>
          {{ t('courseRegistration.batch.roundMain') }}
        </h3>
        <span class="round-section-chevron" :class="{ 'is-expanded': mainExpanded }">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <div v-show="mainExpanded" class="round-section-body">
        <div class="round-card">
          <div class="round-fields">
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundStart') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.main.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r2s]"
                @update:model-value="(v) => onScheduleDateChange(idx.r2s, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundEnd') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.main.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r2e]"
                @update:model-value="(v) => onScheduleDateChange(idx.r2e, v)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="form-section round-section">
      <button
        type="button"
        class="round-section-toggle"
        :aria-expanded="supplementExpanded"
        @click="supplementExpanded = !supplementExpanded"
      >
        <h3 class="section-title">
          <span class="step-badge">3</span>
          {{ t('courseRegistration.batch.roundSupplement') }}
        </h3>
        <span class="round-section-chevron" :class="{ 'is-expanded': supplementExpanded }">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <div v-show="supplementExpanded" class="round-section-body">
        <div class="round-card">
          <div class="round-fields">
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundStart') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.supplement.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r3s]"
                @update:model-value="(v) => onScheduleDateChange(idx.r3s, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <span class="req">*</span> {{ t('courseRegistration.batch.roundEnd') }}
              </label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.supplement.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[idx.r3e]"
                @update:model-value="(v) => onScheduleDateChange(idx.r3e, v)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>
</template>

<style scoped>
.session-field {
  margin-bottom: 16px;
  max-width: 280px;
}

.session-adddrop-row {
  display: grid;
  grid-template-columns: minmax(0, 148px) minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 12px 14px;
  align-items: end;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.session-adddrop-session {
  min-width: 0;
}

.session-label {
  display: block;
  margin-bottom: 6px;
}

.session-adddrop-fields {
  display: contents;
}

.form-field.compact {
  min-width: 0;
}

.session-adddrop-row :deep(.date-picker-en),
.session-adddrop-row :deep(.date-picker-en-input),
.session-adddrop-row :deep(input[type='text']) {
  width: 100%;
  max-width: none;
}

.session-enabled-field {
  min-width: 72px;
  padding-bottom: 2px;
}

.session-select {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.session-select:disabled {
  background: #f9fafb;
  color: #374151;
  cursor: not-allowed;
}

.audience-tabs {
  display: flex;
  gap: 4px;
  margin: 0 0 16px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 8px;
  width: fit-content;
  max-width: 100%;
}

.audience-tab {
  padding: 6px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  line-height: 1.4;
}

.audience-tab.active {
  background: #fff;
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.form-field-full {
  flex: 1 1 100%;
  min-width: 100%;
}

.field-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.form-section {
  margin-bottom: 24px;
}

.form-section + .form-section {
  padding-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.round-section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  margin: 0 0 14px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.round-section-body {
  margin-bottom: 4px;
}

.round-section-chevron {
  display: inline-flex;
  flex-shrink: 0;
  color: #9ca3af;
  transition: transform 0.15s ease;
}

.round-section-chevron.is-expanded {
  transform: rotate(180deg);
}

.round-section-chevron svg {
  width: 16px;
  height: 16px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.round-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.round-card {
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.form-field :deep(.date-picker-en) {
  width: 100%;
}

.scope-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.scope-rules-table-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: auto;
  background: #fff;
}

.scope-rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.scope-rules-table th,
.scope-rules-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.scope-rules-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.scope-rules-table tbody tr:last-child td {
  border-bottom: none;
}

.scope-rules-table .col-actions {
  width: 120px;
  text-align: center;
  white-space: nowrap;
}

.scope-rules-table .empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 24px 12px !important;
}

.link-btn {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-default {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn:disabled,
.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.round1-quota-block {
  margin: 12px 0 0;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.round1-quota-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.quota-divider {
  margin: 16px 0;
  border-top: 1px dashed #d1d5db;
}

.round1-quota-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.45;
}

.round1-formula {
  margin: 0 0 12px;
}

.round1-formula-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.round1-formula-defs {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.55;
}

.round1-quota-preview {
  margin: 8px 0 0;
  font-size: 12px;
  color: #374151;
}

.round1-me-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 8px;
}

.round1-me-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.round1-me-sum {
  font-size: 13px;
  color: #6b7280;
  margin-left: auto;
}

.me-year-select {
  min-width: 88px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.me-special-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.me-intake-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 24px;
}

.me-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
}

.me-chip-x {
  border: none;
  background: transparent;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}

.me-intake-empty {
  font-size: 12px;
  color: #9ca3af;
}

.me-intake-add {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.error-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b91c1c;
}

.me-intakes-cell {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.inline-number {
  width: 72px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 720px) {
  .round-fields {
    grid-template-columns: 1fr;
  }
}
</style>
