<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import {
  universityOperatorOptions,
  defaultImages,
  section2ImageFields,
  section3ImageFields,
  imageFieldLabels,
  loadUniversityInfo,
  saveUniversityInfo,
  validateUniversityForm,
  toMonthInputValue,
  fromMonthInputValue,
  readImageFile,
} from '../data/universityInfo.js'

const form = reactive(loadUniversityInfo())
const errors = ref({})
const saveMessage = ref('')

const confirmVisible = ref(false)
const pendingDeleteImageKey = ref('')
const fileInputRef = ref(null)
const uploadingImageKey = ref('')

onMounted(() => {
  Object.assign(form, loadUniversityInfo())
})

const establishedMonthInput = computed({
  get() {
    return toMonthInputValue(form.establishedMonthYear)
  },
  set(value) {
    form.establishedMonthYear = fromMonthInputValue(value)
    clearFieldError('establishedMonthYear')
  },
})

function openEstablishedPicker() {
  document.getElementById('established-month-picker')?.showPicker?.()
}

function clearFieldError(key) {
  if (errors.value[key]) {
    const next = { ...errors.value }
    delete next[key]
    errors.value = next
  }
}

function handleSave() {
  saveMessage.value = ''
  const validationErrors = validateUniversityForm(form)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length) {
    const firstKey = Object.keys(validationErrors)[0]
    document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  const saved = saveUniversityInfo({ ...form })
  Object.assign(form, saved)
  saveMessage.value = 'Saved successfully.'
}

function triggerUpload(key) {
  uploadingImageKey.value = key
  fileInputRef.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  const key = uploadingImageKey.value
  if (!file || !key) return
  try {
    form[key] = await readImageFile(file)
  } catch (err) {
    window.alert(err.message || 'Failed to upload image')
  } finally {
    uploadingImageKey.value = ''
  }
}

function requestDeleteImage(key) {
  pendingDeleteImageKey.value = key
  confirmVisible.value = true
}

function confirmDeleteImage() {
  const key = pendingDeleteImageKey.value
  if (key) {
    form[key] = defaultImages[key]
  }
  pendingDeleteImageKey.value = ''
  confirmVisible.value = false
}

function getDeleteMessage() {
  const label = imageFieldLabels[pendingDeleteImageKey.value] || 'this image'
  return `Are you sure you want to delete ${label}? This action cannot be undone. The image will be restored to the system default.`
}
</script>

