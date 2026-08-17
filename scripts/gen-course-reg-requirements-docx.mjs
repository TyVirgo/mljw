/**
 * 生成选课模块全栈开发需求文档（Word）到桌面
 */
import fs from 'fs'
import path from 'path'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  LevelFormat,
} from 'docx'

const desktop = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Desktop',
)
const outPath = path.join(desktop, '选课管理模块-全栈开发需求文档.docx')

const thin = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
const borders = { top: thin, bottom: thin, left: thin, right: thin }

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    ...opts,
    children: [
      new TextRun({
        text,
        font: '微软雅黑',
        size: opts.size || 21,
        bold: opts.bold,
        color: opts.color,
      }),
    ],
  })
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: '微软雅黑', size: 32, bold: true, color: '1F4E79' })],
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: '微软雅黑', size: 26, bold: true, color: '2E75B6' })],
  })
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: '微软雅黑', size: 22, bold: true, color: '404040' })],
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, font: '微软雅黑', size: 21 })],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { fill: 'D6E3F0' } : undefined,
    children: [
      new Paragraph({
        spacing: { after: 40, before: 40 },
        children: [
          new TextRun({
            text: text ?? '',
            font: '微软雅黑',
            size: 18,
            bold: !!opts.header,
          }),
        ],
      }),
    ],
  })
}

function table(headers, rows, colWidths) {
  const widths = colWidths || headers.map(() => Math.floor(9000 / headers.length))
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(String(c ?? ''), { width: widths[i] })),
          }),
      ),
    ],
  })
}

