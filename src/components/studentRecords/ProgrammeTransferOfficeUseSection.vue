<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  programmeOptions,
  semesterOptions,
  resolveProgrammeTransferOfficeUseDefaults,
} from '../../data/programmeTransfers.js'
import { formatMovementDate } from '../../utils/formatMovementDate.js'
import '../../styles/movement-detail-body.css'
import '../../styles/movement-form.css'

const props = defineProps({
  item: { type: Object, default: null },
  editable: { type: Boolean, default: false },
  modelValue: {
    type: Object,
    default: () => ({
      adminNewProgramme: '',
      adminNewIntake: '',
      adminDate: '',
    }),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t, tr } = useAppI18n()

const displayValues = computed(() => {
  if (props.editable) return props.modelValue
  return resolveProgrammeTransferOfficeUseDefaults(props.item || props.modelValue)
})

function updateField(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="movement-detail-body programme-transfer-office-use">
    <div class="section-bar">{{ t('programmeTransfer.sections.officeUse') }}</div>

    <dl v-if="!editable" class="detail-grid">
      <div>
        <dt>{{ t('programmeTransfer.fields.newProgrammeFirst') }}</dt>
        <dd>{{ displayValues.adminNewProgramme || '—' }}</dd>
      </div>
      <div>
        <dt>{{ t('programmeTransfer.fields.startSemester') }}</dt>
        <dd>{{ displayValues.adminNewIntake || '—' }}</dd>
      </div>
      <div>
        <dt>{{ t('programmeTransfer.fields.adminApprovalDate') }}</dt>
        <dd>{{ displayValues.adminDate ? formatMovementDate(displayValues.adminDate) : '—' }}</dd>
      </div>
    </dl>

    <div v-else class="form-grid">
      <div class="form-field">
        <label>{{ t('programmeTransfer.fields.newProgrammeFirst') }}</label>
        <select
          :value="modelValue.adminNewProgramme"
          class="form-control"
          @change="updateField('adminNewProgramme', $event.target.value)"
        >
          <option value="">{{ tr('please select') }}</option>
          <option v-for="opt in programmeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
      <div class="form-field">
        <label>{{ t('programmeTransfer.fields.startSemester') }}</label>
        <select
          :value="modelValue.adminNewIntake"
          class="form-control"
          @change="updateField('adminNewIntake', $event.target.value)"
        >
          <option value="">{{ tr('please select') }}</option>
          <option v-for="opt in semesterOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
      <div class="form-field">
        <label>{{ t('programmeTransfer.fields.adminApprovalDate') }}</label>
        <input
          :value="modelValue.adminDate"
          type="date"
          class="form-control"
          @input="updateField('adminDate', $event.target.value)"
        />
      </div>
    </div>
  </div>
</template>
