/**
 * 生成「学籍管理模块 · 反馈调整说明」文档模板
 * 基于 Feedback-学籍管理-20260708-合并.docx 反馈内容分类填充
 */
import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'

const TEMPLATE = 'd:/任务/马来/马来教务/学籍管理/变更说明书 -模板.docx'
const OUT = 'd:/任务/马来/马来教务/学籍管理/学籍管理模块-反馈调整说明.docx'

const FONT = '微软雅黑'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function titlePara(line1, line2) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b/><w:color w:val="1A2332"/><w:sz w:val="36"/></w:rPr><w:t>${esc(line1)}</w:t><w:br/><w:t>${esc(line2)}</w:t></w:r></w:p>`
}

function metaPara(lines) {
  const inner = lines.map((l) => `<w:t>${esc(l)}</w:t>`).join('<w:br/>')
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b w:val="0"/><w:color w:val="6B7C93"/><w:sz w:val="20"/></w:rPr>${inner}</w:r></w:p>`
}

function h1(text) {
  return `<w:p/><w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b/><w:color w:val="4A7AB8"/><w:sz w:val="28"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`
}

function h2(text) {
  return `<w:p><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`
}

function bodyPara(text) {
  return `<w:p><w:pPr><w:spacing w:line="324" w:lineRule="auto" w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b w:val="0"/><w:sz w:val="22"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/><w:b w:val="0"/><w:sz w:val="22"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`
}

function screenshotPlaceholder(label) {
  return [
    bodyPara(`【原型调整后截图 · ${label}】`),
    bodyPara('（请在此处插入调整后原型截图）'),
    bodyPara(''),
  ].join('')
}

const TBL_OPEN =
  '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:type="auto" w:w="0"/><w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="0" w:noVBand="1" w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="900"/><w:gridCol w:w="1200"/><w:gridCol w:w="1400"/><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/></w:tblGrid>'

function tableCell(text, header = false) {
  const bold = header ? '<w:b/>' : '<w:b w:val="0"/>'
  return `<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="1800"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/>${bold}<w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`
}

function tableRow(cells, header = false) {
  return `<w:tr>${cells.map((c) => tableCell(c, header)).join('')}</w:tr>`
}

function table(headers, rows) {
  const header = tableRow(headers, true)
  const data = rows.map((r) => tableRow(r))
  return `${TBL_OPEN}${header}${data.join('')}</w:tbl>`
}

/** 20260709 评审会明确需调整项 → 本期已调整 */
const DONE_ROWS = [
  ['1', '20260709评审', '学生基本信息', '增加「学籍类型」列表字段', '原型/需求已补充学籍类型列；截图待补充'],
  ['2', '20260709评审', '学籍异动申请·详情', '详情改回流程图效果，打印与详情展示一致', '详情抽屉顶部改为审批流程图+下方申请详情；截图待补充'],
  ['3', '20260709评审', '异动类别', '「适用人员类型」改为「是否允许学生申请」开关（是/否）', '表单与列表统一为开关表述；截图待补充'],
  ['4', '20260709评审', '知情同意书', '备注前增加「适用学生范围」下拉（第一年/第二年及以上，非必填）', '弹窗与主列表已同步展示；截图待补充'],
  ['5', '20260709评审', '学生基本信息·搜索', '混合模糊搜索拆为学号/姓名/中文名/证件号/手机号独立文本框', '搜索区已拆分为 5 个独立 AND 文本框；截图待补充'],
  ['6', '20260709评审', '学生基本信息·详情', '增加「导出学籍卡」按钮', '详情底部仅保留入口按钮，本期不实现导出逻辑；截图待补充'],
  ['7', '20260709评审', '异动规则设置', '新增菜单：仅编辑规则值与应用开关，不可新增/搜索', '侧边栏已增加四条内置规则配置页（演示存储）；截图待补充'],
  ['8', '20260709评审', '学籍异动审批', 'AC 撤销按钮从申请管理端移至「已处理历史」Tab', '仅进行中/审批中状态显示撤销；申请端撤销入口已移除；截图待补充'],
  ['9', '20260709评审', '学籍异动维护', '行操作增加「添加文号」；列表增加文号列；未填显示 NA', '文号用于 PDF 文件名前缀拼接；截图待补充'],
  ['10', '20260709评审', '学籍异动审批', '去掉「最近审核时间」列表字段', '审核时间改在详情页查看；截图待补充'],
]

