<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import DatePickerEn from '../components/common/DatePickerEn.vue'
import { useAppI18n } from '../composables/useAppI18n.js'
import {
  universityOperatorOptions,
  defaultImages,
  section2ImageFields,
  section3ImageFields,
  imageFieldLabels,
  loadUniversityInfo,
  saveUniversityInfo,
  validateUniversityForm,
  readImageFile,
} from '../data/universityInfo.js'

const { t, tr } = useAppI18n()

const translatedSection2Fields = computed(() =>
  section2ImageFields.map((item) => ({
    ...item,
    label: tr(item.label),
    hint: tr(item.hint),
  })),
)

const translatedSection3Fields = computed(() =>
  section3ImageFields.map((item) => ({
    ...item,
    label: tr(item.label),
    hint: tr(item.hint),
  })),
)

const form = reactive(loadUniversityInfo())
const errors = ref({})
const saveMessage = ref('')

const confirmVisible = ref(false)
const pendingDeleteImageKey = ref('')
const fileInputRef = ref(null)
const uploadingImageKey = ref('')

function migrateEstablishedFormat() {
  const value = form.establishedMonthYear?.trim()
  if (!value) return
  const legacyMonthYear = value.match(/^(0[1-9]|1[0-2])\/(\d{4})$/)
  if (legacyMonthYear) {
    form.establishedMonthYear = `01/${legacyMonthYear[1]}/${legacyMonthYear[2]}`
    return
  }
  const legacyIsoMonth = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (legacyIsoMonth) {
    form.establishedMonthYear = `01/${legacyIsoMonth[2]}/${legacyIsoMonth[1]}`
  }
}

onMounted(() => {
  Object.assign(form, loadUniversityInfo())
  migrateEstablishedFormat()
})

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
  saveMessage.value = tr('Saved successfully.')
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
  const label = tr(imageFieldLabels[pendingDeleteImageKey.value] || 'this image')
  return tr(
    `Are you sure you want to delete ${label}? This action cannot be undone. The image will be restored to the system default.`,
  )
}
</script>