<template>
  <div class="university-page">
    <div class="page-card">
      <form class="uni-form" @submit.prevent="handleSave">
        <div class="form-grid">
          <div id="field-moheRegistrationNo" class="form-item" :class="{ 'has-error': errors.moheRegistrationNo }">
            <label><span class="required">*</span> MOHE Registration Certificate No.:</label>
            <input
              v-model="form.moheRegistrationNo"
              type="text"
              placeholder="please input"
              @input="clearFieldError('moheRegistrationNo')"
            />
            <p v-if="errors.moheRegistrationNo" class="error-text">{{ errors.moheRegistrationNo }}</p>
          </div>

          <div class="form-item">
            <label>University Operator:</label>
            <select v-model="form.universityOperator">
              <option value="">please select</option>
              <option v-for="opt in universityOperatorOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div id="field-universityName" class="form-item" :class="{ 'has-error': errors.universityName }">
            <label><span class="required">*</span> University Name:</label>
            <input
              v-model="form.universityName"
              type="text"
              placeholder="please input"
              @input="clearFieldError('universityName')"
            />
            <p v-if="errors.universityName" class="error-text">{{ errors.universityName }}</p>
          </div>

          <div id="field-companyNo" class="form-item" :class="{ 'has-error': errors.companyNo }">
            <label>Company No.:</label>
            <input
              v-model="form.companyNo"
              type="text"
              placeholder="please input"
              @input="clearFieldError('companyNo')"
            />
            <p v-if="errors.companyNo" class="error-text">{{ errors.companyNo }}</p>
          </div>

          <div id="field-universityNameChinese" class="form-item" :class="{ 'has-error': errors.universityNameChinese }">
            <label><span class="required">*</span> University Name (Chinese):</label>
            <input
              v-model="form.universityNameChinese"
              type="text"
              placeholder="please input"
              @input="clearFieldError('universityNameChinese')"
            />
            <p v-if="errors.universityNameChinese" class="error-text">{{ errors.universityNameChinese }}</p>
          </div>

          <div id="field-universityNameMal" class="form-item" :class="{ 'has-error': errors.universityNameMal }">
            <label><span class="required">*</span> University Name (MAL):</label>
            <input
              v-model="form.universityNameMal"
              type="text"
              placeholder="please input"
              @input="clearFieldError('universityNameMal')"
            />
            <p v-if="errors.universityNameMal" class="error-text">{{ errors.universityNameMal }}</p>
          </div>

          <div id="field-contactNo" class="form-item" :class="{ 'has-error': errors.contactNo }">
            <label>Contact No.:</label>
            <input
              v-model="form.contactNo"
              type="text"
              placeholder="please input"
              @input="clearFieldError('contactNo')"
            />
            <p v-if="errors.contactNo" class="error-text">{{ errors.contactNo }}</p>
          </div>

          <div id="field-postCode" class="form-item" :class="{ 'has-error': errors.postCode }">
            <label>Post Code:</label>
            <input
              v-model="form.postCode"
              type="text"
              placeholder="please input"
              @input="clearFieldError('postCode')"
            />
            <p v-if="errors.postCode" class="error-text">{{ errors.postCode }}</p>
          </div>

          <div id="field-faxNo" class="form-item" :class="{ 'has-error': errors.faxNo }">
            <label>Fax No.:</label>
            <input
              v-model="form.faxNo"
              type="text"
              placeholder="please input"
              @input="clearFieldError('faxNo')"
            />
            <p v-if="errors.faxNo" class="error-text">{{ errors.faxNo }}</p>
          </div>

          <div id="field-email" class="form-item" :class="{ 'has-error': errors.email }">
            <label>Email:</label>
            <input
              v-model="form.email"
              type="text"
              placeholder="please input"
              @input="clearFieldError('email')"
            />
            <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
          </div>

          <div id="field-website" class="form-item" :class="{ 'has-error': errors.website }">
            <label>Website:</label>
            <input
              v-model="form.website"
              type="text"
              placeholder="please input"
              @input="clearFieldError('website')"
            />
            <p v-if="errors.website" class="error-text">{{ errors.website }}</p>
          </div>

          <div id="field-establishedMonthYear" class="form-item" :class="{ 'has-error': errors.establishedMonthYear }">
            <label>Established (Month /Year):</label>
            <div class="date-input">
              <input
                id="established-month-picker"
                v-model="establishedMonthInput"
                type="month"
                class="month-picker"
              />
              <button type="button" class="calendar-btn" aria-label="Select date" @click="openEstablishedPicker">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
            <p v-if="errors.establishedMonthYear" class="error-text">{{ errors.establishedMonthYear }}</p>
          </div>

          <div class="form-item form-item-empty" aria-hidden="true"></div>

          <div id="field-universityAddress" class="form-item form-item-full" :class="{ 'has-error': errors.universityAddress }">
            <label><span class="required">*</span> University Address:</label>
            <input
              v-model="form.universityAddress"
              type="text"
              placeholder="please input"
              @input="clearFieldError('universityAddress')"
            />
            <p v-if="errors.universityAddress" class="error-text">{{ errors.universityAddress }}</p>
          </div>
        </div>

        <div id="field-adminPortalLogo" class="image-field">
          <label>Admin Portal Logo:</label>
          <div class="image-content">
            <button type="button" class="image-preview preview-logo" @click="triggerUpload('adminPortalLogo')">
              <img :src="form.adminPortalLogo" alt="Admin Portal Logo" />
            </button>
            <button
              type="button"
              class="delete-link"
              @click="requestDeleteImage('adminPortalLogo')"
            >
              Delete
            </button>
            <p class="image-hint">
              Displayed on the home page. Recommended image size: 670px (width) × 670px (height).
            </p>
          </div>
        </div>

        <div class="form-stack">
          <div
            v-for="item in section2ImageFields.slice(0, 2)"
            :key="item.key"
            :id="`field-${item.key}`"
            class="image-field"
          >
            <label>{{ item.label }}</label>
            <div class="image-content">
              <button
                type="button"
                class="image-preview"
                :class="item.previewClass"
                @click="triggerUpload(item.key)"
              >
                <img :src="form[item.key]" :alt="item.label" />
              </button>
              <button
                type="button"
                class="delete-link"
                @click="requestDeleteImage(item.key)"
              >
                Delete
              </button>
              <p class="image-hint">{{ item.hint }}</p>
            </div>
          </div>

          <div id="field-loginPageTitle" class="form-item form-item-stack" :class="{ 'has-error': errors.loginPageTitle }">
            <label>Login Page Title:</label>
            <input
              v-model="form.loginPageTitle"
              type="text"
              placeholder="please input"
              @input="clearFieldError('loginPageTitle')"
            />
            <p v-if="errors.loginPageTitle" class="error-text">{{ errors.loginPageTitle }}</p>
          </div>

          <div id="field-loginPageTitleUserPortal" class="form-item form-item-stack" :class="{ 'has-error': errors.loginPageTitleUserPortal }">
            <label>Login Page Title (User Portal):</label>
            <input
              v-model="form.loginPageTitleUserPortal"
              type="text"
              placeholder="please input"
              @input="clearFieldError('loginPageTitleUserPortal')"
            />
            <p v-if="errors.loginPageTitleUserPortal" class="error-text">{{ errors.loginPageTitleUserPortal }}</p>
          </div>

          <div id="field-browserTitle" class="form-item form-item-stack" :class="{ 'has-error': errors.browserTitle }">
            <label>Browser Title:</label>
            <input
              v-model="form.browserTitle"
              type="text"
              placeholder="please input"
              @input="clearFieldError('browserTitle')"
            />
            <p v-if="errors.browserTitle" class="error-text">{{ errors.browserTitle }}</p>
          </div>

          <div
            v-for="item in section2ImageFields.slice(2, 3)"
            :key="item.key"
            :id="`field-${item.key}`"
            class="image-field"
          >
            <label>{{ item.label }}</label>
            <div class="image-content">
              <button
                type="button"
                class="image-preview"
                :class="item.previewClass"
                @click="triggerUpload(item.key)"
              >
                <img :src="form[item.key]" :alt="item.label" />
              </button>
              <button
                type="button"
                class="delete-link"
                @click="requestDeleteImage(item.key)"
              >
                Delete
              </button>
              <p class="image-hint">{{ item.hint }}</p>
            </div>
          </div>
        </div>

        <div class="form-stack section-3">
          <div
            v-for="item in section3ImageFields"
            :key="item.key"
            :id="`field-${item.key}`"
            class="image-field"
          >
            <label>{{ item.label }}</label>
            <div class="image-content">
              <button
                type="button"
                class="image-preview"
                :class="item.previewClass"
                @click="triggerUpload(item.key)"
              >
                <img :src="form[item.key]" :alt="item.label" />
              </button>
              <button type="button" class="delete-link" @click="requestDeleteImage(item.key)">
                Delete
              </button>
              <p class="image-hint">{{ item.hint }}</p>
            </div>
          </div>

          <div id="field-mobilePortalTitle" class="form-item form-item-stack" :class="{ 'has-error': errors.mobilePortalTitle }">
            <label>Mobile Portal Title:</label>
            <input
              v-model="form.mobilePortalTitle"
              type="text"
              placeholder="please input"
              @input="clearFieldError('mobilePortalTitle')"
            />
            <p v-if="errors.mobilePortalTitle" class="error-text">{{ errors.mobilePortalTitle }}</p>
          </div>

          <div class="form-grid form-grid-motto">
            <div id="field-mottoLeft" class="form-item" :class="{ 'has-error': errors.mottoLeft }">
              <label>Motto (Left Side):</label>
              <input
                v-model="form.mottoLeft"
                type="text"
                placeholder="please input"
                @input="clearFieldError('mottoLeft')"
              />
              <p v-if="errors.mottoLeft" class="error-text">{{ errors.mottoLeft }}</p>
            </div>

            <div id="field-mottoRight" class="form-item" :class="{ 'has-error': errors.mottoRight }">
              <label>Motto (Right Side):</label>
              <input
                v-model="form.mottoRight"
                type="text"
                placeholder="please input"
                @input="clearFieldError('mottoRight')"
              />
              <p v-if="errors.mottoRight" class="error-text">{{ errors.mottoRight }}</p>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
          <button type="submit" class="btn-save">Save</button>
        </div>
      </form>

      <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="handleFileChange" />
    </div>

    <ConfirmDialog
      :visible="confirmVisible"
      title="Delete Confirmation"
      :message="getDeleteMessage()"
      confirm-text="Delete"
      @confirm="confirmDeleteImage"
      @cancel="confirmVisible = false"
    />
  </div>
