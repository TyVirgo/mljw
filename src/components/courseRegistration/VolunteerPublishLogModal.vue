<script setup>
/**
 * 第一轮志愿结果 — 发布日志弹窗
 */
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { listPublishLogsForBatch, volunteerPublishLogs } from '../../data/courseRegistration/preselectReleaseSync.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  batchId: { type: String, default: '' },
  batchName: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { t } = useAppI18n()

const rows = computed(() => {
  void volunteerPublishLogs.value.length
  return listPublishLogsForBatch(props.batchId)
})

function triggerLabel(type) {
  return type === 'manual'
    ? t('courseRegistration.result.publishTriggerManual')
    : t('courseRegistration.result.publishTriggerAuto')
}

function statusLabel(status) {
  return status === 'success'
    ? t('courseRegistration.result.publishStatusSuccess')
    : t('courseRegistration.result.publishStatusFailure')
}
</script>

<template>
  <div v-if="visible" class="pub-log-mask" @click.self="emit('close')">
    <div class="pub-log-modal" role="dialog" aria-modal="true">
      <header class="pub-log-head">
        <div>
          <h3>{{ t('courseRegistration.result.publishLogTitle') }}</h3>
          <p v-if="batchName" class="pub-log-sub">{{ batchName }}</p>
        </div>
        <button type="button" class="pub-log-x" @click="emit('close')">×</button>
      </header>
      <div class="pub-log-body">
        <div v-if="!rows.length" class="pub-log-empty">
          {{ t('courseRegistration.result.publishLogEmpty') }}
        </div>
        <div v-else class="pub-log-table-wrap">
          <table class="pub-log-table">
            <thead>
              <tr>
                <th>{{ t('courseRegistration.result.publishColTime') }}</th>
                <th>{{ t('courseRegistration.result.publishColTrigger') }}</th>
                <th>{{ t('courseRegistration.result.publishColTask') }}</th>
                <th>{{ t('courseRegistration.result.publishColStatus') }}</th>
                <th>{{ t('courseRegistration.result.publishColOperator') }}</th>
                <th>{{ t('courseRegistration.result.publishColDuration') }}</th>
                <th>{{ t('courseRegistration.result.publishColMessage') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td class="nowrap">{{ row.startedAt }}</td>
                <td>{{ triggerLabel(row.triggerType) }}</td>
                <td>{{ row.taskName }}</td>
                <td>
                  <span
                    class="pub-log-badge"
                    :class="row.status === 'success' ? 'ok' : 'fail'"
                  >
                    {{ statusLabel(row.status) }}
                  </span>
                </td>
                <td>{{ row.operatorName || row.operatorId }}</td>
                <td class="nowrap">
                  {{
                    row.durationMs != null
                      ? t('courseRegistration.result.publishDurationMs', { n: row.durationMs })
                      : '—'
                  }}
                </td>
                <td>{{ row.message || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <footer class="pub-log-foot">
        <button type="button" class="btn btn-default" @click="emit('close')">
          {{ t('common.close') }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.pub-log-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.pub-log-modal {
  width: min(960px, 100%);
  max-height: min(84vh, 720px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pub-log-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.pub-log-head h3 {
  margin: 0;
  font-size: 16px;
  color: #111827;
}
.pub-log-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}
.pub-log-x {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}
.pub-log-body {
  padding: 12px 16px;
  overflow: auto;
  flex: 1;
}
.pub-log-empty {
  padding: 40px 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
.pub-log-table-wrap {
  overflow: auto;
}
.pub-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.pub-log-table th,
.pub-log-table td {
  border-bottom: 1px solid #f3f4f6;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}
.pub-log-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  white-space: nowrap;
}
.nowrap {
  white-space: nowrap;
}
.pub-log-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.pub-log-badge.ok {
  background: #ecfdf5;
  color: #047857;
}
.pub-log-badge.fail {
  background: #fef2f2;
  color: #b91c1c;
}
.pub-log-foot {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}
.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.btn:hover {
  background: #f9fafb;
}
</style>
