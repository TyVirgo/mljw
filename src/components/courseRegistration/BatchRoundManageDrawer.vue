<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import DatePickerEn from '../common/DatePickerEn.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { formatDualAudienceRoundsSummary } from '../../data/courseRegistration/registrationBatches.js'
import {
  roundsToPicker,
  addDropWindowToPicker,
  roundsFromPicker,
  getManageRoundsScheduleMinDates,
  clearInvalidManageRoundsScheduleAfter,
  pickerToBatchDate,
  batchDateToPicker,
} from '../../data/courseRegistration/registrationBatchFormUtils.js'
import {
  AUDIENCE_FRESHMAN,
  AUDIENCE_SENIOR,
  ensureRoundsByAudience,
  syncLegacyRoundsFromAudience,
} from '../../data/courseRegistration/audienceRounds.js'
import {
  getBatchRound1Quota,
  normalizeRound1Quota,
  previewDaySharePercents,
  DEMO_ROUND1_OPEN_DAYS,
  DEFAULT_DECAY_R,
  intakeLabelsForYear,
  meYearAddOptions,
  meYearDefaultPool,
  meYearSharePercentSum,
} from '../../data/courseRegistration/batchRound1Quota.js'

const props = defineProps({
  visible: Boolean,
  batch: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const { t } = useAppI18n()

const form = ref({
  rounds: roundsToPicker(),
  seniorRounds: roundsToPicker(),
  freshmanRounds: roundsToPicker(),
  seniorResultReleaseAt: '',
  addDropWindow: { start: '', end: '' },
  round1Quota: getBatchRound1Quota(null),
})
const audienceTab = ref(AUDIENCE_SENIOR)
const preselectExpanded = ref(true)
const mainExpanded = ref(true)
const supplementExpanded = ref(true)
const meShareError = ref('')
const roundSaveError = ref('')

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
    preselectExpanded.value = true
    mainExpanded.value = true
    supplementExpanded.value = true
    audienceTab.value = AUDIENCE_SENIOR
    meShareError.value = ''
    roundSaveError.value = ''
    const by = ensureRoundsByAudience(props.batch)
    form.value = {
      rounds: roundsToPicker(by.senior),
      seniorRounds: roundsToPicker(by.senior),
      freshmanRounds: roundsToPicker(by.freshman),
      seniorResultReleaseAt: batchDateToPicker(by.senior.resultReleaseAt || ''),
      addDropWindow: addDropWindowToPicker(props.batch.addDropWindow),
      round1Quota: getBatchRound1Quota(props.batch),
    }
  },
  { immediate: true },
)

const isGeBatch = computed(() => String(props.batch?.type || '').toUpperCase() === 'GE')
const isMeBatch = computed(() => String(props.batch?.type || '').toUpperCase() === 'ME')

/** Demo 展示固定 N=5，与份额预览一致 */
const round1OpenDays = computed(() => DEMO_ROUND1_OPEN_DAYS)

const daySharePreview = computed(() =>
  previewDaySharePercents(DEMO_ROUND1_OPEN_DAYS, form.value.round1Quota?.decayR ?? DEFAULT_DECAY_R),
)

const meYearRows = computed(() => {
  const map = form.value.round1Quota?.meYearShares || {}
  return Object.keys(map)
    .sort()
    .map((year) => ({
      year,
      intakes: intakeLabelsForYear(year).join(' · '),
      share: map[year] ?? 0,
    }))
})

const meYearAddChoices = computed(() =>
  meYearAddOptions(
    props.batch?.academicSession,
    Object.keys(form.value.round1Quota?.meYearShares || {}),
  ),
)

const meShareSum = computed(() => meYearSharePercentSum(form.value.round1Quota?.meYearShares))

/**
 * 某行入学年下拉：默认 6 年池 + 本行当前年；去掉其他行已占用年；新年在前
 * @param {string} currentYear
 * @returns {string[]}
 */
function meYearSelectOptions(currentYear) {
  const pool = meYearDefaultPool(props.batch?.academicSession)
  const taken = new Set(Object.keys(form.value.round1Quota?.meYearShares || {}))
  taken.delete(String(currentYear || ''))
  const years = new Set(pool)
  if (currentYear) years.add(String(currentYear))
  return [...years]
    .filter((y) => !taken.has(y))
    .sort((a, b) => Number(b) - Number(a))
}

