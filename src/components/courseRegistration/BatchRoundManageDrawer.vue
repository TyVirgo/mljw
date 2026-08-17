<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import BatchScopeRuleModal from './BatchScopeRuleModal.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatDualAudienceRoundsSummary } from '../../data/courseRegistration/registrationBatches.js'
import {
  roundsToPicker,
  addDropWindowToPicker,
  roundsFromPicker,
  getBatchScheduleMinDates,
  clearInvalidBatchScheduleAfter,
  pickerToBatchDate,
  batchDateToPicker,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  getBatchScopeRules,
  cloneScopeRules,
  scopeLabelsFromRules,
  formatDimList,
  collapseScopeRulesOnePerRound,
} from '../../data/courseRegistration/batchScopeRules.js'
import { countStudentsForScopeRule } from '../../data/courseRegistration/batchStudentRoster.js'
import { getBatchRoundSetupGates } from '../../data/courseRegistration/batchRoundSetupGates.js'
import {
  AUDIENCE_FRESHMAN,
  AUDIENCE_SENIOR,
  ensureRoundsByAudience,
  syncLegacyRoundsFromAudience,
} from '../../data/courseRegistration/audienceRounds.js'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-student-list'])

const { t } = useAppI18n()

const form = ref({
  rounds: roundsToPicker(),
  seniorRounds: roundsToPicker(),
  freshmanRounds: roundsToPicker(),
  seniorResultReleaseAt: '',
  scopeRules: [],
  addDropWindow: { start: '', end: '' },
})
const audienceTab = ref(AUDIENCE_SENIOR)
const scopeModalVisible = ref(false)
const scopeModalRound = ref('preselect')
const editingScopeIndex = ref(null)
const editingScopeRule = ref(null)
const preselectExpanded = ref(true)
const mainExpanded = ref(true)
const supplementExpanded = ref(true)

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

watch(
  () => [props.visible, props.batch],
  () => {
    if (!props.visible || !props.batch) return
    scopeModalVisible.value = false
    editingScopeIndex.value = null
    editingScopeRule.value = null
    preselectExpanded.value = true
    mainExpanded.value = true
    supplementExpanded.value = true
    audienceTab.value = AUDIENCE_SENIOR
    const by = ensureRoundsByAudience(props.batch)
    form.value = {
      rounds: roundsToPicker(by.senior),
      seniorRounds: roundsToPicker(by.senior),
      freshmanRounds: roundsToPicker(by.freshman),
      seniorResultReleaseAt: batchDateToPicker(by.senior.resultReleaseAt || ''),
      scopeRules: getBatchScopeRules(props.batch),
      addDropWindow: addDropWindowToPicker(props.batch.addDropWindow),
    }
  },
  { immediate: true },
)

const title = computed(() =>
  t('courseRegistration.batch.manageRoundsTitle', {
    name: props.batch?.name || '',
  }),
)

const scheduleMinDates = computed(() => getBatchScheduleMinDates(form.value))

const roundGates = computed(() => {
  if (!props.batch) return getBatchRoundSetupGates(null)
  return getBatchRoundSetupGates({
    volunteerFinalConfirmedAt: props.batch.volunteerFinalConfirmedAt,
    rounds: {
      main: {
        end: pickerToBatchDate(form.value.rounds.main.end) || form.value.rounds.main.end,
      },
    },
  })
})

const preselectScopeRules = computed(() =>
  form.value.scopeRules
    .map((rule, index) => ({ rule, index }))
    .filter((item) => item.rule.round === 'preselect'),
)

const mainScopeRules = computed(() =>
  form.value.scopeRules
    .map((rule, index) => ({ rule, index }))
    .filter((item) => item.rule.round === 'main'),
)

const supplementScopeRules = computed(() =>
  form.value.scopeRules
    .map((rule, index) => ({ rule, index }))
    .filter((item) => item.rule.round === 'supplement'),
)

function openScopeModal(roundKey, ruleItem = null) {
  if (roundKey !== 'preselect' && !roundGates.value[roundKey]?.open) return
  // 每轮至多一条：已有且非编辑时改为编辑该条
  if (!ruleItem) {
    const existing = form.value.scopeRules
      .map((rule, index) => ({ rule, index }))
      .find((item) => (item.rule.round || '') === roundKey)
    if (existing) {
      ruleItem = existing
    }
  }
  scopeModalRound.value = roundKey
  if (ruleItem) {
    editingScopeIndex.value = ruleItem.index
    editingScopeRule.value = { ...ruleItem.rule }
  } else {
    editingScopeIndex.value = null
    editingScopeRule.value = null
  }
  scopeModalVisible.value = true
}

function closeScopeModal() {
  scopeModalVisible.value = false
  editingScopeIndex.value = null
  editingScopeRule.value = null
}

