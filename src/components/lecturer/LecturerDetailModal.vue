<script setup>
import { ref, watch, computed } from 'vue'
import {
  formSteps,
  formatDateDisplay,
  formatAttachmentSize,
  formatUploadTimestamp,
} from '../../data/lecturers.js'

const props = defineProps({
  visible: Boolean,
  data: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const currentStep = ref(1)
const cpdExpanded = ref({})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      currentStep.value = 1
      if (props.data?.cpdByYear) {
        const expanded = {}
        props.data.cpdByYear.forEach((y) => {
          expanded[y.year] = y.expanded !== false
        })
        cpdExpanded.value = expanded
      }
    }
  },
)

const isLastStep = computed(() => currentStep.value === formSteps.length)

function stepClass(stepId) {
  return stepId === currentStep.value ? 'active' : ''
}

function goToStep(stepId) {
  currentStep.value = stepId
}

function display(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function formatMonthDisplay(value) {
  if (!value) return '--'
  const slash = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slash) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[Number(slash[2]) - 1]} ${slash[3]}`
  }
  const match = String(value).match(/^(\d{4})-(\d{2})$/)
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[Number(match[2]) - 1]} ${match[1]}`
  }
  return formatDateDisplay(value)
}

function toggleCpdYear(year) {
  cpdExpanded.value[year] = !cpdExpanded.value[year]
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && data" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Detail</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="emit('close')">×</button>
        </div>

        <div class="stepper">
          <div class="stepper-track">
            <div v-for="(step, index) in formSteps" :key="step.id" class="step-unit">
              <button
                type="button"
                class="step-unit-body"
                :class="stepClass(step.id)"
                :aria-current="step.id === currentStep ? 'step' : undefined"
                @click="goToStep(step.id)"
              >
                <div class="step-circle">{{ step.id }}</div>
                <span class="step-label">{{ step.label }}</span>
              </button>
              <div v-if="index < formSteps.length - 1" class="step-connector" aria-hidden="true">
                <span class="step-connector-line" />
                <svg class="step-connector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-body">
          <!-- Step 1 -->
          <div v-show="currentStep === 1">
            <section class="detail-section">
              <h3 class="section-title"><span class="bar" />Personal Information</h3>
              <div class="detail-columns">
                <div class="detail-col detail-col-left">
                  <div class="detail-row"><span class="label">Name:</span><span class="value">{{ data.name }}</span></div>
                  <div class="detail-row"><span class="label">Name_MAL:</span><span class="value">{{ display(data.nameMal) }}</span></div>
                  <div class="detail-row"><span class="label">Date of Birth:</span><span class="value">{{ formatDateDisplay(data.personal?.dateOfBirth) }}</span></div>
                  <div class="detail-row"><span class="label">Mobile Phone:</span><span class="value">{{ display(data.personal?.mobilePhone) }}</span></div>
                  <div class="detail-row"><span class="label">Degree:</span><span class="value">{{ data.degree }}</span></div>
                </div>
                <div class="detail-col detail-col-right">
                  <div class="detail-row"><span class="label">Name_CN:</span><span class="value">{{ display(data.nameCn) }}</span></div>
                  <div class="detail-row"><span class="label">Gender:</span><span class="value">{{ data.gender }}</span></div>
                  <div class="detail-row"><span class="label">Nationality:</span><span class="value">{{ display(data.personal?.nationality) }}</span></div>
                  <div class="detail-row"><span class="label">Personal Email:</span><span class="value">{{ display(data.personal?.personalEmail) }}</span></div>
                  <div class="detail-row"><span class="label">Research Focus Areas:</span><span class="value">{{ display(data.personal?.researchFocusAreas) }}</span></div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <h3 class="section-title"><span class="bar" />Employment Information</h3>
              <div class="detail-columns">
                <div class="detail-col detail-col-left">
                  <div class="detail-row"><span class="label">Staff ID:</span><span class="value">{{ data.staffId }}</span></div>
                  <div class="detail-row"><span class="label">School/Department:</span><span class="value">{{ data.department }}</span></div>
                  <div class="detail-row"><span class="label">Title:</span><span class="value">{{ data.title }}</span></div>
                  <div class="detail-row"><span class="label">Office Extension:</span><span class="value">{{ display(data.employment?.officeExtension) }}</span></div>
                  <div class="detail-row"><span class="label">Date of Joining:</span><span class="value">{{ formatDateDisplay(data.dateOfJoining) }}</span></div>
                  <div class="detail-row"><span class="label">Currently Teaching:</span><span class="value">{{ data.employment?.currentlyTeaching }}</span></div>
                </div>
                <div class="detail-col detail-col-right">
                  <div class="detail-row"><span class="label">Category:</span><span class="value">{{ data.category }}</span></div>
                  <div class="detail-row"><span class="label">FOU/UG/PG:</span><span class="value">{{ display(data.employment?.foundationUndergraduatePostgraduate) }}</span></div>
                  <div class="detail-row"><span class="label">Academic Position:</span><span class="value">{{ data.academicPosition }}</span></div>
                  <div class="detail-row"><span class="label">XMUM Email:</span><span class="value">{{ display(data.employment?.xmumEmail) }}</span></div>
                  <div class="detail-row"><span class="label">Employment Status:</span><span class="value">{{ data.employmentStatus }}</span></div>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <h3 class="section-title"><span class="bar" />Others</h3>
              <div v-if="data.attachment" class="attachment-block">
                <div class="detail-row detail-row-full">
                  <span class="label">Upload Attachment:</span>
                  <div class="file-card">
                    <span class="file-icon">DOC</span>
                    <div class="file-info">
                      <span class="file-name">{{ data.attachment.fileName }}</span>
                      <span class="file-meta">{{ formatAttachmentSize(data.attachment.size) }} | Uploaded at: {{ formatUploadTimestamp(data.attachment.uploadedAt) }}</span>
                    </div>
                    <button type="button" class="download-btn" title="Download">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="detail-row detail-row-full">
                <span class="label">Remarks:</span>
                <span class="value">{{ display(data.remarks) }}</span>
              </div>
            </section>
          </div>

          <!-- Step 2 -->
          <div v-show="currentStep === 2">
            <div v-if="!data.qualifications?.length" class="empty-hint">No academic qualifications recorded.</div>
            <div v-for="(qual, index) in data.qualifications" :key="qual.id" class="qual-card">
              <h3 class="card-title"><span class="bar" />Qualification {{ index + 1 }}</h3>
              <div class="detail-grid">
                <div class="detail-item"><span class="label">Name of Qualification:</span><span class="value">{{ qual.name }}</span></div>
                <div class="detail-item"><span class="label">Name of Awarding Institution:</span><span class="value">{{ qual.institution }}</span></div>
                <div class="detail-item"><span class="label">Awarding country:</span><span class="value">{{ qual.country }}</span></div>
                <div class="detail-item"><span class="label">Year of Award:</span><span class="value">{{ qual.year }}</span></div>
                <div class="detail-item full"><span class="label">Remarks:</span><span class="value">{{ display(qual.remarks) }}</span></div>
              </div>
              <div v-if="qual.attachments?.length" class="attachments">
                <div v-for="att in qual.attachments" :key="att.id" class="file-card">
                  <span class="file-icon">DOC</span>
                  <div class="file-info">
                    <span class="file-name">{{ att.fileName }}</span>
                    <span class="file-meta">{{ formatAttachmentSize(att.size) }}, Uploaded at: {{ formatUploadTimestamp(att.uploadedAt) }}</span>
                  </div>
                  <button type="button" class="download-btn" title="Download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div v-show="currentStep === 3">
            <div v-if="!data.workingExperiences?.length" class="empty-hint">No working experience recorded.</div>
            <div v-for="(exp, index) in data.workingExperiences" :key="exp.id" class="exp-card">
              <h3 class="card-title"><span class="bar" />Working Experience {{ index + 1 }}</h3>
              <div class="detail-grid">
                <div class="detail-item"><span class="label">Academic Position:</span><span class="value">{{ exp.academicPosition }}</span></div>
                <div class="detail-item"><span class="label">Employer:</span><span class="value">{{ exp.employer }}</span></div>
                <div class="detail-item"><span class="label">Start of Service:</span><span class="value">{{ formatMonthDisplay(exp.startDate) }}</span></div>
                <div class="detail-item"><span class="label">End of Service:</span><span class="value">{{ formatMonthDisplay(exp.endDate) }}</span></div>
                <div class="detail-item"><span class="label">Experience in Education (Years):</span><span class="value">{{ exp.educationYears }}</span></div>
                <div class="detail-item"><span class="label">Experience in Industry (Relevant Fields) (Years):</span><span class="value">{{ exp.industryYears }}</span></div>
              </div>
            </div>
          </div>

          <!-- Step 4 CPD -->
          <div v-show="currentStep === 4">
            <div v-if="!data.cpdByYear?.length" class="empty-hint">No CPD records available. Data will appear after HR sync or teacher portal approval.</div>
            <div v-for="yearGroup in data.cpdByYear" :key="yearGroup.year" class="cpd-year-panel">
              <button type="button" class="cpd-year-header" @click="toggleCpdYear(yearGroup.year)">
                <span class="bar" />
                <span class="year-label">{{ yearGroup.year }}</span>
                <span class="year-stats">Number of Activity Attended: {{ yearGroup.activityCount }}</span>
                <span class="year-stats">Number of Hours Earned: {{ yearGroup.hoursEarned }}</span>
                <svg class="chevron" :class="{ up: cpdExpanded[yearGroup.year] }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div v-show="cpdExpanded[yearGroup.year]" class="cpd-table-wrap">
                <table class="cpd-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Name of Activity</th>
                      <th>Name of Activity Provider</th>
                      <th>Type of Activity</th>
                      <th>Category</th>
                      <th>Mode of Delivery</th>
                      <th>Date(s) Attended</th>
                      <th>Number of Hours Earned</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(act, idx) in yearGroup.activities" :key="act.id">
                      <td>{{ idx + 1 }}</td>
                      <td>{{ act.name }}</td>
                      <td>{{ act.provider }}</td>
                      <td>{{ act.type }}</td>
                      <td>{{ act.category }}</td>
                      <td>{{ act.deliveryMode }}</td>
                      <td>{{ act.datesAttended }}</td>
                      <td>{{ act.hoursEarned }}</td>
                      <td><button type="button" class="evidence-link">{{ act.evidence }}</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="currentStep > 1" type="button" class="btn btn-default" @click="currentStep -= 1">Previous</button>
          <button v-if="!isLastStep" type="button" class="btn btn-primary" @click="currentStep += 1">Next</button>
          <button v-else type="button" class="btn btn-primary" @click="emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
}
.modal-panel {
  --modal-pad-left: 32px;
  --modal-pad-right: 48px;
  --modal-footer-pad-right: 24px;
  width: 100%; max-width: 1000px; max-height: 92vh;
  display: flex; flex-direction: column; background: #fff; border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px var(--modal-pad-right) 12px var(--modal-pad-left);
  background: #fafafa; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.modal-title { font-size: 16px; font-weight: 600; color: #111827; }
.modal-close {
  width: 32px; height: 32px; font-size: 22px; color: #6b7280;
  display: flex; align-items: center; justify-content: center; border-radius: 8px;
}
.modal-close:hover { background: #f0f0f0; }
.stepper {
  padding: 20px var(--modal-pad-right) 16px var(--modal-pad-left);
  flex-shrink: 0;
  overflow-x: auto;
}
.stepper-track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: center;
  min-width: min-content;
  margin: 0 auto;
}
.step-unit {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex: 0 0 auto;
}
.step-unit-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 118px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font: inherit;
  text-align: center;
}
.step-unit-body:hover .step-circle {
  border-color: #93c5fd;
  color: #2563eb;
}
.step-unit-body:hover .step-label {
  color: #2563eb;
}
.step-unit-body.active:hover .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.step-unit-body.active:hover .step-label {
  color: #2563eb;
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  box-sizing: border-box;
  flex-shrink: 0;
}
.step-label {
  margin-top: 8px;
  min-height: 44px;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  width: 100%;
  line-height: 1.35;
}
.step-unit-body.active .step-circle {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.step-unit-body.active .step-label {
  color: #2563eb;
  font-weight: 500;
}
.step-connector {
  display: flex;
  align-items: center;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
  color: #cbd5e1;
}
.step-connector-line {
  flex: 1;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}
.step-connector-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-left: -2px;
}
.modal-body { flex: 1; overflow-y: auto; padding: 0 var(--modal-pad-right) 20px var(--modal-pad-left); }
.detail-section { margin-bottom: 24px; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 14px;
}
.bar { width: 3px; height: 16px; background: #2563eb; border-radius: 2px; }
.detail-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 32px;
}
.detail-col {
  display: grid;
  grid-template-columns: var(--detail-label-w) minmax(0, 1fr);
  gap: 12px 12px;
  align-items: start;
}
.detail-col-left { --detail-label-w: 132px; }
.detail-col-right { --detail-label-w: 168px; }
.detail-row {
  display: contents;
}
.detail-row .label {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  text-align: right;
  white-space: nowrap;
}
.detail-row .value {
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  min-width: 0;
}
.detail-row-full {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.detail-row-full .label {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  text-align: right;
  white-space: nowrap;
}
.detail-row-full .value {
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; }
.detail-item { display: flex; gap: 8px; font-size: 14px; line-height: 1.5; }
.detail-item.full { grid-column: 1 / -1; }
.detail-item .label { color: #6b7280; min-width: 180px; text-align: right; flex-shrink: 0; }
.detail-item .value { color: #111827; word-break: break-word; }
.attachment-block { margin-bottom: 16px; }
.file-card {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;
}
.file-icon {
  width: 36px; height: 36px; background: #dbeafe; color: #2563eb; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.file-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.file-name { font-size: 13px; color: #111827; }
.file-meta { font-size: 12px; color: #9ca3af; }
.download-btn { width: 32px; height: 32px; color: #6b7280; display: flex; align-items: center; justify-content: center; }
.download-btn svg { width: 18px; height: 18px; }
.empty-hint { color: #9ca3af; font-size: 14px; padding: 20px 0; }
.qual-card, .exp-card {
  border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;
}
.card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 14px;
}
.attachments { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.cpd-year-panel { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.cpd-year-header {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px;
  background: #f9fafb; font-size: 14px; text-align: left;
}
.year-label { font-weight: 600; color: #111827; }
.year-stats { color: #6b7280; font-size: 13px; margin-left: 8px; }
.chevron { width: 16px; height: 16px; margin-left: auto; color: #9ca3af; transition: transform 0.2s; }
.chevron.up { transform: rotate(180deg); }
.cpd-table-wrap { overflow-x: auto; padding: 0 16px 16px; }
.cpd-table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 13px; }
.cpd-table th, .cpd-table td { padding: 10px 12px; border: 1px solid #e5e7eb; text-align: left; }
.cpd-table th { background: #f9fafb; color: #6b7280; font-weight: 600; }
.evidence-link { color: #2563eb; font-size: 13px; padding: 0; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px var(--modal-footer-pad-right) 16px var(--modal-pad-left);
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 36px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
.btn-primary { background: #2563eb; color: #fff; }
.btn-default { background: #fff; border: 1px solid #d1d5db; color: #374151; }
</style>
