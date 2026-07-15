<script setup>
import { ref, computed } from 'vue'
import TablePagination from '../../components/common/TablePagination.vue'
import ModuleBriefPanel from '../../components/courseRegistration/ModuleBriefPanel.vue'
import CourseRegistrationCallout from '../../components/courseRegistration/CourseRegistrationCallout.vue'
import { useAppI18n } from '../../composables/useAppI18n.js'
import '../../styles/course-registration-list.css'
import {
  reportCardIds,
  buildReportSummary,
  getReportDetailRows,
  getReportColumns,
} from '../../data/courseRegistration/registrationReportData.js'

const { t } = useAppI18n()

const summary = computed(() => buildReportSummary())
const activeCard = ref(reportCardIds[0])
const currentPage = ref(1)
const pageSize = ref(10)

const cards = computed(() =>
  reportCardIds.map((id) => {
    const s = summary.value[id]
    let value = '—'
    let sub = ''
    if (id === 'participation') {
      value = `${s.rate}%`
      sub = `${s.participated}/${s.total}`
    } else if (id === 'creditDistribution') {
      value = `${s.avgCredits} cr`
      sub = `↓${s.belowMin} ↑${s.aboveMax}`
    } else if (id === 'capacityUsage') {
      value = `${s.avgUtilization}%`
      sub = `${s.courseCount} courses`
    } else if (id === 'addDropStats') {
      value = String(s.total)
      sub = `P${s.pending} A${s.approved}`
    } else if (id === 'problemStudents') {
      value = String(s.count)
    }
    return { id, value, sub }
  }),
)

const detailRows = computed(() => getReportDetailRows(activeCard.value))
const detailColumns = computed(() => getReportColumns(activeCard.value))

const totalPages = computed(() => Math.max(1, Math.ceil(detailRows.value.length / pageSize.value)))
const paginatedDetail = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return detailRows.value.slice(start, start + pageSize.value)
})

function openCard(id) {
  activeCard.value = id
  currentPage.value = 1
}

function columnLabel(key) {
  const labelKey = `courseRegistration.report.columns.${key}`
  const translated = t(labelKey)
  return translated !== labelKey ? translated : key
}

function handleExport() {
  window.alert(t('common.export') + ' (demo)')
}
</script>

<template>
  <div class="cr-list-page cr-report-page">
    <ModuleBriefPanel page-id="cr-report" />

    <div class="page-card">
      <CourseRegistrationCallout variant="info">
        <p>{{ t('courseRegistration.report.hint') }}</p>
      </CourseRegistrationCallout>

      <div class="card-grid">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="report-card"
          :class="{ active: activeCard === card.id }"
          @click="openCard(card.id)"
        >
          <span class="card-value">{{ card.value }}</span>
          <span v-if="card.sub" class="card-sub">{{ card.sub }}</span>
          <span class="card-label">{{ t(`courseRegistration.report.cards.${card.id}`) }}</span>
        </button>
      </div>

      <div class="detail-panel">
        <div class="detail-header">
          <h3>{{ t(`courseRegistration.report.cards.${activeCard}`) }}</h3>
          <button type="button" class="btn btn-outline" @click="handleExport">
            {{ t('courseRegistration.report.export') }}
          </button>
        </div>

        <div class="table-section">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('common.serialNo') }}</th>
                  <th v-for="col in detailColumns" :key="col">{{ columnLabel(col) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in paginatedDetail" :key="index">
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td v-for="col in detailColumns" :key="col">{{ row[col] }}</td>
                </tr>
                <tr v-if="!paginatedDetail.length">
                  <td :colspan="detailColumns.length + 1" class="empty-cell">{{ t('common.noData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TablePagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="detailRows.length"
            :total-pages="totalPages"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.report-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.report-card:hover,
.report-card.active {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}

.card-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.card-sub {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.card-label {
  font-size: 13px;
  color: #6b7280;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
}

.detail-header .btn-outline {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  border: 1px solid #2563eb;
  color: #2563eb;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