<template>
  <div class="university-page">
    <div class="page-card">
      <form class="uni-form" @submit.prevent="handleSave">
        <section class="uni-section-basic">
          <div class="form-grid-pair">
            <div id="field-moheRegistrationNo" class="form-item" :class="{ 'has-error': errors.moheRegistrationNo }">
              <label><span class="required">*</span> {{ tr('MOHE Registration Certificate No.:') }}</label>
              <input
                v-model="form.moheRegistrationNo"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('moheRegistrationNo')"
              />
              <p v-if="errors.moheRegistrationNo" class="error-text">{{ tr(errors.moheRegistrationNo) }}</p>
            </div>

            <div class="form-item">
              <label>{{ tr('University Operator:') }}</label>
              <select v-model="form.universityOperator">
                <option value="">{{ t('common.pleaseSelect') }}</option>
                <option v-for="opt in universityOperatorOptions" :key="opt" :value="opt">{{ tr(opt) }}</option>
              </select>
            </div>

            <div id="field-universityName" class="form-item" :class="{ 'has-error': errors.universityName }">
              <label><span class="required">*</span> {{ tr('University Name:') }}</label>
              <input
                v-model="form.universityName"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('universityName')"
              />
              <p v-if="errors.universityName" class="error-text">{{ tr(errors.universityName) }}</p>
            </div>

            <div id="field-companyNo" class="form-item" :class="{ 'has-error': errors.companyNo }">
              <label>{{ tr('Company No.:') }}</label>
              <input
                v-model="form.companyNo"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('companyNo')"
              />
              <p v-if="errors.companyNo" class="error-text">{{ tr(errors.companyNo) }}</p>
            </div>

            <div id="field-universityNameChinese" class="form-item" :class="{ 'has-error': errors.universityNameChinese }">
              <label><span class="required">*</span> {{ tr('University Name (Chinese):') }}</label>
              <input
                v-model="form.universityNameChinese"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('universityNameChinese')"
              />
              <p v-if="errors.universityNameChinese" class="error-text">{{ tr(errors.universityNameChinese) }}</p>
            </div>

            <div id="field-universityNameMal" class="form-item" :class="{ 'has-error': errors.universityNameMal }">
              <label><span class="required">*</span> {{ tr('University Name (MAL):') }}</label>
              <input
                v-model="form.universityNameMal"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('universityNameMal')"
              />
              <p v-if="errors.universityNameMal" class="error-text">{{ tr(errors.universityNameMal) }}</p>
            </div>

            <div id="field-postCode" class="form-item" :class="{ 'has-error': errors.postCode }">
              <label>{{ tr('Post Code:') }}</label>
              <input
                v-model="form.postCode"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('postCode')"
              />
              <p v-if="errors.postCode" class="error-text">{{ tr(errors.postCode) }}</p>
            </div>

            <div id="field-website" class="form-item" :class="{ 'has-error': errors.website }">
              <label>{{ tr('Website:') }}</label>
              <input
                v-model="form.website"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('website')"
              />
              <p v-if="errors.website" class="error-text">{{ tr(errors.website) }}</p>
            </div>

            <div id="field-contactNo" class="form-item" :class="{ 'has-error': errors.contactNo }">
              <label>{{ tr('Contact No.:') }}</label>
              <input
                v-model="form.contactNo"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('contactNo')"
              />
              <p v-if="errors.contactNo" class="error-text">{{ tr(errors.contactNo) }}</p>
            </div>

            <div id="field-faxNo" class="form-item" :class="{ 'has-error': errors.faxNo }">
              <label>{{ tr('Fax No.:') }}</label>
              <input
                v-model="form.faxNo"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('faxNo')"
              />
              <p v-if="errors.faxNo" class="error-text">{{ tr(errors.faxNo) }}</p>
            </div>
          </div>

          <div class="form-rows">
            <div id="field-email" class="form-item" :class="{ 'has-error': errors.email }">
              <label>{{ tr('Email:') }}</label>
              <input
                v-model="form.email"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('email')"
              />
              <p v-if="errors.email" class="error-text">{{ tr(errors.email) }}</p>
            </div>

            <div id="field-establishedMonthYear" class="form-item" :class="{ 'has-error': errors.establishedMonthYear }">
              <label>{{ tr('Established (Month/Year):') }}</label>
              <DatePickerEn
                v-model="form.establishedMonthYear"
                class="field-control"
                :has-error="!!errors.establishedMonthYear"
                @update:model-value="clearFieldError('establishedMonthYear')"
              />
              <p v-if="errors.establishedMonthYear" class="error-text">{{ tr(errors.establishedMonthYear) }}</p>
            </div>

            <div id="field-universityAddress" class="form-item" :class="{ 'has-error': errors.universityAddress }">
              <label><span class="required">*</span> {{ tr('University Address:') }}</label>
              <input
                v-model="form.universityAddress"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('universityAddress')"
              />
              <p v-if="errors.universityAddress" class="error-text">{{ tr(errors.universityAddress) }}</p>
            </div>

            <div id="field-adminPortalLogo" class="image-field">
              <label>{{ tr('Admin Portal Logo:') }}</label>
              <div class="image-content">
                <button type="button" class="image-preview preview-logo" @click="triggerUpload('adminPortalLogo')">
                  <img :src="form.adminPortalLogo" alt="Admin Portal Logo" />
                </button>
                <button type="button" class="delete-link" @click="requestDeleteImage('adminPortalLogo')">
                  {{ t('common.delete') }}
                </button>
                <p class="image-hint">
                  {{ tr('Displayed on the home page. Recommended image size: 670px (width) × 670px (height).') }}
                </p>
              </div>
            </div>

            <div
              v-for="item in translatedSection2Fields.slice(0, 1)"
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
                  {{ t('common.delete') }}
                </button>
                <p class="image-hint">{{ item.hint }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="uni-section-branding">
          <div class="form-rows">
            <div
              v-for="item in translatedSection2Fields.slice(1, 2)"
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
                  {{ t('common.delete') }}
                </button>
                <p class="image-hint">{{ item.hint }}</p>
              </div>
            </div>

            <div id="field-loginPageTitle" class="form-item" :class="{ 'has-error': errors.loginPageTitle }">
              <label>{{ tr('Login Page Title:') }}</label>
              <input
                v-model="form.loginPageTitle"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('loginPageTitle')"
              />
              <p v-if="errors.loginPageTitle" class="error-text">{{ tr(errors.loginPageTitle) }}</p>
            </div>

            <div id="field-loginPageTitleUserPortal" class="form-item" :class="{ 'has-error': errors.loginPageTitleUserPortal }">
              <label>{{ tr('Login Page Title (User Portal):') }}</label>
              <input
                v-model="form.loginPageTitleUserPortal"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('loginPageTitleUserPortal')"
              />
              <p v-if="errors.loginPageTitleUserPortal" class="error-text">{{ tr(errors.loginPageTitleUserPortal) }}</p>
            </div>

            <div id="field-browserTitle" class="form-item" :class="{ 'has-error': errors.browserTitle }">
              <label>{{ tr('Browser Tags:') }}</label>
              <input
                v-model="form.browserTitle"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('browserTitle')"
              />
              <p v-if="errors.browserTitle" class="error-text">{{ tr(errors.browserTitle) }}</p>
            </div>

            <div
              v-for="item in translatedSection2Fields.slice(2, 3)"
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
                  {{ t('common.delete') }}
                </button>
                <p class="image-hint">{{ item.hint }}</p>
              </div>
            </div>

            <div
              v-for="item in translatedSection3Fields"
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
                  {{ t('common.delete') }}
                </button>
                <p class="image-hint">{{ item.hint }}</p>
              </div>
            </div>

            <div id="field-mobilePortalTitle" class="form-item" :class="{ 'has-error': errors.mobilePortalTitle }">
              <label>{{ tr('Mobile Portal Title:') }}</label>
              <input
                v-model="form.mobilePortalTitle"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('mobilePortalTitle')"
              />
              <p v-if="errors.mobilePortalTitle" class="error-text">{{ tr(errors.mobilePortalTitle) }}</p>
            </div>
          </div>

          <div class="form-grid-pair form-grid-pair-tail">
            <div id="field-mottoLeft" class="form-item" :class="{ 'has-error': errors.mottoLeft }">
              <label>{{ tr('Mobile (Left Side):') }}</label>
              <input
                v-model="form.mottoLeft"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('mottoLeft')"
              />
              <p v-if="errors.mottoLeft" class="error-text">{{ tr(errors.mottoLeft) }}</p>
            </div>

            <div id="field-mottoRight" class="form-item" :class="{ 'has-error': errors.mottoRight }">
              <label>{{ tr('Mobile (Right Side):') }}</label>
              <input
                v-model="form.mottoRight"
                type="text"
                :placeholder="t('common.pleaseInput')"
                @input="clearFieldError('mottoRight')"
              />
              <p v-if="errors.mottoRight" class="error-text">{{ tr(errors.mottoRight) }}</p>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
          <button type="submit" class="btn-save">{{ t('common.save') }}</button>
        </div>
      </form>

      <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="handleFileChange" />
    </div>

    <ConfirmDialog
      :visible="confirmVisible"
      :title="t('common.deleteConfirmation')"
      :message="getDeleteMessage()"
      :confirm-text="t('common.delete')"
      @confirm="confirmDeleteImage"
      @cancel="confirmVisible = false"
    />
  </div>
</template>

<style scoped>
.university-page {
  --uni-label-width: 240px;
  min-height: calc(100vh - 56px);
  padding: 24px 28px 32px;
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 28px 40px 36px;
}

.uni-form {
  width: 100%;
  max-width: 100%;
}

.uni-section-branding {
  margin-top: 32px;
}

.form-grid-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 48px;
  row-gap: 16px;
}

