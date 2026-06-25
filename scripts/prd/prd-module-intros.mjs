/** 各二级子模块「菜单内容简介」（纯中文，对齐模板图示） */

export const profileMenuSummary =
  '学生基本信息管理，包含新增、编辑、删除、查询、导入、导出、查看详情等常用功能，用于维护本科生全维度学籍档案。支持按学生类别（本地生/中国学生/国际生）差异化维护证件与学籍字段，通过七个信息页签组织录入与展示，为学籍异动申请提供主数据支撑。'

export const transferMenuSummary =
  '转专业申请（嵌入学籍异动申请 Tab 壳层）。老师入口列表含学号/姓名列并可关键字搜索；学生入口隐藏学号/姓名列与关键字搜索。Section I 学号姓名同行，老师新建可 StudentSelectModal 选学生；只读字段灰底。申请学年学期 YYYY/MM 选学生后写入 intake。转专业原因改为类别配置下拉（reasonId）；Section VII 教务核定三字段申请侧 disabled 置灰。日历日期 YYYY-MM-DD。'

export const defermentMenuSummary =
  '休学申请（Tab 壳层内）。双行搜索与双入口列显隐规则同转专业。休学主要原因下拉来自 DEF001 类别 reasons；家长区可 Download Consent Letter。国际生含 ISAO 审批节点。'

export const resumptionMenuSummary =
  '复学申请（Tab 壳层内）。须选择休学/复学学期，双声明与附件；RES001 本阶段不同步申请原因下拉。'

export const withdrawalMenuSummary =
  '退学申请（Tab 壳层内）。主要原因来自 WDR001 类别 reasons；国际生 ISAO 提示；家长知情同意书模板联动。'

export const movementApplicationTeacherSummary =
  '学籍异动申请（老师）入口：StudentMovementApplicationView 页顶水平 Tab（转专业·休学·复学·退学，默认休学），嵌入四 View。搜索双行：首行学号或姓名、专业代码、申请学年学期、状态（含 Draft）；次行是否实施可收起。列表展示学号、姓名列。'

export const movementApplicationStudentSummary =
  '学籍异动申请（学生）入口：与老师共用 Tab 壳层与四 View；搜索隐藏学号或姓名字段；列表隐藏学号、姓名列；表单不提供 StudentSelectModal（学生身份上下文）。'

export const approvalMenuSummary =
  '学籍异动审批：Tab 顺序待我审批→已提交→已处理历史（仅待我审批角标）。搜索五字段 inline：学年学期、专业代码、状态、学号、姓名。列表无异动原因列；已处理历史 Tab 显示是否实施 Y/N。查看详情为只读 DetailModal + 底部 [审批] 打开 MovementApprovalModal（无内联审批表单）。批量审批、ExportModal 导出、Recall 撤回。状态 Badge；申请日期 YYYY-MM-DD；生效学期 YYYY/MM。'

export const categoryMenuSummary =
  '异动类别配置：categoryCode 全局唯一（演示 4 行 PT001/DEF001/WDR001/RES001）。表单四行双列布局；类别下拉全量不与学籍状态联动；三实施开关 + 允许学生申请。reasons[] 同步至转专业/休学/退学申请原因下拉。'

export const consentMenuSummary =
  '知情同意书配置：按适用异动类别与 Student Type（Local/Chinese/International，中文「中国」）维护模板，(类别+类型) 唯一。含学生/家长附件 mock；四 Tab 申请 Form/Detail 与休学/退学家长区 resolveConsentTemplate 下载。'

export const maintenanceMenuSummary =
  '学籍异动维护：15 列宽表与查询一致；搜索学年学期/专业代码/状态/学号/姓名。工具栏实施、导出、删除（无修改异动编号）；行操作详情、流转日志（无 Edit）。详情脱敏。'

export const queryMenuSummary =
  '学籍异动查询：15 列宽表只读；搜索首行学年学期/专业代码/状态/异动类型，次行学号/姓名可收起。工具栏仅导出；详情脱敏。'

export const level1MenuIntro =
  '门户二级应用「学籍管理」，侧边栏分为学籍管理、学籍异动两组 expandable 导航（不含学生个人学习计划；学籍异动统计菜单暂缓）。已落地：学生基本信息、异动类别、知情同意书、学籍异动申请（老师/学生）、学籍异动审批、异动维护、异动查询。可交互前端演示，本地存储联动。'

export const level1MenuIntroV16 =
  '门户二级应用「学籍管理」，侧边栏分为学籍管理、学籍异动两组导航。本期已落地学生基本信息、四类异动申请及统一异动审批；其余菜单为占位。当前为可交互前端演示，数据在本地存储间联动刷新。'