function handleScopeConfirm(rule) {
  const next = [...form.value.scopeRules]
  if (editingScopeIndex.value != null) {
    next[editingScopeIndex.value] = rule
  } else {
    const existingIdx = next.findIndex((r) => (r.round || '') === (rule.round || ''))
    if (existingIdx >= 0) next[existingIdx] = rule
    else next.push(rule)
  }
  form.value.scopeRules = collapseScopeRulesOnePerRound(next)
  closeScopeModal()
}

function removeScopeRule(index) {
  form.value.scopeRules = form.value.scopeRules.filter((_, i) => i !== index)
}

/**
 * 某轮是否已有学生范围
 * @param {string} roundKey
 */
function hasScopeForRound(roundKey) {
  return form.value.scopeRules.some((rule) => (rule.round || '') === roundKey)
}

/**
 * 范围匹配学生数
 * @param {object} rule
 */
function scopeStudentCount(rule) {
  return countStudentsForScopeRule(rule)
}

/**
 * 打开批次学生清单并定位到该轮可选学生
 * @param {string} roundKey
 */
function openRoundStudentList(roundKey) {
  if (!props.batch) return
  emit('open-student-list', {
    batch: {
      ...props.batch,
      scopeRules: cloneScopeRules(form.value.scopeRules),
    },
    round: roundKey,
  })
}

function dimLabel(value) {
  return formatDimList(Array.isArray(value) ? value : value ? [value] : [], t)
}

