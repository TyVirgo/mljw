/**
 * 基于 V1.6 内容 + 异动类别/维护/查询三模块，生成学籍管理 PRD V1.7
 * 用法: node scripts/generate-student-records-prd-v17.mjs
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
} from './prd/prd-xml.mjs'
import {
  profileListFields,
  profileSearchFields,
  profileDataFlow,
  profileBusinessFlow,
  transferListFields,
  movementAppDataFlow,
  transferBusinessFlow,
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
  categoryListFields,
  categorySearchFields,
  categoryDataFlow,
  categoryBusinessFlow,
  movementWideListFields,
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
  approvalMenuSummary,
  categoryMenuSummary,
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
} from './prd/prd-buttons.mjs'

const TEMPLATE_PATH =
  'c:/Users/admin/Desktop/马来教务/模板/厦大马来分校本科教务系统产品需求文档模板（带参考数据版）0610.docx'
const OUTPUT_DIR = 'c:/Users/admin/Desktop/马来教务/模板'
const OUTPUT_NAME = '厦大马来分校本科教务系统产品需求文档-学籍管理模块-V1.7.docx'

function buildDocumentInnerXml() {
  resetParaIds()
  const parts = [
    buildCoverSection({
      version: 'V1.7',
      date: '2026年6月15日',
      note:
        'V1.7 在 V1.6 基础上新增异动类别配置（含三实施行为开关）、学籍异动维护、学籍异动查询三个模块；维护与查询导出统一为 ExportModal+xlsx；业务描述纯中文，技术标识括号备注。',
    }),
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
        '七页签档案增删改查、导入导出、按学生类别分支校验',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动类别',
        '类别/原因配置；三实施行为开关；12 条预置种子',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动申请',
        '四页签：转专业/休学/复学/退学；表单弹窗与只读详情',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '异动审批',
        '已提交/待我审批/已处理历史三视图；批量审批与全页详情',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动维护',
        'Approved 宽表；实施/改编号/Edit/Export/Delete',
      ],
      [
        '学籍管理',
        'Student Status Management',
        '学籍异动',
        'Student Status Change',
        '学籍异动查询',
        '非 Draft 只读宽表；双行搜索收起；ExportModal xlsx',
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
      prototypeLink: '原型路径：门户 → 学籍管理 → 学生基本信息。',
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
      menuTitle: '2.2.1.3 学籍异动申请 — 转专业（Programme Transfer）（已确认）',
      menuSummary: transferMenuSummary,
      listFields: transferListFields,
      searchFields: movementSearchField,
      formPageTitle: TRANSFER_FORM_PAGE,
      formFieldGroups: transferFormFieldGroups,
      dataFlow: movementAppDataFlow,
      businessFlow: transferBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 异动申请 → 转专业页签。',
      buttons: buildMovementButtons('转专业'),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.3.1 休学（Deferment）（已确认）',
      menuSummary: defermentMenuSummary,
      listFields: defermentListFields,
      searchFields: movementSearchField,
      formPageTitle: DEFERMENT_FORM_PAGE,
      formFieldGroups: defermentFormFieldGroups,
      dataFlow: defermentDataFlow,
      businessFlow: defermentBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 休学页签。',
      buttons: buildMovementButtons('休学'),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.3.2 复学（Resumption）（已确认）',
      menuSummary: resumptionMenuSummary,
      listFields: resumptionListFields,
      searchFields: movementSearchField,
      formPageTitle: RESUMPTION_FORM_PAGE,
      formFieldGroups: resumptionFormFieldGroups,
      dataFlow: resumptionDataFlow,
      businessFlow: resumptionBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 复学页签。',
      buttons: buildMovementButtons('复学'),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.3.3 退学（Withdrawal）（已确认）',
      menuSummary: withdrawalMenuSummary,
      listFields: withdrawalListFields,
      searchFields: movementSearchField,
      formPageTitle: WITHDRAWAL_FORM_PAGE,
      formFieldGroups: withdrawalFormFieldGroups,
      dataFlow: withdrawalDataFlow,
      businessFlow: withdrawalBusinessFlow,
      prototypeLink: '原型路径：异动申请 → 退学页签。',
      buttons: buildMovementButtons('退学'),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.4 学籍异动审批（Status Change Approval）（已确认）',
      menuSummary: approvalMenuSummary,
      listFields: approvalListFields,
      searchFields: approvalSearchFields,
      formPageTitle: APPROVAL_FORM_PAGE,
      formFieldGroups: approvalFormFieldGroups,
      dataFlow: approvalDataFlow,
      businessFlow:
        '进入【异动审批】→ 切换已提交/待我审批/已处理历史视图 → 填写搜索条件查询或重置 → 待我审批视图勾选后批量审批，或行内查看进入全页详情填写决策 → 流转日志查看历史 → 已处理历史中已通过记录可撤回 → 导出当前筛选结果 → 审批通过后按类别 autoImplement 设置初始实施状态 → 写回后申请页签同步刷新。',
      prototypeLink: '原型路径：门户 → 学籍管理 → 异动审批。',
      buttons: buildApprovalButtons(),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.5 学籍异动维护（Status Change Maintenance）（已确认）',
      menuSummary: maintenanceMenuSummary,
      listFieldNote:
        '列表页宽表展示字段如下（图示1–3 合并列；横向滚动，Actions 列 sticky 固定）：',
      listFields: movementWideListFields,
      searchFields: movementMaintenanceSearchFields,
      formPageTitle: MAINTENANCE_EDIT_PAGE,
      formFieldGroups: maintenanceEditFieldGroups,
      dataFlow: maintenanceDataFlow,
      businessFlow: maintenanceBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动维护。',
      buttons: buildMaintenanceButtons(),
    }),
    buildModuleXml({
      menuTitle: '2.2.1.6 学籍异动查询（Status Change Inquiry）（已确认）',
      menuSummary: queryMenuSummary,
      listFieldNote:
        '列表页宽表列与维护页一致（图示1–3）；表头具备 sortable 装饰样式，首版无真实排序：',
      listFields: movementWideListFields,
      searchFieldNote:
        '搜索区采用双行布局，首行始终可见，次行（学号、学生姓名）默认展开且可通过「收起」隐藏：',
      searchFields: movementQuerySearchFields,
      formPageTitle: QUERY_FORM_PAGE,
      formFieldGroups: queryFormFieldGroups,
      dataFlow: queryDataFlow,
      businessFlow: queryBusinessFlow,
      prototypeLink: '原型路径：门户 → 学籍管理 → 学籍异动 → 学籍异动查询。',
      buttons: buildQueryButtons(),
    }),
    buildSeparationTable({ extended: true }),
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
