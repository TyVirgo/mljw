<script setup>
import { computed } from 'vue'
import { formatImplementedYn } from '../../data/movementApprovalQueue.js'

const props = defineProps({
  value: { type: String, default: '' },
})

const yn = computed(() => formatImplementedYn(props.value))
const badgeClass = computed(() =>
  yn.value === 'Y' ? 'implemented-yn-badge--y' : 'implemented-yn-badge--n',
)
</script>

<template>
  <span class="implemented-yn-badge" :class="badgeClass">{{ yn }}</span>
</template>

<style scoped>
.implemented-yn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.implemented-yn-badge--y {
  background: #dcfce7;
  color: #166534;
}

.implemented-yn-badge--n {
  background: #fee2e2;
  color: #991b1b;
}
</style>
