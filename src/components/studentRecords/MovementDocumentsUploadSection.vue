<script setup>
import { ref, computed, watch } from 'vue'
import AttachmentPreviewTrigger from '../common/AttachmentPreviewTrigger.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import {
  getMovementDocumentFields,
  getMovementAttachmentHintKey,
  attachmentErrorKey,
  validateMovementAttachmentFile,
  normalizeMovementAttachments,
  normalizeOtherDocuments,
} from '../../data/movementAttachments.js'
import '../../styles/movement-form.css'

const props = defineProps({
  sourceKey: { type: String, required: true },
  studentCategory: { type: String, default: '' },
  /** 国籍：休学按马/中/其他切换附件清单 */
  nationality: { type: String, default: '' },
  attachments: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:attachments', 'download-consent'])

const { t, tr } = useAppI18n()

const fileInputRefs = ref({})
const pendingLocalFiles = ref({})

const documentFields = computed(() =>
  getMovementDocumentFields(props.sourceKey, props.studentCategory, props.nationality),
)

const hintKey = computed(() => getMovementAttachmentHintKey(props.sourceKey))

const normalizedAttachments = computed(() =>
  normalizeMovementAttachments({ attachments: props.attachments }),
)

watch(
  () => [props.studentCategory, props.nationality],
  () => {
    pendingLocalFiles.value = {}
  },
)

// 原 fieldError 用于控件 error class；当前上传行未绑定 class，保留逻辑备查
// function fieldError(key) {
//   return props.errors[attachmentErrorKey(key)] ? 'error' : ''
// }

function errorMessage(key) {
  const msg = props.errors[attachmentErrorKey(key)]
  return msg ? tr(msg) : ''
}

/**
 * 写回整个 attachments 对象
 * @param {string} key 槽位键
 * @param {unknown} value 槽位值
 */
function setAttachment(key, value) {
  emit('update:attachments', {
    ...normalizedAttachments.value,
    [key]: value,
  })
}

/**
 * 单文件槽位变更
 * @param {string} key 槽位键
 * @param {Event} event input change
 */
function onFileChange(key, event) {
  const file = event.target.files?.[0]
  if (!file) {
    clearSingleAttachment(key)
    return
  }
  const result = validateMovementAttachmentFile(file)
  if (!result.valid) {
    clearSingleAttachment(key)
    window.alert(t(result.errorKey || 'movementDocuments.errors.invalidFormat'))
    return
  }
  pendingLocalFiles.value = { ...pendingLocalFiles.value, [key]: file }
  setAttachment(key, result.meta)
}

/**
 * 清空单文件槽位（含 input value，便于再次选同一文件）
 * @param {string} key 槽位键
 */
function clearSingleAttachment(key) {
  pendingLocalFiles.value = { ...pendingLocalFiles.value, [key]: null }
  setAttachment(key, null)
  const input = fileInputRefs.value[key]
  if (input) input.value = ''
}

/**
 * 多文件槽位（otherDocuments）某一行变更
 * @param {number} index 行下标
 * @param {Event} event input change
 */
function onMultiFileChange(index, event) {
  const pendingKey = `otherDocuments:${index}`
  const file = event.target.files?.[0]
  const list = normalizeOtherDocuments(normalizedAttachments.value.otherDocuments)
  if (!file) {
    clearMultiAttachment(index)
    return
  }
  const result = validateMovementAttachmentFile(file)
  if (!result.valid) {
    clearMultiAttachment(index)
    window.alert(t(result.errorKey || 'movementDocuments.errors.invalidFormat'))
    return
  }
  pendingLocalFiles.value = { ...pendingLocalFiles.value, [pendingKey]: file }
  list[index] = result.meta
  setAttachment('otherDocuments', list)
}

/**
 * 清空 otherDocuments 某一行的已选文件（不删行）
 * @param {number} index 行下标
 */
function clearMultiAttachment(index) {
  const pendingKey = `otherDocuments:${index}`
  pendingLocalFiles.value = { ...pendingLocalFiles.value, [pendingKey]: null }
  const list = normalizeOtherDocuments(normalizedAttachments.value.otherDocuments)
  list[index] = null
  setAttachment('otherDocuments', list)
  const input = fileInputRefs.value[pendingKey]
  if (input) input.value = ''
}

/** Other Documents 增加一行空上传 */
function addOtherDocumentSlot() {
  const list = normalizeOtherDocuments(normalizedAttachments.value.otherDocuments)
  list.push(null)
  setAttachment('otherDocuments', list)
}

/**
 * 删除 Other Documents 第 index 行（仅 index>=1；至少保留一行）
 * @param {number} index 行下标
 */
function removeOtherDocumentSlot(index) {
  if (index < 1) return
  const list = normalizeOtherDocuments(normalizedAttachments.value.otherDocuments)
  if (list.length <= 1) return
  list.splice(index, 1)
  // 清理被删行及后续行的 pending 本地文件映射
  const nextPending = { ...pendingLocalFiles.value }
  Object.keys(nextPending).forEach((key) => {
    if (key.startsWith('otherDocuments:')) delete nextPending[key]
  })
  pendingLocalFiles.value = nextPending
  setAttachment('otherDocuments', normalizeOtherDocuments(list, 1))
}

function triggerFileInput(key) {
  fileInputRefs.value[key]?.click()
}

function setFileInputRef(key, el) {
  if (el) fileInputRefs.value[key] = el
}

/** 多文件某行的本地 File，供预览 */
function multiPendingFile(index) {
  return pendingLocalFiles.value[`otherDocuments:${index}`] || null
}
</script>

<template>
  <div class="documents-panel movement-documents-upload">
    <div
      v-for="field in documentFields"
      :key="field.key"
      class="movement-documents-upload__row"
    >
      <div class="attachment-header">
        <label class="attachment-label">
          {{ t(field.labelKey) }}
          <span v-if="field.required" class="required">*</span>
          :
        </label>
        <button
          v-if="field.showConsentDownload"
          type="button"
          class="btn btn-outline consent-btn"
          @click="emit('download-consent')"
        >
          {{ t(field.downloadLabelKey) }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <!-- Other Documents：右侧 Add More Files -->
        <button
          v-else-if="field.multi"
          type="button"
          class="btn btn-outline consent-btn"
          @click="addOtherDocumentSlot"
        >
          {{ t('movementDocuments.addMoreFiles') }}
        </button>
      </div>

      <!-- 多附件：默认一行，可继续添加；第 2 行起可关闭 -->
      <template v-if="field.multi">
        <div
          v-for="(slot, index) in normalizedAttachments.otherDocuments"
          :key="`other-${index}`"
          class="file-row"
          :class="{ 'file-row--multi': index > 0 }"
        >
          <button type="button" class="btn btn-default" @click="triggerFileInput(`otherDocuments:${index}`)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {{ t('movementDocuments.selectFile') }}
          </button>
          <AttachmentPreviewTrigger
            v-if="slot?.fileName"
            :file-name="slot.fileName"
            :file-meta="slot"
            :local-file="multiPendingFile(index)"
            :show-file-icon="false"
          />
          <span v-else class="file-name">{{ t('movementDocuments.noFileSelected') }}</span>
          <button
            v-if="slot?.fileName"
            type="button"
            class="btn-clear-file"
            :aria-label="t('movementDocuments.removeFile')"
            :title="t('movementDocuments.removeFile')"
            @click="clearMultiAttachment(index)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <!-- 第 2 行及以后：关闭小按钮（删整行） -->
          <button
            v-if="index > 0"
            type="button"
            class="btn-remove-slot"
            :aria-label="t('common.close')"
            :title="t('common.close')"
            @click="removeOtherDocumentSlot(index)"
          >
            ×
          </button>
          <input
            :ref="(el) => setFileInputRef(`otherDocuments:${index}`, el)"
            type="file"
            class="hidden-file"
            accept=".pdf,.doc,.docx"
            @change="onMultiFileChange(index, $event)"
          />
        </div>
      </template>

      <!-- 单附件槽位（保持既有自定义选择按钮，不改成原生 file 外观） -->
      <template v-else>
        <div class="file-row">
          <button type="button" class="btn btn-default" @click="triggerFileInput(field.key)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {{ t('movementDocuments.selectFile') }}
          </button>
          <AttachmentPreviewTrigger
            v-if="normalizedAttachments[field.key]?.fileName"
            :file-name="normalizedAttachments[field.key].fileName"
            :file-meta="normalizedAttachments[field.key]"
            :local-file="pendingLocalFiles[field.key]"
            :show-file-icon="false"
          />
          <span v-else class="file-name">{{ t('movementDocuments.noFileSelected') }}</span>
          <button
            v-if="normalizedAttachments[field.key]?.fileName"
            type="button"
            class="btn-clear-file"
            :aria-label="t('movementDocuments.removeFile')"
            :title="t('movementDocuments.removeFile')"
            @click="clearSingleAttachment(field.key)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <input
            :ref="(el) => setFileInputRef(field.key, el)"
            type="file"
            class="hidden-file"
            accept=".pdf,.doc,.docx"
            @change="onFileChange(field.key, $event)"
          />
        </div>
      </template>

      <p class="hint-text movement-documents-upload__format-hint">{{ t(hintKey) }}</p>
      <p v-if="!field.multi && errorMessage(field.key)" class="field-error">{{ errorMessage(field.key) }}</p>
    </div>
  </div>
</template>

<style scoped>
.movement-documents-upload__format-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.movement-documents-upload__row + .movement-documents-upload__row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.documents-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}

.attachment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.attachment-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.required {
  color: #ef4444;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: #2563eb;
  background: #fff;
  border: 1px solid #2563eb;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-outline:hover {
  background: #eff6ff;
}

.btn-default {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-row--multi {
  margin-top: 10px;
}

/* 已上传文件的删除按钮 */
.btn-clear-file {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
}

.btn-clear-file svg {
  width: 14px;
  height: 14px;
}

.btn-clear-file:hover {
  color: #ef4444;
  border-color: #fca5a5;
  background: #fef2f2;
}

/* Other Documents 第 2 行起的关闭小按钮 */
.btn-remove-slot {
  margin-left: auto;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.btn-remove-slot:hover {
  color: #ef4444;
  border-color: #fca5a5;
  background: #fef2f2;
}

.file-name {
  font-size: 13px;
  color: #6b7280;
}

.hidden-file {
  display: none;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.consent-btn {
  flex-shrink: 0;
}
</style>
