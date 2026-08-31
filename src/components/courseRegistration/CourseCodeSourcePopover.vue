<script setup>
import { computed, ref, watch } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { getCourseCodeSourceParts } from '../../data/courseRegistration/courseCodeSource.js'
import { getCourseTeachingBrief } from '../../data/courseRegistration/courseTeachingBrief.js'

const props = defineProps({
  /** 课程代码 */
  code: { type: String, required: true },
  /** 可选：课程上下文（类型/名称/学分等，用于教学目标回退） */
  course: { type: Object, default: null },
})

const { t, isZh } = useAppI18n()

const open = ref(false)

const locale = computed(() => (isZh.value ? 'zh' : 'en'))

const sourceParts = computed(() => getCourseCodeSourceParts(props.code, locale.value))

const teachingBrief = computed(() => {
  const fromLib = sourceParts.value.course || {}
  const ctx = props.course || {}
  return getCourseTeachingBrief(
    props.code,
    {
      name: ctx.name || ctx.courseName || fromLib.name,
      credits: ctx.credits ?? fromLib.credits,
      type: ctx.type || fromLib.type,
      schoolElectiveCategory: ctx.schoolElectiveCategory || fromLib.schoolElectiveCategory,
      prerequisites: ctx.prerequisites || fromLib.prerequisites,
    },
    locale.value,
  )
})

const isGeBrief = computed(() => teachingBrief.value?.type !== 'ME')

function openModal(event) {
  event?.stopPropagation?.()
  open.value = true
}

function closeModal() {
  open.value = false
}

watch(
  () => props.code,
  () => closeModal(),
)
</script>

