export const STAT_COUNT_KEYS = [
  'programmeTransfer',
  'deferment',
  'withdrawal',
  'resumption',
  'outboundMobility',
  'expel',
  'incomplete',
  'completion',
  'completionWithoutGraduation',
  'inboundMobility',
  'iep',
]

export const SOURCE_TO_COLUMN = {
  'programme-transfer': 'programmeTransfer',
  deferment: 'deferment',
  withdrawal: 'withdrawal',
  resumption: 'resumption',
}

export const SUPPLEMENT_COLUMN_KEYS = [
  'outboundMobility',
  'expel',
  'incomplete',
  'completion',
  'completionWithoutGraduation',
  'inboundMobility',
  'iep',
]

export function createEmptyStatCounts() {
  return Object.fromEntries(STAT_COUNT_KEYS.map((key) => [key, 0]))
}