.form-grid-pair-tail {
  margin-top: 8px;
}

.form-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.form-item,
.image-field {
  display: grid;
  grid-template-columns: var(--uni-label-width) minmax(0, 1fr);
  align-items: start;
  column-gap: 16px;
  row-gap: 4px;
}

.form-item label,
.image-field label {
  padding-top: 8px;
  font-size: 13px;
  font-weight: 500;
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
.field-control {
  grid-column: 2;
  width: 100%;
  min-width: 0;
}

.form-item input,
.form-item select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #fff;
}

.form-item select {
  appearance: auto;
}

.form-item input:focus,
.form-item select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.form-item.has-error input,
.form-item.has-error select {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12);
}

.error-text {
  grid-column: 2;
  font-size: 12px;
  color: #ef4444;
}

.image-content {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
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
  width: 100%;
  max-width: 480px;
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
  width: 100%;
  max-width: 400px;
  height: 48px;
}

.preview-mobile img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
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
  max-width: 100%;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px 16px;
  margin-top: 32px;
  padding-top: 8px;
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

@media (max-width: 1023px) {
  .university-page {
    --uni-label-width: 200px;
  }

  .form-grid-pair {
    grid-template-columns: 1fr;
    column-gap: 0;
  }
}

@media (max-width: 767px) {
  .university-page {
    --uni-label-width: 1fr;
  }

  .form-item,
  .image-field {
    grid-template-columns: 1fr;
  }

  .form-item label,
  .image-field label {
    text-align: left;
    padding-top: 0;
  }

  .form-item input,
  .form-item select,
  .field-control,
  .error-text,
  .image-content {
    grid-column: 1;
  }
}
</style>