function apiBlock(method, pathUrl, desc, req, res) {
  return [
    h3(`${method} ${pathUrl}`),
    p(`说明：${desc}`),
    p('请求参数 / Body：', { bold: true }),
    ...req.map((x) => bullet(x)),
    p('响应字段：', { bold: true }),
    ...res.map((x) => bullet(x)),
  ]
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, before: 600 },
    children: [
      new TextRun({
        text: '选课管理模块',
        font: '微软雅黑',
        size: 48,
        bold: true,
        color: '1F4E79',
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: '全栈开发需求文档',
        font: '微软雅黑',
        size: 36,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: '基于现行前端原型（马来教务 · 选课管理）整理｜文档日期：2026-08-03',
        font: '微软雅黑',
        size: 20,
        color: '666666',
      }),
    ],
  }),
  p(
    '本文档描述选课管理模块的页面元素、交互逻辑、前后端接口契约、数据库设计与业务规则，供前后端全栈开发落地。不涉及具体前端脚手架或技术选型约束。当前仓库为前端原型（内存 Mock），正式实现需按本文档对接真实后端与数据库。',
  ),

  // ========== 1 ==========
  h1('1. 文档说明与范围'),
  h2('1.1 模块目标'),
  p(
    '支撑教务侧完成选课批次配置、规则设置、过程监控、加退课审批、补注册、缴费名单、结果与日志管理；支撑学生侧完成在线选课、加退课/重修申请与选课历史查询。',
  ),
  h2('1.2 角色'),
  table(
    ['角色', '权限范围'],
    [
      ['教务管理员（Admin）', '批次/规则/监控/审批/补注册/缴费/结果/日志全量管理'],
      ['学生（Student）', '在线选课、选课历史、加退课/重修申请'],
      ['外部系统（只读对接）', '培养方案/课程库、排课、学籍、财务账单状态'],
    ],
    [2200, 6800],
  ),
  h2('1.3 本期范围（已产品化菜单）'),
  bullet('学生：在线选课、选课历史、加退课/重修申请'),
  bullet('批次与规则：选课批次、选课规则设置'),
  bullet('选课过程：学生选课监控、加退课/重修审批、缴费名单管理、补注册名单'),
  bullet('结果与日志：选课结果、选课日志'),
  bullet('模块说明：流程说明（可上线为帮助页，正式环境可隐藏）'),
  h2('1.4 明确不做 / 已弱化'),
  bullet('在线支付（缴费名单仅同步财务结果，不联动“完成选课”）'),
  bullet('Replace 类型申请'),
  bullet('管理端候补名单、独立学业预警页、白名单、选课报表（原型遗留，本期不纳入正式菜单）'),
  bullet('自动候补递补占位'),

  // ========== 2 ==========
  h1('2. 信息架构与菜单'),
  p('选课为独立应用入口，默认落地学生「在线选课」。菜单结构如下：'),
  table(
    ['分组', '页面', 'pageId', '受众'],
    [
      ['学生选课', '在线选课', 'crs-register', '学生'],
      ['学生选课', '选课历史', 'crs-result', '学生'],
      ['学生选课', '加退课/重修申请', 'crs-adddrop', '学生'],
      ['批次与规则', '选课批次', 'cr-batch', '管理端'],
      ['批次与规则', '选课规则设置', 'cr-rules', '管理端'],
      ['选课过程', '学生选课监控', 'cr-monitor', '管理端'],
      ['选课过程', '加退课/重修审批', 'cr-approval', '管理端'],
      ['选课过程', '缴费名单管理', 'cr-fee-roster', '管理端'],
      ['选课过程', '补注册名单', 'cr-supplement', '管理端'],
      ['结果与日志', '选课结果', 'cr-result', '管理端'],
      ['结果与日志', '选课日志', 'cr-log', '管理端'],
      ['模块说明', '流程说明', 'cr-flow-guide', '共用'],
    ],
    [1800, 2400, 2400, 2400],
  ),
  p('说明：原「可选课程」已并入批次「管理课程」，访问 cr-courses 应重定向至 cr-batch。'),

  // ========== 3 ==========
  h1('3. 学期主业务流程'),
  p('整体阶段（A–H）建议顺序：'),
  bullet('A. 配置批次与校级/局部规则，发布批次'),
  bullet('B. 为本批导入/配置可选课程、容量、专业范围、是否可选与可见轮次'),
  bullet('C. 第一轮（预选志愿）：学生提交志愿 → 教务确认志愿名单/随机排序定稿'),
  bullet('D. 第二轮（正选）、第三轮（补选）：先到先得进入选课队列；第三轮仅开放仍有空位课程'),
  bullet('E. 加退课窗口：学生提交加/退/重修（或联合 AddDrop）；管理端审批；可自助退课直通'),
  bullet('F. 补注册名单：授予名单内学生额外加退/重修权限与可选绕过规则'),
  bullet('G. 缴费名单：同步未缴/已缴，导入导出；不对接在线支付'),
  bullet('H. 选课结果查询与操作日志审计'),
  h3('轮次配置闸门'),
  bullet('R1 预选：始终可配置时间与参与范围'),
  bullet('R2 正选：须本批志愿已定稿（volunteerFinalConfirmedAt 非空）'),
  bullet('R3 补选：须第二轮结束日已过'),
  bullet('加退课窗口：独立于三轮，始终可配置'),
  bullet('未发布（draft）批次不可进入正选/学生不可正式选课'),

  // ========== 4 ==========
  h1('4. 页面需求（元素 · 交互 · 逻辑）'),

  h2('4.1 选课批次（cr-batch）'),
  h3('页面元素'),
  bullet('筛选区：学年学期、批次类型（ME/GE）、状态（草稿/进行中/已结束）、关键字（批次名称）'),
  bullet('列表列：批次名称、学年学期、类型、状态徽章、学分区间、课程数、轮次摘要、操作'),
  bullet('操作按钮：新建批次、发布、撤销发布、编辑、管理轮次、管理课程、学生名单'),
  bullet('分页：建议默认每页 20 条'),
  h3('抽屉/弹窗'),
  bullet('新建/编辑批次抽屉：基本信息（名称、学年学期、类型 ME|GE）、是否可选、学分上下限、局部规则、加退课窗口、预选优先级（preferSenior、minSemestersAbove）'),
  bullet('管理轮次抽屉：三轮起止时间 + 参与范围入口；闸门置灰不可配的轮次'),
  bullet('参与范围规则弹窗：学院多选、专业批次（intake/programme）多选、分组名、所属轮次；每轮至多一条规则；学院与专业批次不强制联动'),
  bullet('学生名单抽屉：特殊学生名单 | 可选学生名单（范围命中+复学等来源）'),
  bullet('特殊学生：新增/挑选/编辑/Excel 导入（按学号匹配学生主数据）；字段含是否强制可选、备注'),
  bullet('管理课程抽屉：本批课程表；导入培养方案课程；设置是否可选与 visibleFromRound；容量百分比（相对 sourceCapacity）；专业范围+学生类别+校选类别；查看教学分组'),
  h3('交互逻辑'),
  bullet('发布：draft→active，校验至少已配置 R1 时间与必要课程'),
  bullet('撤销：active→draft（需约定是否允许已有选课记录时撤销）'),
  bullet('状态 closed：时间全部结束后只读或限制编辑'),

  h2('4.2 选课规则设置（cr-rules）'),
  h3('页面元素'),
  bullet('规则列表：规则编号、名称、说明、启用开关、规则值（flag/count）'),
  bullet('规则项：'),
  table(
    ['规则ID', '含义', '类型', '默认'],
    [
      ['CR201', '关联先修课程', 'flag', '启用'],
      ['CR202', '不及格可重修选课', 'flag', '启用'],
      ['CR203', '可退自选课每轮上限', 'count', '10'],
      ['CR204', '允许超过最高学分', 'flag', '关闭'],
      ['CR107', '延迟缴费天数', 'count', '2'],
    ],
    [1400, 2800, 1600, 3200],
  ),
  p('校级规则为全局默认；批次 localRules 可覆盖部分项。学分常量：长学期 12–20；复学上限 21；短学期最低 4。'),

  h2('4.3 学生选课监控（cr-monitor）'),
  h3('页面元素'),
  bullet('筛选：批次、学院/专业、状态标签（正常/学分偏低/学分偏高/GE类别不足/缺先修/未注册）'),
  bullet('列表：学号、姓名、专业、已选学分、学分区间、问题标记、操作「详情」'),
  bullet('详情抽屉：学分进度环、GE 需求统计、周课表、问题列表、历史；按钮「加入补注册」'),
  h3('逻辑'),
  bullet('状态由已确认选课结果 + 规则学分上下限 + GE/先修校验聚合计算'),
  bullet('加入补注册写入补注册名单并带默认权限'),

  h2('4.4 加退课/重修审批（cr-approval）'),
  h3('页面元素'),
  bullet('Tab：待审批 / 已提交 / 历史'),
  bullet('列表：申请号、学号姓名、专业 intake、类型（Add|Drop|Retake|AddDrop）、状态、提交时间、账单状态、操作'),
  bullet('详情抽屉：申请明细、校验结果（学分重算、课表冲突）、审批时间线'),
  bullet('审批弹窗：批准/拒绝、意见、是否生成账单'),
  h3('逻辑'),
  bullet('学生可提交条件：处于批次 addDropWindow 内，或在补注册名单中'),
  bullet('Drop 通道：教学周 ≤ dropDeadlineWeek → self；超期 → special（需理由+附件）'),
  bullet('批次开关 selfServiceDropNoApproval：常规自助 Drop 可直接 Approved 并写回选课结果'),
  bullet('联合申请建议顺序：先 Drop 后 Add；重修优先级 F > M'),
  bullet('通过后写回学生已选课程；可选生成账单并进入缴费名单'),
  bullet('取消：仅审批未开始可取消；已自助通过不可取消'),
  bullet('申请状态：Pending | In Review | Approved | Rejected | Cancelled'),
  bullet('账单状态：pending | paid | cancelled | none'),

  h2('4.5 补注册名单（cr-supplement）'),
  h3('页面元素'),
  bullet('列表：学号、姓名、专业、权限开关（可加/可退/可重修）、绕过最高学分、绕过先修、备注、操作'),
  bullet('录入/编辑抽屉：权限与绕过项配置'),
  h3('逻辑'),
  bullet('名单内学生在窗口外亦可发起加退课；学籍阻断中休学+补注册有例外放行约定'),

  h2('4.6 缴费名单管理（cr-fee-roster）'),
  h3('页面元素'),
  bullet('Tab：未缴费 / 已缴费'),
  bullet('列表：学号、姓名、已选学分、计费学分 billableCredits=max(0, enrolledCredits-creditMin)、金额、课程来源、欠费标志、操作'),
  bullet('操作：同步财务、未缴费新增/导入、已缴费导入、导出、查看已选课程明细'),
  h3('逻辑'),
  bullet('不对接在线支付；缴费完成不自动改变选课成功态，仅更新名单 isPaid/paidAt'),
  bullet('课程来源 courseSource：preselect|main|supplement|admin'),

  h2('4.7 选课结果（cr-result）'),
  h3('页面元素'),
  bullet('Tab 顺序：第一轮志愿 | 按轮次 | 按学生'),
  bullet('第一轮志愿：按课程分组查看志愿名单；增删学生；随机排序；保存；定稿后第二轮开始只读'),
  bullet('按轮次：只读结果表（跨轮累计已选展示）'),
  bullet('按学生：学生维度结果；代选（AdminAddCourseForStudent：一人+未满员课×分组，批次只读）；删除；导出'),
  h3('逻辑'),
  bullet('代选写入结果 courseSource=admin，记操作人'),
  bullet('第一轮志愿结果对学生侧为 pendingAssign，不计入成功学分直至教务定稿确认'),

  h2('4.8 选课日志（cr-log）'),
  h3('页面元素'),
  bullet('筛选：批次、轮次（preselect|main|supplement）'),
  bullet('列表：时间、学号、课程、分组、操作类型、结果、队列状态、操作人/来源'),
  h3('字段枚举'),
  bullet('operation：register | drop | adminAdd | joinQueue | cancelQueue'),
  bullet('result：success | failure | queuing | cancelQueue'),
  bullet('queueStatus：queuing | cancelled'),

  h2('4.9 学生在线选课（crs-register）'),
  h3('页面元素'),
  bullet('顶栏：当前学年学期批次选择、轮次切换（预选/正选/补选）、ME/GE 类型 Tab'),
  bullet('课程列表：代码、名称、学分、类型、容量/已选、资格状态、操作选课'),
  bullet('课程详情抽屉、教学分组选择抽屉、本轮选课情况/选课篮抽屉'),
  bullet('学分进度环、GE 需求统计条（可选展示）'),
  bullet('全局排队遮罩：排队中 / 成功 / 失败 / 待分配；可取消排队'),
  h3('逻辑'),
  bullet('R1：提交志愿，结果 pendingAssign，占用老生容量策略，不计入成功学分直至确认'),
  bullet('R2/R3：确认后进入并发队列；R3 过滤仍有空位的课'),
  bullet('资格校验：批次范围、学籍状态、audience、已修、先修缺失/不及格、白名单豁免（若启用）、课程满员'),
  bullet('阻断学籍：Deferred|Suspended|Withdrawn|Dismissed|Graduated（补注册+休学例外）'),
  bullet('各轮选课篮独立（preselect/main/supplement）'),

  h2('4.10 学生加退课/重修（crs-adddrop）'),
  h3('页面元素'),
  bullet('我的申请列表：申请号、类型、状态、提交时间、操作查看/取消'),
  bullet('新建申请：选课器弹窗（加/退/重修课程与分组）、理由与附件（special 通道必填）'),
  bullet('申请详情抽屉（与管理端共用只读明细组件）'),
  h3('逻辑'),
  bullet('窗口内或补注册名单可提交；联合申请先退再加；与审批模块状态机一致'),

  h2('4.11 学生选课历史（crs-result）'),
  h3('页面元素'),
  bullet('列表/卡片：学期、课程、分组、学分、来源轮次、状态、时间'),
  bullet('可查看详情；按产品约定决定是否允许历史页退选（需走加退课流程）'),

  h2('4.12 流程说明（cr-flow-guide）'),
  p('展示 A–H 阶段说明、主流程与联动、顺序约束；节点可跳转到对应业务页。正式环境可作为帮助文档保留或隐藏。'),

  // ========== 5 ==========
  h1('5. 前后端接口设计'),
  p(
    '约定：REST JSON；统一响应 { code, message, data }；分页 { list, total, page, pageSize }。鉴权 Header: Authorization: Bearer <token>。下列路径前缀建议 /api/course-registration。',
  ),

  h2('5.1 批次与范围'),
  ...apiBlock(
    'GET',
    '/batches',
    '分页查询选课批次',
    [
      'query: academicSession?, type(ME|GE)?, status(draft|active|closed)?, keyword?, page, pageSize',
    ],
    [
      'list[]: id, name, academicSession, type, status, creditMin, creditMax, courseCount, roundsSummary, isSelectable, volunteerFinalConfirmedAt',
      'total',
    ],
  ),
  ...apiBlock(
    'POST',
    '/batches',
    '新建批次',
    [
      'body: name, academicSession, type, creditMin, creditMax, isSelectable, addDropWindow{start,end}, preselectPriority{preferSenior,minSemestersAbove}, localRules{}, rounds{}, scopeRules[]',
    ],
    ['data: batch 完整对象'],
  ),
  ...apiBlock('PUT', '/batches/{batchId}', '编辑批次', ['body: 同新建可编辑字段'], ['data: batch']),
  ...apiBlock('POST', '/batches/{batchId}/publish', '发布批次', ['无或 remark'], ['data: { status: active }']),
  ...apiBlock('POST', '/batches/{batchId}/revoke', '撤销发布', ['无或 remark'], ['data: { status: draft }']),
  ...apiBlock(
    'PUT',
    '/batches/{batchId}/rounds',
    '保存三轮时间与范围规则',
    [
      'body: rounds{preselect,main,supplement:{start,end}}, scopeRules[{faculties[],intakes[],programmes[],groupName,round}]',
    ],
    ['校验闸门失败返回业务错误码'],
  ),
  ...apiBlock(
    'GET',
    '/batches/{batchId}/roster',
    '学生名单',
    ['query: tab=special|selectable'],
    [
      'special: studentId, name, programme, isSelectable, remark, rosterSource',
      'selectable: studentId, name, programme, intake, faculty, rosterSource(scope|resumption|special)',
    ],
  ),
  ...apiBlock(
    'POST',
    '/batches/{batchId}/special-students',
    '新增/导入特殊学生',
    ['body: students[{studentId,isSelectable,remark}] 或 multipart Excel'],
    ['成功数/失败明细'],
  ),
  ...apiBlock(
    'GET',
    '/batches/{batchId}/courses',
    '本批可选课程',
    ['query: keyword?, isSelectable?'],
    [
      'list[]: courseId, code, name, credits, type, sections[], quota, prerequisites[], isSelectable, visibleFromRound, capacityPercent, sourceCapacity, programmeScope, studentCategories[], schoolElectiveCategories[]',
    ],
  ),
  ...apiBlock(
    'POST',
    '/batches/{batchId}/courses/import',
    '从培养方案/课程库导入',
    ['body: courseIds[] 或 programmeCourseRefs[]'],
    ['导入结果'],
  ),
  ...apiBlock(
    'PUT',
    '/batches/{batchId}/courses/settings',
    '批量设置可选/容量/专业范围等',
    [
      'body: courseIds[], patch: { isSelectable?, visibleFromRound?, capacityPercent?, programmeScope?, studentCategories?, schoolElectiveCategories? }',
    ],
    ['更新条数'],
  ),

  h2('5.2 校级规则'),
  ...apiBlock('GET', '/rules', '获取校级规则目录', [], ['list[]: id, type, enabled, params.value']),
  ...apiBlock('PUT', '/rules', '批量保存规则', ['body: rules[]'], ['ok']),

  h2('5.3 学生选课（含队列）'),
  ...apiBlock(
    'GET',
    '/student/context',
    '当前学生选课上下文',
    [],
    [
      'student, activeBatches[], currentRound, creditMin/Max, confirmedCourses[], pendingAssign[], cartsByRound',
    ],
  ),
  ...apiBlock(
    'GET',
    '/student/courses',
    '可选课程列表（含资格）',
    ['query: batchId, round(preselect|main|supplement), type(ME|GE)?'],
    [
      'list[]: 课程字段 + eligibility{ok, reasons[]}, section 容量 enrolled/capacity',
    ],
  ),
  ...apiBlock(
    'POST',
    '/student/preselect/volunteer',
    '提交/取消第一轮志愿',
    ['body: batchId, courseId, sectionId, action(submit|remove)'],
    ['status: pendingAssign'],
  ),
  ...apiBlock(
    'POST',
    '/student/register',
    '正选/补选确认选课（入队）',
    ['body: batchId, round, courseId, sectionId'],
    ['queueTicketId, status: queued'],
  ),
  ...apiBlock(
    'GET',
    '/student/queue/{ticketId}',
    '查询排队结果',
    [],
    ['status: queuing|success|failed|pendingAssign|cancelled, message'],
  ),
  ...apiBlock('POST', '/student/queue/{ticketId}/cancel', '取消排队', [], ['ok']),
  ...apiBlock(
    'GET',
    '/student/my-results',
    '学生选课历史',
    ['query: academicSession?'],
    ['list[]: courseCode, section, credits, round, courseSource, status, time'],
  ),

  h2('5.4 加退课申请与审批'),
  ...apiBlock(
    'POST',
    '/add-drop/applications',
    '学生提交申请',
    [
      'body: type(Add|Drop|Retake|AddDrop), items[{action,courseCode,section,credits,retakeGrade?,fee?}], reason?, attachments[], dropChannel(self|special)',
    ],
    ['applicationNo, status'],
  ),
  ...apiBlock(
    'GET',
    '/add-drop/applications',
    '申请列表（学生看自己的；管理端可筛全量）',
    ['query: statusTab(pending|submitted|history), keyword?, page, pageSize'],
    ['list[]: application 摘要'],
  ),
  ...apiBlock(
    'GET',
    '/add-drop/applications/{id}',
    '申请详情含校验与时间线',
    [],
    [
      'application, validation{creditsAfter, conflicts[], suggestedOrder[]}, timeline[]',
    ],
  ),
  ...apiBlock(
    'POST',
    '/add-drop/applications/{id}/decide',
    '审批决定',
    ['body: decision(approve|reject), comment?, generateBill?:boolean'],
    ['status, billStatus'],
  ),
  ...apiBlock(
    'POST',
    '/add-drop/applications/{id}/cancel',
    '取消申请',
    [],
    ['仅 Pending 且审批未开始'],
  ),

  h2('5.5 监控 / 补注册 / 缴费'),
  ...apiBlock(
    'GET',
    '/monitor/students',
    '监控列表',
    ['query: batchId, status?, keyword?, page, pageSize'],
    ['list[]: studentId, name, programme, credits, status, issues[]'],
  ),
  ...apiBlock('GET', '/monitor/students/{studentId}', '监控详情', ['query: batchId'], ['学分、GE、课表、问题、历史']),
  ...apiBlock(
    'POST',
    '/supplement',
    '加入/更新补注册',
    ['body: studentId, canAdd, canDrop, canRetake, bypassCreditMax, bypassPrerequisite, remark'],
    ['entry'],
  ),
  ...apiBlock('GET', '/supplement', '补注册名单分页', ['query'], ['list']),
  ...apiBlock(
    'GET',
    '/fee-roster',
    '缴费名单',
    ['query: tab=unpaid|paid, batchId?, keyword?'],
    ['list[]: studentId, enrolledCredits, billableCredits, amount, isPaid, paidAt, outstandingFee, courseSource'],
  ),
  ...apiBlock('POST', '/fee-roster/sync', '从财务同步', ['body: batchId?'], ['同步统计']),
  ...apiBlock('POST', '/fee-roster/import', '导入未缴/已缴 Excel', ['multipart + tab'], ['成功失败明细']),
  ...apiBlock('GET', '/fee-roster/export', '导出', ['query: tab'], ['文件流']),

  h2('5.6 结果与志愿定稿 / 代选 / 日志'),
  ...apiBlock(
    'GET',
    '/results/volunteers',
    '第一轮志愿按课查看',
    ['query: batchId, courseId?'],
    ['groups[]: courseId, sectionId, students[], shuffleSeed?'],
  ),
  ...apiBlock(
    'PUT',
    '/results/volunteers',
    '保存志愿名单（含排序）',
    ['body: batchId, courseId, sectionId, studentIds[]'],
    ['ok'],
  ),
  ...apiBlock(
    'POST',
    '/results/volunteers/finalize',
    '志愿定稿',
    ['body: batchId'],
    ['volunteerFinalConfirmedAt'],
  ),
  ...apiBlock(
    'GET',
    '/results/by-round',
    '按轮次结果',
    ['query: batchId, round'],
    ['只读 list'],
  ),
  ...apiBlock(
    'GET',
    '/results/by-student',
    '按学生结果',
    ['query: batchId, keyword?'],
    ['list'],
  ),
  ...apiBlock(
    'POST',
    '/results/admin-add',
    '教务代选',
    ['body: batchId, studentId, items[{courseId,sectionId}]'],
    ['写入 courseSource=admin；校验未满员'],
  ),
  ...apiBlock(
    'DELETE',
    '/results/{resultId}',
    '删除某条选课结果（管理端）',
    ['需审计原因'],
    ['ok'],
  ),
  ...apiBlock(
    'GET',
    '/logs',
    '操作日志',
    ['query: batchId, round, studentId?, operation?, page, pageSize'],
    ['list[]: time, studentId, courseCode, section, operation, result, queueStatus, operator'],
  ),

  // ========== 6 ==========
  h1('6. 数据库设计'),
  p('以下为逻辑模型建议（表名可按项目规范加前缀）。主键均为 BIGINT/UUID；需包含 created_at、updated_at、created_by、updated_by；逻辑删除可选。'),

  h2('6.1 核心表'),
  h3('cr_batch 选课批次'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', '批次ID'],
      ['name', 'VARCHAR', '批次名称'],
      ['academic_session', 'VARCHAR', '学年学期如 2026/04'],
      ['type', 'VARCHAR', 'ME|GE'],
      ['status', 'VARCHAR', 'draft|active|closed'],
      ['credit_min / credit_max', 'INT', '学分区间'],
      ['is_selectable', 'TINYINT', '是否对学生开放'],
      ['add_drop_start / end', 'DATETIME', '加退课窗口'],
      ['prefer_senior', 'TINYINT', '预选优先老生'],
      ['min_semesters_above', 'INT', '优先年级差'],
      ['local_rules_json', 'JSON', '局部规则'],
      ['volunteer_final_confirmed_at', 'DATETIME', '志愿定稿时间'],
      ['self_service_drop_no_approval', 'TINYINT', '自助退课免审'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_batch_round 批次轮次'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['round_key', 'VARCHAR', 'preselect|main|supplement'],
      ['start_at / end_at', 'DATETIME', '可空表示未配置'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_batch_scope_rule 参与范围'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['round_key', 'VARCHAR', '每批每轮建议唯一'],
      ['faculties_json', 'JSON', '学院列表，可含 All'],
      ['intakes_json', 'JSON', '专业批次'],
      ['programmes_json', 'JSON', '专业代码'],
      ['group_name', 'VARCHAR', '分组名'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_batch_special_student 特殊学生'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['student_id', 'VARCHAR', '学号'],
      ['is_selectable', 'TINYINT', '强制可选'],
      ['remark', 'VARCHAR', '备注'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_batch_course 批次课程'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['course_code', 'VARCHAR', '课程代码'],
      ['course_name', 'VARCHAR', ''],
      ['credits', 'DECIMAL', ''],
      ['course_type', 'VARCHAR', 'ME/GE 等'],
      ['is_selectable', 'TINYINT', ''],
      ['visible_from_round', 'VARCHAR', '从哪一轮可见'],
      ['source_capacity', 'INT', '源最大容量'],
      ['capacity_percent', 'INT', '容量百分比'],
      ['quota_json', 'JSON', 'total/senior/freshman/releaseToFreshman'],
      ['prerequisites_json', 'JSON', '先修'],
      ['programme_scope_json', 'JSON', '专业范围，__unlimited__ 表示不限'],
      ['student_categories_json', 'JSON', 'Local/China/International'],
      ['school_elective_categories_json', 'JSON', '校选类别'],
      ['g1_category', 'VARCHAR', 'GE 类别'],
      ['audience', 'VARCHAR', '受众'],
    ],
    [3600, 1600, 3800],
  ),

  h3('cr_course_section 教学分组'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_course_id', 'FK', ''],
      ['section_code', 'VARCHAR', '如 01'],
      ['time_desc', 'VARCHAR', '上课时间描述'],
      ['room', 'VARCHAR', ''],
      ['lecturer', 'VARCHAR', ''],
      ['capacity', 'INT', ''],
      ['enrolled', 'INT', '已选人数（可用冗余+事务更新）'],
      ['week_pattern_json', 'JSON', '周次'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_rule_setting 校级规则'),
  table(
    ['字段', '类型', '说明'],
    [
      ['rule_id', 'PK', 'CR201 等'],
      ['rule_type', 'VARCHAR', 'flag|count'],
      ['enabled', 'TINYINT', ''],
      ['param_value', 'INT', ''],
    ],
    [3200, 1800, 4000],
  ),

  h2('6.2 选课过程与结果表'),
  h3('cr_registration_cart / cr_registration_result'),
  p(
    '建议：选课篮可用会话级或临时表；正式结果落入 cr_registration_result。',
  ),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['student_id', 'VARCHAR', ''],
      ['round_key', 'VARCHAR', 'preselect|main|supplement'],
      ['course_code / section_id', 'VARCHAR/FK', ''],
      ['credits', 'DECIMAL', ''],
      ['status', 'VARCHAR', 'queued|success|pendingAssign|failed|cancelled'],
      ['course_source', 'VARCHAR', 'preselect|main|supplement|admin'],
      ['operator_id', 'VARCHAR', '代选操作人'],
      ['queue_ticket_id', 'VARCHAR', '关联队列'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_queue_ticket 选课队列票据'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['student_id', 'VARCHAR', ''],
      ['batch_id / round_key / section_id', '—', '定位选课目标'],
      ['status', 'VARCHAR', 'queuing|success|failed|cancelled'],
      ['fail_reason', 'VARCHAR', ''],
      ['enqueued_at / finished_at', 'DATETIME', ''],
    ],
    [3600, 1600, 3800],
  ),

  h3('cr_preselect_volunteer 第一轮志愿名单'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id', 'FK', ''],
      ['course_id / section_id', 'FK', ''],
      ['student_id', 'VARCHAR', ''],
      ['sort_order', 'INT', '随机排序结果'],
      ['confirmed', 'TINYINT', '是否纳入定稿'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_add_drop_application / cr_add_drop_item'),
  table(
    ['字段', '类型', '说明'],
    [
      ['application: id, application_no, student_id, type, status, submitted_at, bill_status, bill_amount, drop_channel, reason', '—', '主表'],
      ['item: application_id, action, course_code, section, credits, time_desc, retake_grade(F|M), fee', '—', '明细'],
      ['approval_log_json 或独立日志表', '—', '时间线'],
      ['attachment 表', '—', 'special 通道附件'],
    ],
    [5200, 1200, 2600],
  ),

  h3('cr_supplement_entry 补注册'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['student_id', 'VARCHAR', ''],
      ['batch_id', 'FK', '可选关联'],
      ['can_add / can_drop / can_retake', 'TINYINT', '权限'],
      ['bypass_credit_max / bypass_prerequisite', 'TINYINT', '绕过'],
      ['remark', 'VARCHAR', ''],
    ],
    [4000, 1600, 3400],
  ),

  h3('cr_fee_roster 缴费名单'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['student_id', 'VARCHAR', ''],
      ['batch_id', 'FK', ''],
      ['enrolled_credits', 'DECIMAL', ''],
      ['billable_credits', 'DECIMAL', 'max(0, enrolled-creditMin)'],
      ['amount', 'DECIMAL', ''],
      ['is_paid', 'TINYINT', ''],
      ['paid_at', 'DATETIME', ''],
      ['outstanding_fee', 'CHAR', 'Y|N'],
      ['course_source', 'VARCHAR', ''],
      ['finance_ref', 'VARCHAR', '财务单据号'],
    ],
    [3200, 1800, 4000],
  ),

  h3('cr_operation_log 操作日志'),
  table(
    ['字段', '类型', '说明'],
    [
      ['id', 'PK', ''],
      ['batch_id / round_key', '—', ''],
      ['student_id / course_code / section', '—', ''],
      ['operation', 'VARCHAR', 'register|drop|adminAdd|joinQueue|cancelQueue'],
      ['result', 'VARCHAR', 'success|failure|queuing|cancelQueue'],
      ['queue_status', 'VARCHAR', ''],
      ['operator_id', 'VARCHAR', ''],
      ['detail_json', 'JSON', ''],
      ['created_at', 'DATETIME', ''],
    ],
    [3200, 1800, 4000],
  ),

  h2('6.3 外部依赖数据（只读）'),
  bullet('学生主数据：学号、姓名、学院、专业、intake、学籍状态、学生类别'),
  bullet('培养方案/课程库：课程、先修、学分、GE 类别'),
  bullet('排课：教学分组、时间地点、教师、容量'),
  bullet('财务：账单状态、已缴金额（同步缴费名单）'),
  bullet('学籍异动：复学等进入可选名单来源 rosterSource=resumption'),

  h2('6.4 关键事务要点'),
  bullet('选课入队出队：对 section.enrolled 使用乐观锁或行锁，防止超卖'),
  bullet('审批通过：同一事务更新申请状态、写结果表、可选写缴费名单'),
  bullet('志愿定稿：写 batch.volunteer_final_confirmed_at，并批量将 pendingAssign 转为 success（按产品规则）'),
  bullet('代选：校验容量与学生资格后写入 result + log'),

  // ========== 7 ==========
  h1('7. 前后端对接约定'),
  h2('7.1 状态字典统一'),
  p('前后端、数据库枚举值必须一致，建议后端提供 /api/meta/dicts 下发。关键字典：批次状态、轮次、申请类型/状态、账单状态、选课结果状态、日志 operation/result、监控问题状态、课程来源。'),
  h2('7.2 错误码建议'),
  table(
    ['code', '场景'],
    [
      ['CR_ROUND_GATE', '轮次闸门不满足'],
      ['CR_BATCH_NOT_ACTIVE', '批次未发布'],
      ['CR_OUT_OF_WINDOW', '不在选课/加退课窗口且非补注册'],
      ['CR_NOT_ELIGIBLE', '资格不通过（附 reasons[]）'],
      ['CR_SECTION_FULL', '分组已满'],
      ['CR_QUEUE_TIMEOUT', '排队失败'],
      ['CR_APPROVAL_STATE', '审批状态不允许该操作'],
      ['CR_CREDIT_EXCEED', '超过学分上限且未允许超额'],
    ],
    [2800, 6200],
  ),
  h2('7.3 导入导出'),
  bullet('特殊学生、缴费未缴/已缴：Excel；后端校验学号是否存在并返回行级错误'),
  bullet('选课结果导出：字段与原型 export 字段定义对齐（学号、课程、分组、轮次、来源、学分、状态等）'),
  h2('7.4 并发与队列'),
  bullet('正选/补选提交仅创建队列票据，由队列消费者扣减容量并回写结果'),
  bullet('前端轮询 GET /student/queue/{ticketId} 或 WebSocket 推送；超时与取消需幂等'),
  h2('7.5 权限'),
  bullet('管理端接口校验教务角色；学生接口强制仅能操作本人数据'),
  bullet('代选、删除结果、定稿、审批决定需操作审计日志'),

  // ========== 8 ==========
  h1('8. 关键业务规则汇总'),
  bullet('未发布批次不可正式选课'),
  bullet('R2 依赖志愿定稿；R3 依赖 R2 已结束；R3 仅空位课'),
  bullet('第一轮志愿成功态为待分配，定稿前不计入成功学分'),
  bullet('加退课：窗口内或补注册名单；Drop 分 self/special；可配置自助免审'),
  bullet('联合申请无 Replace；建议先 Drop 后 Add；重修 F 优先于 M'),
  bullet('学籍阻断集合：Deferred/Suspended/Withdrawn/Dismissed/Graduated（补注册例外按规则）'),
  bullet('缴费不同步改变选课完成态；billableCredits=max(0, enrolledCredits-creditMin)'),
  bullet('课程「专业范围+学生类别+校选类别」为配置项：若本期不做运行时硬校验，需在接口文档标注“仅存档”'),
  bullet('校级规则 CR201–CR204、CR107 与批次 localRules 合并生效（批次优先或校级兜底，实现时需二选一并写清）'),

  // ========== 9 ==========
  h1('9. 验收要点（摘要）'),
  bullet('管理端可完成：建批→配轮次/范围→导课→发布→志愿定稿→看监控→审批→补注册→缴费名单→查结果/日志'),
  bullet('学生端可完成：选批次轮次→志愿/正选排队→看结果→窗口内加退课→查历史'),
  bullet('闸门、容量并发、审批写回、日志留痕、导入导出校验均有对应用例'),
  bullet('本地开发访问与云端静态部署路径互不影响（前端构建 base 可配置）'),

  h1('10. 附录：实体关系简述'),
  p(
    'Batch 1—N Round；Batch 1—N ScopeRule；Batch 1—N BatchCourse 1—N Section；Batch 1—N SpecialStudent；Student+Batch+Section → RegistrationResult / QueueTicket / Volunteer；Student → AddDropApplication 1—N Item；Student → SupplementEntry；Student+Batch → FeeRoster；全域 OperationLog。',
  ),
  p(
    '—— 文档结束。如需按单页拆分为接口字段级 OpenAPI，可在本需求基础上继续细化。',
  ),
]

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [],
      },
    },
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 210 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '○',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 210 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: '选课管理模块 · 全栈开发需求文档',
                  font: '微软雅黑',
                  size: 16,
                  color: '888888',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '第 ', font: '微软雅黑', size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], font: '微软雅黑', size: 16 }),
                new TextRun({ text: ' 页', font: '微软雅黑', size: 16 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
})

const buf = await Packer.toBuffer(doc)
fs.writeFileSync(outPath, buf)
console.log('Wrote:', outPath)
console.log('Size:', buf.length, 'bytes')
