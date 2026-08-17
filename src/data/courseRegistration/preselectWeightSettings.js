/**
 * 选课规则：第一轮权重 r（GE 默认 3；ME 可按专业覆盖）
 */
import { ref } from 'vue'

export const preselectWeightSettings = ref({
  /** GE 默认衰减系数 */
  geDefaultR: 3,
  /** 全局默认（无专业覆盖时 ME 也用） */
  defaultR: 3,
  /** programme code → r */
  meByProgramme: {
    SWE: 2.5,
    COS: 3,
    DSA: 3,
  },
  /** 第三轮互释对方预留池 */
  releaseCrossAudienceOnRound3: true,
})

export function getPreselectR(batchType, programme) {
  const s = preselectWeightSettings.value
  if (String(batchType).toUpperCase() === 'GE') return Number(s.geDefaultR) || 3
  const prog = String(programme || '')
  if (prog && s.meByProgramme?.[prog] != null) return Number(s.meByProgramme[prog]) || 3
  return Number(s.defaultR) || 3
}

/** W_i = r^(N-i)，i 从 1..N */
export function dayWeights(nDays, r) {
  const N = Math.max(1, Math.floor(nDays) || 1)
  const ratio = Number(r) > 0 ? Number(r) : 3
  const weights = []
  for (let i = 1; i <= N; i += 1) {
    weights.push(ratio ** (N - i))
  }
  return weights
}

export function weightForDayIndex(dayIndex1Based, nDays, r) {
  const weights = dayWeights(nDays, r)
  const idx = Math.min(weights.length, Math.max(1, Math.floor(dayIndex1Based) || 1)) - 1
  return weights[idx]
}