function setDecayR(value) {
  const n = Number(value)
  form.value.round1Quota = {
    ...form.value.round1Quota,
    decayR: Number.isFinite(n) && n > 0 ? n : DEFAULT_DECAY_R,
  }
}

function setMeYearShare(year, event) {
  const el = event?.target
  const raw = el ? el.value : event
  const n = Math.max(0, Number(raw))
  if (!Number.isFinite(n)) {
    if (el) el.value = String(form.value.round1Quota.meYearShares?.[year] ?? 0)
    return
  }
  if (n > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareRowMax')
    if (el) el.value = String(form.value.round1Quota.meYearShares?.[year] ?? 0)
    return
  }
  const next = {
    ...form.value.round1Quota.meYearShares,
    [year]: n,
  }
  const sum = meYearSharePercentSum(next)
  if (sum > 100) {
    meShareError.value = t('courseRegistration.batch.round1MeShareOver', { sum })
    if (el) el.value = String(form.value.round1Quota.meYearShares?.[year] ?? 0)
    return
  }
  meShareError.value = ''
  form.value.round1Quota = {
    ...form.value.round1Quota,
    meYearShares: next,
  }
}

function addMeYearRow() {
  const year = String(meYearAddChoices.value[0] || '').trim()
  if (!/^\d{4}$/.test(year)) return
  if (form.value.round1Quota.meYearShares?.[year] != null) return
  meShareError.value = ''
  form.value.round1Quota = {
    ...form.value.round1Quota,
    meYearShares: {
      ...form.value.round1Quota.meYearShares,
      [year]: 0,
    },
  }
}

function changeMeYear(fromYear, toYear) {
  const nextYear = String(toYear || '').trim()
  if (!/^\d{4}$/.test(nextYear) || nextYear === String(fromYear)) return
  const map = { ...form.value.round1Quota.meYearShares }
  if (map[nextYear] != null) return
  const share = map[fromYear]
  delete map[fromYear]
  map[nextYear] = share
  meShareError.value = ''
  form.value.round1Quota = { ...form.value.round1Quota, meYearShares: map }
}

function removeMeYearRow(year) {
  const next = { ...form.value.round1Quota.meYearShares }
  delete next[year]
  meShareError.value = ''
  form.value.round1Quota = { ...form.value.round1Quota, meYearShares: next }
}

const title = computed(() =>
  t('courseRegistration.batch.manageRoundsTitle', {
    name: props.batch?.name || '',
  }),
)