/** 本期暂无法处理 */
const BLOCKED_ROWS = [
  ['1', '反馈合并稿', '知情同意书', '模板自动匹配学生/申请信息、线上签名或带信息 PDF', '暂无正式模板与签名组件；需业务部门提供模板后二期实现'],
  ['2', '反馈合并稿', '状态日志/毕业', '毕业 Completion Batch/Date、Graduation Batch/Date 等终态字段', '依赖毕业模块，当前仅预留字段名无数据源'],
  ['3', '反馈合并稿', '状态日志', 'IEP 状态流转记录', '业务规则待定，暂无 IEP 学籍数据源'],
  ['4', '反馈合并稿', '学生基本信息', '中国学生毕业生学籍卡导出（中文异动表述）', '导出格式与数据来源待定，本期仅保留入口'],
  ['5', '反馈合并稿', '学生基本信息', 'Action 权限（Details/Preview/Edit/Delete）大改版', '需统一权限体系与角色模型，超出本期原型范围'],
  ['6', '反馈合并稿', '家庭信息', '家庭背景字段级隐私权限（如收入仅 Admission/AA 可见）', '需字段级权限引擎，当前仅支持菜单/板块级'],
  ['7', '8/7补充', '异动规则', '按国籍+学期自动限制转专业申请时间窗口并拦截提交', '规则页已配置但尚未接入申请/审批自动校验'],
  ['8', '8/7补充', '异动类别', '新增 Suspension（教务发起强制休学）异动类型', '需教务确认与休学流程差异，待业务定稿'],
]

/** 下期再调整 */
const DEFERRED_ROWS = [
  ['1', '反馈合并稿', '学籍信息', 'Programme Level→学院→专业→Programme Code 顺序及联动', '需与基础数据专业结构对齐，下期统一调整表单分区'],
  ['2', '反馈合并稿', '学籍信息', 'Intake→Academic Session→Semester 顺序及在读学期语义', '涉及存量字段重排与计算规则，下期与学籍档案一并改造'],
  ['3', '反馈合并稿', '学籍信息', 'Registration Time / Expected Completion Batch / Expected Graduation Batch', '需专业学制+国籍规则引擎，下期实现自动计算'],
  ['4', '反馈合并稿', '学籍信息', 'Programme Structure 字段（匹配专业版本结构）', '需培养方案/专业结构数据对接'],
  ['5', '反馈合并稿', '教育背景', 'Local 学生 SPM 马来语成绩（MPU 课程匹配）', '下期与学生端可维护字段一并规划'],
  ['6', '反馈合并稿', '状态日志', '休学起止时间段、转专业 Approved in/Effective from、退学原因标识', '下期扩展状态日志事件类型与展示'],
  ['7', '2/7反馈', '学生基本信息', 'Student Pass Expiry Date（IO 维护，搜索/板块可见）', '下期增加字段及 IO 维护入口'],
  ['8', '反馈合并稿', '学籍异动申请', '申请表单全面改版（SECTION I–VI 对齐 E-service）', '下期按 E-service 分区、声明、附件清单整体重构'],
  ['9', '反馈合并稿', '学籍异动申请', '按国籍/Programme Level 显示提示语与差异化附件（如机票）', '下期与完整 PDF 导出一并实现'],
  ['10', '反馈合并稿', '学籍异动申请', 'Print/PDF 导出（文件名规则、附件打包、NA 文号逻辑）', '下期对接正式导出与存档流程'],
  ['11', '反馈合并稿', '学籍异动申请', '休学允许补回过往学期、学生邮件申请后 AC 撤销流程', '下期与审批通知联动'],
  ['12', '反馈合并稿', '学籍异动维护/查询', '列表增加国籍列；Preview 可查看并下载 PDF 表格', '下期与 PDF 导出能力一并补齐'],
  ['13', '8/7补充', '退学申请', '是否保留本学期成绩字段', '下期随退学表单改版增加'],
  ['14', '反馈合并稿', '学生端', '学生可修改字段整合页及 Admission 审核流', '需学生端门户与审核流程，下期规划'],
]

/** 待确认疑问（保留模板行，供会议补充答复） */
const QA_ROWS = [
  ['1', '学生基本信息', '学生端个人信息页布局？可修改字段是否单独一页？后台与学生端排版是否不同？', '（待产品/Admission 答复）'],
  ['2', '家庭信息', '多联系人是否增加多个板块？板块级还是字段级权限？', '（待权限方案确认）'],
  ['3', '异动类别', '「已获得成绩课程不预置到新专业」默认是否应勾选？对选课影响？', '（待选课模块联评）'],
  ['4', '知情同意书', '转专业按 intake 区分第一/第二年版本；国际学生签证版本差异', '（待模板定稿）'],
  ['5', '学籍异动申请', '生效日期由 AA 审批人设定规则（开学前2周/学期结束等）', '（待审批规则细化）'],
  ['6', '学籍异动申请', '国际学生申请是否自动抓取 Student Pass Expiry Date', '（待 IO 数据接口确认）'],
]

