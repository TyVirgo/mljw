<script setup>
import { computed } from 'vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import { buildMovementApprovalLogRows } from '../../utils/movementApprovalLogDisplay.js'

const props = defineProps({
  approvalLog: { type: Array, default: () => [] },
})

const { t } = useAppI18n()

const rows = computed(() => buildMovementApprovalLogRows(props.approvalLog))
</script>

<template>
  <section class="movement-approval-log-table">
    <h3 class="movement-approval-log-table__title">{{ t('movementExport.approvalLogTitle') }}</h3>
    <div class="movement-approval-log-table__wrap">
      <table v-if="rows.length" class="log-table">
        <thead>
          <tr>
            <th>{{ t('movementExport.approvalLog.description') }}</th>
            <th>{{ t('movementExport.approvalLog.actionBy') }}</th>
            <th>{{ t('movementExport.approvalLog.actionByRole') }}</th>
            <th>{{ t('movementExport.approvalLog.createdAt') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.description }}</td>
            <td>{{ row.actionBy }}</td>
            <td>{{ row.actionByRole }}</td>
            <td>{{ row.createdAt }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="log-empty">{{ t('common.noData') }}</p>
    </div>
  </section>
</template>

<style scoped>
.movement-approval-log-table {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.movement-approval-log-table__title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.movement-approval-log-table__wrap {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.log-table th,
.log-table td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
}

.log-table th {
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

.log-empty {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}
</style>