const includeResultRelease = computed(() => audienceTab.value === AUDIENCE_SENIOR)
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
  if (!props.batch) return
  roundSaveError.value = ''
  persistCurrentAudienceFromForm()

  const senior = form.value.seniorRounds
  const freshman = form.value.freshmanRounds

  if (
    isEmptyTime(senior.preselect.start) ||
    isEmptyTime(senior.preselect.end) ||
    isEmptyTime(form.value.seniorResultReleaseAt) ||
    isEmptyTime(senior.main.start) ||
    isEmptyTime(senior.main.end) ||
    isEmptyTime(senior.supplement.start) ||
    isEmptyTime(senior.supplement.end)
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
  if (
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
  if (
    audienceTab.value === AUDIENCE_FRESHMAN &&
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
  if (isGeBatch.value) {
    const decay = Number(form.value.round1Quota?.decayR)
    if (!Number.isFinite(decay) || decay <= 0) {
      roundSaveError.value = t('courseRegistration.batch.roundDecayRequired')
      return
    }
  }
  if (isMeBatch.value) {
    const sum = meShareSum.value
    if (sum !== 100) {
      meShareError.value = t('courseRegistration.batch.round1MeShareNeed100', { sum })
      return
    }
  }
  meShareError.value = ''
  const seniorPicker = form.value.seniorRounds
  const freshmanPicker = form.value.freshmanRounds
  const seniorFromForm = roundsFromPicker(seniorPicker)
  const freshmanFromForm = roundsFromPicker(freshmanPicker)

  const seniorRounds = {
    preselect: seniorFromForm.preselect,
    main: seniorFromForm.main,
    supplement: seniorFromForm.supplement,
    resultReleaseAt: pickerToBatchDate(String(form.value.seniorResultReleaseAt || '').trim()),
  }

  const freshmanRounds = {
    preselect: freshmanFromForm.preselect,
    main: freshmanFromForm.main,
    supplement: freshmanFromForm.supplement,
  }

  const roundsByAudience = { senior: seniorRounds, freshman: freshmanRounds }
  const rounds = syncLegacyRoundsFromAudience(roundsByAudience)

  const addDropWindow = props.batch.addDropWindow || { start: '', end: '' }

  emit('save', {
    rounds,
    roundsByAudience,
    roundsSummary: formatDualAudienceRoundsSummary(
      { rounds, roundsByAudience, addDropWindow },
      addDropWindow,
    ),
    // 双时间线后不再用 preferSenior 挡新生；保存时关掉旧闸门
    preselectPriority: { preferSenior: false, minSemestersAbove: 1 },
    round1Quota: normalizeRound1Quota(
      form.value.round1Quota,
      props.batch.type,
      props.batch.programme,
      props.batch.academicSession,
    ),
  })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" @close="emit('close')">
    <CourseRegistrationCallout variant="info">
      <p>{{ t('courseRegistration.batch.manageRoundsHint') }}{{ t('common.prototypeOnlySuffix') }}</p>
      <p>{{ t('courseRegistration.batch.audienceRoundsHint') }}</p>
    </CourseRegistrationCallout>
    <CourseRegistrationCallout v-if="roundSaveError" variant="warning">
      <p>{{ roundSaveError }}</p>
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
            <div v-if="audienceTab === AUDIENCE_SENIOR" class="form-field form-field-full">
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
            v-if="audienceTab === AUDIENCE_SENIOR && (isGeBatch || isMeBatch)"
            class="round1-quota-block"
          >
            <h4 class="round1-quota-title">{{ t('courseRegistration.batch.round1QuotaTitle') }}</h4>

            <template v-if="isGeBatch">
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
            </template>

            <template v-else-if="isMeBatch">
              <div class="scope-toolbar round1-me-toolbar">
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="!meYearAddChoices.length"
                  @click="addMeYearRow"
                >
                  + {{ t('common.create') }}
                </button>
                <span class="round1-me-sum">
                  {{ t('courseRegistration.batch.round1MeShareSum', { sum: meShareSum }) }}
                </span>
              </div>
              <div class="scope-rules-table-wrap">
                <table class="data-table scope-rules-table">
                  <thead>
                    <tr>
                      <th>{{ t('courseRegistration.batch.round1MeYear') }}</th>
                      <th>{{ t('courseRegistration.batch.round1MeIntakes') }}</th>
                      <th>
                        <span class="req">*</span> {{ t('courseRegistration.batch.round1MeShare') }}
                      </th>
                      <th class="col-actions">{{ t('common.actions') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in meYearRows" :key="row.year">
                      <td>
                        <select
                          class="me-year-select"
                          :value="row.year"
                          @change="changeMeYear(row.year, $event.target.value)"
                        >
                          <option
                            v-for="y in meYearSelectOptions(row.year)"
                            :key="y"
                            :value="y"
                          >
                            {{ y }}
                          </option>
                        </select>
                      </td>
                      <td class="me-intakes-cell">{{ row.intakes }}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          class="inline-number"
                          :value="row.share"
                          @change="setMeYearShare(row.year, $event)"
                        />
                      </td>
                      <td class="col-actions">
                        <button type="button" class="link-btn" @click="removeMeYearRow(row.year)">
                          {{ t('common.delete') }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!meYearRows.length">
                      <td colspan="4" class="empty-cell">
                        {{ t('courseRegistration.batch.round1MeEmpty') }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="round1-quota-hint">
                {{
                  t('courseRegistration.batch.round1MeHint', {
                    programme: props.batch?.programme || '—',
                  })
                }}
              </p>
              <p v-if="meShareError" class="error-text">{{ meShareError }}</p>
            </template>
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
  margin: 12px 0 16px;
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

.round1-me-sum {
  font-size: 13px;
  color: #6b7280;
  margin-left: auto;
}

.me-year-select {
  min-width: 108px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.error-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b91c1c;
}

.me-prog-input {
  width: 140px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
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
