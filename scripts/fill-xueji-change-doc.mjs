/**
 * 复制「变更说明书 -模板.docx」格式，填充学籍管理 V2.0 vs V2.4 对比内容
 */
import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'

const TEMPLATE = 'd:/任务/马来/马来教务/学籍管理/变更说明书 -模板.docx'
const OUT = 'd:/任务/马来/马来教务/模板/学籍管理模块-需求文档V2.0与V2.4变更对比说明.docx'

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

const TBL_OPEN =
  '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:type="auto" w:w="0"/><w:tblLook w:firstColumn="1" w:firstRow="1" w:lastColumn="0" w:lastRow="0" w:noHBand="0" w:noVBand="1" w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="1813"/><w:gridCol w:w="1813"/><w:gridCol w:w="1813"/><w:gridCol w:w="1813"/><w:gridCol w:w="1813"/></w:tblGrid>'

function tableCell(text, header = false) {
  const bold = header ? '<w:b/>' : '<w:b w:val="0"/>'
  return `<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="1813"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}"/>${bold}<w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`
}

function tableRow(cells, header = false) {
  return `<w:tr>${cells.map((c) => tableCell(c, header)).join('')}</w:tr>`
}

function table(rows) {
  const header = tableRow(['序号', '变更类型', '变更位置', '修改前（V2.0）', '修改后（V2.4）'], true)
  const data = rows.map((r, i) => tableRow([String(i + 1), ...r]))
  return `${TBL_OPEN}${header}${data.join('')}</w:tbl>`
}

/** 三、变更明细对照表：按菜单模块核心差异 */
const TABLE_ROWS = [
  ['新增', '2.2.1.7 异动规则设置', 'V2.0 无此菜单章节', '新增四条内置规则配置页（转专业周次/月数阈值等），行内修改规则值与启用开关'],
  ['修改', '2.2.1.1 学生基本信息·搜索', '学号/姓名/学生类别等下拉筛选', '新增 5 个独立文本框（学号/姓名/中文名/身份证号/手机号），多值 AND；折叠区扩展国籍、学生准证有效期等'],
  ['修改', '2.2.1.1 学生基本信息·列表', '列表无「学籍类型」列', '列表新增「学籍类型」列'],
  ['修改', '2.2.1.1 学生基本信息·详情', 'Others 页签；无导出学籍卡', '「其他信息」页签；详情底部新增「导出学籍卡」按钮'],
  ['修改', '2.2.1.2 异动类别', 'categoryCode、DEF001、reasons[]、Set Reason 等技术表述', '类别编码、休学异动类别、原因列表、设置原因等中文表述，业务规则不变'],
  ['修改', '2.2.1.3 知情同意书·字段', 'Student Type、Remark；(类别+类型)唯一', '学生类别、备注、适用学生范围（第一年/第二年及以上）；异动类别+学生类别唯一'],
  ['修改', '2.2.1.3 知情同意书·联动', '休学/退学 resolveConsentTemplate 下载', '转专业/休学/复学/退学四标签页及休学/退学家长区按类别+学生类别匹配下载'],
  ['修改', '2.2.1.4 学籍异动申请（老师）', 'Tab 壳层四 View；默认打开休学；列表列名「生效学期」', '四个标签页结构；默认打开转专业；列表列名「生效日期」'],
  ['修改', '2.2.1.4.1 转专业·详情', '详情只读；流转日志独立弹窗', '详情抽屉顶部审批流程图+下方申请详情；支持预览PDF/导出PDF；流转历史合并进详情'],
  ['修改', '2.2.1.4.2 休学·家长区', '家长手动填写；声明区可 Download Consent Letter', '选学生后从家庭成员列表自动带入家长/监护人（≥2人分块展示）；声明区移除下载按钮'],
  ['修改', '2.2.1.4.2 休学·原因来源', 'DEF001 类别 reasons', '「休学异动类别」配置的原因列表'],
  ['修改', '2.2.1.4.4 退学·原因来源', 'WDR001 类别 reasons', '「退学异动类别配置的原因列表」'],
  ['修改', '2.2.1.5 学籍异动申请（学生）', '共用 Tab 壳层；StudentSelectModal', '共用四个标签页结构；选择学生弹窗（表述中文化），隐藏学号/姓名列规则不变'],
  ['修改', '2.2.1.6 学籍异动审批', '是否实施 Y/N；DetailModal+[审批]→MovementApprovalModal', '是否实施 是/否；申请详情弹窗+「审批」→审批意见弹窗；详情抽屉流程图在上'],
  ['修改', '2.2.1.8 学籍异动维护·列表', '无文号列；行操作详情+流转日志', '学号前新增文号列（未填 NA）；行操作修改文号+详情+导出PDF'],
  ['修改', '2.2.1.8 学籍异动维护·搜索', '单行五字段（学年学期/专业代码/状态/学号/姓名）', '两行共九项搜索条件'],
  ['修改', '2.2.1.9 学籍异动查询', 'ExportModal 导出 xlsx；详情脱敏', '导出字段选择弹窗导出 Excel；详情抽屉含审批流程图；封面补充查询页预览PDF'],
  ['修改', '全局·日期列名', '多处列表/字段表列名「生效学期」', '统一改为「生效日期」，格式仍为 年/月 或 YYYY/MM'],
  ['修改', '全局·状态展示', 'Y/N、pill Badge、Expired、Draft 等', '是/否、胶囊形状态标签、已过期、草稿等中文业务用语'],
  ['修改', '全局·页面用语', 'Tab/View/Modal/Section/Badge 等英文组件名', '标签页/申请页面结构/弹窗/分区/状态标签等业务用语'],
]

