<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  modelValue: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50],
  },
})

const emit = defineEmits(['update:modelValue', 'update:pageSize', 'change'])

const jumpPage = ref(props.modelValue)

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

watch(
  () => props.modelValue,
  (page) => {
    jumpPage.value = page
  },
)

function goToPage(page) {
  const next = Math.min(Math.max(1, Math.round(page)), totalPages.value)
  jumpPage.value = next
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', { page: next, pageSize: props.pageSize, type: 'page' })
  }
}

function handlePageSizeChange(event) {
  const size = Number(event.target.value)
  if (!Number.isFinite(size) || size <= 0 || size === props.pageSize) return
  jumpPage.value = 1
  emit('update:pageSize', size)
  emit('update:modelValue', 1)
  emit('change', { page: 1, pageSize: size, type: 'pageSize' })
}

function applyJumpPage() {
  const page = Number(jumpPage.value)
  if (!Number.isFinite(page)) return
  goToPage(page)
}
</script>

<template>
  <div class="table-pagination">
    <span class="table-pagination-total">Total {{ total }} records</span>
    <div class="table-pagination-controls">
      <button type="button" class="page-link" :disabled="modelValue <= 1" @click="goToPage(1)">Home</button>
      <button type="button" class="page-btn" :disabled="modelValue <= 1" @click="goToPage(modelValue - 1)">‹</button>
      <button type="button" class="page-btn active">{{ modelValue }}</button>
      <button type="button" class="page-btn" :disabled="modelValue >= totalPages" @click="goToPage(modelValue + 1)">
        ›
      </button>
      <button type="button" class="page-link" :disabled="modelValue >= totalPages" @click="goToPage(totalPages)">
        End
      </button>
    </div>
    <select class="page-size" :value="pageSize" @change="handlePageSizeChange">
      <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} records/page</option>
    </select>
    <div class="jump-wrap">
      <span class="jump-label">Jump to</span>
      <input
        v-model.number="jumpPage"
        type="number"
        class="jump-input"
        min="1"
        :max="totalPages"
        @keyup.enter="applyJumpPage"
      />
      <span class="jump-label">page</span>
    </div>
  </div>
</template>

<style scoped>
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.table-pagination-total {
  font-size: 13px;
  color: #9ca3af;
  margin-right: auto;
}

.table-pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-link {
  font-size: 13px;
  color: #9ca3af;
  padding: 0 6px;
  background: transparent;
}

.page-link:not(:disabled):hover {
  color: #6b7280;
}

.page-link:disabled {
  color: #d1d5db;
  cursor: not-allowed;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  background: #fff;
}

.page-btn:not(:disabled):hover {
  border-color: #9ca3af;
  color: #374151;
}

.page-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  cursor: default;
}

.page-btn:disabled {
  color: #d1d5db;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.page-size {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  appearance: none;
}

.jump-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jump-label {
  font-size: 13px;
  color: #9ca3af;
}

.jump-input {
  width: 48px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  color: #374151;
}

.jump-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
</style>
