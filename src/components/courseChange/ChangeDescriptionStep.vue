<script setup>
import { useAppI18n } from '../../composables/useAppI18n.js'
import { changeDescriptionComponents } from '../../data/courseChangeApplications.js'

defineProps({
  courseName: { type: String, default: '' },
  changeDescription: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  chooseDisabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['choose', 'update:changeDescription'])

const { t, tr } = useAppI18n()

function onPick(key, level, model) {
  emit('update:changeDescription', { ...model, [key]: level })
}

function levelClass(active) {
  return active ? 'active' : ''
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

    <section class="component-section">
      <h3 class="section-title">{{ tr('MAIN COMPONENTS') }}</h3>
      <div class="component-table">
        <div v-for="item in changeDescriptionComponents.main" :key="item.key" class="component-row">
          <div class="component-info">
            <div class="component-name">{{ tr(item.label) }}</div>
            <div class="component-hint">{{ tr(item.hint) }}</div>
          </div>
          <div v-if="readonly" class="readonly-level">
            {{ changeDescription[item.key] === 'major' ? tr('Major Changes') : tr('Minor / No Changes') }}
          </div>
          <div v-else class="level-toggle">
            <button
              type="button"
              class="level-btn"
              :class="levelClass(changeDescription[item.key] === 'major')"
              @click="onPick(item.key, 'major', changeDescription)"
            >
              N
            </button>
            <button
              type="button"
              class="level-btn"
              :class="levelClass(changeDescription[item.key] === 'minor')"
              @click="onPick(item.key, 'minor', changeDescription)"
            >
              Y
            </button>
            <span class="level-label major">{{ tr('Major Changes') }}</span>
            <span class="level-label minor">{{ tr('Minor / No Changes') }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="component-section">
      <h3 class="section-title">{{ tr('OTHER COMPONENTS') }}</h3>
      <div class="component-table">
        <div v-for="item in changeDescriptionComponents.other" :key="item.key" class="component-row">
          <div class="component-info">
            <div class="component-name">{{ tr(item.label) }}</div>
            <div class="component-hint">{{ tr(item.hint) }}</div>
          </div>
          <div v-if="readonly" class="readonly-level">
            {{ changeDescription[item.key] === 'major' ? tr('Major Changes') : tr('Minor / No Changes') }}
          </div>
          <div v-else class="level-toggle">
            <button
              type="button"
              class="level-btn"
              :class="levelClass(changeDescription[item.key] === 'major')"
              @click="onPick(item.key, 'major', changeDescription)"
            >
              N
            </button>
            <button
              type="button"
              class="level-btn"
              :class="levelClass(changeDescription[item.key] === 'minor')"
              @click="onPick(item.key, 'minor', changeDescription)"
            >
              Y
            </button>
            <span class="level-label major">{{ tr('Major Changes') }}</span>
            <span class="level-label minor">{{ tr('Minor / No Changes') }}</span>
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
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.component-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.component-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.component-row:last-child {
  border-bottom: none;
}

.component-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.component-hint {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.level-toggle {
  display: grid;
  grid-template-columns: 36px 36px;
  grid-template-rows: auto auto;
  gap: 6px 8px;
  align-items: center;
  justify-items: center;
}

.level-btn {
  width: 36px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.level-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.level-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

.level-label.major {
  grid-column: 1;
}

.level-label.minor {
  grid-column: 2;
}

.readonly-level {
  font-size: 13px;
  color: #2563eb;
  font-weight: 500;
  white-space: nowrap;
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