<template>
  <span class="cr-code-source">
    <button type="button" class="link-btn cr-code-source-trigger" @click="openModal">
      {{ code }}
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        class="cr-code-source-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="code"
      >
        <div class="cr-code-source-panel" @click.stop>
          <div class="cr-code-source-body">
            <p
              v-for="(line, idx) in sourceParts.batchNames"
              :key="`batch-${idx}-${line}`"
              class="cr-code-source-line"
            >
              {{ line }}
            </p>

            <template v-if="teachingBrief">
              <!-- GE：整卡外框（对齐图示2） -->
              <table v-if="isGeBrief" class="cr-brief-sheet" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--half">
                      <strong class="cr-brief-inline-label"
                        >{{ t('courseRegistration.student.courseBrief.courseCode') }}:</strong
                      >
                      {{ teachingBrief.code }}
                    </td>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--half">
                      <strong class="cr-brief-inline-label"
                        >{{ t('courseRegistration.student.courseBrief.courseName') }}:</strong
                      >
                      {{ teachingBrief.name }}
                    </td>
                  </tr>
                  <tr class="cr-brief-sheet-accent--ge">
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--half">
                      <strong class="cr-brief-inline-label"
                        >{{ t('courseRegistration.student.courseBrief.credits') }}:</strong
                      >
                      {{ teachingBrief.credits }}
                    </td>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--half">
                      <strong class="cr-brief-inline-label"
                        >{{ t('courseRegistration.student.courseBrief.field') }}:</strong
                      >
                      {{ teachingBrief.field }}
                    </td>
                  </tr>
                  <tr>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--body" colspan="2">
                      <p class="cr-brief-section-title">
                        {{ t('courseRegistration.student.courseBrief.briefIntro') }}
                      </p>
                      <p class="cr-brief-section-heading">
                        {{ t('courseRegistration.student.courseBrief.contentHeading') }}:
                      </p>
                      <p class="cr-brief-paragraph">{{ teachingBrief.content }}</p>
                      <p class="cr-brief-section-heading">
                        {{ t('courseRegistration.student.courseBrief.outcomesHeading') }}:
                      </p>
                      <p class="cr-brief-outcome-lead">
                        {{ t('courseRegistration.student.courseBrief.outcomesLead') }}
                      </p>
                      <ol class="cr-brief-list">
                        <li v-for="(item, i) in teachingBrief.outcomes" :key="`o-${i}`">
                          {{ item }}
                        </li>
                      </ol>
                    </td>
                  </tr>
                  <tr>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--assess" colspan="2">
                      <p class="cr-brief-section-heading">
                        {{ t('courseRegistration.student.courseBrief.assessmentHeading') }}:
                      </p>
                      <table class="cr-brief-assess-table" cellspacing="0" cellpadding="0">
                        <tbody>
                          <tr v-for="(row, i) in teachingBrief.assessment" :key="`a-${i}`">
                            <td>{{ row.method }}</td>
                            <td class="cr-brief-assess-weight">{{ row.weight }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- ME：整卡外框（对齐图示3） -->
              <table v-else class="cr-brief-sheet" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr class="cr-brief-sheet-accent--me">
                    <td class="cr-brief-sheet-cell cr-brief-me-code">{{ teachingBrief.code }}</td>
                    <td class="cr-brief-sheet-cell cr-brief-me-name">{{ teachingBrief.name }}</td>
                  </tr>
                  <tr>
                    <td class="cr-brief-sheet-cell" colspan="2">
                      <strong class="cr-brief-inline-label"
                        >{{ t('courseRegistration.student.courseBrief.credits') }}:</strong
                      >
                      {{ teachingBrief.credits }}
                    </td>
                  </tr>
                  <tr>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--body" colspan="2">
                      <p class="cr-brief-section-title">
                        {{ t('courseRegistration.student.courseBrief.briefIntro') }}
                      </p>
                      <p class="cr-brief-section-heading cr-brief-section-heading--underline">
                        {{ t('courseRegistration.student.courseBrief.contentHeading') }}:
                      </p>
                      <p class="cr-brief-paragraph">{{ teachingBrief.content }}</p>
                      <p class="cr-brief-section-heading cr-brief-section-heading--underline">
                        {{ t('courseRegistration.student.courseBrief.outcomesHeading') }}:
                      </p>
                      <p class="cr-brief-outcome-lead">
                        {{ t('courseRegistration.student.courseBrief.outcomesLead') }}
                      </p>
                      <ol class="cr-brief-list">
                        <li v-for="(item, i) in teachingBrief.outcomes" :key="`o-${i}`">
                          {{ item }}
                        </li>
                      </ol>
                      <p v-if="teachingBrief.prerequisites" class="cr-brief-prereq">
                        <strong>{{ t('courseRegistration.student.courseBrief.prerequisiteHeading') }}</strong>
                        {{ teachingBrief.prerequisites }}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="cr-brief-sheet-cell cr-brief-sheet-cell--assess" colspan="2">
                      <p class="cr-brief-section-heading">
                        {{ t('courseRegistration.student.courseBrief.assessmentHeading') }}:
                      </p>
                      <table class="cr-brief-assess-table" cellspacing="0" cellpadding="0">
                        <tbody>
                          <tr v-for="(row, i) in teachingBrief.assessment" :key="`a-${i}`">
                            <td>{{ row.method }}</td>
                            <td class="cr-brief-assess-weight">{{ row.weight }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>

            <p
              v-for="(line, idx) in sourceParts.libraryLines"
              :key="`lib-${idx}-${line}`"
              class="cr-code-source-line cr-code-source-line--lib"
            >
              {{ line }}
            </p>
            <p
              v-if="!sourceParts.batchNames.length && !sourceParts.libraryLines.length && !teachingBrief"
              class="cr-code-source-empty"
            >
              {{ t('common.noData') }}
            </p>
          </div>
          <div class="cr-code-source-footer">
            <button type="button" class="cr-code-source-ok" @click="closeModal">
              {{ t('common.ok') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.cr-code-source {
  display: inline-flex;
  max-width: 100%;
}

.cr-code-source-trigger {
  background: none;
  border: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.cr-code-source-trigger:hover {
  text-decoration: underline;
}

.cr-code-source-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  box-sizing: border-box;
}

.cr-code-source-panel {
  width: min(680px, 100%);
  max-height: min(86vh, 760px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.28);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.cr-code-source-body {
  padding: 16px 18px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.55;
  color: #111827;
}

.cr-code-source-line {
  margin: 0 0 8px;
  word-break: break-word;
}

.cr-code-source-line--lib {
  margin-top: 12px;
  font-size: 12px;
  color: #6b7280;
}

.cr-code-source-empty {
  color: #9ca3af;
}

/* 整卡课程信息表：外框 + 内部分区横线 */
.cr-brief-sheet {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #111827;
  margin: 8px 0 4px;
  background: #fff;
}

.cr-brief-sheet-cell {
  border: 1px solid #111827;
  padding: 10px 12px;
  vertical-align: top;
  background: #fff;
  color: #111827;
  font-size: 13px;
  line-height: 1.55;
}

.cr-brief-sheet-cell--half {
  width: 50%;
}

.cr-brief-sheet-cell--body {
  padding: 12px 14px 14px;
}

.cr-brief-sheet-cell--assess {
  padding: 12px 14px 14px;
}

.cr-brief-sheet-accent--ge .cr-brief-sheet-cell {
  background: #fef9c3;
}

.cr-brief-sheet-accent--me .cr-brief-sheet-cell {
  background: #ffedd5;
}

.cr-brief-inline-label {
  font-weight: 700;
  margin-right: 4px;
}

.cr-brief-me-code {
  width: 28%;
  font-weight: 700;
}

.cr-brief-me-name {
  font-weight: 700;
}

.cr-brief-section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.cr-brief-section-heading {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.cr-brief-section-heading--underline {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cr-brief-outcome-lead {
  margin: 0 0 6px;
  font-size: 13px;
}

.cr-brief-paragraph {
  margin: 0 0 12px;
  text-align: justify;
}

.cr-brief-list {
  margin: 0 0 12px;
  padding-left: 1.4em;
}

.cr-brief-list:last-child {
  margin-bottom: 0;
}

.cr-brief-list li + li {
  margin-top: 4px;
}

.cr-brief-prereq {
  margin: 12px 0 0;
}

/* 考核嵌套表：完整边线，略缩进 */
.cr-brief-assess-table {
  width: calc(100% - 8px);
  max-width: 420px;
  border-collapse: collapse;
  margin: 4px 0 0;
  border: 1px solid #111827;
}

.cr-brief-assess-table td {
  border: 1px solid #111827;
  padding: 6px 10px;
  font-size: 12px;
  background: #fff;
}

.cr-brief-assess-weight {
  width: 72px;
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}

.cr-code-source-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px 16px;
  border-top: 1px solid #f3f4f6;
}

.cr-code-source-ok {
  min-width: 88px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cr-code-source-ok:hover {
  background: #1d4ed8;
}
</style>