function onScheduleDateChange(index, value) {
  const setters = [
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
  if (index <= 1) {
    /* R1 always open */
  } else if (index <= 3 && !roundGates.value.main.open) {
    return
  } else if (index >= 4 && !roundGates.value.supplement.open) {
    return
  }
  setter(value || '')
  clearInvalidBatchScheduleAfter(form.value, index)
}

function handleSave() {
  if (!props.batch) return
  persistCurrentAudienceFromForm()
  const seniorPicker = form.value.seniorRounds
  const freshmanPicker = form.value.freshmanRounds
  const seniorFromForm = roundsFromPicker(seniorPicker)
  const freshmanFromForm = roundsFromPicker(freshmanPicker)

  const seniorRounds = {
    preselect: seniorFromForm.preselect,
    main: roundGates.value.main.open
      ? seniorFromForm.main
      : {
          start: props.batch.roundsByAudience?.senior?.main?.start || props.batch.rounds?.main?.start || '',
          end: props.batch.roundsByAudience?.senior?.main?.end || props.batch.rounds?.main?.end || '',
        },
    supplement: roundGates.value.supplement.open
      ? seniorFromForm.supplement
      : {
          start:
            props.batch.roundsByAudience?.senior?.supplement?.start ||
            props.batch.rounds?.supplement?.start ||
            '',
          end:
            props.batch.roundsByAudience?.senior?.supplement?.end ||
            props.batch.rounds?.supplement?.end ||
            '',
        },
    resultReleaseAt: pickerToBatchDate(String(form.value.seniorResultReleaseAt || '').trim()),
  }

  const freshmanRounds = {
    preselect: freshmanFromForm.preselect,
    main: roundGates.value.main.open
      ? freshmanFromForm.main
      : {
          start: props.batch.roundsByAudience?.freshman?.main?.start || '',
          end: props.batch.roundsByAudience?.freshman?.main?.end || '',
        },
    supplement: roundGates.value.supplement.open
      ? freshmanFromForm.supplement
      : {
          start: props.batch.roundsByAudience?.freshman?.supplement?.start || '',
          end: props.batch.roundsByAudience?.freshman?.supplement?.end || '',
        },
  }

  const roundsByAudience = { senior: seniorRounds, freshman: freshmanRounds }
  const rounds = syncLegacyRoundsFromAudience(roundsByAudience)

  const fromBatch = getBatchScopeRules(props.batch)
  const fromForm = cloneScopeRules(form.value.scopeRules)
  const scopeRules = collapseScopeRulesOnePerRound([
    ...fromForm.filter((rule) => rule.round === 'preselect'),
    ...(roundGates.value.main.open
      ? fromForm.filter((rule) => rule.round === 'main')
      : fromBatch.filter((rule) => rule.round === 'main')),
    ...(roundGates.value.supplement.open
      ? fromForm.filter((rule) => rule.round === 'supplement')
      : fromBatch.filter((rule) => rule.round === 'supplement')),
  ])

  const addDropWindow = props.batch.addDropWindow || { start: '', end: '' }

  emit('save', {
    rounds,
    roundsByAudience,
    scopeRules,
    scope: scopeLabelsFromRules(scopeRules, t),
    roundsSummary: formatDualAudienceRoundsSummary(
      { rounds, roundsByAudience, addDropWindow },
      addDropWindow,
    ),
    // 双时间线后不再用 preferSenior 挡新生；保存时关掉旧闸门
    preselectPriority: { preferSenior: false, minSemestersAbove: 1 },
  })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.batch.manageRoundsHint') }}{{ t('common.prototypeOnlySuffix') }}</p>
      <p>{{ t('courseRegistration.batch.audienceRoundsHint') }}</p>
    </CourseRegistrationCallout>

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

    <!-- 第一轮：始终可编辑 -->
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
              <label class="field-label">{{ t('courseRegistration.batch.roundStart') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.preselect.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[0]"
                @update:model-value="(v) => onScheduleDateChange(0, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.preselect.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[1]"
                @update:model-value="(v) => onScheduleDateChange(1, v)"
              />
            </div>
            <div v-if="audienceTab === AUDIENCE_SENIOR" class="form-field form-field-full">
              <label class="field-label">{{ t('courseRegistration.batch.seniorResultReleaseAt') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.seniorResultReleaseAt"
                :placeholder="t('courseRegistration.batch.seniorResultReleaseAtPlaceholder')"
                @update:model-value="(v) => (form.seniorResultReleaseAt = v || '')"
              />
            </div>
          </div>

          <div class="scope-toolbar">
            <button
              v-if="!hasScopeForRound('preselect')"
              type="button"
              class="btn btn-primary"
              @click="openScopeModal('preselect')"
            >
              + {{ t('courseRegistration.batch.scopeAdd') }}
            </button>
          </div>
          <div class="scope-rules-table-wrap">
            <table class="data-table scope-rules-table">
              <thead>
                <tr>
                  <th class="col-no">{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeProgrammeIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeStudentCount') }}</th>
                  <th class="col-actions">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in preselectScopeRules" :key="`pre-${item.index}`">
                  <td class="col-no">{{ item.index + 1 }}</td>
                  <td>{{ dimLabel(item.rule.faculties ?? item.rule.faculty) }}</td>
                  <td>{{ dimLabel(item.rule.programmeIntakes ?? item.rule.programmeIntake) }}</td>
                  <td>
                    <button
                      type="button"
                      class="link-btn scope-count-link"
                      @click="openRoundStudentList('preselect')"
                    >
                      {{ t('courseRegistration.batch.scopeStudentCountValue', { count: scopeStudentCount(item.rule) }) }}
                    </button>
                  </td>
                  <td class="col-actions">
                    <button type="button" class="link-btn" @click="openScopeModal('preselect', item)">
                      {{ t('common.edit') }}
                    </button>
                    <button type="button" class="link-btn danger" @click="removeScopeRule(item.index)">
                      {{ t('common.delete') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!preselectScopeRules.length">
                  <td colspan="5" class="empty-cell">{{ t('courseRegistration.batch.scopeEmptyHintRound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- 第二轮 -->
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
        <CourseRegistrationCallout v-if="!roundGates.main.open" variant="warning">
          <p>{{ t(roundGates.main.lockReasonKey) }}</p>
        </CourseRegistrationCallout>
        <div class="round-card" :class="{ 'is-locked': !roundGates.main.open }">
          <div class="round-fields">
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.roundStart') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.main.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[2]"
                :disabled="!roundGates.main.open"
                @update:model-value="(v) => onScheduleDateChange(2, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.main.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[3]"
                :disabled="!roundGates.main.open"
                @update:model-value="(v) => onScheduleDateChange(3, v)"
              />
            </div>
          </div>
          <div class="scope-toolbar">
            <button
              v-if="!hasScopeForRound('main')"
              type="button"
              class="btn btn-primary"
              :disabled="!roundGates.main.open"
              @click="openScopeModal('main')"
            >
              + {{ t('courseRegistration.batch.scopeAdd') }}
            </button>
          </div>
          <div class="scope-rules-table-wrap">
            <table class="data-table scope-rules-table">
              <thead>
                <tr>
                  <th class="col-no">{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeProgrammeIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeStudentCount') }}</th>
                  <th class="col-actions">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in mainScopeRules" :key="`main-${item.index}`">
                  <td class="col-no">{{ item.index + 1 }}</td>
                  <td>{{ dimLabel(item.rule.faculties ?? item.rule.faculty) }}</td>
                  <td>{{ dimLabel(item.rule.programmeIntakes ?? item.rule.programmeIntake) }}</td>
                  <td>
                    <button
                      type="button"
                      class="link-btn scope-count-link"
                      @click="openRoundStudentList('main')"
                    >
                      {{ t('courseRegistration.batch.scopeStudentCountValue', { count: scopeStudentCount(item.rule) }) }}
                    </button>
                  </td>
                  <td class="col-actions">
                    <button
                      type="button"
                      class="link-btn"
                      :disabled="!roundGates.main.open"
                      @click="roundGates.main.open && openScopeModal('main', item)"
                    >
                      {{ t('common.edit') }}
                    </button>
                    <button
                      type="button"
                      class="link-btn danger"
                      :disabled="!roundGates.main.open"
                      @click="roundGates.main.open && removeScopeRule(item.index)"
                    >
                      {{ t('common.delete') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!mainScopeRules.length">
                  <td colspan="5" class="empty-cell">{{ t('courseRegistration.batch.scopeEmptyHintRound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- 第三轮 -->
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
        <CourseRegistrationCallout v-if="!roundGates.supplement.open" variant="warning">
          <p>{{ t(roundGates.supplement.lockReasonKey) }}</p>
        </CourseRegistrationCallout>
        <div class="round-card" :class="{ 'is-locked': !roundGates.supplement.open }">
          <div class="round-fields">
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.roundStart') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.supplement.start"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[4]"
                :disabled="!roundGates.supplement.open"
                @update:model-value="(v) => onScheduleDateChange(4, v)"
              />
            </div>
            <div class="form-field">
              <label class="field-label">{{ t('courseRegistration.batch.roundEnd') }}</label>
              <DatePickerEn
                mode="datetime"
                :model-value="form.rounds.supplement.end"
                :placeholder="t('common.pleaseSelectDateTime')"
                :min-date="scheduleMinDates[5]"
                :disabled="!roundGates.supplement.open"
                @update:model-value="(v) => onScheduleDateChange(5, v)"
              />
            </div>
          </div>
          <div class="scope-toolbar">
            <button
              v-if="!hasScopeForRound('supplement')"
              type="button"
              class="btn btn-primary"
              :disabled="!roundGates.supplement.open"
              @click="openScopeModal('supplement')"
            >
              + {{ t('courseRegistration.batch.scopeAdd') }}
            </button>
          </div>
          <div class="scope-rules-table-wrap">
            <table class="data-table scope-rules-table">
              <thead>
                <tr>
                  <th class="col-no">{{ t('common.serialNo') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeFaculty') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeProgrammeIntake') }}</th>
                  <th>{{ t('courseRegistration.batch.scopeStudentCount') }}</th>
                  <th class="col-actions">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in supplementScopeRules" :key="`sup-${item.index}`">
                  <td class="col-no">{{ item.index + 1 }}</td>
                  <td>{{ dimLabel(item.rule.faculties ?? item.rule.faculty) }}</td>
                  <td>{{ dimLabel(item.rule.programmeIntakes ?? item.rule.programmeIntake) }}</td>
                  <td>
                    <button
                      type="button"
                      class="link-btn scope-count-link"
                      @click="openRoundStudentList('supplement')"
                    >
                      {{ t('courseRegistration.batch.scopeStudentCountValue', { count: scopeStudentCount(item.rule) }) }}
                    </button>
                  </td>
                  <td class="col-actions">
                    <button
                      type="button"
                      class="link-btn"
                      :disabled="!roundGates.supplement.open"
                      @click="roundGates.supplement.open && openScopeModal('supplement', item)"
                    >
                      {{ t('common.edit') }}
                    </button>
                    <button
                      type="button"
                      class="link-btn danger"
                      :disabled="!roundGates.supplement.open"
                      @click="roundGates.supplement.open && removeScopeRule(item.index)"
                    >
                      {{ t('common.delete') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!supplementScopeRules.length">
                  <td colspan="5" class="empty-cell">{{ t('courseRegistration.batch.scopeEmptyHintRound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>

  <BatchScopeRuleModal
    :visible="scopeModalVisible"
    :fixed-round="scopeModalRound"
    :initial-rule="editingScopeRule"
    @close="closeScopeModal"
    @confirm="handleScopeConfirm"
  />
</template>

<style scoped>
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

.text-input {
  width: 100%;
  max-width: 280px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
}

.field-hint {
  margin: 6px 0 0;
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

.round-card {
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.round-card.is-locked {
  opacity: 0.72;
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

.scope-rules-table .col-no {
  width: 56px;
  text-align: center;
}

.scope-rules-table .col-actions {
  width: 120px;
  text-align: center;
  white-space: nowrap;
}

.scope-rules-table .col-actions .link-btn + .link-btn {
  margin-left: 8px;
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

.link-btn.danger {
  color: #dc2626;
}

.scope-count-link {
  font-weight: 500;
  white-space: nowrap;
}

.scope-count-link {
  font-weight: 500;
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

@media (max-width: 720px) {
  .round-fields {
    grid-template-columns: 1fr;
  }
}
</style>
