<script setup>
const props = defineProps({
  schedule: { type: Array, default: () => [] },
  conflictCourses: { type: Array, default: () => [] },
})

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function cellClass(day, hour) {
  const slot = props.schedule.find(
    (s) => s.day === day && hour >= Math.floor(s.start) && hour < Math.ceil(s.end),
  )
  if (!slot) return ''
  const conflict = props.conflictCourses.includes(slot.course)
  return conflict ? 'cell-conflict' : 'cell-occupied'
}

function cellLabel(day, hour) {
  const slot = props.schedule.find(
    (s) => s.day === day && hour >= Math.floor(s.start) && hour < Math.ceil(s.end),
  )
  return slot?.course || ''
}
</script>

<template>
  <div class="week-grid-wrap">
    <table class="week-grid">
      <thead>
        <tr>
          <th></th>
          <th v-for="day in days" :key="day">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hour in hours" :key="hour">
          <td class="hour-label">{{ hour }}:00</td>
          <td
            v-for="day in days"
            :key="`${day}-${hour}`"
            class="grid-cell"
            :class="cellClass(day, hour)"
            :title="cellLabel(day, hour)"
          >
            <span v-if="cellLabel(day, hour)" class="cell-text">{{ cellLabel(day, hour) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.week-grid-wrap {
  overflow-x: auto;
}

.week-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.week-grid th,
.week-grid td {
  border: 1px solid #e5e7eb;
  padding: 4px;
  text-align: center;
  min-width: 56px;
}

.hour-label {
  color: #6b7280;
  background: #f9fafb;
  width: 48px;
}

.grid-cell {
  height: 28px;
  background: #fff;
}

.cell-occupied {
  background: #dbeafe;
  color: #1d4ed8;
}

.cell-conflict {
  background: #fee2e2;
  color: #b91c1c;
}

.cell-text {
  font-size: 10px;
  font-weight: 600;
}
</style>
