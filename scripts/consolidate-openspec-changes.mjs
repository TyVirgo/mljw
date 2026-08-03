/**
 * 将 openspec/changes 下散碎变更包按三大模块/菜单合并为中文需求包，并删除旧包。
 * 用法：node scripts/consolidate-openspec-changes.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CHANGES = path.join(ROOT, 'openspec', 'changes')

/** @type {Record<string, { titleZh: string; changeNames: string[] }>} */
const BUCKETS = {
  'basic-data-programme': {
    titleZh: '基础数据-培养方案与年级专业',
    changeNames: [
      'add-programme-intake-planned-enrollment',
      'add-school-elective-category',
      'refine-enrollment-cascade-programme-intake',
      'refine-programme-intake-published-version',
    ],
  },
  'basic-data-course': {
    titleZh: '基础数据-课程信息与开课申请',
    changeNames: [
      'add-course-application',
      'add-course-change-application',
      'add-new-course-approval',
      'align-change-description-step-ui',
      'polish-course-library-import-footer',
      'polish-course-list-pager-filter',
      'redesign-prerequisite-modal',
      'refine-approval-modal-action-labels',
      'refine-course-list-status-ux',
    ],
  },
  'basic-data-lecturer': {
    titleZh: '基础数据-教师与评教设置',
    changeNames: ['add-evaluation-settings', 'add-lecturer-information'],
  },
  'basic-data-shared': {
    titleZh: '基础数据-附件在线预览等共享能力',
    changeNames: ['add-attachment-online-preview'],
  },
  'student-records-profile': {
    titleZh: '学籍管理-学生基本信息',
    changeNames: [
      'add-status-log-graduation-withdrawal-remarks',
      'add-student-pass-expiry-date',
      'add-student-profile-change-log-tab',
      'add-student-profile-crud',
      'add-student-profile-export-card-button',
      'add-student-profile-preview-login',
      'add-student-profile-track-category-field',
      'refine-student-pass-expiry-end-date-display',
      'refine-student-profile-enrollment-demo-fields',
      'refine-student-profile-enrollment-programme-first-cascade',
      'refine-student-profile-list-search',
      'refine-student-profile-nationality-first',
      'refine-student-profile-split-keyword-search',
      'remove-taiwan-from-demo-nationality',
      'unify-student-profile-field-labels',
    ],
  },
  'student-records-movement-category': {
    titleZh: '学籍管理-异动类别配置',
    changeNames: [
      'add-movement-category-config',
      'add-movement-reason-applicable-personnel-category',
      'refine-movement-category-form-ui',
      'refine-movement-reason-allow-student-switch',
      'refine-movement-reason-personnel-multiselect',
      'remove-exclude-graded-from-preset-option',
    ],
  },
  'student-records-consent-form': {
    titleZh: '学籍管理-知情同意书配置',
    changeNames: [
      'add-consent-form-applicable-student-scope',
      'add-consent-form-config',
      'refine-consent-form-version-snapshot',
    ],
  },
  'student-records-movement-rules': {
    titleZh: '学籍管理-异动规则设置',
    changeNames: [
      'add-movement-rule-condition-columns',
      'add-movement-rule-settings',
      'refine-chinese-programme-transfer-rules',
      'refine-local-programme-transfer-rule-value',
      'refine-movement-rule-settings-split-rows',
      'refine-mr004-editable-application-week',
    ],
  },
  'student-records-movement-application': {
    titleZh: '学籍管理-异动申请（教职工/学生端）',
    changeNames: [
      'add-deferment-app',
      'add-deferment-period-dates',
      'add-deferment-period-field-tooltip',
      'add-deferment-resumption-period-date-fields',
      'add-movement-declaration-parent-email-notice',
      'add-movement-international-remarks-and-documents',
      'add-movement-parent-contacts-from-family',
      'add-programme-transfer-app',
      'add-programme-transfer-office-use-approval',
      'add-programme-transfer-status-log-remark',
      'add-resumption-app',
      'add-withdrawal-app',
      'add-withdrawal-final-assessment-field',
      'refine-movement-application-default-tab-and-visa-expiry',
      'refine-movement-declaration-content',
      'refine-movement-parent-contacts-readonly',
      'refine-movement-student-info-fields',
      'reorder-movement-declaration-and-applicant-notes',
      'restructure-movement-application-sections',
      'sort-deferment-period-options-desc',
      'split-movement-application-teacher-student',
      'unify-movement-date-format',
      'unify-movement-declaration-section',
      'update-movement-application-details',
    ],
  },
  'student-records-movement-approval': {
    titleZh: '学籍管理-异动审批',
    changeNames: [
      'add-movement-admin-cancel',
      'add-movement-approval-app',
      'add-movement-approval-list-columns-and-documents-hint',
      'add-movement-approval-log-parallel-branches',
      'inline-movement-approval-search-fields',
      'refine-movement-admin-cancel-to-approval-history',
      'refine-movement-admin-detail-export',
      'refine-movement-approval-search-ui',
      'refine-movement-approval-stage-department-labels',
      'refine-movement-cancel-entry-points',
      'refine-movement-detail-approval-timeline',
      'remove-movement-approval-last-action-time-column',
      'restore-movement-approval-last-action-time-column',
    ],
  },
  'student-records-movement-maintenance': {
    titleZh: '学籍管理-异动维护',
    changeNames: [
      'add-movement-list-pdf-preview',
      'add-movement-maintenance',
      'add-movement-maintenance-archive-number',
      'refine-movement-maintenance-pdf-action-label',
      'refine-movement-maintenance-query-list-columns-search',
    ],
  },
  'student-records-movement-query': {
    titleZh: '学籍管理-异动查询与统计',
    changeNames: ['add-movement-query-app', 'add-movement-statistics-app'],
  },
  'student-records-shell': {
    titleZh: '学籍管理-应用壳层与导航',
    changeNames: [
      'add-student-records-app',
      'restructure-student-records-navigation',
      'unify-application-detail-drawer',
    ],
  },
  'course-reg-module-shell': {
    titleZh: '选课管理-模块壳层与信息架构',
    changeNames: [
      'add-course-capacity-settings',
      'add-course-programme-scope-settings',
      'add-course-registration-module',
      'hide-registration-report-menu',
      'mark-prototype-callouts',
      'move-module-brief-to-breadcrumb',
      'polish-course-group-label-and-menu',
      'polish-student-page-layout',
      'realign-cr-admin-menu-ia',
      'remove-student-page-note-to-brief',
      'scope-multiselect-course-selectable',
      'simplify-special-application-flow',
    ],
  },
  'course-reg-batch': {
    titleZh: '选课管理-选课批次',
    changeNames: [
      'add-batch-local-rules-selectable',
      'add-batch-special-student-roster',
      'add-batch-student-roster',
      'add-course-visible-from-round',
      'batch-table-horizontal-scroll',
      'differentiate-round-demo-courses',
      'enrich-batch-active-demo',
      'enrich-batch-scope-demo-data',
      'enrich-scope-detail-roster',
      'isolate-rounds-and-enrich-sections',
      'polish-batch-courses-main-table',
      'polish-batch-drawer-tables',
      'polish-batch-form-draft-scope-dates',
      'polish-batch-manage-students-entry',
      'polish-batch-names-and-drop-ui',
      'polish-batch-preview-suffix',
      'polish-batch-roster-table',
      'polish-batch-scope-count-column',
      'polish-register-scope-adddrop-ui',
      'polish-scope-detail-layout',
      'progressive-batch-round-setup',
      'refine-batch-adddrop-bill-days',
      'refine-batch-elective-round1-scope',
      'refine-batch-scope-by-faculty-grade',
      'refine-batch-scope-intake',
      'remove-batch-courses-empty-import-btn',
      'rename-import-from-programme',
      'require-scope-round-specific',
    ],
  },
  'course-reg-rules': {
    titleZh: '选课管理-选课规则',
    changeNames: [
      'add-registration-rule-settings',
      'polish-credit-rule-numbered-lines',
      'replace-registration-rules-simple',
    ],
  },
  'course-reg-monitor': {
    titleZh: '选课管理-选课监控',
    changeNames: ['merge-academic-alert-into-monitor', 'polish-round-status-list-ux'],
  },
  'course-reg-approval': {
    titleZh: '选课管理-加退课审批',
    changeNames: ['add-drop-deadline-branches'],
  },
  'course-reg-fee-roster': {
    titleZh: '选课管理-缴费名单',
    changeNames: [
      'add-fee-roster-maintenance',
      'align-fee-source-drop-attachment',
      'polish-fee-roster-import-paid-tab',
    ],
  },
  'course-reg-result': {
    titleZh: '选课管理-管理端选课结果',
    changeNames: [
      'add-admin-result-roster-actions',
      'add-preselect-volunteer-confirm',
      'add-result-by-round-tab',
      'add-student-result-operator',
      'polish-result-course-source',
      'remove-admin-waitlist',
      'split-result-by-student-course-rows',
    ],
  },
  'course-reg-log': {
    titleZh: '选课管理-选课日志',
    changeNames: ['add-registration-log', 'enrich-registration-log-round-monitor'],
  },
  'course-reg-student-register': {
    titleZh: '选课管理-学生在线选课',
    changeNames: [
      'add-register-ge-stats-row',
      'add-register-list-sections-column',
      'add-student-credit-progress-toolbar',
      'collapse-student-cart-to-toolbar',
      'default-register-entry-and-queue-ux',
      'fix-register-list-ui-polish',
      'flatten-register-table-by-section',
      'polish-my-courses-table',
      'polish-register-capacity-column',
      'polish-register-round-capacity-ux',
      'polish-section-credit-ux',
      'polish-section-picker-credit-visual',
      'polish-student-cart-section-style',
      'polish-student-register-toolbar',
      'queue-result-overlay-gated',
      'refine-my-courses-queue-ux',
      'refine-queue-history-cart-ux',
      'refine-section-picker-credit-banner',
      'remove-register-adddrop-timeline-card',
      'split-student-register-by-course-type',
      'student-round-via-menu',
      'sync-register-search-with-table',
      'unify-round-direct-register',
    ],
  },
  'course-reg-student-adddrop': {
    titleZh: '选课管理-学生加退课',
    changeNames: [
      'add-adddrop-course-picker',
      'enrich-student-adddrop-form',
      'polish-adddrop-form-layout',
      'polish-adddrop-label-intake-desc',
      'polish-demo-teaching-week-callout',
      'polish-student-adddrop-list',
    ],
  },
  'course-reg-student-result': {
    titleZh: '选课管理-学生选课结果与历史',
    changeNames: [
      'enrich-student-history-batch-retake',
      'polish-student-waitlist-list',
      'refine-student-my-result-unselect',
      'remove-student-my-schedule',
      'remove-waitlist-enrich-history-search',
      'rename-result-waitlist-add-selected-at',
      'rename-section-code-to-group-name',
    ],
  },
  'course-reg-flow-guide': {
    titleZh: '选课管理-流程说明',
    changeNames: ['move-flow-guide-and-register-page-size'],
  },
}

