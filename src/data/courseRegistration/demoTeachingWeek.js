import { ref, computed } from 'vue'
import { getActiveBatch } from './registrationBatches.js'

/**
 * @deprecated 加退课发起闸门已改为申请窗口日期；保留导出以免旧引用断裂。
 * 演示用当前开课周（非真实教务日历）
 */
export const demoTeachingWeek = ref(3)

export function getDropDeadlineWeek(batch = getActiveBatch()) {
  return Number(batch?.dropDeadlineWeek) || 5
}

/** @returns {'self' | 'special'} */
export function getDropChannel(batch = getActiveBatch(), week = demoTeachingWeek.value) {
  const deadline = getDropDeadlineWeek(batch)
  return Number(week) <= deadline ? 'self' : 'special'
}

export function isSelfServiceDropWindow(batch = getActiveBatch(), week = demoTeachingWeek.value) {
  return getDropChannel(batch, week) === 'self'
}

export function useDropChannelState(batchRef, weekRef = demoTeachingWeek) {
  const channel = computed(() => getDropChannel(batchRef.value, weekRef.value))
  const deadlineWeek = computed(() => getDropDeadlineWeek(batchRef.value))
  const isSelf = computed(() => channel.value === 'self')
  return { channel, deadlineWeek, isSelf }
}