</template>

<style scoped>
.university-page {
  min-height: calc(100vh - 56px);
  padding: 24px 28px 32px;
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 28px 32px 36px;
}

.uni-form {
  max-width: 980px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 56px;
  margin-bottom: 28px;
}

.form-item {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: start;
  gap: 4px 12px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.form-item-empty {
  visibility: hidden;
}

.form-item label,
.image-field label {
  padding-top: 8px;
  font-size: 13px;
  color: #374151;
  text-align: right;
  line-height: 1.4;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-item input,
.form-item select,
.date-input input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
  grid-column: 2;
}

.form-item select {
  appearance: auto;
}

.date-input {
  position: relative;
  grid-column: 2;
  display: flex;
  align-items: center;
}

.date-input input,
.month-picker {
  width: 100%;
  height: 36px;
  padding: 0 40px 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
}

.month-picker::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 36px;
  height: 100%;
  cursor: pointer;
}

.calendar-btn {
  position: absolute;
  right: 0;
  top: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
}

.month-picker {
  grid-column: unset;
}

.date-input:focus-within .calendar-btn {
  color: #2563eb;
}

.date-input svg {
  width: 16px;
  height: 16px;
}

.form-item input:focus,
.form-item select:focus,
.date-input input:focus,
.month-picker:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-item.has-error input,
.form-item.has-error select,
.form-item.has-error .date-input input,
.form-item.has-error .month-picker {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12);
}

