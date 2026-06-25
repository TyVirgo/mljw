<script setup>
import { ref } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import ProgrammeTransferView from './ProgrammeTransferView.vue'
import DefermentView from './DefermentView.vue'
import ResumptionView from './ResumptionView.vue'
import WithdrawalView from './WithdrawalView.vue'

defineProps({
  applicantMode: {
    type: String,
    default: 'teacher',
    validator: (value) => ['teacher', 'student'].includes(value),
  },
})

const { t } = useAppI18n()

const activeTab = ref('deferment')

const tabs = [
  { key: 'programme-transfer', labelKey: 'menu.srProgrammeTransfer' },
  { key: 'deferment', labelKey: 'menu.srDeferment' },
  { key: 'resumption', labelKey: 'menu.srResumption' },
  { key: 'withdrawal', labelKey: 'menu.srWithdrawal' },
]
</script>

<template>
  <div class="movement-application-page">
    <nav class="movement-tabs" aria-label="Movement application tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="movement-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ t(tab.labelKey) }}
      </button>
    </nav>

    <div class="movement-tab-panel">
      <ProgrammeTransferView
        v-show="activeTab === 'programme-transfer'"
        :applicant-mode="applicantMode"
      />
      <DefermentView v-show="activeTab === 'deferment'" :applicant-mode="applicantMode" />
      <ResumptionView v-show="activeTab === 'resumption'" :applicant-mode="applicantMode" />
      <WithdrawalView v-show="activeTab === 'withdrawal'" :applicant-mode="applicantMode" />
    </div>
  </div>
</template>

<style scoped>
.movement-application-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  background: #fff;
}

.movement-tabs {
  display: flex;
  gap: 0;
  flex-shrink: 0;
  padding: 0 28px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.movement-tab-btn {
  padding: 12px 20px;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
}

.movement-tab-btn:hover {
  color: #2563eb;
}

.movement-tab-btn.active {
  color: #2563eb;
  font-weight: 600;
  border-bottom-color: #2563eb;
}

.movement-tab-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.movement-tab-panel :deep(.programme-transfer-page),
.movement-tab-panel :deep(.deferment-page),
.movement-tab-panel :deep(.resumption-page),
.movement-tab-panel :deep(.withdrawal-page) {
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
  overflow-y: auto;
}
</style>
