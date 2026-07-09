import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.join(repoRoot, 'openspec', 'changes')

const headerReplacements = [
  [/^## Why\s*$/gm, '## 背景'],
  [/^## What\s*$/gm, '## 变更内容'],
  [/^## Impact\s*$/gm, '## 影响'],
  [/^## Non-goals\s*$/gm, '## 非目标'],
  [/^## Goals\s*$/gm, '## 目标'],
  [/^## ADDED Requirements\s*$/gm, '## 新增需求'],
  [/^## MODIFIED Requirements\s*$/gm, '## 修改需求'],
  [/^## REMOVED Requirements\s*$/gm, '## 删除需求'],
  [/^## Requirements\s*$/gm, '## 需求'],
  [/^### Requirement: /gm, '### 需求：'],
  [/^#### Scenario: /gm, '#### 场景：'],
  [/^## ADDED: /gm, '## 新增：'],
  [/^## MODIFIED: /gm, '## 修改：'],
  [/^# Tasks\s*$/gm, '# 任务'],
  [/^# Design\s*$/gm, '# 设计'],
  [/^# Proposal\s*$/gm, '# 提案'],
  // tasks.md 英文章节标题
  [/^## 1\. Data & lookup\s*$/gm, '## 1. 数据与查询'],
  [/^## 1\. Data model\s*$/gm, '## 1. 数据模型'],
  [/^## 1\. Data helpers\s*$/gm, '## 1. 数据辅助'],
  [/^## 1\. Builders\s*$/gm, '## 1. 构建函数'],
  [/^## 1\. Field registry & components\s*$/gm, '## 1. 字段注册表与组件'],
  [/^## 1\. Formatter & normalize\s*$/gm, '## 1. 格式化与规范化'],
  [/^## 1\. Mock & navigation\s*$/gm, '## 1. Mock 与导航'],
  [/^## 1\. OpenSpec & shell\s*$/gm, '## 1. OpenSpec 与壳层'],
  [/^## 1\. OpenSpec \/ i18n\s*$/gm, '## 1. OpenSpec 与 i18n'],
  [/^## 1\. Data Layer\s*$/gm, '## 1. 数据层'],
  [/^## 1\. Helper\s*$/gm, '## 1. 工具函数'],
  [/^## 2\. UI\s*$/gm, '## 2. 界面'],
  [/^## 2\. List page UI\s*$/gm, '## 2. 列表页界面'],
  [/^## 2\. List UI & i18n\s*$/gm, '## 2. 列表界面与 i18n'],
  [/^## 2\. Views & i18n\s*$/gm, '## 2. 视图与 i18n'],
  [/^## 2\. Forms & data\s*$/gm, '## 2. 表单与数据'],
  [/^## 2\. Seed data\s*$/gm, '## 2. 种子数据'],
  [/^## 2\. Integration\s*$/gm, '## 2. 集成'],
  [/^## 2\. Toggle Component\s*$/gm, '## 2. 切换组件'],
  [/^## 3\. Status log integration\s*$/gm, '## 3. 状态日志集成'],
  [/^## 3\. Details & verify\s*$/gm, '## 3. 详情与验证'],
  [/^## 3\. Mock & verify\s*$/gm, '## 3. Mock 与验证'],
  [/^## 3\. i18n & verify\s*$/gm, '## 3. i18n 与验证'],
  [/^## 3\. Verify\s*$/gm, '## 3. 验证'],
  [/^## 3\. ChangeDescriptionStep Refactor\s*$/gm, '## 3. ChangeDescriptionStep 重构'],
  [/^## 4\. Detail \/ Drawer\s*$/gm, '## 4. 详情 / 抽屉'],
  [/^## 4\. Refine（无 Banner \+ tooltip 可见）\s*$/gm, '## 4. 细化（无 Banner + tooltip 可见）'],
  [/^## 4\. Search–table column alignment\s*$/gm, '## 4. 搜索与列表列对齐'],
  [/^## 4\. i18n\s*$/gm, '## 4. i18n'],
  [/^## 5\. Sticky checkbox & Programme Level display\s*$/gm, '## 5. 冻结复选框与专业层次展示'],
  [/^## 5\. Verification\s*$/gm, '## 5. 验证'],
  [/^## 3\. FormModal Section II–III\s*$/gm, '## 3. FormModal Section II–III'],
]

const inlineReplacements = [
  [/\*\*WHEN\*\*/g, '**当**'],
  [/\*\*THEN\*\*/g, '**则**'],
  [/\*\*AND\*\*/g, '**且**'],
  [/^WHEN /gm, '当 '],
  [/^THEN /gm, '则 '],
  [/\bAND changes SHALL NOT\b/g, '且变更不得'],
  [/\bAND SHALL\b/g, '且应'],
  [/\bAND WHEN\b/g, '且当'],
  [/\bsystem SHALL NOT\b/gi, '系统不得'],
  [/\bsystem SHALL\b/gi, '系统应'],
  [/\bSHALL NOT\b/g, '不得'],
  [/\bSHALL\b/g, '应'],
]

/** 整段 tasks 文件替换（按变更包维护） */
const fileReplacements = {
  'add-deferment-period-dates/tasks.md': [
    [
      `# 任务
## 1. Data & lookup

- [x] 1.1 Add 2024 semester records to semesterInfo for mock lookup coverage
- [x] 1.2 resolveDefermentPeriodDates + getDefermentPeriodOptions in deferments.js
- [x] 1.3 defermentStartDate / defermentEndDate on createEmptyDeferment + normalizeDeferment

## 2. UI

- [x] 2.1 DefermentFormModal: watch period, readonly start/end row
- [x] 2.2 DefermentDetailModal + MovementDetailContent display
- [x] 2.3 i18n zh/en + zh-flat

## 3. Status log integration

- [x] 3.1 buildDefermentStatusLogRemarkLines + extend applyStudentProfileFromMovement
- [x] 3.2 Pass movement context from maintenance + approval engine
- [x] 3.3 Update mock deferments and student statusLogs`,
      `# 任务
## 1. 数据与查询

- [x] 1.1 向 semesterInfo 补充 2024 学年学期记录，覆盖 mock 查询
- [x] 1.2 在 deferments.js 实现 resolveDefermentPeriodDates、getDefermentPeriodOptions
- [x] 1.3 createEmptyDeferment、normalizeDeferment 增加 defermentStartDate / defermentEndDate

## 2. 界面

- [x] 2.1 DefermentFormModal：监听休学期间，只读展示起止日期行
- [x] 2.2 DefermentDetailModal + MovementDetailContent 同步展示
- [x] 2.3 i18n zh/en + zh-flat

## 3. 状态日志集成

- [x] 3.1 buildDefermentStatusLogRemarkLines + 扩展 applyStudentProfileFromMovement
- [x] 3.2 维护与审批引擎传入异动上下文
- [x] 3.3 更新 mock deferments 与学生 statusLogs`,
    ],
  ],
  'add-student-pass-expiry-date/tasks.md': [
    [
      `# 任务
## 1. Data model

- [x] 1.1 \`studentPassExpiryDate\` on createEmptyBasicInfo, clearCategorySpecificFields, normalizeStudent
- [x] 1.2 \`matchesStudentPassExpiryDateRange\` helper + mock China/Intl samples
- [x] 1.3 programmeTransfers visaExpiryDate from studentPassExpiryDate

## 2. UI

- [x] 2.1 BasicInfoTab read-only field (China/Intl)
- [x] 2.2 StudentProfileView column + date range search
- [x] 2.3 exportStudentProfileExcel column + row mapping

## 3. i18n & verify

- [x] 3.1 zh/en + zh-flat labels
- [x] 3.2 npm run build`,
      `# 任务
## 1. 数据模型

- [x] 1.1 createEmptyBasicInfo、clearCategorySpecificFields、normalizeStudent 增加 \`studentPassExpiryDate\`
- [x] 1.2 实现 \`matchesStudentPassExpiryDateRange\` 辅助函数 + mock China/Intl 样例
- [x] 1.3 programmeTransfers 的 visaExpiryDate 改读 studentPassExpiryDate

## 2. 界面

- [x] 2.1 BasicInfoTab 只读字段（China/Intl）
- [x] 2.2 StudentProfileView 列表列 + 日期范围搜索
- [x] 2.3 exportStudentProfileExcel 列与行映射

## 3. i18n 与验证

- [x] 3.1 zh/en + zh-flat 标签
- [x] 3.2 npm run build`,
    ],
  ],
  'add-programme-transfer-status-log-remark/tasks.md': [
    [
      `# 任务
- [x] 1. programmeTransferStatusLog.js helper
- [x] 2. applyStudentProfileFromMovement PT branch
- [x] 3. Update student mock statusLogs + approved transfer applicationSession
- [x] 4. Re-export from programmeTransfers.js`,
      `# 任务
- [x] 1. 新增 programmeTransferStatusLog.js 辅助函数
- [x] 2. applyStudentProfileFromMovement 转专业分支接入
- [x] 3. 更新学生 mock statusLogs 与已批准转专业 applicationSession
- [x] 4. 从 programmeTransfers.js 重新导出`,
    ],
  ],
  'add-status-log-graduation-withdrawal-remarks/tasks.md': [
    [
      `# 任务
## 1. Builders

- [x] 1.1 graduationStatusLog.js
- [x] 1.2 withdrawalStatusLog.js

## 2. Integration

- [x] 2.1 applyStudentProfileFromMovement withdrawal branch
- [x] 2.2 studentStatusOptions + i18n Graduated

## 3. Mock & verify

- [x] 3.1 XMUM2309001 graduation + withdrawal demo updates
- [x] 3.2 npm run build`,
      `# 任务
## 1. 构建函数

- [x] 1.1 graduationStatusLog.js
- [x] 1.2 withdrawalStatusLog.js

## 2. 集成

- [x] 2.1 applyStudentProfileFromMovement 退学分支
- [x] 2.2 studentStatusOptions + i18n Graduated

## 3. Mock 与验证

- [x] 3.1 更新 XMUM2309001 毕业与退学 demo
- [x] 3.2 npm run build`,
    ],
  ],
  'add-student-profile-preview-login/tasks.md': [
    [
      `## 1. Mock & navigation`,
      `## 1. Mock 与导航`,
    ],
    [`## 2. List UI & i18n`, `## 2. 列表界面与 i18n`],
    [`## 3. Verify`, `## 3. 验证`],
    [`## 4. Refine（无 Banner + tooltip 可见）`, `## 4. 细化（无 Banner + tooltip 可见）`],
  ],
  'unify-student-profile-field-labels/tasks.md': [
    [`## 1. Field registry & components`, `## 1. 字段注册表与组件`],
    [`## 2. Views & i18n`, `## 2. 视图与 i18n`],
    [`## 3. Verify`, `## 3. 验证`],
  ],
  'refine-student-profile-enrollment-demo-fields/tasks.md': [
    [`## 1. Formatter & normalize`, `## 1. 格式化与规范化`],
    [`## 2. Seed data`, `## 2. 种子数据`],
    [`## 3. Verify`, `## 3. 验证`],
  ],
  'refine-student-profile-list-search/tasks.md': [
    [`## 1. Data helpers`, `## 1. 数据辅助`],
    [`## 2. List page UI`, `## 2. 列表页界面`],
    [`## 3. i18n & verify`, `## 3. i18n 与验证`],
    [`## 4. Search–table column alignment`, `## 4. 搜索与列表列对齐`],
    [`## 5. Sticky checkbox & Programme Level display`, `## 5. 冻结复选框与专业层次展示`],
  ],
  'refine-movement-application-default-tab-and-visa-expiry/tasks.md': [
    [`## 1. OpenSpec & shell`, `## 1. OpenSpec 与壳层`],
    [`## 2. Forms & data`, `## 2. 表单与数据`],
    [`## 3. Details & verify`, `## 3. 详情与验证`],
  ],
  'restructure-movement-application-sections/tasks.md': [
    [`## 1. OpenSpec / i18n`, `## 1. OpenSpec 与 i18n`],
    [`## 4. Detail / Drawer`, `## 4. 详情 / 抽屉`],
  ],
  'align-change-description-step-ui/tasks.md': [
    [
      `## 1. Data Layer

- [x] 1.1 Extend \`changeDescriptionComponents\` in \`courseChangeApplications.js\`: replace \`hint\` with \`majorCriteria[]\` and \`minorCriteria[]\` for all 10 components (text from prototype)
- [x] 1.2 Verify \`createEmptyChangeDescription()\` defaults and validation unchanged

## 2. Toggle Component

- [x] 2.1 Create \`ChangeLevelToggle.vue\`: pill-shaped N/Y switch, props \`active\` / \`disabled\`, blue active state (#2563eb)
- [x] 2.2 Support readonly mode (disabled, no pointer events)

## 3. ChangeDescriptionStep Refactor

- [x] 3.1 Rewrite template to three-column table: header row + data rows with Component Name | Major Changes | Minor / No Changes
- [x] 3.2 Render \`majorCriteria\` / \`minorCriteria\` as bullet lists under each column toggle
- [x] 3.3 Wire mutually exclusive toggle logic: click inactive column → set \`major\` or \`minor\`
- [x] 3.4 Add section title blue vertical accent bar (MAIN COMPONENTS / OTHER COMPONENTS)
- [x] 3.5 Style table: row borders, component name column \`#fafafa\` background, 12px grey criteria text

## 4. i18n

- [x] 4.1 Add Chinese translations in \`zh-flat.js\` for all criteria bullet strings (10 components × major + minor lists)
- [x] 4.2 Add table header keys if missing: \`Component Name\`, \`Major Changes\`, \`Minor / No Changes\`

## 5. Verification

- [x] 5.1 Visual check: Step 1 matches prototype layout (three columns, pill toggles, bullet criteria)
- [x] 5.2 Functional check: toggle mutual exclusivity, default minor, readonly detail mode
- [x] 5.3 Run \`npm run build\``,
      `## 1. 数据层

- [x] 1.1 扩展 \`courseChangeApplications.js\` 中 \`changeDescriptionComponents\`：将全部 10 个组件的 \`hint\` 替换为 \`majorCriteria[]\`、\`minorCriteria[]\`（文案取自原型）
- [x] 1.2 确认 \`createEmptyChangeDescription()\` 默认值与校验逻辑不变

## 2. 切换组件

- [x] 2.1 新建 \`ChangeLevelToggle.vue\`：胶囊形 N/Y 开关，props \`active\` / \`disabled\`，激活态蓝色（#2563eb）
- [x] 2.2 支持只读模式（disabled，无 pointer events）

## 3. ChangeDescriptionStep 重构

- [x] 3.1 重写模板为三列表格：表头行 + 数据行（Component Name | Major Changes | Minor / No Changes）
- [x] 3.2 在各列切换下方以 bullet 列表渲染 \`majorCriteria\` / \`minorCriteria\`
- [x] 3.3 互斥切换逻辑：点击未激活列 → 设为 \`major\` 或 \`minor\`
- [x] 3.4 区块标题增加蓝色竖向强调条（MAIN COMPONENTS / OTHER COMPONENTS）
- [x] 3.5 表格样式：行边框、组件名列 \`#fafafa\` 背景、12px 灰色 criteria 文案

## 4. i18n

- [x] 4.1 在 \`zh-flat.js\` 为全部 criteria bullet 补充中文（10 组件 × major + minor 列表）
- [x] 4.2 补全表头 key：\`Component Name\`、\`Major Changes\`、\`Minor / No Changes\`

## 5. 验证

- [x] 5.1 视觉检查：Step 1 对齐原型布局（三列、胶囊切换、bullet criteria）
- [x] 5.2 功能检查：切换互斥、默认 minor、只读详情模式
- [x] 5.3 运行 \`npm run build\``,
    ],
  ],
}

function getChangedPackages() {
  const out = execSync('git status --porcelain openspec/changes', { cwd: repoRoot, encoding: 'utf8' })
  const pkgs = new Set()
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/openspec\/changes\/([^/]+)\//)
    if (m) pkgs.add(m[1])
  }
  return pkgs
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

const changedPkgs = getChangedPackages()
let updated = 0

for (const file of walk(root)) {
  const relFromChanges = path.relative(root, file).replace(/\\/g, '/')
  const pkg = relFromChanges.split('/')[0]
  if (changedPkgs.size && !changedPkgs.has(pkg)) continue

  const original = fs.readFileSync(file, 'utf8')
  let text = original
  for (const [from, to] of headerReplacements) text = text.replace(from, to)
  for (const [from, to] of inlineReplacements) text = text.replace(from, to)

  const pairs = fileReplacements[relFromChanges]
  if (pairs) {
    for (const [from, to] of pairs) text = text.replace(from, to)
  }

  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8')
    updated++
    console.log('updated:', relFromChanges)
  }
}

console.log(`\n共更新 ${updated} 个 markdown 文件（变更包范围：${changedPkgs.size || '全部'} 个）`)
