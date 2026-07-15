/**
 * 从第 7/8/9 次调研「选课原文」提取内容，并追加与原型一致的连贯流程说明，输出 docx
 */
import fs from 'fs'
import path from 'path'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from 'docx'

const BASE = 'D:/任务/马来/马来教务/选课/需求总结'
const SOURCES = [
  {
    title: '第七次调研（0911）— 选课相关原文摘录',
    note: '来源：本科教务第7次调研0911（排课、选课、场地使用情况）。已剔除排课、场地、教室分配、调停课、场地借用等非选课段落；保留先修课/转学分与课程注册主体讨论。',
    file: path.join(BASE, '第七次/选课原文.txt'),
    ranges: [
      [435, 640],
      [1559, 2390],
    ],
  },
  {
    title: '第八次调研（0912）— 选课相关原文摘录',
    note: '来源：本科教务第8次调研0912（选课）。以 Study Plan 与选课联动、加退课、复学、配额、白名单等为主线。',
    file: path.join(BASE, '第八次/选课原文.txt'),
    startLine: 1,
  },
  {
    title: '第九次调研（0918）— 选课相关原文摘录',
    note: '来源：本科教务第9次调研0918。保留与选课直接相关的学业监控、白名单、课程注册总结；已剔除实习、评教、毕业、成绩单等后续板块。',
    file: path.join(BASE, '第九次/选课原文.txt'),
    ranges: [
      [192, 220],
      [627, 730],
      [823, 1033],
    ],
  },
]

const OUT = path.join(BASE, '选课模块需求整理（第7-9次调研）.docx')

const FONT = '宋体'
const BODY = 21
const H1 = 32
const H2 = 28
const H3 = 24

function runs(text, opts = {}) {
  const { bold = false, size = BODY, italics = false } = opts
  return String(text ?? '')
    .split('\n')
    .flatMap((line, i, arr) => {
      const parts = [
        new TextRun({ text: line || ' ', bold, italics, size, font: FONT }),
      ]
      if (i < arr.length - 1) parts.push(new TextRun({ break: 1 }))
      return parts
    })
}

function heading(text, level = HeadingLevel.HEADING_1) {
  const size = level === HeadingLevel.HEADING_1 ? H1 : level === HeadingLevel.HEADING_2 ? H2 : H3
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 240 : 180, after: 120 },
    children: [new TextRun({ text, bold: true, size, font: FONT })],
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: runs(text, opts),
  })
}

function quoteBlock(lines) {
  return lines
    .filter((l) => l.trim())
    .map((line) =>
      new Paragraph({
        spacing: { after: 40 },
        indent: { left: 360 },
        children: [
          new TextRun({ text: line, size: BODY, font: FONT, color: '333333' }),
        ],
      }),
    )
}

function readExtract({ file, startLine = 1, endLine, ranges }) {
  const raw = fs.readFileSync(file, 'utf8')
  const lines = raw.split(/\r?\n/)
  if (ranges?.length) {
    return ranges
      .map(([from, to]) => lines.slice(from - 1, to).join('\n'))
      .join('\n\n---\n\n')
      .trim()
  }
  const from = Math.max(0, startLine - 1)
  const to = endLine ? Math.min(lines.length, endLine) : lines.length
  return lines.slice(from, to).join('\n').trim()
}

