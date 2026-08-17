<script setup>
import { ref, watch, computed } from 'vue'
import ApplicationDetailDrawer from '../common/ApplicationDetailDrawer.vue'
import WhitelistStudentPickModal from './WhitelistStudentPickModal.vue'
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
const selectedStudent = ref(null)

function createEmptyForm() {
  return {
    canAdd: true,
    canDrop: false,
    canRetake: false,
    bypassPrerequisite: false,
    bypassCreditMax: false,
    bypassCreditMin: false,
    prereqCourseCodesText: '',
    prereqValidUntil: '',
    permissionHours: {
      supplement: SUPPLEMENT_INVITE_HOURS,
      canAdd: SUPPLEMENT_INVITE_HOURS,
      canDrop: SUPPLEMENT_INVITE_HOURS,
      canRetake: SUPPLEMENT_INVITE_HOURS,
      bypassPrerequisite: SUPPLEMENT_INVITE_HOURS,
      bypassCreditMax: SUPPLEMENT_INVITE_HOURS,
      bypassCreditMin: SUPPLEMENT_INVITE_HOURS,
    },
    remark: '',
    sendInviteOnSave: false,
  }
}

watch(
  () => [props.visible, props.entry],
  () => {
    if (!props.visible) return
    formError.value = ''
    pickerOpen.value = false
    if (!props.entry?.id) {
      form.value = createEmptyForm()
      selectedStudent.value = null
      return
    }
    const n = normalizeWhitelistEntry(props.entry)
    const hours = { ...createEmptyForm().permissionHours }
    for (const perm of n.permissions || []) {
      if (perm.validHours != null) hours[perm.key] = perm.validHours
    }
    const prereq = (n.permissions || []).find((p) => p.key === 'bypassPrerequisite')
    selectedStudent.value = {
      studentId: n.studentId,
      studentName: n.studentName,
      programme: n.programme,
      intake: n.intake,
    }
    form.value = {
      canAdd: n.canAdd,
      canDrop: n.canDrop,
      canRetake: n.canRetake,
      bypassPrerequisite: n.bypassPrerequisite,
      bypassCreditMax: n.bypassCreditMax,
      bypassCreditMin: n.bypassCreditMin,
      prereqCourseCodesText: (prereq?.courseCodes || []).join(', '),
      prereqValidUntil: prereq?.validUntil || '',
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
  const s = selectedStudent.value
  if (!s?.studentId) return ''
  const intake = formatIntakeBatch(s.intake) || s.intake
  return `${s.studentId} · ${s.programme || '—'}/${intake || '—'}`
})

const gatedHourKeys = computed(() => {
  const keys = ['supplement']
  if (form.value.canAdd) keys.push('canAdd')
  if (form.value.canDrop) keys.push('canDrop')
  if (form.value.canRetake) keys.push('canRetake')
  return keys
})

function onPickStudent(row) {
  selectedStudent.value = {
    studentId: row.studentId,
    studentName: row.studentName,
    programme: row.programme,
    intake: row.intake,
  }
  formError.value = ''
}

function handleSave() {
  formError.value = ''
  if (isCreate.value && !selectedStudent.value?.studentId) {
    formError.value = t('courseRegistration.whitelist.studentRequired')
    return
  }
  if (!form.value.canAdd && !form.value.canDrop && !form.value.canRetake) {
    formError.value = t('courseRegistration.whitelist.permissionRequired')
    return
  }

  const codes = String(form.value.prereqCourseCodesText || '')
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const permissionUntil = {}
  if (form.value.bypassPrerequisite && form.value.prereqValidUntil) {
    permissionUntil.bypassPrerequisite = form.value.prereqValidUntil
  }

  if (isCreate.value) {
    const result = addStudentToSupplementList(selectedStudent.value, {
      source: 'manual',
      canAdd: form.value.canAdd,
      canDrop: form.value.canDrop,
      canRetake: form.value.canRetake,
      bypassPrerequisite: form.value.bypassPrerequisite,
      bypassCreditMax: form.value.bypassCreditMax,
      bypassCreditMin: form.value.bypassCreditMin,
      remark: form.value.remark,
    })
    if (!result.ok) {
      formError.value = t(result.errorKey || 'courseRegistration.supplement.alreadyExists')
      return
    }
    updateSupplementEntry(result.item.id, {
      canAdd: form.value.canAdd,
      canDrop: form.value.canDrop,
      canRetake: form.value.canRetake,
      bypassPrerequisite: form.value.bypassPrerequisite,
      bypassCreditMax: form.value.bypassCreditMax,
      bypassCreditMin: form.value.bypassCreditMin,
      prereqCourseCodes: codes,
      permissionHours: form.value.permissionHours,
      permissionUntil,
      remark: form.value.remark,
    })
    if (form.value.sendInviteOnSave) {
      sendSupplementInvite(result.item.id)
    }
    emit('saved', { mode: 'create', id: result.item.id })
    return
  }

  updateSupplementEntry(props.entry.id, {
    canAdd: form.value.canAdd,
    canDrop: form.value.canDrop,
    canRetake: form.value.canRetake,
    bypassPrerequisite: form.value.bypassPrerequisite,
    bypassCreditMax: form.value.bypassCreditMax,
    bypassCreditMin: form.value.bypassCreditMin,
    prereqCourseCodes: codes,
    permissionHours: form.value.permissionHours,
    permissionUntil,
    remark: form.value.remark,
  })
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
          <input
            type="text"
            class="form-input"
            readonly
            :value="
              selectedStudent
                ? `${selectedStudent.studentName}（${selectedStudent.studentId}）`
                : ''
            "
            :placeholder="t('courseRegistration.whitelist.selectStudentPlaceholder')"
          />
          <button type="button" class="btn btn-default" @click="pickerOpen = true">
            {{ t('studentSelect.selectButton') }}
          </button>
        </div>
      </template>

      <div class="permission-grid">
        <label class="checkbox-row">
          <input type="checkbox" checked disabled />
          {{ t('courseRegistration.whitelist.perm.supplement') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.canAdd" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.canAdd') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.canDrop" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.canDrop') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.canRetake" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.canRetake') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.bypassPrerequisite" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.bypassPrerequisite') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.bypassCreditMax" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.bypassCreditMax') }}
        </label>
        <label class="checkbox-row">
          <input v-model="form.bypassCreditMin" type="checkbox" />
          {{ t('courseRegistration.whitelist.perm.bypassCreditMin') }}
        </label>
      </div>

      <div class="hours-block">
        <p class="field-label">{{ t('courseRegistration.whitelist.perPermissionHours') }}</p>
        <div v-for="key in gatedHourKeys" :key="key" class="hours-row">
          <span>{{ t(`courseRegistration.whitelist.perm.${key}`) }}</span>
          <input
            v-model.number="form.permissionHours[key]"
            type="number"
            min="1"
            class="hours-input"
          />
          <span class="muted">h</span>
        </div>
      </div>

      <template v-if="form.bypassPrerequisite">
        <label class="field-label">{{ t('courseRegistration.whitelist.prereqCourses') }}</label>
        <input
          v-model="form.prereqCourseCodesText"
          type="text"
          class="form-input"
          :placeholder="t('courseRegistration.whitelist.prereqCoursesPlaceholder')"
        />
        <label class="field-label">{{ t('courseRegistration.whitelist.prereqValidUntil') }}</label>
        <input
          v-model="form.prereqValidUntil"
          type="text"
          class="form-input"
          placeholder="yyyy-mm-dd hh:mm:ss"
        />
        <p class="muted">{{ t('courseRegistration.whitelist.prereqValidUntilHint') }}</p>
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
    @close="pickerOpen = false"
    @select="onPickStudent"
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
}
.student-pick-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.student-pick-row .form-input {
  flex: 1;
}
.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
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
  font: inherit;
  box-sizing: border-box;
}
.muted {
  font-size: 12px;
  color: #9ca3af;
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
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
