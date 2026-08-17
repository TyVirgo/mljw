/**
 * 新老受众轮次与名额初分（GE/ME 选课模型）
 */

export const AUDIENCE_SENIOR = 'senior'
export const AUDIENCE_FRESHMAN = 'freshman'

export function emptyRoundRange() {
  return { start: '', end: '' }
}

export function defaultAudienceRounds() {
  return {
    preselect: emptyRoundRange(),
    main: emptyRoundRange(),
    supplement: emptyRoundRange(),
  }
}

export function cloneRounds(rounds = {}) {
  return {
    preselect: { start: rounds?.preselect?.start || '', end: rounds?.preselect?.end || '' },
    main: { start: rounds?.main?.start || '', end: rounds?.main?.end || '' },
    supplement: { start: rounds?.supplement?.start || '', end: rounds?.supplement?.end || '' },
  }
}

/**
 * 演示用老生轮次窗（相对原型「今天」≈ 2026-08，保证进行中轮的 end 未过，便于入口倒计时）
 * 原邮件 2026/04 表已整体平移到 8 月窗；开闭仍由 demoActiveRound / demoClosedRounds 驱动
 */
export const DEMO_SENIOR_ROUNDS_202604 = {
  preselect: { start: '30-Jul-2026 00:00:00', end: '15-Aug-2026 18:00:00' },
  main: { start: '10-Aug-2026 00:00:00', end: '20-Aug-2026 23:59:00' },
  supplement: { start: '21-Aug-2026 00:00:00', end: '28-Aug-2026 23:59:00' },
  resultReleaseAt: '15-Aug-2026 19:00:00',
}

/** 演示用新生轮次窗；R1 咬老生 R2 附近 */
export const DEMO_FRESHMAN_ROUNDS_202604 = {
  preselect: { start: '12-Aug-2026 00:00:00', end: '18-Aug-2026 12:00:00' },
  main: { start: '18-Aug-2026 12:00:00', end: '22-Aug-2026 23:59:00' },
  supplement: { start: '23-Aug-2026 00:00:00', end: '28-Aug-2026 23:59:00' },
}

/**
 * 从批次解析 roundsByAudience；兼容仅有 rounds 的旧数据
 */
export function ensureRoundsByAudience(batch) {
  if (!batch) {
    return {
      senior: { ...defaultAudienceRounds(), resultReleaseAt: '' },
      freshman: defaultAudienceRounds(),
    }
  }
  if (batch.roundsByAudience?.senior && batch.roundsByAudience?.freshman) {
    return {
      senior: {
        ...cloneRounds(batch.roundsByAudience.senior),
        resultReleaseAt: batch.roundsByAudience.senior.resultReleaseAt || '',
      },
      freshman: cloneRounds(batch.roundsByAudience.freshman),
    }
  }
  const senior = {
    ...cloneRounds(batch.rounds),
    resultReleaseAt: batch.resultReleaseAt || '',
  }
  return {
    senior,
    freshman: defaultAudienceRounds(),
  }
}

/** 写回时同步 legacy `rounds` = 老生，便于旧代码读取 */
export function syncLegacyRoundsFromAudience(roundsByAudience) {
  return cloneRounds(roundsByAudience?.senior)
}

export function getAudienceRounds(batch, audience = AUDIENCE_SENIOR) {
  const by = ensureRoundsByAudience(batch)
  return audience === AUDIENCE_FRESHMAN ? by.freshman : by.senior
}

/**
 * 名额初分：优先老生比例四舍五入，新生 = 总额 − 老生
 * @returns {{ senior: number, freshman: number }}
 */
export function splitQuotaByHeadcount(totalCapacity, freshmanCount, seniorCount) {
  const total = Math.max(0, Math.floor(Number(totalCapacity) || 0))
  const fresh = Math.max(0, Number(freshmanCount) || 0)
  const senior = Math.max(0, Number(seniorCount) || 0)
  const head = fresh + senior
  if (total <= 0) return { senior: 0, freshman: 0 }
  if (head <= 0) {
    const s = Math.round(total * 0.6)
    return { senior: s, freshman: Math.max(0, total - s) }
  }
  const seniorQuota = Math.round((total * senior) / head)
  const clampedSenior = Math.min(total, Math.max(0, seniorQuota))
  return { senior: clampedSenior, freshman: Math.max(0, total - clampedSenior) }
}

/** 演示：批次范围新老在册人数（名额分配只读展示） */
export const DEMO_HEADCOUNT = {
  freshman: 100,
  senior: 1500,
}
