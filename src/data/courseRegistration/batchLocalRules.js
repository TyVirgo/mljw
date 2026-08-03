/** 批次选课规则描述（配置 UI；本轮不接学生端校验） */
export function defaultBatchLocalRules() {
  return {
    linkPrerequisites: true,
    allowRetakeOnFail: true,
    allowDropSelfSelected: true,
    dropSelfSelectedMaxPerRound: 10,
    allowExceedCreditMax: false,
  }
}

export function normalizeBatchLocalRules(raw) {
  const base = defaultBatchLocalRules()
  if (!raw || typeof raw !== 'object') return base
  const max = Number(raw.dropSelfSelectedMaxPerRound)
  return {
    linkPrerequisites: raw.linkPrerequisites !== false,
    allowRetakeOnFail: raw.allowRetakeOnFail !== false,
    allowDropSelfSelected: raw.allowDropSelfSelected !== false,
    dropSelfSelectedMaxPerRound: Number.isFinite(max) && max > 0 ? Math.floor(max) : 10,
    allowExceedCreditMax: Boolean(raw.allowExceedCreditMax),
  }
}
