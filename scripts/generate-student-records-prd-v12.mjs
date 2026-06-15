/**
 * 基于空白模板生成学籍管理 PRD V1.2
 * 用法: node scripts/generate-student-records-prd-v12.mjs
 */
import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'
import {
  loadTemplateAssets,
  resetParaIds,
  wrapDocumentBody,
  buildCoverSection,
  buildOverviewSection,
  buildAppDirectoryTable,
  buildModuleXml,
  buildSeparationTable,
  pHeading,
  pBody,
  pBulletItem,
} from './prd/prd-xml.mjs'
import {
  profileListFields,
  profileSearchFields,
  profileDataFlow,
  profileButtons,
  transferListFields,
  movementAppDataFlow,
  movementAppButtons,
  movementSearchField,
  defermentListFields,
  defermentDataFlow,
  defermentBusinessFlow,
  resumptionListFields,
  resumptionDataFlow,
  resumptionBusinessFlow,
  withdrawalListFields,
  withdrawalDataFlow,
  withdrawalBusinessFlow,
  approvalListFields,
  approvalSearchFields,
  approvalDataFlow,
  approvalButtons,
} from './prd/prd-content.mjs'
import {
  PROFILE_FORM_PAGE,
  profileFormFieldGroups,
  TRANSFER_FORM_PAGE,
  transferFormFieldGroups,
  DEFERMENT_FORM_PAGE,
  defermentFormFieldGroups,
  RESUMPTION_FORM_PAGE,
  resumptionFormFieldGroups,
  WITHDRAWAL_FORM_PAGE,
  withdrawalFormFieldGroups,
  APPROVAL_FORM_PAGE,
  approvalFormFieldGroups,
} from './prd/prd-field-groups.mjs'

const TEMPLATE_PATH =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档模板（带参考数据版）0610.docx'
const OUTPUT_DIR = 'c:/Users/admin/Desktop/马来教务/模板'
const OUTPUT_NAME = '厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.5.docx'
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

