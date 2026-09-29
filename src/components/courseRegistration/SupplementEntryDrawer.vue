<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
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
} from '../../data/courseRegistration/supplementListQueue.js'
import { formatIntakeBatch } from '../../data/intakeSets.js'

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
/** 新增：多选学生；编辑：单人展示 */
const selectedStudents = ref([])

function createEmptyForm() {
  return {
    supplement: true,
    canAdd: true,
    canDrop: true,
    canRetake: true,
    bypassPrerequisite: false,
    bypassCreditMin: false,
    prereqCourseCodes: [],
    prereqValidUntil: '',
    permissionHours: {
      supplement: SUPPLEMENT_INVITE_HOURS,
      canAdd: SUPPLEMENT_INVITE_HOURS,
      canDrop: SUPPLEMENT_INVITE_HOURS,
      canRetake: SUPPLEMENT_INVITE_HOURS,
      bypassPrerequisite: SUPPLEMENT_INVITE_HOURS,
      bypassCreditMin: SUPPLEMENT_INVITE_HOURS,
    },
    remark: '',
    sendInviteOnSave: true,
  }
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
      bypassCreditMin: n.bypassCreditMin,
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

const showInviteHours = computed(() => form.value.supplement)

function onSupplementChange() {
  if (!form.value.supplement) {
    form.value.canAdd = false
    form.value.canDrop = false
    form.value.canRetake = false
  } else {
    form.value.canAdd = true
    form.value.canDrop = true
    form.value.canRetake = true
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

function openCoursePicker() {
  coursePickerOpen.value = true
}

function onCoursesPicked(codes) {
  form.value.prereqCourseCodes = [...(codes || [])]
  coursePickerOpen.value = false
}

function removePrereqCode(code) {
  form.value.prereqCourseCodes = (form.value.prereqCourseCodes || []).filter((c) => c !== code)
}

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
    bypassCreditMax: false,
    bypassCreditMin: form.value.bypassCreditMin,
    prereqCourseCodes: codes,
    permissionHours: syncGatedHoursFromParent(form.value.permissionHours),
    permissionUntil,
    remark: form.value.remark,
  }
}

function handleSave() {
  formError.value = ''
  if (isCreate.value && !selectedStudents.value.length) {
    formError.value = t('courseRegistration.whitelist.studentRequired')
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
    !form.value.bypassCreditMin
  ) {
    formError.value = t('courseRegistration.whitelist.permissionAnyRequired')
    return
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
        bypassCreditMax: false,
        bypassCreditMin: form.value.bypassCreditMin,
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
      <p class="hint">{{ t('courseRegistration.whitelist.formHint') }}</p>

      <template v-if="isCreate">
        <label class="field-label">{{ t('courseRegistration.whitelist.selectStudent') }} *</label>
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
          <label class="checkbox-row checkbox-row--parent">
            <input
              v-model="form.supplement"
              type="checkbox"
              @change="onSupplementChange"
            />
            {{ t('courseRegistration.whitelist.perm.supplement') }}
          </label>
          <div class="permission-children">
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input v-model="form.canAdd" type="checkbox" :disabled="!form.supplement" />
              {{ t('courseRegistration.whitelist.perm.canAdd') }}
            </label>
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input v-model="form.canDrop" type="checkbox" :disabled="!form.supplement" />
              {{ t('courseRegistration.whitelist.perm.canDrop') }}
            </label>
            <label class="checkbox-row" :class="{ 'is-disabled': !form.supplement }">
              <input v-model="form.canRetake" type="checkbox" :disabled="!form.supplement" />
              {{ t('courseRegistration.whitelist.perm.canRetake') }}
            </label>
          </div>
        </div>
        <div class="permission-side">
          <label class="checkbox-row">
            <input v-model="form.bypassPrerequisite" type="checkbox" />
            {{ t('courseRegistration.whitelist.perm.bypassPrerequisite') }}
          </label>
          <label class="checkbox-row">
            <input v-model="form.bypassCreditMin" type="checkbox" />
            {{ t('courseRegistration.whitelist.perm.bypassCreditMin') }}
          </label>
        </div>
      </div>

      <div v-if="showInviteHours" class="hours-block">
        <p class="field-label">{{ t('courseRegistration.whitelist.perPermissionHours') }}</p>
        <div class="hours-row">
          <span>{{ t('courseRegistration.whitelist.perm.supplement') }}</span>
          <input
            v-model.number="form.permissionHours.supplement"
            type="number"
            min="1"
            class="hours-input"
          />
          <span class="muted">h</span>
        </div>
      </div>

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
                @click="openCoursePicker"
              >
                <template v-if="(form.prereqCourseCodes || []).length">
                  <span
                    v-for="code in form.prereqCourseCodes"
                    :key="code"
                    class="tag-chip"
                    @click.stop
                  >
                    <span class="tag-chip-text">{{ code }}</span>
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
              <button type="button" class="btn btn-default" @click="openCoursePicker">
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

      <label class="field-label">{{ t('courseRegistration.supplement.remark') }}</label>
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
    :selected-codes="form.prereqCourseCodes"
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
.hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
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
.checkbox-row input {
  accent-color: #2563eb;
}
.hours-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
}
.hours-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
}
.hours-input {
  width: 64px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
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
