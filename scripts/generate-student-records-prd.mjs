/**
 * 生成学籍管理 PRD docx
 * 用法: node scripts/generate-student-records-prd.mjs
 */
import fs from 'fs'
import path from 'path'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import {
  heading,
  body,
  bullet,
  tableFromRows,
  buildModuleSection,
} from './prd/prd-helpers.mjs'
import {
  profileListFields,
  profileFormFields,
  profileSearchFields,
  profileDataFlow,
  profileButtons,
  transferListFields,
  transferFormFields,
  movementAppDataFlow,
  movementAppButtons,
  movementSearchField,
  defermentListFields,
  defermentFormFields,
  defermentDataFlow,
  defermentBusinessFlow,
  resumptionListFields,
  resumptionFormFields,
  resumptionDataFlow,
  resumptionBusinessFlow,
  withdrawalListFields,
  withdrawalFormFields,
  withdrawalDataFlow,
  withdrawalBusinessFlow,
  approvalListFields,
  approvalSearchFields,
  approvalDataFlow,
  approvalButtons,
} from './prd/prd-content.mjs'

const OUTPUT_DIR = 'c:/Users/admin/Desktop/马来教务/模板'
const OUTPUT_NAME = '厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.1.docx'
const CHANGE_ROOT = path.resolve('openspec/changes')

const CHANGE_PACKAGES = [
  'add-student-records-app',
  'add-student-profile-crud',
  'add-programme-transfer-app',
  'add-deferment-app',
  'add-resumption-app',
  'add-withdrawal-app',
  'restructure-student-records-navigation',
  'update-movement-application-details',
  'add-movement-approval-app',
  'refine-movement-approval-search-ui',
  'inline-movement-approval-search-fields',
]

function readMd(changeName, file) {
  const p = path.join(CHANGE_ROOT, changeName, file)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''
}

function readSpecs(changeName) {
  const specDir = path.join(CHANGE_ROOT, changeName, 'specs')
  if (!fs.existsSync(specDir)) return ''
  const parts = []
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.name === 'spec.md') parts.push(fs.readFileSync(full, 'utf8'))
    }
  }
  walk(specDir)
  return parts.join('\n')
}

