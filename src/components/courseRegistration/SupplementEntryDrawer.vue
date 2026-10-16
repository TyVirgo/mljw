<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import CourseRegistrationCallout from './CourseRegistrationCallout.vue'
import WhitelistStudentPickModal from './WhitelistStudentPickModal.vue'
import WhitelistCoursePickModal from './WhitelistCoursePickModal.vue'
import AcademicSessionMonthPicker from './AcademicSessionMonthPicker.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  updateSupplementEntry,
  addStudentToSupplementList,
  sendSupplementInvite,
  SUPPLEMENT_INVITE_HOURS,
  normalizeWhitelistEntry,
  FUTURE_ELECTIVE_ME_CATEGORY_KEYS,
} from '../../data/courseRegistration/supplementListQueue.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'
import { getCourseByCode } from '../../data/courseRegistration/selectableCourses.js'
import {
  formatWhitelistSectionTag,
  normalizeWhitelistSectionRefs,
} from '../../data/courseRegistration/whitelistSectionRefs.js'

const props = defineProps({
  visible: Boolean,
  /** null = 新增模式 */
  entry: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useAppI18n()

const isCreate = computed(() => !props.entry?.id)
const form = ref(createEmptyForm())
const formError = ref('')
const pickerOpen = ref(false)
const coursePickerOpen = ref(false)
/** @type {import('vue').Ref<'prereq'|'futureMandatory'|'coreSwitchAdd'|'coreSwitchRetake'>} */
const coursePickerMode = ref('prereq')
/** 新增：多选学生；编辑：单人展示 */
const selectedStudents = ref([])

function createEmptyForm() {
  return {
    supplement: true,
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassPrerequisite: false,
    bypassCreditMax: false,
    creditBypassExtra: 3,
    allowFutureMandatory: false,
    futureMandatorySections: [],
    allowCoreSectionSwitchAdd: false,
    coreSectionSwitchAddSections: [],
    allowCoreSectionSwitchRetake: false,
    coreSectionSwitchRetakeSections: [],
    allowFutureElective: false,
    allowDropBelowCreditMin: false,
    futureElectiveGeCredits: 3,
    futureElectiveMeCredits: 3,
    futureElectiveMeCategoryKeys: [],
    prereqCourseCodes: [],
    prereqValidUntil: '',
    permissionHours: {
      supplement: SUPPLEMENT_INVITE_HOURS,
      canAdd: SUPPLEMENT_INVITE_HOURS,
      canDrop: SUPPLEMENT_INVITE_HOURS,
      canRetake: SUPPLEMENT_INVITE_HOURS,
      bypassPrerequisite: SUPPLEMENT_INVITE_HOURS,
    },
    remark: '',
    sendInviteOnSave: true,
  }
}

const meCategoryOptions = FUTURE_ELECTIVE_ME_CATEGORY_KEYS.map((key) => ({
  key,
  labelKey: `courseRegistration.whitelist.futureElectiveMeCat.${key}`,
}))

function isMeCategoryChecked(key) {
  return (form.value.futureElectiveMeCategoryKeys || []).includes(key)
}

function toggleMeCategory(key, checked) {
  const set = new Set(form.value.futureElectiveMeCategoryKeys || [])
  if (checked) set.add(key)
  else set.delete(key)
  form.value.futureElectiveMeCategoryKeys = [...set]
}

function toSessionValue(raw) {
  const s = String(raw || '').trim()
  if (/^\d{4}\/\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{4})-(\d{2})/)
  if (m) return `${m[1]}/${m[2]}`
  return ''
}

/** 保存前：父项小时数同步到已开的邀请门子权限 */
function syncGatedHoursFromParent(hours) {
  const parent = Number(hours.supplement) > 0 ? Number(hours.supplement) : SUPPLEMENT_INVITE_HOURS
  return {
    ...hours,
    supplement: parent,
    canAdd: parent,
    canDrop: parent,
    canRetake: parent,
  }
}

watch(
  () => [props.visible, props.entry],
  () => {
    if (!props.visible) return
    formError.value = ''
    pickerOpen.value = false
    coursePickerOpen.value = false
    if (!props.entry?.id) {
      form.value = createEmptyForm()
      selectedStudents.value = []
      return
    }
    const n = normalizeWhitelistEntry(props.entry)
    const hours = { ...createEmptyForm().permissionHours }
    for (const perm of n.permissions || []) {
      if (perm.validHours != null) hours[perm.key] = perm.validHours
    }
    // 编辑展示以父项时长为准
    const parentHours =
      hours.supplement != null && Number(hours.supplement) > 0
        ? Number(hours.supplement)
        : SUPPLEMENT_INVITE_HOURS
    hours.supplement = parentHours
    const prereq = (n.permissions || []).find((p) => p.key === 'bypassPrerequisite')
    selectedStudents.value = [
      {
        studentId: n.studentId,
        studentName: n.studentName,
        programme: n.programme,
        intake: n.intake,
      },
    ]
    const parentOn = n.supplement !== false
    form.value = {
      supplement: parentOn,
      canAdd: parentOn && n.canAdd,
      canDrop: parentOn && n.canDrop,
      canRetake: parentOn && n.canRetake,
      bypassPrerequisite: n.bypassPrerequisite,
      bypassCreditMax: n.bypassCreditMax,
      creditBypassExtra: n.creditBypassExtra > 0 ? n.creditBypassExtra : 3,
      allowFutureMandatory: n.allowFutureMandatory,
      futureMandatorySections: normalizeWhitelistSectionRefs(n.futureMandatorySections),
      allowCoreSectionSwitchAdd: parentOn && n.canAdd && n.allowCoreSectionSwitchAdd,
      coreSectionSwitchAddSections: normalizeWhitelistSectionRefs(
        n.coreSectionSwitchAddSections,
      ),
      allowCoreSectionSwitchRetake:
        parentOn && n.canRetake && n.allowCoreSectionSwitchRetake,
      coreSectionSwitchRetakeSections: normalizeWhitelistSectionRefs(
        n.coreSectionSwitchRetakeSections,
      ),
      allowFutureElective: n.allowFutureElective,
      allowDropBelowCreditMin: n.allowDropBelowCreditMin,
      futureElectiveGeCredits:
        n.futureElectiveGeCredits > 0 ? n.futureElectiveGeCredits : 3,
      futureElectiveMeCredits:
        n.futureElectiveMeCredits > 0 ? n.futureElectiveMeCredits : 3,
      futureElectiveMeCategoryKeys: [...(n.futureElectiveMeCategoryKeys || [])],
      prereqCourseCodes: [...(prereq?.courseCodes || [])],
      prereqValidUntil: toSessionValue(prereq?.validUntil || ''),
      permissionHours: hours,
      remark: n.remark || '',
      sendInviteOnSave: false,
    }
  },
  { immediate: true },
)

const title = computed(() => {
  if (isCreate.value) return t('courseRegistration.whitelist.createTitle')
  return props.entry?.studentName || t('courseRegistration.whitelist.editTitle')
})

const subtitle = computed(() => {
  if (isCreate.value) {
    const n = selectedStudents.value.length
    if (!n) return ''
    if (n === 1) {
      const s = selectedStudents.value[0]
      const intake = formatIntakeBatch(s.intake) || s.intake
      return `${s.studentId} · ${s.programme || '—'}/${intake || '—'}`
    }
    return t('courseRegistration.result.selectedStudents', { count: n })
  }
  const s = selectedStudents.value[0]
  if (!s?.studentId) return ''
  const intake = formatIntakeBatch(s.intake) || s.intake
  return `${s.studentId} · ${s.programme || '—'}/${intake || '—'}`
})

function onSupplementChange() {
  if (!form.value.supplement) {
    form.value.canAdd = false
    form.value.canDrop = false
    form.value.canRetake = false
    form.value.allowCoreSectionSwitchAdd = false
    form.value.coreSectionSwitchAddSections = []
    form.value.allowCoreSectionSwitchRetake = false
    form.value.coreSectionSwitchRetakeSections = []
  } else {
    form.value.canAdd = true
    form.value.canDrop = true
    form.value.canRetake = true
  }
}

function onCanAddChange() {
  if (!form.value.canAdd) {
    form.value.allowCoreSectionSwitchAdd = false
    form.value.coreSectionSwitchAddSections = []
  }
}

function onCanRetakeChange() {
  if (!form.value.canRetake) {
    form.value.allowCoreSectionSwitchRetake = false
    form.value.coreSectionSwitchRetakeSections = []
  }
}

function onCoreSwitchAddChange() {
  if (!form.value.allowCoreSectionSwitchAdd) {
    form.value.coreSectionSwitchAddSections = []
  }
}

function onCoreSwitchRetakeChange() {
  if (!form.value.allowCoreSectionSwitchRetake) {
    form.value.coreSectionSwitchRetakeSections = []
  }
}

function onFutureMandatoryChange() {
  if (!form.value.allowFutureMandatory) {
    form.value.futureMandatorySections = []
  }
}

function onPickStudents(rows) {
  selectedStudents.value = Array.isArray(rows) ? rows.map((r) => ({ ...r })) : []
  formError.value = ''
}

function removeStudent(studentId) {
  selectedStudents.value = selectedStudents.value.filter((s) => s.studentId !== studentId)
  formError.value = ''
}

function openStudentPicker() {
  pickerOpen.value = true
}

function openCoursePicker(mode = 'prereq') {
  coursePickerMode.value = mode
  coursePickerOpen.value = true
}

function onCoursesPicked(payload) {
  if (coursePickerMode.value === 'prereq') {
    form.value.prereqCourseCodes = [...(payload || [])]
  } else if (coursePickerMode.value === 'futureMandatory') {
    form.value.futureMandatorySections = normalizeWhitelistSectionRefs(payload)
  } else if (coursePickerMode.value === 'coreSwitchAdd') {
    form.value.coreSectionSwitchAddSections = normalizeWhitelistSectionRefs(payload)
  } else if (coursePickerMode.value === 'coreSwitchRetake') {
    form.value.coreSectionSwitchRetakeSections = normalizeWhitelistSectionRefs(payload)
  }
  coursePickerOpen.value = false
}

function removePrereqCode(code) {
  form.value.prereqCourseCodes = (form.value.prereqCourseCodes || []).filter((c) => c !== code)
}

function removeSectionRef(listKey, ref) {
  const key = `${ref.courseCode}::${ref.sectionCode}`
  form.value[listKey] = normalizeWhitelistSectionRefs(form.value[listKey] || []).filter(
    (r) => `${r.courseCode}::${r.sectionCode}` !== key,
  )
}

const coursePickerProps = computed(() => {
  const mode = coursePickerMode.value
  if (mode === 'futureMandatory') {
    return {
      selectionUnit: 'section',
      coreOnly: true,
      selectedCodes: [],
      selectedSections: form.value.futureMandatorySections,
      titleKey: 'courseRegistration.whitelist.futureMandatoryPickTitle',
      hintKey: 'courseRegistration.whitelist.sectionPickHint',
    }
  }
  if (mode === 'coreSwitchAdd' || mode === 'coreSwitchRetake') {
    const sections =
      mode === 'coreSwitchAdd'
        ? form.value.coreSectionSwitchAddSections
        : form.value.coreSectionSwitchRetakeSections
    return {
      selectionUnit: 'section',
      coreOnly: true,
      selectedCodes: [],
      selectedSections: sections,
      titleKey: 'courseRegistration.whitelist.coreSwitchPickTitle',
      hintKey: 'courseRegistration.whitelist.sectionPickHint',
    }
  }
  return {
    selectionUnit: 'course',
    coreOnly: false,
    selectedCodes: form.value.prereqCourseCodes,
    selectedSections: [],
    titleKey: 'courseRegistration.whitelist.prereqCoursePickTitle',
    hintKey: 'courseRegistration.whitelist.prereqCoursePickHint',
  }
})

function buildPatch() {
  const codes = [...(form.value.prereqCourseCodes || [])]
  const permissionUntil = {}
  if (form.value.bypassPrerequisite) {
    permissionUntil.bypassPrerequisite = form.value.prereqValidUntil || ''
  }
  return {
    supplement: form.value.supplement,
    canAdd: form.value.canAdd,
    canDrop: form.value.canDrop,
    canRetake: form.value.canRetake,
    bypassPrerequisite: form.value.bypassPrerequisite,
    bypassCreditMax: form.value.bypassCreditMax,
    bypassCreditMin: false,
    creditBypassExtra: form.value.bypassCreditMax
      ? Math.min(3, Math.max(1, Number(form.value.creditBypassExtra) || 3))
      : 0,
    allowFutureMandatory: form.value.allowFutureMandatory,
    futureMandatorySections: form.value.allowFutureMandatory
      ? normalizeWhitelistSectionRefs(form.value.futureMandatorySections)
      : [],
    allowCoreSectionSwitchAdd:
      form.value.canAdd && form.value.allowCoreSectionSwitchAdd,
    coreSectionSwitchAddSections:
      form.value.canAdd && form.value.allowCoreSectionSwitchAdd
        ? normalizeWhitelistSectionRefs(form.value.coreSectionSwitchAddSections)
        : [],
    allowCoreSectionSwitchRetake:
      form.value.canRetake && form.value.allowCoreSectionSwitchRetake,
    coreSectionSwitchRetakeSections:
      form.value.canRetake && form.value.allowCoreSectionSwitchRetake
        ? normalizeWhitelistSectionRefs(form.value.coreSectionSwitchRetakeSections)
        : [],
    allowFutureElective: form.value.allowFutureElective,
    allowDropBelowCreditMin: form.value.allowDropBelowCreditMin,
    futureElectiveGeCredits: form.value.allowFutureElective
      ? Math.max(1, Number(form.value.futureElectiveGeCredits) || 1)
      : 0,
    futureElectiveMeCredits: form.value.allowFutureElective
      ? Math.max(1, Number(form.value.futureElectiveMeCredits) || 1)
      : 0,
    futureElectiveMeCategoryKeys: form.value.allowFutureElective
      ? [...(form.value.futureElectiveMeCategoryKeys || [])]
      : [],
    prereqCourseCodes: codes,
    permissionHours: syncGatedHoursFromParent(form.value.permissionHours),
    permissionUntil,
    remark: form.value.remark,
  }
}

/** 标签：课号 + 分组（按课选择，展示课+分组） */
function prereqTagLabel(code) {
  const c = getCourseByCode(code)
  const groups = Array.isArray(c?.sections) && c.sections.length
    ? c.sections.map((s) => String(s.code || '').trim()).filter(Boolean)
    : []
  if (!groups.length) return code
  return `${code} · ${groups.join('/')}`
}

function handleSave() {
  formError.value = ''
  if (isCreate.value && !selectedStudents.value.length) {
    formError.value = t('courseRegistration.whitelist.studentRequired')
    return
  }
  if (isCreate.value && !String(form.value.remark || '').trim()) {
    formError.value = t('courseRegistration.whitelist.remarkRequired')
    return
  }
  if (
    form.value.supplement &&
    !form.value.canAdd &&
    !form.value.canDrop &&
    !form.value.canRetake
  ) {
    formError.value = t('courseRegistration.whitelist.permissionRequired')
    return
  }
  if (
    !form.value.supplement &&
    !form.value.bypassPrerequisite &&
    !form.value.bypassCreditMax &&
    !form.value.allowFutureMandatory &&
    !form.value.allowFutureElective &&
    !form.value.allowDropBelowCreditMin
  ) {
    formError.value = t('courseRegistration.whitelist.permissionAnyRequired')
    return
  }
  if (form.value.bypassCreditMax) {
    const extra = Number(form.value.creditBypassExtra)
    if (!Number.isFinite(extra) || extra < 1 || extra > 3) {
      formError.value = t('courseRegistration.whitelist.creditBypassExtraInvalid')
      return
    }
  }
  if (form.value.bypassPrerequisite) {
    if (!(form.value.prereqCourseCodes || []).length) {
      formError.value = t('courseRegistration.whitelist.prereqCoursesRequired')
      return
    }
    if (!String(form.value.prereqValidUntil || '').trim()) {
      formError.value = t('courseRegistration.whitelist.prereqValidUntilRequired')
      return
    }
  }
  if (form.value.allowFutureMandatory) {
    if (!normalizeWhitelistSectionRefs(form.value.futureMandatorySections).length) {
      formError.value = t('courseRegistration.whitelist.futureMandatorySectionsRequired')
      return
    }
  }
  if (form.value.canAdd && form.value.allowCoreSectionSwitchAdd) {
    if (!normalizeWhitelistSectionRefs(form.value.coreSectionSwitchAddSections).length) {
      formError.value = t('courseRegistration.whitelist.coreSwitchSectionsRequired')
      return
    }
  }
  if (form.value.canRetake && form.value.allowCoreSectionSwitchRetake) {
    if (!normalizeWhitelistSectionRefs(form.value.coreSectionSwitchRetakeSections).length) {
      formError.value = t('courseRegistration.whitelist.coreSwitchSectionsRequired')
      return
    }
  }
  if (form.value.allowFutureElective) {
    const ge = Number(form.value.futureElectiveGeCredits)
    const me = Number(form.value.futureElectiveMeCredits)
    if (!Number.isFinite(ge) || ge < 1 || !Number.isFinite(me) || me < 1) {
      formError.value = t('courseRegistration.whitelist.futureElectiveCreditsRequired')
      return
    }
    if (!(form.value.futureElectiveMeCategoryKeys || []).length) {
      formError.value = t('courseRegistration.whitelist.futureElectiveMeCategoryRequired')
      return
    }
  }

  const patch = buildPatch()

  if (isCreate.value) {
    const createdIds = []
    let skipped = 0
    for (const stu of selectedStudents.value) {
      const result = addStudentToSupplementList(stu, {
        source: 'manual',
        supplement: form.value.supplement,
        canAdd: form.value.canAdd,
        canDrop: form.value.canDrop,
        canRetake: form.value.canRetake,
        bypassPrerequisite: form.value.bypassPrerequisite,
        bypassCreditMax: form.value.bypassCreditMax,
        creditBypassExtra: form.value.creditBypassExtra,
        allowFutureMandatory: form.value.allowFutureMandatory,
        futureMandatorySections: form.value.futureMandatorySections,
        allowCoreSectionSwitchAdd: form.value.allowCoreSectionSwitchAdd,
        coreSectionSwitchAddSections: form.value.coreSectionSwitchAddSections,
        allowCoreSectionSwitchRetake: form.value.allowCoreSectionSwitchRetake,
        coreSectionSwitchRetakeSections: form.value.coreSectionSwitchRetakeSections,
        allowFutureElective: form.value.allowFutureElective,
        allowDropBelowCreditMin: form.value.allowDropBelowCreditMin,
        futureElectiveGeCredits: form.value.futureElectiveGeCredits,
        futureElectiveMeCredits: form.value.futureElectiveMeCredits,
        futureElectiveMeCategoryKeys: form.value.futureElectiveMeCategoryKeys,
        remark: form.value.remark,
      })
      if (!result.ok) {
        skipped += 1
        continue
      }
      updateSupplementEntry(result.item.id, patch)
      if (form.value.sendInviteOnSave) {
        sendSupplementInvite(result.item.id)
      }
      createdIds.push(result.item.id)
    }
    if (!createdIds.length) {
      formError.value = t('courseRegistration.supplement.alreadyExists')
      return
    }
    if (skipped > 0) {
      window.alert(t('courseRegistration.whitelist.createSkippedExists', { n: skipped }))
    }
    emit('saved', { mode: 'create', ids: createdIds, skippedCount: skipped })
    return
  }

  updateSupplementEntry(props.entry.id, patch)
  emit('saved', { mode: 'edit', id: props.entry.id })
}
</script>

<template>
  <ApplicationDetailDrawer :visible="visible" :title="title" :subtitle="subtitle" @close="emit('close')">
    <div class="form-body">
      <CourseRegistrationCallout variant="info" class="form-hint-callout">
        <p class="hint">{{ t('courseRegistration.whitelist.formHint') }}</p>
      </CourseRegistrationCallout>

      <template v-if="isCreate">
        <label class="field-label">
          {{ t('courseRegistration.whitelist.selectStudent') }}
          <span class="req">*</span>
        </label>
        <div class="student-pick-row">
          <div
            class="tag-field"
            :class="{ 'tag-field--empty': !selectedStudents.length }"
            @click="openStudentPicker"
          >
            <template v-if="selectedStudents.length">
              <span
                v-for="stu in selectedStudents"
                :key="stu.studentId"
                class="tag-chip"
                :title="`${stu.studentName}（${stu.studentId}）`"
                @click.stop
              >
                <span class="tag-chip-text">{{ stu.studentName }}</span>
                <button
                  type="button"
                  class="tag-chip-remove"
                  :aria-label="t('common.delete')"
                  @click.stop="removeStudent(stu.studentId)"
                >
                  ×
                </button>
              </span>
            </template>
            <span v-else class="tag-placeholder">
              {{ t('courseRegistration.whitelist.selectStudentPlaceholder') }}
            </span>
          </div>
          <button type="button" class="btn btn-default" @click="openStudentPicker">
            {{
              selectedStudents.length
                ? t('courseRegistration.batch.specialChangeStudent')
                : t('studentSelect.selectButton')
            }}
          </button>
        </div>
      </template>

      <div class="permission-layout">
        <div class="permission-group">
          <label class="checkbox-row checkbox-row--parent credit-bypass-inline">
            <input
              v-model="form.supplement"
              type="checkbox"
              @change="onSupplementChange"
            />
            <span class="credit-bypass-inline-text">
              {{ t('courseRegistration.whitelist.perm.supplement')
              }}{{ t('courseRegistration.whitelist.hoursInlineSep')
              }}{{ t('courseRegistration.whitelist.inviteHoursPrefix') }}
              <input
                v-model.number="form.permissionHours.supplement"
                type="number"
                min="1"
                step="1"
                class="inline-number"
                :disabled="!form.supplement"
              />
              h
            </span>
          </label>
          <div class="permission-children">
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input
                v-model="form.canAdd"
                type="checkbox"
                :disabled="!form.supplement"
                @change="onCanAddChange"
              />
              {{ t('courseRegistration.whitelist.perm.canAdd') }}
            </label>
            <div class="permission-nested" :class="{ 'is-disabled': !form.supplement || !form.canAdd }">
              <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement || !form.canAdd }">
                <input
                  v-model="form.allowCoreSectionSwitchAdd"
                  type="checkbox"
                  :disabled="!form.supplement || !form.canAdd"
                  @change="onCoreSwitchAddChange"
                />
                {{ t('courseRegistration.whitelist.perm.allowCoreSectionSwitch') }}
              </label>
              <div v-if="form.allowCoreSectionSwitchAdd && form.canAdd" class="section-pick-inline">
                <div
                  class="tag-field tag-field--single-line"
                  :class="{
                    'tag-field--empty': !(form.coreSectionSwitchAddSections || []).length,
                  }"
                  @click="openCoursePicker('coreSwitchAdd')"
                >
                  <template v-if="(form.coreSectionSwitchAddSections || []).length">
                    <span
                      v-for="ref in form.coreSectionSwitchAddSections"
                      :key="`${ref.courseCode}::${ref.sectionCode}`"
                      class="tag-chip"
                      @click.stop
                    >
                      <span class="tag-chip-text">{{ formatWhitelistSectionTag(ref) }}</span>
                      <button
                        type="button"
                        class="tag-chip-remove"
                        :aria-label="t('common.delete')"
                        @click.stop="removeSectionRef('coreSectionSwitchAddSections', ref)"
                      >
                        ×
                      </button>
                    </span>
                  </template>
                  <span v-else class="tag-placeholder">
                    {{ t('courseRegistration.whitelist.sectionPickEmpty') }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-default"
                  @click="openCoursePicker('coreSwitchAdd')"
                >
                  {{ t('studentSelect.selectButton') }}
                </button>
              </div>
            </div>
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input v-model="form.canDrop" type="checkbox" :disabled="!form.supplement" />
              {{ t('courseRegistration.whitelist.perm.canDrop') }}
            </label>
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input
                v-model="form.canRetake"
                type="checkbox"
                :disabled="!form.supplement"
                @change="onCanRetakeChange"
              />
              {{ t('courseRegistration.whitelist.perm.canRetake') }}
            </label>
            <div
              class="permission-nested"
              :class="{ 'is-disabled': !form.supplement || !form.canRetake }"
            >
              <label
                class="checkbox-row"
                :class="{ 'is-disabled': !form.supplement || !form.canRetake }"
              >
                <input
                  v-model="form.allowCoreSectionSwitchRetake"
                  type="checkbox"
                  :disabled="!form.supplement || !form.canRetake"
                  @change="onCoreSwitchRetakeChange"
                />
                {{ t('courseRegistration.whitelist.perm.allowCoreSectionSwitch') }}
              </label>
              <div
                v-if="form.allowCoreSectionSwitchRetake && form.canRetake"
                class="section-pick-inline"
              >
                <div
                  class="tag-field tag-field--single-line"
                  :class="{
                    'tag-field--empty': !(form.coreSectionSwitchRetakeSections || []).length,
                  }"
                  @click="openCoursePicker('coreSwitchRetake')"
                >
                  <template v-if="(form.coreSectionSwitchRetakeSections || []).length">
                    <span
                      v-for="ref in form.coreSectionSwitchRetakeSections"
                      :key="`${ref.courseCode}::${ref.sectionCode}`"
                      class="tag-chip"
                      @click.stop
                    >
                      <span class="tag-chip-text">{{ formatWhitelistSectionTag(ref) }}</span>
                      <button
                        type="button"
                        class="tag-chip-remove"
                        :aria-label="t('common.delete')"
                        @click.stop="removeSectionRef('coreSectionSwitchRetakeSections', ref)"
                      >
                        ×
                      </button>
                    </span>
                  </template>
                  <span v-else class="tag-placeholder">
                    {{ t('courseRegistration.whitelist.sectionPickEmpty') }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-default"
                  @click="openCoursePicker('coreSwitchRetake')"
                >
                  {{ t('studentSelect.selectButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="permission-side">
          <label class="checkbox-row">
            <input v-model="form.bypassPrerequisite" type="checkbox" />
            {{ t('courseRegistration.whitelist.perm.bypassPrerequisite') }}
          </label>
          <label class="checkbox-row credit-bypass-inline">
            <input v-model="form.bypassCreditMax" type="checkbox" />
            <span class="credit-bypass-inline-text">
              {{
                t('courseRegistration.whitelist.perm.bypassCreditMin') +
                t('courseRegistration.whitelist.creditBypassInlineSep') +
                t('courseRegistration.whitelist.creditBypassExtraLabel')
              }}
              <input
                v-model.number="form.creditBypassExtra"
                type="number"
                min="1"
                max="3"
                step="1"
                class="inline-number"
                :disabled="!form.bypassCreditMax"
              />
              {{ t('courseRegistration.whitelist.creditBypassExtraUnit') }}
            </span>
          </label>
          <label class="checkbox-row">
            <input
              v-model="form.allowFutureMandatory"
              type="checkbox"
              @change="onFutureMandatoryChange"
            />
            {{ t('courseRegistration.whitelist.perm.allowFutureMandatory') }}
          </label>
          <label class="checkbox-row">
            <input v-model="form.allowFutureElective" type="checkbox" />
            {{ t('courseRegistration.whitelist.perm.allowFutureElective') }}
          </label>
          <label class="checkbox-row">
            <input v-model="form.allowDropBelowCreditMin" type="checkbox" />
            {{ t('courseRegistration.whitelist.perm.allowDropBelowCreditMin') }}
          </label>
        </div>
      </div>

      <template v-if="form.allowFutureElective">
        <div class="future-elective-block">
          <p class="field-label">
            {{ t('courseRegistration.whitelist.futureElectiveConfigLabel') }}
            <span class="req">*</span>
          </p>
          <div class="future-elective-credits">
            <label class="future-elective-credit-field">
              <span>{{ t('courseRegistration.whitelist.futureElectiveGeAllowSelect') }}</span>
              <input
                v-model.number="form.futureElectiveGeCredits"
                type="number"
                min="1"
                max="30"
                step="1"
                class="hours-input"
              />
              <span class="muted">{{ t('courseRegistration.whitelist.futureElectiveCreditUnit') }}</span>
            </label>
            <label class="future-elective-credit-field">
              <span>{{ t('courseRegistration.whitelist.futureElectiveMeAllowSelect') }}</span>
              <input
                v-model.number="form.futureElectiveMeCredits"
                type="number"
                min="1"
                max="30"
                step="1"
                class="hours-input"
              />
              <span class="muted">{{ t('courseRegistration.whitelist.futureElectiveCreditUnit') }}</span>
            </label>
          </div>
          <p class="field-label">
            {{ t('courseRegistration.whitelist.futureElectiveMeCategories') }}
            <span class="req">*</span>
          </p>
          <div class="me-category-grid">
            <label
              v-for="opt in meCategoryOptions"
              :key="opt.key"
              class="checkbox-row"
            >
              <input
                type="checkbox"
                :checked="isMeCategoryChecked(opt.key)"
                @change="toggleMeCategory(opt.key, $event.target.checked)"
              />
              {{ t(opt.labelKey) }}
            </label>
          </div>
        </div>
      </template>

      <template v-if="form.allowFutureMandatory">
        <div class="future-mandatory-block">
          <label class="field-label">
            {{ t('courseRegistration.whitelist.futureMandatorySections') }}
            <span class="req">*</span>
          </label>
          <div class="student-pick-row">
            <div
              class="tag-field tag-field--single-line"
              :class="{ 'tag-field--empty': !(form.futureMandatorySections || []).length }"
              @click="openCoursePicker('futureMandatory')"
            >
              <template v-if="(form.futureMandatorySections || []).length">
                <span
                  v-for="ref in form.futureMandatorySections"
                  :key="`${ref.courseCode}::${ref.sectionCode}`"
                  class="tag-chip"
                  @click.stop
                >
                  <span class="tag-chip-text">{{ formatWhitelistSectionTag(ref) }}</span>
                  <button
                    type="button"
                    class="tag-chip-remove"
                    :aria-label="t('common.delete')"
                    @click.stop="removeSectionRef('futureMandatorySections', ref)"
                  >
                    ×
                  </button>
                </span>
              </template>
              <span v-else class="tag-placeholder">
                {{ t('courseRegistration.whitelist.sectionPickEmpty') }}
              </span>
            </div>
            <button
              type="button"
              class="btn btn-default"
              @click="openCoursePicker('futureMandatory')"
            >
              {{ t('studentSelect.selectButton') }}
            </button>
          </div>
        </div>
      </template>

      <template v-if="form.bypassPrerequisite">
        <div class="prereq-row">
          <div class="prereq-col">
            <label class="field-label">
              {{ t('courseRegistration.whitelist.prereqCourses') }}
              <span class="req">*</span>
            </label>
            <div class="student-pick-row">
              <div
                class="tag-field tag-field--single-line"
                :class="{ 'tag-field--empty': !(form.prereqCourseCodes || []).length }"
                @click="openCoursePicker('prereq')"
              >
                <template v-if="(form.prereqCourseCodes || []).length">
                  <span
                    v-for="code in form.prereqCourseCodes"
                    :key="code"
                    class="tag-chip"
                    @click.stop
                  >
                    <span class="tag-chip-text" :title="prereqTagLabel(code)">{{
                      prereqTagLabel(code)
                    }}</span>
                    <button
                      type="button"
                      class="tag-chip-remove"
                      :aria-label="t('common.delete')"
                      @click.stop="removePrereqCode(code)"
                    >
                      ×
                    </button>
                  </span>
                </template>
                <span v-else class="tag-placeholder">
                  {{ t('courseRegistration.whitelist.prereqCoursesEmpty') }}
                </span>
              </div>
              <button type="button" class="btn btn-default" @click="openCoursePicker('prereq')">
                {{ t('studentSelect.selectButton') }}
              </button>
            </div>
          </div>
          <div class="prereq-col">
            <label class="field-label">
              {{ t('courseRegistration.whitelist.prereqValidUntil') }}
              <span class="req">*</span>
            </label>
            <AcademicSessionMonthPicker v-model="form.prereqValidUntil" />
          </div>
        </div>
      </template>

      <label class="field-label">
        {{ t('courseRegistration.supplement.remark') }}
        <span v-if="isCreate" class="req">*</span>
      </label>
      <textarea v-model="form.remark" class="form-input" rows="3" />

      <label v-if="isCreate" class="checkbox-row">
        <input v-model="form.sendInviteOnSave" type="checkbox" />
        {{ t('courseRegistration.whitelist.sendInviteOnSave') }}
      </label>

      <p v-if="formError" class="form-error">{{ formError }}</p>
    </div>

    <template #footer>
      <button type="button" class="btn btn-default" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="button" class="btn btn-primary" @click="handleSave">{{ t('common.save') }}</button>
    </template>
  </ApplicationDetailDrawer>

  <WhitelistStudentPickModal
    :visible="pickerOpen"
    :initial-selected="selectedStudents"
    @close="pickerOpen = false"
    @select="onPickStudents"
  />

  <WhitelistCoursePickModal
    :visible="coursePickerOpen"
    :selection-unit="coursePickerProps.selectionUnit"
    :core-only="coursePickerProps.coreOnly"
    :selected-codes="coursePickerProps.selectedCodes"
    :selected-sections="coursePickerProps.selectedSections"
    :title-key="coursePickerProps.titleKey"
    :hint-key="coursePickerProps.hintKey"
    @close="coursePickerOpen = false"
    @confirm="onCoursesPicked"
  />
</template>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-hint-callout {
  margin-bottom: 0;
}
.form-hint-callout :deep(.cr-callout__body) {
  min-width: 0;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: #1e3a8a;
  line-height: 1.55;
  white-space: pre-line;
}
.student-pick-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.tag-field {
  flex: 1;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  cursor: pointer;
  background: #fff;
}
.tag-field--empty {
  align-items: center;
}
.tag-field--single-line {
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
}
.tag-field--single-line .tag-chip {
  flex-shrink: 0;
}
.tag-placeholder {
  font-size: 13px;
  color: #9ca3af;
}
.req {
  color: #dc2626;
  margin-left: 2px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 6px 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
}
.tag-chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag-chip-remove {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.tag-chip-remove:hover {
  color: #111827;
  background: #e5e7eb;
}
.permission-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px 20px;
  align-items: start;
}
.permission-group,
.permission-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.permission-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 22px;
  padding-left: 10px;
  border-left: 2px solid #e5e7eb;
}
.permission-nested {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 22px;
  padding-left: 10px;
  border-left: 2px solid #e5e7eb;
}
.permission-nested.is-disabled {
  opacity: 0.65;
}
.section-pick-inline {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.section-pick-inline--side {
  margin-left: 22px;
}
.section-pick-inline .tag-field {
  flex: 1;
  min-width: 0;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}
.checkbox-row--parent {
  font-weight: 600;
  color: #111827;
}
.checkbox-row.is-disabled {
  color: #9ca3af;
  cursor: not-allowed;
}
.checkbox-row > input[type='checkbox'] {
  accent-color: #2563eb;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin: 0;
  align-self: center;
}
.hours-input {
  width: 64px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
.credit-bypass-inline {
  align-items: center;
}
.credit-bypass-inline-text {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 2px;
  line-height: 1.4;
  min-width: 0;
}
.inline-number {
  width: 48px;
  height: 26px;
  margin: 0 4px;
  padding: 2px 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.2;
  text-align: center;
  box-sizing: border-box;
}
.inline-number:disabled {
  opacity: 0.5;
  background: #f3f4f6;
  cursor: not-allowed;
}
.muted {
  color: #6b7280;
}
.future-elective-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.future-elective-credits {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}
.future-elective-credit-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}
.me-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 4px 12px;
}
.future-mandatory-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.prereq-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px 16px;
  align-items: start;
}
.prereq-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.field-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}
.muted {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
.form-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
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
@media (max-width: 720px) {
  .permission-layout,
  .prereq-row {
    grid-template-columns: 1fr;
  }
}
</style>