const MODIFY_COUNT = TABLE_ROWS.filter((r) => r[0] === '修改').length
const ADD_COUNT = TABLE_ROWS.filter((r) => r[0] === '新增').length
const TOTAL = TABLE_ROWS.length

function buildBodyContent() {
  return [
    titlePara('厦大马来分校本科教务系统产品需求文档', '变更说明书'),
    metaPara([
      '修改前文档：厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.0.docx',
      '修改后文档：厦大马来分校本科教务系统产品需求文档-学籍管理模块-V2.4.docx',
      '文档版本：V2.4',
      '编制日期：2026年07月10日',
      '说明：本文档描述 V2.4 相对 V2.0 的菜单模块差异',
    ]),

    h1('一、文档对比说明'),
    bodyPara(
      '本变更说明书对比上述两份 Word 需求文档，以修改前文档（V2.0 版）为基准，说明修改后文档（V2.4 版）在各菜单模块功能描述、字段定义、页面排版及业务流程方面的变更内容。',
    ),
    bullet('修改前（V2.0）：含学生基本信息、异动类别、知情同意书、学籍异动申请/审批/维护/查询等菜单；菜单标题含英文副标题及「（已确认）」标记；无「异动规则设置」菜单'),
    bullet('修改后（V2.4）：整体模块结构延续，新增「异动规则设置」；菜单标题仅保留中文；技术组件名改为业务用语（标签页、弹窗等）'),
    bullet('整体差异主线：① 新增异动规则配置菜单；② 搜索与详情能力增强；③ 详情抽屉统一为「审批流程图+申请内容」布局；④ 全局用语通俗化与中文化'),

    h1('二、变更类型统计'),
    bullet(`修改：${MODIFY_COUNT} 项`),
    bullet(`新增：${ADD_COUNT} 项`),
    bodyPara(`合计变更项：${TOTAL} 项`),

    h1('三、变更明细对照表'),
    table(TABLE_ROWS),

    h1('四、重点变更说明'),
    h2('4.1 新增菜单（异动规则设置）'),
    bodyPara('V2.0 需求文档完全不存在 2.2.1.7 章节；V2.4 在侧边栏「知情同意书」之后新增纯列表配置页，含四条内置转专业相关规则，本期仅作演示存储。'),

    h2('4.2 学生基本信息增强'),
    bullet('搜索区新增 5 个独立 AND 文本框及扩展折叠筛选字段'),
    bullet('列表新增「学籍类型」列'),
    bullet('详情底部新增「导出学籍卡」入口'),

    h2('4.3 知情同意书与申请类菜单'),
    bullet('知情同意书新增「适用学生范围」，字段全面中文化，联动扩展至四类申请标签页'),
    bullet('老师端申请默认标签页由休学改为转专业；转专业详情抽屉重构并支持 PDF'),
    bullet('休学选学生后自动带入家长/监护人，声明区移除单独下载知情同意书按钮'),

    h2('4.4 审批、维护与查询'),
    bullet('审批/维护/查询详情抽屉统一为顶部审批流程图+下方申请内容'),
    bullet('维护页新增文号列、修改文号与导出 PDF 行操作；搜索区由单行扩展为两行九项'),
    bullet('查询页补充预览 PDF 能力描述'),

    h2('4.5 全局用语与展示规则'),
    bullet('列表日期列名「生效学期」→「生效日期」'),
    bullet('是否实施 Y/N → 是/否；状态 Badge → 状态标签'),
    bullet('Tab/Modal/View/Section 等 → 标签页/弹窗/申请页面结构/分区'),

    h1('五、结论与实施建议'),
    bullet('两份文档对比版本为 V2.0（修改前）与 V2.4（修改后）；V2.4 为当前需求基线'),
    bullet('变更以菜单模块为单位汇总于第三节对照表；第四节按主题归纳重点差异'),
    bullet('实施与验收应以修改后文档（V2.4 版）为准，本变更说明书作为 V2.0 修订至 V2.4 的差异对照清单'),

    h1('六、附录'),
    bodyPara('各菜单模块按【字段】【排版】【内容】三维度展开的逐项说明，见第三节「变更明细对照表」及 V2.0/V2.4 需求文档对应章节正文。'),
  ].join('')
}

async function main() {
  const zip = await JSZip.loadAsync(fs.readFileSync(TEMPLATE))
  let docXml = await zip.file('word/document.xml').async('string')

  const bodyOpen = docXml.indexOf('<w:body>')
  const bodyClose = docXml.indexOf('</w:body>')
  if (bodyOpen < 0 || bodyClose < 0) throw new Error('template body not found')

  const bodyInnerStart = bodyOpen + '<w:body>'.length
  const sectPrStart = docXml.lastIndexOf('<w:sectPr', bodyClose)
  const sectPr = docXml.slice(sectPrStart, bodyClose)

  docXml =
    docXml.slice(0, bodyInnerStart) +
    buildBodyContent() +
    sectPr +
    docXml.slice(bodyClose)

  zip.file('word/document.xml', docXml)

  const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const candidates = [OUT, OUT.replace('.docx', '-新版.docx'), OUT.replace('.docx', '-v2.docx')]
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
  if (!written) throw new Error('所有输出路径均被占用，请关闭 Word 后重试')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