.error-text {
  grid-column: 2;
  font-size: 12px;
  color: #ef4444;
}

.image-field {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  margin-bottom: 24px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 8px;
}

.form-item-stack {
  margin-bottom: 18px;
}

.image-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.image-preview {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  padding: 8px;
  overflow: hidden;
  cursor: pointer;
}

.image-preview:hover {
  border-color: #93c5fd;
}

.preview-logo {
  width: 200px;
  height: 200px;
}

.preview-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.preview-wide {
  width: 320px;
  height: 180px;
}

.preview-wide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.preview-medium {
  width: 160px;
  height: 144px;
}

.preview-medium img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.preview-icon {
  width: 80px;
  height: 80px;
}

.preview-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.preview-mobile {
  width: 280px;
  height: 48px;
}

.preview-mobile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.section-3 {
  margin-top: 8px;
}

.form-grid-motto {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 56px;
  margin-bottom: 8px;
}

.delete-link {
  font-size: 13px;
  color: #2563eb;
}

.delete-link:hover {
  text-decoration: underline;
}

.image-hint {
  font-size: 12px;
  color: #ef4444;
  line-height: 1.5;
  max-width: 520px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 36px;
}

.save-message {
  font-size: 13px;
  color: #059669;
}

.btn-save {
  min-width: 120px;
  height: 40px;
  padding: 0 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.28);
}

.btn-save:hover {
  background: #1d4ed8;
}

.hidden-input {
  display: none;
}
</style>
