# OpenSpec 变更包合并说明

> 原约 188 个零散变更已按 **三大模块 → 菜单** 合并为 **25** 个中文需求包，供后续整理正式需求文档。  
> 每个合并包内含：`proposal.md`（能力范围）、`design.md`、`specs/*/spec.md`、`tasks.md`、`SOURCES.md`（历史来源名）。

## 使用约定

1. **写需求文档**：以各包 `proposal.md` 的「能力范围」为主线，对照 `specs/` 中的验收条目去重润色。
2. **追溯原型**：查 `SOURCES.md` 中的历史 change 名（代码已落地，旧目录已删）。
3. **不再用旧包做 apply**：合并包标记为需求沉淀；增量开发请新建新的 OpenSpec change。

---

## 一、基础数据（4）

| 变更包目录 | 中文名 | 对应菜单/能力 |
|---|---|---|
| `basic-data-programme` | 培养方案与年级专业 | 培养方案版本、入学批次、年级专业；计划招生等 |
| `basic-data-course` | 课程信息与开课申请 | 课程库、先修、开课/变更申请与审批交互 |
| `basic-data-lecturer` | 教师与评教设置 | 教师信息、评教设置（多为骨架提案） |
| `basic-data-shared` | 附件在线预览等共享能力 | 跨页附件预览 |

## 二、学籍管理（9）

| 变更包目录 | 中文名 | 对应菜单 |
|---|---|---|
| `student-records-shell` | 应用壳层与导航 | 学籍应用入口、菜单重组、详情抽屉统一 |
| `student-records-profile` | 学生基本信息 | 学生档案列表/表单/检索/导出/变更记录 |
| `student-records-movement-category` | 异动类别配置 | 异动类型、原因、人员类别、预设选项 |
| `student-records-consent-form` | 知情同意书配置 | 同意书模板、适用范围、版本快照 |
| `student-records-movement-rules` | 异动规则设置 | 规则表、转专业相关规则、申请周次等 |
| `student-records-movement-application` | 异动申请（教职工/学生端） | 转专业/休学/退学/复学申请单与声明区 |
| `student-records-movement-approval` | 异动审批 | 审批列表、时间线、并行分支、撤销入口 |
| `student-records-movement-maintenance` | 异动维护 | 维护列表、归档号、PDF 预览 |
| `student-records-movement-query` | 异动查询与统计 | 查询、统计 |

## 三、选课管理（12）

| 变更包目录 | 中文名 | 对应菜单 |
|---|---|---|
| `course-reg-module-shell` | 模块壳层与信息架构 | 选课应用总览、菜单 IA、容量/专业范围、callout |
| `course-reg-batch` | 选课批次 | 批次、范围、轮次、特殊学生、课程表 |
| `course-reg-rules` | 选课规则 | 学分/规则配置 |
| `course-reg-monitor` | 选课监控 | 监控、学业预警并入 |
| `course-reg-approval` | 加退课审批 | 退课截止分支等 |
| `course-reg-fee-roster` | 缴费名单 | 未缴费/已缴费、同步、导入 |
| `course-reg-result` | 管理端选课结果 | 按学生/课程/轮次、预选志愿、候补下线 |
| `course-reg-log` | 选课日志 | 日志与轮次监控 enrichment |
| `course-reg-student-register` | 学生在线选课 | 选课列表、购物车、队列、学分进度 |
| `course-reg-student-adddrop` | 学生加退课 | 加退课表单与列表 |
| `course-reg-student-result` | 学生选课结果与历史 | 我的结果、历史、候补收敛 |
| `course-reg-flow-guide` | 流程说明 | 流程说明页与页大小等 |

## 合并脚本

可复用：`scripts/consolidate-openspec-changes.mjs`（分类表在脚本内 `BUCKETS`）。  
旧源目录删除后不可再次从磁盘回读；若需重跑，请从 git 历史恢复后再执行。