function appendixSection(changeName, titleZh) {
  const proposal = readMd(changeName, 'proposal.md')
  const specs = readSpecs(changeName)
  const why = proposal.match(/## Why\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || ''
  const what = proposal.match(/## What Changes\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || ''
  const items = [heading(`附录：变更包 ${changeName}`, 3), body(`【${titleZh}】`)]
  if (why) {
    items.push(heading('背景与目的', 4))
    why.split('\n').filter(Boolean).slice(0, 8).forEach((l) => items.push(body(l.replace(/^[-*]\s*/, ''))))
  }
  if (what) {
    items.push(heading('主要变更', 4))
    what.split('\n').filter(Boolean).slice(0, 12).forEach((l) => items.push(body(l.replace(/^[-*#]\s*/, ''))))
  }
  if (specs) {
    items.push(heading('规格摘要', 4))
    specs
      .split('\n')
      .filter((l) => l.startsWith('### Requirement:'))
      .slice(0, 5)
      .forEach((l) => items.push(bullet(l.replace('### Requirement:', '').trim())))
  }
  return items
}

const changeTitles = {
  'add-student-records-app': '学籍管理应用壳层',
  'add-student-profile-crud': '学生档案 CRUD',
  'add-programme-transfer-app': '转专业申请',
  'add-deferment-app': '休学申请',
  'add-resumption-app': '复学申请',
  'add-withdrawal-app': '退学申请',
  'restructure-student-records-navigation': '导航 IA 重组',
  'update-movement-application-details': '申请详情只读化',
  'add-movement-approval-app': '异动审批工作台',
  'refine-movement-approval-search-ui': '审批搜索 UI',
  'inline-movement-approval-search-fields': '搜索 inline 布局',
}

const children = [
  new Paragraph({
    children: [new TextRun({ text: '厦大马来分校本科教务系统产品需求文档', bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '学籍管理模块（学生基本信息 + 学籍异动）', bold: true, size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),
  body('文档版本：V1.1'),
  body('创建日期：2026年6月15日'),
  body('需求确认状态：已确认'),
  body('说明：依据公司 PRD 模板章节结构生成；V1.1 补充（2）字段信息表、（3）菜单功能清单、详细数据流转。'),

  heading('1 文档概述'),
  heading('1.1 文档目的', 2),
  body('描述学籍管理模块产品需求：学生基本信息、四类学籍异动申请与审批。'),
  heading('1.2 开发背景', 2),
  bullet('纯前端 Mock 可交互原型；目标用户含教务管理人员与审批角色。'),
  heading('1.3 文档说明', 2),
  bullet('字段信息表采用模板 9 列表头；功能按钮含下钻页面说明；数据流转含说明/前置/下游三段。'),

  heading('2 系统分析'),
  heading('2.1 应用目录——学籍管理', 2),
  tableFromRows([
    ['一级目录', '英文', '二级目录', '英文', '三级/说明', '状态'],
    ['学籍管理', 'Student Status Management', '学籍管理', 'Student Records Management', '学生基本信息', '已开发'],
    ['', '', '学籍异动', 'Student Status Change', '异动申请/审批', '已开发'],
  ]),

  heading('2.2 模块名称——系统需求', 2),
  heading('2.2.1 一级菜单：学籍管理（Student Status Management）', 3),
  body('门户二级应用；侧边栏三组：学籍管理、学籍异动、学生个人学习计划。'),

  ...buildModuleSection({
    headingText: '2.2.1.1 学生基本信息（Student Basic Information）（已确认）',
    intro: '七 Tab 档案 CRUD；Category：Local/China/International。',
    listFieldTitle: '列表页表格展示字段：',
    listFields: profileListFields,
    formFieldTitle: '新增/编辑表单主要字段（七 Tab 汇总）：',
    formFields: profileFormFields,
    searchFields: profileSearchFields,
    dataFlow: profileDataFlow,
    businessFlow:
      '进入【学籍管理】→【学籍管理】→【学生基本信息】→ 查看列表 → Search/Reset 筛选 → Create 打开七 Tab Drawer 新建保存 / 行内 Edit 修改 / Details 七 Tab 只读 / 勾选 Delete 批量删除 / Import 模板导入 / Export 选字段导出 → 任一操作完成后列表自动刷新。',
    buttons: profileButtons,
  }),

  ...buildModuleSection({
    headingText: '2.2.1.2 学籍异动申请 — 转专业（Programme Transfer）（已确认）',
    intro: 'Tab 子模块；7 态；Section I–IV + VII（Form）；详情只读。',
    listFieldTitle: '列表页表格展示字段：',
    listFields: transferListFields,
    formFieldTitle: '新建/编辑表单字段：',
    formFields: transferFormFields,
    searchFields: movementSearchField,
    dataFlow: movementAppDataFlow,
    businessFlow:
      '进入【学籍管理】→【学籍异动】→【异动申请】→ Tab【转专业】→ Search 筛选 → New Application 打开 Form Modal（Section I–IV）→ Save Draft 或 Submit → Details 只读 DetailModal / Approval Log 查看流转 → Draft 可 Edit/Delete，Pending Review 前可 Cancel，Update Required 可 Resubmit → 审批在【异动审批】模块完成。',
    buttons: movementAppButtons('转专业'),
  }),

  ...buildModuleSection({
    headingText: '2.2.1.2.1 休学（Deferment）（已确认）',
    intro: '学籍异动申请 Tab 子模块；6 态生命周期；Form Modal 含 Section I–III 与 Documents；International 学生审批链含 ISAO 节点。',
    listFieldTitle: '列表页表格展示字段：',
    listFields: defermentListFields,
    formFieldTitle: '新建/编辑表单字段（Section I–III + Documents）：',
    formFields: defermentFormFields,
    searchFields: movementSearchField,
    dataFlow: defermentDataFlow,
    businessFlow: defermentBusinessFlow,
    buttons: movementAppButtons('休学'),
  }),

  ...buildModuleSection({
    headingText: '2.2.1.2.2 复学（Resumption）（已确认）',
    intro: 'Tab 子模块；6 态；Form Modal 含 Section I–II、双声明 Section III 与 Documents；须关联已批准休学记录。',
    listFieldTitle: '列表页表格展示字段：',
    listFields: resumptionListFields,
    formFieldTitle: '新建/编辑表单字段：',
    formFields: resumptionFormFields,
    searchFields: movementSearchField,
    dataFlow: resumptionDataFlow,
    businessFlow: resumptionBusinessFlow,
    buttons: movementAppButtons('复学'),
  }),

  ...buildModuleSection({
    headingText: '2.2.1.2.3 退学（Withdrawal）（已确认）',
    intro: 'Tab 子模块；6 态；Form Modal 含 Section I–III 与 Documents；International 学生在 Section II 显示 ISAO 提示。',
    listFieldTitle: '列表页表格展示字段：',
    listFields: withdrawalListFields,
    formFieldTitle: '新建/编辑表单字段：',
    formFields: withdrawalFormFields,
    searchFields: movementSearchField,
    dataFlow: withdrawalDataFlow,
    businessFlow: withdrawalBusinessFlow,
    buttons: movementAppButtons('退学'),
  }),

  ...buildModuleSection({
    headingText: '2.2.1.3 学籍异动审批（Status Change Approval）（已确认）',
    intro: '三 Tab：Submitted/Pending/History；统一四异动列表；Pending 批量 Review。',
    listFieldTitle: '统一审批列表字段：',
    listFields: approvalListFields,
    formFieldTitle: '搜索区字段：',
    formFields: approvalSearchFields,
    searchFields: null,
    dataFlow: approvalDataFlow,
    businessFlow:
      '进入【学籍管理】→【学籍异动】→【异动审批】→ 切换 Submitted/Pending/History Tab → Search/Reset 五字段筛选 → Pending Tab 勾选批量 Review 或行内 View 单条审批 → Approval Log 查看历史 → History Tab View 后 Recall 撤回 → Export 导出 CSV → 写回后申请 Tab 同步刷新。',
    buttons: approvalButtons,
  }),

  heading('2.3 申请与审批职责分离', 3),
  tableFromRows([
    ['能力', '学生基本信息', '异动申请', '异动审批'],
    ['详情', 'Detail Drawer', '只读无审批', 'View 只读/审批'],
    ['Section VII', '—', 'Form', 'Pending View'],
    ['流转日志', '—', '列表', '列表'],
  ]),

  heading('3 附录：OpenSpec 变更包', 2),
]

for (const pkg of CHANGE_PACKAGES) {
  children.push(...appendixSection(pkg, changeTitles[pkg] || pkg))
}

const doc = new Document({ sections: [{ properties: {}, children }] })
const buffer = await Packer.toBuffer(doc)
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
const outPath = path.join(OUTPUT_DIR, OUTPUT_NAME)
fs.writeFileSync(outPath, buffer)
console.log('Generated:', outPath)