const EN_HINTS = [
  /\bWhy\b/,
  /\bWhat Changes\b/,
  /\bNon-goals\b/,
  /\bCapabilities\b/,
  /\bImpact\b/,
  /\bThe system\b/i,
  /\bUsers can\b/i,
  /\bShall\b/,
]

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return ''
  }
}

function extractSection(md, ...headers) {
  if (!md) return ''
  for (const h of headers) {
    const re = new RegExp(
      `^#{1,3}\\s*${h}\\s*\\n([\\s\\S]*?)(?=^#{1,3}\\s|$)`,
      'im',
    )
    const m = md.match(re)
    if (m) return m[1].trim()
  }
  return ''
}

function stripMdNoise(s) {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 粗粒度英→中：保留原文结构，对常见小节做替换；整段英文则加「（原文摘要）」前缀提示后续人工润色 */
function toZhFriendly(text) {
  if (!text) return ''
  let t = text
  const replacements = [
    [/^## Why\s*$/gim, '## 背景与动机'],
    [/^## What Changes\s*$/gim, '## 变更内容'],
    [/^## Non-goals\s*$/gim, '## 非目标'],
    [/^## Capabilities\s*$/gim, '## 能力'],
    [/^## Impact\s*$/gim, '## 影响范围'],
    [/^### New Capabilities\s*$/gim, '### 新增能力'],
    [/^### Modified Capabilities\s*$/gim, '### 修改能力'],
    [/MUST /g, '必须'],
    [/SHALL /g, '应当'],
    [/SHOULD /g, '宜'],
    [/WHEN /g, '当'],
    [/THEN /g, '则'],
    [/AND /g, '且'],
    [/the system /gi, '系统'],
    [/the user /gi, '用户'],
    [/student /gi, '学生'],
    [/admin /gi, '管理员'],
  ]
  for (const [a, b] of replacements) t = t.replace(a, b)

  const hasCjk = /[\u4e00-\u9fff]/.test(t)
  const looksEn = EN_HINTS.some((re) => re.test(text)) && !hasCjk
  if (looksEn && t.length > 40) {
    return `（以下内容由英文提案整理，已做术语替换；整理需求文档时可再润色）\n\n${t}`
  }
  return t
}

function collectChangeSummary(name) {
  const dir = path.join(CHANGES, name)
  if (!fs.existsSync(dir)) {
    return { name, missing: true, why: '', what: '', design: '', specs: [], tasks: '' }
  }
  const proposal = readText(path.join(dir, 'proposal.md'))
  const design = readText(path.join(dir, 'design.md'))
  const tasks = readText(path.join(dir, 'tasks.md'))

  const why = extractSection(proposal, 'Why', '背景与动机', '背景', '动机')
  const what = extractSection(
    proposal,
    'What Changes',
    '变更内容',
    'What',
    'Changes',
  )
  // 若无标准小节，取全文前 800 字
  const fallback = stripMdNoise(proposal).slice(0, 800)

  const specsDir = path.join(dir, 'specs')
  const specs = []
  if (fs.existsSync(specsDir)) {
    for (const cap of fs.readdirSync(specsDir)) {
      const specPath = path.join(specsDir, cap, 'spec.md')
      if (fs.existsSync(specPath)) {
        specs.push({ capability: cap, body: readText(specPath) })
      }
    }
  }

  return {
    name,
    missing: false,
    why: toZhFriendly(stripMdNoise(why || fallback)),
    what: toZhFriendly(stripMdNoise(what)),
    design: toZhFriendly(stripMdNoise(design).slice(0, 2500)),
    specs,
    tasks: stripMdNoise(tasks).slice(0, 1500),
  }
}

function buildProposal(bucketKey, meta, summaries) {
  const lines = []
  lines.push(`# ${meta.titleZh}`)
  lines.push('')
  lines.push('> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。')
  lines.push('')
  lines.push('## 背景与动机')
  lines.push('')
  lines.push(
    `将「${meta.titleZh}」相关的零散提案合并为一份连贯需求说明，便于按菜单编写正式需求文档，并减少 openspec/changes 目录噪音。`,
  )
  lines.push('')
  lines.push('## 能力范围（按逻辑分组）')
  lines.push('')

  for (const s of summaries) {
    if (s.missing) {
      lines.push(`### ［缺失］\`${s.name}\``)
      lines.push('')
      continue
    }
    lines.push(`### ${s.name}`)
    lines.push('')
    if (s.why) {
      lines.push('**动机**')
      lines.push('')
      lines.push(s.why)
      lines.push('')
    }
    if (s.what) {
      lines.push('**变更要点**')
      lines.push('')
      lines.push(s.what)
      lines.push('')
    }
  }

  lines.push('## 合并来源')
  lines.push('')
  for (const n of meta.changeNames) {
    lines.push(`- \`${n}\``)
  }
  lines.push('')
  lines.push('## 能力标识')
  lines.push('')
  lines.push(`- \`${bucketKey}\`：${meta.titleZh}（合并需求包）`)
  lines.push('')
  lines.push('## 影响范围')
  lines.push('')
  lines.push('- 对应模块菜单下的列表/表单/抽屉/导出与演示数据')
  lines.push('- i18n（中/英）与导航配置')
  lines.push('- 本包以文档沉淀为主；代码已在各次 apply 中落地')
  lines.push('')
  return lines.join('\n')
}

function buildDesign(meta, summaries) {
  const lines = []
  lines.push(`# ${meta.titleZh} — 设计要点（合并）`)
  lines.push('')
  lines.push('## 文档用途')
  lines.push('')
  lines.push('汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。')
  lines.push('')
  for (const s of summaries) {
    if (!s.design) continue
    lines.push(`## 来源：${s.name}`)
    lines.push('')
    lines.push(s.design)
    lines.push('')
  }
  if (summaries.every((s) => !s.design)) {
    lines.push('（各来源变更未附 design.md，或内容为空；整理需求时以 proposal / spec 为准。）')
    lines.push('')
  }
  return lines.join('\n')
}

function buildMergedSpec(bucketKey, meta, summaries) {
  const lines = []
  lines.push(`# ${meta.titleZh} 规格（合并）`)
  lines.push('')
  lines.push('## 说明')
  lines.push('')
  lines.push(
    '以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。',
  )
  lines.push('')

  for (const s of summaries) {
    if (!s.specs.length) continue
    for (const spec of s.specs) {
      lines.push(`## 来源 \`${s.name}\` / 能力 \`${spec.capability}\``)
      lines.push('')
      lines.push(toZhFriendly(stripMdNoise(spec.body)))
      lines.push('')
    }
  }

  if (summaries.every((s) => !s.specs.length)) {
    lines.push('### 需求 R1（占位）')
    lines.push('')
    lines.push(`系统应提供「${meta.titleZh}」相关能力，具体验收以合并 proposal 中的变更要点为准。`)
    lines.push('')
    lines.push('#### 场景：需求文档整理入口')
    lines.push('')
    lines.push('- **当** 产品根据本合并包整理需求文档')
    lines.push('- **则** 可按「合并来源」回溯历史变更与原型行为')
    lines.push('')
  }

  return lines.join('\n')
}

function buildTasks(meta, summaries) {
  const lines = []
  lines.push(`# ${meta.titleZh} — 任务清单（合并归档）`)
  lines.push('')
  lines.push('> 历史 tasks 已在各次 apply 中完成。本清单仅作追溯；**无需再次实现**。')
  lines.push('')
  lines.push('- [x] 1. 合并本菜单下历史变更包为中文需求包')
  lines.push('- [x] 2. 保留合并来源列表便于需求文档回溯')
  lines.push('- [x] 3. 删除已被合并的旧变更目录')
  lines.push('')
  lines.push('## 历史来源任务摘要')
  lines.push('')
  for (const s of summaries) {
    if (!s.tasks) continue
    lines.push(`### ${s.name}`)
    lines.push('')
    lines.push('```')
    lines.push(s.tasks)
    lines.push('```')
    lines.push('')
  }
  return lines.join('\n')
}

function rmDirRecursive(dir) {
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true, force: true })
}

function main() {
  const dry = process.argv.includes('--dry')
  const allSource = new Set()
  for (const meta of Object.values(BUCKETS)) {
    for (const n of meta.changeNames) allSource.add(n)
  }

  const existing = fs
    .readdirSync(CHANGES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'archive')
    .map((d) => d.name)

  const orphan = existing.filter((n) => !allSource.has(n) && !BUCKETS[n])
  if (orphan.length) {
    console.warn('未归类目录（将保留）:', orphan.join(', '))
  }

  for (const [key, meta] of Object.entries(BUCKETS)) {
    if (!meta.changeNames.length) continue
    const summaries = meta.changeNames.map(collectChangeSummary)
    const outDir = path.join(CHANGES, key)
    if (!dry) {
      fs.mkdirSync(path.join(outDir, 'specs', key), { recursive: true })
      fs.writeFileSync(
        path.join(outDir, '.openspec.yaml'),
        'schema: spec-driven\ncreated: consolidated\n',
      )
      fs.writeFileSync(path.join(outDir, 'proposal.md'), buildProposal(key, meta, summaries))
      fs.writeFileSync(path.join(outDir, 'design.md'), buildDesign(meta, summaries))
      fs.writeFileSync(
        path.join(outDir, 'specs', key, 'spec.md'),
        buildMergedSpec(key, meta, summaries),
      )
      fs.writeFileSync(path.join(outDir, 'tasks.md'), buildTasks(meta, summaries))
      fs.writeFileSync(
        path.join(outDir, 'SOURCES.md'),
        [
          `# 合并来源 — ${meta.titleZh}`,
          '',
          ...meta.changeNames.map((n) => `- ${n}`),
          '',
        ].join('\n'),
      )
    }
    console.log(`OK ${key} (${meta.changeNames.length})`)
  }

  if (!dry) {
    for (const n of allSource) {
      const p = path.join(CHANGES, n)
      if (fs.existsSync(p)) rmDirRecursive(p)
    }
  }

  console.log(
    dry
      ? `[dry] would write ${Object.keys(BUCKETS).filter((k) => BUCKETS[k].changeNames.length).length} packages`
      : `Done. Consolidated packages written; ${allSource.size} source dirs removed.`,
  )
}

main()