function buildBodyContent() {
  const parts = [
    titlePara('厦大马来分校本科教务系统', '学籍管理模块 · 反馈调整说明'),
    metaPara([
      '反馈来源：Feedback-学籍管理-20260708-合并.docx',
      '原型地址：http://192.168.39.12/high/Academic%20System/20260625/',
      '文档版本：V1.0（模板）',
      '编制日期：2026年07月13日',
      '说明：本文档记录根据反馈对原型的调整结论，含已调整、暂无法处理、下期再调整三类',
    ]),

    h1('一、文档说明'),
    bodyPara(
      '本文档基于《Feedback-学籍管理-20260708-合并》及 20260709 评审会结论，对学籍管理模块原型反馈进行归类说明。每项均预留「原型调整后截图」位置，请在完成原型修改后补充截图。',
    ),
    bullet('本期已调整：20260709 评审会明确的 10 项，已在当前原型/需求中体现或已做入口级调整'),
    bullet('本期暂无法处理：依赖外部模板、其他模块、权限体系或业务未定稿，本期不纳入开发'),
    bullet('下期再调整：已识别需求但超出本期原型范围，纳入下一期迭代'),

    h1('二、调整项统计'),
    bullet(`本期已调整：${DONE_ROWS.length} 项`),
    bullet(`本期暂无法处理：${BLOCKED_ROWS.length} 项`),
    bullet(`下期再调整：${DEFERRED_ROWS.length} 项`),
    bullet(`待确认疑问：${QA_ROWS.length} 项`),
    bodyPara(`合计反馈归类项：${DONE_ROWS.length + BLOCKED_ROWS.length + DEFERRED_ROWS.length} 项（不含待确认疑问）`),

    h1('三、本期已调整项'),
    bodyPara('以下项已在当前原型或需求文档中完成调整。请在每项下方补充对应截图。'),
    table(
      ['序号', '反馈来源', '涉及菜单', '反馈摘要', '调整说明'],
      DONE_ROWS.map((r) => r),
    ),
    h2('3.1 已调整项 · 原型截图'),
    ...DONE_ROWS.map((r) => screenshotPlaceholder(`${r[0]} ${r[2]} — ${r[3].slice(0, 30)}`)),

    h1('四、本期暂无法处理项'),
    bodyPara('以下项本期不纳入原型调整，表中「暂不处理原因」需在评审会上与业务方确认。'),
    table(
      ['序号', '反馈来源', '涉及菜单', '反馈摘要', '暂不处理原因'],
      BLOCKED_ROWS.map((r) => r),
    ),

    h1('五、下期再调整项'),
    bodyPara('以下项已登记需求，计划在下一期原型/需求迭代中处理。'),
    table(
      ['序号', '反馈来源', '涉及菜单', '反馈摘要', '下期计划说明'],
      DEFERRED_ROWS.map((r) => r),
    ),
    h2('5.1 下期项 · 原型规划截图（预留）'),
    bodyPara('（下期原型完成后，请在此处按菜单补充规划稿或目标效果图）'),
    screenshotPlaceholder('下期重点菜单规划稿'),

    h1('六、待确认疑问'),
    bodyPara('以下疑问来自反馈文档，尚未形成调整结论，请在产品评审后补充「答复」列。'),
    table(['序号', '涉及菜单', '疑问内容', '答复（待补充）'], QA_ROWS.map((r) => r)),

    h1('七、附录 · 原型截图清单'),
    bodyPara('建议在完成全部截图后，按下列清单核对：'),
    bullet('三、本期已调整项：每项 1 张截图（共 10 处）'),
    bullet('五、下期再调整项：可附 1 张规划说明图（可选）'),
    bullet('截图命名建议：序号-菜单名-调整点.png（例：01-学生基本信息-搜索框拆分.png）'),
  ]

  return parts.join('')
}

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(TEMPLATE))
  let docXml = await zip.file('word/document.xml').async('string')

  const bodyOpen = docXml.indexOf('<w:body>')
  const bodyClose = docXml.indexOf('</w:body>')
  const bodyInnerStart = bodyOpen + '<w:body>'.length
  const sectPrStart = docXml.lastIndexOf('<w:sectPr', bodyClose)
  const sectPr = docXml.slice(sectPrStart, bodyClose)

  docXml =
    docXml.slice(0, bodyInnerStart) + buildBodyContent() + sectPr + docXml.slice(bodyClose)

  zip.file('word/document.xml', docXml)

  const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })

  const candidates = [OUT, OUT.replace('.docx', '-模板.docx')]
  let written = false
  for (const target of candidates) {
    try {
      fs.writeFileSync(target, outBuf)
      console.log('已生成:', target)
      written = true
      break
    } catch (e) {
      if (e.code !== 'EBUSY') throw e
    }
  }
  if (!written) throw new Error('输出路径被占用，请关闭 Word 后重试')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
