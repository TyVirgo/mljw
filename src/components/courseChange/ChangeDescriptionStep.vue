<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { changeDescriptionComponents } from '../../data/courseChangeApplications.js'
import ChangeLevelToggle from './ChangeLevelToggle.vue'

const props = defineProps({
  courseName: { type: String, default: '' },
  changeDescription: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  chooseDisabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['choose', 'update:changeDescription'])

const { t, tr } = useAppI18n()

const sections = computed(() => [
  { title: 'MAIN COMPONENTS', items: changeDescriptionComponents.main },
  { title: 'OTHER COMPONENTS', items: changeDescriptionComponents.other },
])

function onPick(key, level) {
  if (props.readonly || props.changeDescription[key] === level) return
  emit('update:changeDescription', { ...props.changeDescription, [key]: level })
}
</script>

<template>
  <div class="change-description-step">
    <div class="baseline-field">
      <label><span class="required">*</span> {{ tr('Course Name:') }}</label>
      <div class="input-with-btn">
        <input :value="courseName" type="text" class="input" readonly :placeholder="t('common.pleaseSelect')" />
        <button v-if="!readonly && !chooseDisabled" type="button" class="btn btn-outline" @click="emit('choose')">
          {{ tr('Choose') }}
        </button>
      </div>
      <p v-if="error" class="error-text">{{ tr(error) }}</p>
    </div>

    <section v-for="section in sections" :key="section.title" class="component-section">
      <h3 class="section-title">{{ tr(section.title) }}</h3>
      <div class="change-table">
        <div class="table-header">
          <div class="col-name">{{ tr('Component Name') }}</div>
          <div class="col-level">{{ tr('Major Changes') }}</div>
          <div class="col-level">{{ tr('Minor Changes') }}</div>
          <div class="col-level">{{ tr('No Changes') }}</div>
        </div>
        <div v-for="item in section.items" :key="item.key" class="table-row">
          <div class="col-name">
            <div class="component-name">{{ tr(item.label) }}</div>
          </div>
          <div class="col-level">
            <div class="level-cell" :class="{ 'toggle-only': !item.majorCriteria.length }">
              <ul v-if="item.majorCriteria.length" class="criteria-list">
                <li v-for="criterion in item.majorCriteria" :key="criterion">{{ tr(criterion) }}</li>
              </ul>
              <ChangeLevelToggle
                :active="changeDescription[item.key] === 'major'"
                :disabled="readonly"
                @toggle="onPick(item.key, 'major')"
              />
            </div>
          </div>
          <div class="col-level">
            <div class="level-cell" :class="{ 'toggle-only': !item.minorCriteria.length }">
              <ul v-if="item.minorCriteria.length" class="criteria-list">
                <li v-for="criterion in item.minorCriteria" :key="criterion">{{ tr(criterion) }}</li>
              </ul>
              <ChangeLevelToggle
                :active="changeDescription[item.key] === 'minor'"
                :disabled="readonly"
                @toggle="onPick(item.key, 'minor')"
              />
            </div>
          </div>
          <div class="col-level">
            <div class="level-cell" :class="{ 'toggle-only': !item.noneCriteria.length }">
              <ul v-if="item.noneCriteria.length" class="criteria-list">
                <li v-for="criterion in item.noneCriteria" :key="criterion">{{ tr(criterion) }}</li>
              </ul>
              <ChangeLevelToggle
                :active="changeDescription[item.key] === 'none'"
                :disabled="readonly"
                @toggle="onPick(item.key, 'none')"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.change-description-step {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.baseline-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.required {
  color: #ef4444;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  background: #f9fafb;
}

.error-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: #ef4444;
}

.section-title {
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid #2563eb;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.change-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: minmax(150px, 0.85fr) 1fr 1fr 1fr;
}

.table-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.table-header .col-name,
.table-header .col-level {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.table-header .col-level {
  text-align: left;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
}

.table-row:last-child {
  border-bottom: none;
}

.col-name {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fafafa;
  border-right: 1px solid #e5e7eb;
}

.component-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.col-level {
  padding: 14px 16px;
  border-right: 1px solid #e5e7eb;
}

.col-level:last-child {
  border-right: none;
}

.level-cell {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 24px;
  height: 100%;
}

.level-cell.toggle-only {
  justify-content: flex-end;
}

.criteria-list {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding-left: 18px;
  list-style: disc;
}

.criteria-list li {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
}

.btn-outline {
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
  cursor: pointer;
  white-space: nowrap;
}
</style>