const integratedFlow = `
第二部分  选课模块业务流转说明（与原型流程一致）

说明：本节依据第 7/8/9 次调研原文归纳，并与 ly-cea-pjxt-jcsj-ui 选课原型菜单、CourseRegistrationFlowGuideView 流程说明页对齐。术语：ME（Major Elective 专业选修）、GE（General Elective 通识选修）、Mandatory（必修注册）；「课程注册」≈ 学生选课 + 加退课，必修课多由系统导入课表。

一、术语与制度前提

1. 学年学分制：学生须按培养方案学期进度修读，不能因成绩优秀而提前修未来学期课程；加课只能从「欠修（unfulfilled）」池选，不能从「未来待修（pending future）」池选（极特殊情况经 BOA 白名单批准）。
2. 注册对象：全体学生每学期须完成 M1/GE 等选修注册；必修课已在课表，变化走加减课/重修。
3. 学分边界：长学期最低 12、最高按 intake 配置（如 20/21）；短学期最低约 4。批次发布前按 intake+program 设定上下限。
4. 新老生：老生开学前约 1 周可提前选课；新生开学当周选课。教学分组可配置总容量 / 老生容量 / 新生容量，新生端仅见本身份可用名额。

二、学期时间轴（长学期为主）

阶段 A — 开学前准备（管理端）
  · 确定本学期 M1/GE 开课清单（M1 从培养方案池勾选实际开课；GE 从课程库开设）。
  · 创建选课批次：类型 ME / GE / Mandatory；配置学年学期（如 2024/09）、Pre/Main/Supp 三轮时间、Add/Drop 窗口、退课截止（第 5 周）、scope（Program×Intake）、学分上下限、账单 48h 付款窗口；可勾选「自动导入复学学生」。
  · 维护可选课程：教学分组、新老生配额、先修课与 GE 类别限制。
  · 白名单预审：先修例外、超学分、修未来学期课、毕业生特殊等，经 AC→HOP→BOA 批准。
  · 发布批次并按 intake/program 发邮件；排除休学/退学等不在校学生。

阶段 B~F — 主轮选课（学生 + 监控）
  · 第一轮 Pre（预选）：可超额选课，结束后系统按规则筛选（如高年级优先等），未入选者进入下一轮。
  · 第二轮 Main（正选）：先到先得，选课篮→队列→确认锁定名额。
  · 第三轮 Supp（补选）：继续抢剩余名额；期间可调配老生/新生配额。
  · 管理端实时监控：未选课、学分不足/超限、GE 类别不足、先修缺失等；第 1 周末干预提醒。

阶段 G~H — Add/Drop 与审批（可与主轮重叠）
  · 长学期第 1~2 周：M1/GE 可在系统自助加减（在学分上限内）。
  · 重修 Retake F/M、Replace：走加退课申请→审批→生成账单→48h 付款→入班；Retake F 优先于 Retake M。
  · 时间冲突：须先 Drop 再 Add（可关联提交，审批先 Drop 后 Add）。
  · 必修退课：需审批+申请信（个人原因可能导致延毕）。

阶段 I~K — 收尾
  · 第三周复查：系统关闭自助加减后，导出应修 vs 实修、欠修学分、GE/ME 缺口；学业预警。
  · 补注册：主轮结束后，名单内学生可补选有余量课程；复学学生宜纳入主轮特殊名单，不必等到补选惩罚轮。
  · 选课结果确认后同步 Study Plan（仅当学期真实选课，不影响教务对未来学期的人工安排）。

三、管理端菜单与业务顺序（原型）

  ⑥ 选课批次 → ⑦ 可选课程 → 发布通知
  ⑧ 学生选课监控（贯穿 B~I）
  ⑩ 加退课审批、⑪ 候补管理（并行）
  ⑨ 补注册名单、⑬ 学业预警
  ⑫ 选课结果、⑮ 选课报表
  ⑭ 白名单管理（全程）

四、学生端菜单与业务顺序（原型）

  ① 在线选课：Pre → Main → Supp，配合 ② 我的课表、⑤ 我的选课结果
  ③ 加退课/重修：与主轮并行准备，审批通过后更新课表
  ④ 我的候补（若启用）
  错过主轮/在补注册名单：主轮结束后在 ①/③ 补选

五、两端核心联动

  管理端发布批次（scope/配额/三轮）→ 学生主轮选课 → 监控回写与提醒
  学生 Add/Drop 申请 → 管理端审批（学分/冲突/先修/账单）→ 批准加课进入同一选课队列机制
  白名单/补注册批准 → 学生突破常规限制选课或补选
  结果确认 → Study Plan 一键更新（当学期）

六、特殊学生分支

  · 休学：在籍不在校，不发选课邮件，不参与主轮。
  · 复学：复学标签→批次自动导入或特殊名单→宜参与主轮正选；Study Plan 可按长对长、短对短顺延。
  · 转学分/已修：不应再出现在可选列表；转专业同 course code 的 MPU 若未转入新专业仍可选（需业务规则）。
  · 先修未过：不可选或仅显示满足先修的课程；临近毕业最后若干学期可申请先修突破（白名单/加课审批）。
  · GE 子类别：毕业要求分文/商/理等最低学分；剩余最后学分阶段系统应限制选错类别（监控预警，选课期提醒）。

七、实现顺序约束（调研明确要求）

  1. 批次发布必须先于学生主轮选课。
  2. 预选筛选必须先于正选抢课。
  3. M1/GE 注册与 Add/Drop 可时间重叠，学分与冲突必须联动。
  4. 付费 Add/Retake：先审批 → 账单 → 48h 付款 → 入班。
  5. 补注册在主轮结束后对名单开放。
  6. 复学宜进主轮特殊名单，非仅补选惩罚。
  7. 第三周复查与第五周特殊退课并存。
  8. Study Plan 同步在选课结果确认之后。
`.trim()

function buildDoc() {
  const children = []

  children.push(
    heading('选课模块需求整理（第 7–9 次调研）', HeadingLevel.TITLE),
    body('整理范围：仅选课 / 课程注册模块（不含开课排课、场地、实习、评教、毕业等）', {
      italics: true,
    }),
    body('资料来源：第七次（0911）、第八次（0912）、第九次（0918）调研视频转写原文'),
    body(`输出路径：${OUT}`),
    new Paragraph({ children: [new PageBreak()] }),
  )

  children.push(heading('第一部分  调研原文摘录（选课相关）', HeadingLevel.HEADING_1))

  for (const src of SOURCES) {
    children.push(heading(src.title, HeadingLevel.HEADING_2))
    children.push(body(src.note, { italics: true }))
    const text = readExtract(src)
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      if (/^发言人/.test(line.trim())) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [new TextRun({ text: line.trim(), bold: true, size: BODY, font: FONT })],
          }),
        )
      } else if (line.trim()) {
        children.push(...quoteBlock([line]))
      }
    }
    children.push(new Paragraph({ children: [new PageBreak()] }))
  }

  children.push(heading('第二部分  选课模块业务流转说明（与原型一致）', HeadingLevel.HEADING_1))

  for (const block of integratedFlow.split('\n\n')) {
    const t = block.trim()
    if (!t || t.startsWith('第二部分')) continue
    if (/^[一二三四五六七]、/.test(t) || /^阶段 [A-Z]/.test(t)) {
      children.push(heading(t.split('\n')[0], HeadingLevel.HEADING_2))
      const rest = t.split('\n').slice(1).join('\n').trim()
      if (rest) children.push(body(rest))
    } else if (/^说明：/.test(t)) {
      children.push(body(t, { italics: true }))
    } else {
      children.push(body(t))
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })
}

const doc = buildDoc()
const buf = await Packer.toBuffer(doc)
fs.mkdirSync(BASE, { recursive: true })
fs.writeFileSync(OUT, buf)
console.log('已生成:', OUT)