function appendixXml(changeName, titleZh) {
  const proposal = readMd(changeName, 'proposal.md')
  const design = readMd(changeName, 'design.md')
  const specs = readSpecs(changeName)
  const why = proposal.match(/## Why\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || ''
  const what = proposal.match(/## What Changes\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || ''
  const decisions = design.match(/## Decisions\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || ''
  const parts = [pHeading('3', `附录：变更包 ${changeName}`), pBody(`【${titleZh}】`)]
  if (why) {
    parts.push(pHeading('4', '背景与目的'))
    why
      .split('\n')
      .filter(Boolean)
      .slice(0, 8)
      .forEach((l) => parts.push(pBody(l.replace(/^[-*]\s*/, ''))))
  }
  if (what) {
    parts.push(pHeading('4', '主要变更'))
    what
      .split('\n')
      .filter(Boolean)
      .slice(0, 12)
      .forEach((l) => parts.push(pBody(l.replace(/^[-*#]\s*/, ''))))
  }
  if (decisions) {
    parts.push(pHeading('4', '设计决策'))
    decisions
      .split('\n')
      .filter(Boolean)
      .slice(0, 8)
      .forEach((l) => parts.push(pBody(l.replace(/^[-*]\s*/, ''))))
  }
  if (specs) {
    parts.push(pHeading('4', '规格摘要'))
    specs
      .split('\n')
      .filter((l) => l.startsWith('### Requirement:'))
      .slice(0, 5)
      .forEach((l) => parts.push(pBulletItem(l.replace('### Requirement:', '').trim())))
  }
  return parts.join('')
}

function withDrillDown(buttons, overrides = {}) {
  return buttons.map((btn) => ({
    ...btn,
    drillDown: overrides[btn.nameEn] ?? btn.drillDown ?? btn.interaction,
  }))
}

function buildDocumentInnerXml() {
  resetParaIds()
  const parts = [
    buildCoverSection(),
    buildOverviewSection(),
    pHeading('2', '2 系统分析'),
    pHeading('3', '2.1 应用目录——学籍管理'),
    buildAppDirectoryTable([
      [
        '学籍管理',
        'Student Status Management',
        '学籍管理',
        'Student Records Management',
        '学生基本信息',
        '七 Tab 档案 CRUD；Import/Export；Category 分支校验',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动申请',
        '四 Tab：转专业/休学/复学/退学；Form Modal + 只读 Details',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动审批',
        'Submitted/Pending/History 三 Tab；批量 Review；共享 movementStore',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍管理',
        'Student Records Management',
        '学生个人学习计划',
        '占位菜单（本期未展开需求）',
      ],
    ]),
    pHeading('3', '2.2 模块名称——系统需求'),
    pHeading('4', '2.2.1 一级菜单：学籍管理（Student Status Management）（已确认）'),
    pBody(
      '模块介绍：门户二级应用「学籍管理」，侧边栏三组导航——学籍管理（学生基本信息）、学籍异动（异动申请 + 异动审批）、学生个人学习计划（占位）。纯前端 Mock 可交互原型，数据在 students 与 movementStore 四 ref 间联动。',
    ),
    buildModuleXml({
      menuTitle: '2.2.1.1 学生基本信息（Student Basic Information）（已确认）',
      intro:
        '维护学生全维度档案，支持 Create/Edit/Delete/Import/Export/Details；Student Category（Local/China/International）决定证件字段显隐与校验分支。',
      summary:
        '列表页 + 七 Tab Form Drawer（Basic Info → Enrollment → Contact → Education → Family → Accommodation → Others）+ Import/Export 能力。',
      listFields: profileListFields,
      searchFields: profileSearchFields,
      formPageTitle: PROFILE_FORM_PAGE,
      formFieldGroups: profileFormFieldGroups,
      dataFlow: profileDataFlow,
      businessFlow:
        '进入【学籍管理】→【学籍管理】→【学生基本信息】→ Search/Reset 筛选 → Create 七 Tab Drawer 保存 / Edit / Details 只读 / 勾选 Delete / Import 模板导入 / Export 选字段导出 → 列表自动刷新。',
      prototypeLink: '原型路径：门户 → 学籍管理 → 学生基本信息（sr-student-profile）。',
      buttons: withDrillDown(profileButtons, {
        Search: '无下钻页面，仅刷新当前列表。',
        Reset: '无下钻页面。',
        Delete: 'ConfirmDialog 确认框，非独立页面。',
        Export: 'ExportModal 穿梭框选字段与导出范围。',
      }),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.2 学籍异动申请 — 转专业（Programme Transfer）（已确认）',
      intro: 'Tab 子模块；7 态生命周期；Form Modal Section I–IV；Dean/HoP 终审 Section VII 在审批页填写；Details 只读无审批。',
      summary: 'Programme Transfer 申请列表 + Form Modal + DetailModal + ApprovalLogModal。',
      listFields: transferListFields,
      searchFields: movementSearchField,
      formPageTitle: TRANSFER_FORM_PAGE,
      formFieldGroups: transferFormFieldGroups,
      dataFlow: movementAppDataFlow,
      businessFlow:
        '进入【学籍异动】→【异动申请】→ Tab【转专业】→ Search → New Application Form Modal → Save Draft/Submit → Details 只读 / Approval Log → Draft 可 Edit/Delete；审批在【异动审批】完成。',
      prototypeLink: '原型路径：门户 → 学籍管理 → 异动申请 → 转专业 Tab。',
      buttons: withDrillDown(movementAppButtons('转专业'), {
        Search: '无下钻页面。',
      }),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.2.1 休学（Deferment）（已确认）',
      intro: '6 态；Section I–III + Documents；International 审批链含 ISAO 节点。',
      summary: 'Deferment 列表 + Form Modal + 只读 Details + Approval Log。',
      listFields: defermentListFields,
      searchFields: movementSearchField,
      formPageTitle: DEFERMENT_FORM_PAGE,
      formFieldGroups: defermentFormFieldGroups,
      dataFlow: defermentDataFlow,
      businessFlow: defermentBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 休学 Tab。',
      buttons: withDrillDown(movementAppButtons('休学'), { Search: '无下钻页面。' }),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.2.2 复学（Resumption）（已确认）',
      intro: '6 态；Section I–II、双声明 Section III、Documents；关联休学记录。',
      summary: 'Resumption 列表 + Form Modal + 只读 Details。',
      listFields: resumptionListFields,
      searchFields: movementSearchField,
      formPageTitle: RESUMPTION_FORM_PAGE,
      formFieldGroups: resumptionFormFieldGroups,
      dataFlow: resumptionDataFlow,
      businessFlow: resumptionBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 复学 Tab。',
      buttons: withDrillDown(movementAppButtons('复学'), { Search: '无下钻页面。' }),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.2.3 退学（Withdrawal）（已确认）',
      intro: '6 态；International 学生在 Section II 显示 ISAO Note 提示。',
      summary: 'Withdrawal 列表 + Form Modal + 只读 Details。',
      listFields: withdrawalListFields,
      searchFields: movementSearchField,
      formPageTitle: WITHDRAWAL_FORM_PAGE,
      formFieldGroups: withdrawalFormFieldGroups,
      dataFlow: withdrawalDataFlow,
      businessFlow: withdrawalBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 退学 Tab。',
      buttons: withDrillDown(movementAppButtons('退学'), { Search: '无下钻页面。' }),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.3 学籍异动审批（Status Change Approval）（已确认）',
      intro: '三 Tab：Submitted / Pending / History；merge 四异动非 Draft 记录；Pending 批量 Review；View 全页审批。',
      summary: '统一审批列表 + MovementApprovalModal + MovementApprovalReviewView + ApprovalLogModal。',
      listFields: approvalListFields,
      searchFields: approvalSearchFields,
      formPageTitle: APPROVAL_FORM_PAGE,
      formFieldGroups: approvalFormFieldGroups,
      dataFlow: approvalDataFlow,
      businessFlow:
        '进入【异动审批】→ 切换 Tab → Search/Reset → Pending 勾选 Review 或 View 单条 → Approval Log / History Recall → Export CSV → 写回申请 Tab 同步。',
      prototypeLink: '原型路径：门户 → 学籍管理 → 异动审批（sr-movement-approval）。',
      buttons: withDrillDown(approvalButtons, {
        Search: '无下钻页面。',
        Reset: '无下钻页面。',
        Export: '浏览器直接下载 CSV，无独立页面。',
        'Approval Log': 'ApprovalLogModal 弹窗表格。',
      }),
    }),
    buildSeparationTable(),
    pHeading('2', '3 附录：OpenSpec 变更包'),
  ]

  for (const pkg of CHANGE_PACKAGES) {
    parts.push(appendixXml(pkg, changeTitles[pkg] || pkg))
  }

  return parts.join('')
}

async function main() {
  loadTemplateAssets()
  const templateBuf = fs.readFileSync(TEMPLATE_PATH)
  const zip = await JSZip.loadAsync(templateBuf)
  const inner = buildDocumentInnerXml()
  zip.file('word/document.xml', wrapDocumentBody(inner))
  const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const outPath = path.join(OUTPUT_DIR, OUTPUT_NAME)
  fs.writeFileSync(outPath, outBuf)
  console.log('Generated:', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
