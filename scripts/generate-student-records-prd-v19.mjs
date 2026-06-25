/**
 * 基于 V1.8 内容 + OpenSpec changes 包增量，生成学籍管理 PRD V1.9
 * 用法: node scripts/generate-student-records-prd-v19.mjs
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
  buildDisplayConventionsSection,
  buildFieldTable,
  pHeading,
  pBody,
} from './prd/prd-xml.mjs'
import {
  profileListFields,
  profileSearchFields,
  profileDataFlow,
  profileBusinessFlow,
  transferListFields,
  movementAppDataFlow,
  transferBusinessFlow,
  movementApplicationSearchFields,
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
  categoryListFields,
  categorySearchFields,
  categoryDataFlow,
  categoryBusinessFlow,
  consentListFields,
  consentSearchFields,
  consentDataFlow,
  consentBusinessFlow,
  movementWideListFields,
  movementQueryOptionalExportFields,
  movementMaintenanceSearchFields,
  movementQuerySearchFields,
  maintenanceDataFlow,
  maintenanceBusinessFlow,
  queryDataFlow,
  queryBusinessFlow,
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
  CATEGORY_FORM_PAGE,
  categoryFormFieldGroups,
  CONSENT_FORM_PAGE,
  consentFormFieldGroups,
  MAINTENANCE_EDIT_PAGE,
  maintenanceEditFieldGroups,
  QUERY_FORM_PAGE,
  queryFormFieldGroups,
} from './prd/prd-field-groups.mjs'
import {
  profileMenuSummary,
  transferMenuSummary,
  defermentMenuSummary,
  resumptionMenuSummary,
  withdrawalMenuSummary,
  movementApplicationTeacherSummary,
  movementApplicationStudentSummary,
  approvalMenuSummary,
  categoryMenuSummary,
  consentMenuSummary,
  maintenanceMenuSummary,
  queryMenuSummary,
  level1MenuIntro,
} from './prd/prd-module-intros.mjs'
import {
  buildProfileButtons,
  buildMovementButtons,
  buildApprovalButtons,
  buildCategoryButtons,
  buildMaintenanceButtons,
  buildQueryButtons,
  buildConsentButtons,
} from './prd/prd-buttons.mjs'

const TEMPLATE_PATH =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档模板（带参考数据版）0610.docx'
const OUTPUT_DIR = 'c:/Users/admin/Desktop/马来教务/模板'
const OUTPUT_NAME = '厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.9.docx'

const V19_COVER_NOTE =
  'V1.9 在 V1.8 基础上全面对齐 OpenSpec changes：侧边栏两组导航（移除学生个人学习计划）；新增知情同意书；学籍异动申请拆为老师/学生双入口 Tab 壳层；审批搜索改专业代码、View→Modal 审批、历史 Tab 显示是否实施；异动类别去 Student Type、原因同步申请下拉；维护/查询搜索改专业代码（查询增异动类型）；维护移除 Edit/改编号；生效学期 YYYY/MM；转专业 Section VII 申请侧 disabled。'

function buildExportListAppendix() {
  return [
    pBody('导出弹窗（ExportModal）除上述 15 列默认勾选外，另提供以下 9 个可选扩展列（默认未勾选）：'),
    buildFieldTable(movementQueryOptionalExportFields, { align: 'left' }),
  ].join('')
}

function buildQueryExportListAppendix() {
  return [
    pBody('导出弹窗（ExportModal）除上述 15 列默认勾选外，另提供以下 9 个可选扩展列（默认未勾选；导出时护照/IC 脱敏、是否实施 Y/N）：'),
    buildFieldTable(movementQueryOptionalExportFields, { align: 'left' }),
  ].join('')
}

function buildMovementModuleXml({ menuTitle, menuSummary, listFields, businessFlow, prototypeLink, moduleName, formPageTitle, formFieldGroups }) {
  return buildModuleXml({
    menuTitle,
    menuSummary,
    listFields,
    searchFieldNote:
      '搜索区双行布局（MovementApplicationSearchBar）：老师入口首行含学号或姓名、专业代码、申请学年学期、状态（含 Draft）；学生入口隐藏学号或姓名；次行是否实施可收起。',
    searchFields: movementApplicationSearchFields,
    formPageTitle,
    formFieldGroups,
    dataFlow: movementAppDataFlow,
    businessFlow,
    prototypeLink,
    buttons: buildMovementButtons(moduleName),
  })
}

function buildMaintenanceModuleXml() {
  return buildModuleXml({
    menuTitle: '2.2.1.8 学籍异动维护（Status Change Maintenance）（已确认）',
    menuSummary: maintenanceMenuSummary,
    listFieldNote:
      '列表页宽表展示 15 个数据列（另含勾选与操作列，共 17 列；横向滚动，Actions 列 sticky 固定）：',
    listFields: movementWideListFields,
    listAppendix: buildExportListAppendix(),
    searchFields: movementMaintenanceSearchFields,
    formPageTitle: MAINTENANCE_EDIT_PAGE,
    formFieldGroups: maintenanceEditFieldGroups,
    dataFlow: maintenanceDataFlow,
    businessFlow: maintenanceBusinessFlow,
    prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动维护。',
    buttons: buildMaintenanceButtons(),
  })
}

function buildQueryModuleXml() {
  return buildModuleXml({
    menuTitle: '2.2.1.9 学籍异动查询（Status Change Inquiry）（已确认）',
    menuSummary: queryMenuSummary,
    listFieldNote:
      '列表页宽表列与维护页一致（15 数据列 + 勾选/操作，共 17 列）；无 sortable 表头装饰：',
    listFields: movementWideListFields,
    listAppendix: buildQueryExportListAppendix(),
    searchFieldNote:
      '搜索区双行布局，首行学年学期/专业代码/状态/异动类型，次行学号/姓名默认展开且可收起：',
    searchFields: movementQuerySearchFields,
    formPageTitle: QUERY_FORM_PAGE,
    formFieldGroups: queryFormFieldGroups,
    dataFlow: queryDataFlow,
    businessFlow: queryBusinessFlow,
    prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动查询。',
    buttons: buildQueryButtons(),
  })
}

function buildDocumentInnerXml() {
  resetParaIds()
  const parts = [
    buildCoverSection({
      version: 'V1.9',
      date: '2026年6月15日',
      note: V19_COVER_NOTE,
    }),
    buildOverviewSection({
      scopeExtra: 'V1.9 增量约定见 §2.5；应用目录见 §2.1。',
    }),
    pHeading('2', '2 系统分析'),
    pHeading('3', '2.1 应用目录——学籍管理'),
    buildAppDirectoryTable([
      [
        '学籍管理',
        'Student Status Management',
        '学籍管理',
        'Student Records Management',
        '学生基本信息',
        '七页签档案增删改查、导入导出',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动类别',
        'categoryCode 唯一；4 行种子；原因同步申请',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '知情同意书',
        '按异动类别+Student Type 模板',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动申请（老师）',
        'Tab 壳层；双行搜索含学号/姓名',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动申请（学生）',
        'Tab 壳层；隐藏学号/姓名列',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动审批',
        '三 Tab；专业代码搜索；Modal 审批',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动维护',
        '15 列；无 Edit/改编号',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动查询',
        '只读；异动类型筛选',
      ],
    ]),
    pHeading('3', '2.2 模块名称——系统需求'),
    pHeading('4', '2.2.1 一级菜单：学籍管理（Student Status Management）（已确认）'),
    pBody(`模块介绍：${level1MenuIntro}`),
    buildModuleXml({
      menuTitle: '2.2.1.1 学生基本信息（Student Basic Information）（已确认）',
      menuSummary: profileMenuSummary,
      listFields: profileListFields,
      searchFields: profileSearchFields,
      formPageTitle: PROFILE_FORM_PAGE,
      formFieldGroups: profileFormFieldGroups,
      dataFlow: profileDataFlow,
      businessFlow: profileBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍管理 → 学生基本信息。',
      buttons: buildProfileButtons(),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.2 异动类别（Change Category）（已确认）',
      menuSummary: categoryMenuSummary,
      listFields: categoryListFields,
      searchFields: categorySearchFields,
      formPageTitle: CATEGORY_FORM_PAGE,
      formFieldGroups: categoryFormFieldGroups,
      dataFlow: categoryDataFlow,
      businessFlow: categoryBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 异动类别。',
      buttons: buildCategoryButtons(),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.3 知情同意书（Informed Consent Form）（已确认）',
      menuSummary: consentMenuSummary,
      listFields: consentListFields,
      searchFields: consentSearchFields,
      formPageTitle: CONSENT_FORM_PAGE,
      formFieldGroups: consentFormFieldGroups,
      dataFlow: consentDataFlow,
      businessFlow: consentBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 知情同意书。',
      buttons: buildConsentButtons(),
    }),
    pHeading('5', '2.2.1.4 学籍异动申请（老师）（Status Change Application - Staff）（已确认）'),
    pHeading('6', '菜单介绍'),
    pBody(`菜单内容简介：${movementApplicationTeacherSummary}`),
    pBody('页内 Tab：转专业 · 休学 · 复学 · 退学（默认休学）。以下 2.2.1.4.1–2.2.1.4.4 为各 Tab 业务字段与按钮（老师入口）。'),
    buildMovementModuleXml({
      menuTitle: '2.2.1.4.1 转专业（Programme Transfer）（已确认）',
      menuSummary: transferMenuSummary,
      listFields: transferListFields,
      businessFlow: transferBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动申请（老师）→ 转专业 Tab。',
      moduleName: '转专业',
      formPageTitle: TRANSFER_FORM_PAGE,
      formFieldGroups: transferFormFieldGroups,
    }),
    buildMovementModuleXml({
      menuTitle: '2.2.1.4.2 休学（Deferment）（已确认）',
      menuSummary: defermentMenuSummary,
      listFields: defermentListFields,
      businessFlow: defermentBusinessFlow,
      prototypeLink: '原型路径：学籍异动申请（老师）→ 休学 Tab。',
      moduleName: '休学',
      formPageTitle: DEFERMENT_FORM_PAGE,
      formFieldGroups: defermentFormFieldGroups,
    }),
    buildMovementModuleXml({
      menuTitle: '2.2.1.4.3 复学（Resumption）（已确认）',
      menuSummary: resumptionMenuSummary,
      listFields: resumptionListFields,
      businessFlow: resumptionBusinessFlow,
      prototypeLink: '原型路径：学籍异动申请（老师）→ 复学 Tab。',
      moduleName: '复学',
      formPageTitle: RESUMPTION_FORM_PAGE,
      formFieldGroups: resumptionFormFieldGroups,
    }),
    buildMovementModuleXml({
      menuTitle: '2.2.1.4.4 退学（Withdrawal）（已确认）',
      menuSummary: withdrawalMenuSummary,
      listFields: withdrawalListFields,
      businessFlow: withdrawalBusinessFlow,
      prototypeLink: '原型路径：学籍异动申请（老师）→ 退学 Tab。',
      moduleName: '退学',
      formPageTitle: WITHDRAWAL_FORM_PAGE,
      formFieldGroups: withdrawalFormFieldGroups,
    }),
    pHeading('5', '2.2.1.5 学籍异动申请（学生）（Status Change Application - Student）（已确认）'),
    pHeading('6', '菜单介绍'),
    pBody(`菜单内容简介：${movementApplicationStudentSummary}`),
    pBody(
      '与学生相关的四 Tab 字段表、表单分区与按钮与老师入口一致（见 §2.2.1.4.1–4.4），差异仅在于：搜索区无学号或姓名字段；列表隐藏学号、姓名列；新建表单不提供 StudentSelectModal（学生身份上下文）。原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动申请（学生）→ 各 Tab。',
    ),
    buildModuleXml({
      menuTitle: '2.2.1.6 学籍异动审批（Status Change Approval）（已确认）',
      menuSummary: approvalMenuSummary,
      listFields: approvalListFields,
      searchFields: approvalSearchFields,
      formPageTitle: APPROVAL_FORM_PAGE,
      formFieldGroups: approvalFormFieldGroups,
      dataFlow: approvalDataFlow,
      businessFlow:
        '进入【学籍异动审批】→ Tab 顺序：待我审批→已提交→已处理历史 → 五字段 inline 搜索 → 待我审批批量 Review 或 View 详情后 [审批] Modal → 历史 Recall → ExportModal 导出 xlsx。',
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动审批。',
      buttons: buildApprovalButtons(),
    }),
    buildMaintenanceModuleXml(),
    buildQueryModuleXml(),
    buildSeparationTable({ extended: true }),
    buildDisplayConventionsSection(),
  ]

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
