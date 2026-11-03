# 学籍管理-异动维护

> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。

## 背景与动机

将「学籍管理-异动维护」相关的零散提案合并为一份连贯需求说明，便于按菜单编写正式需求文档，并减少 openspec/changes 目录噪音。

## 能力范围（按逻辑分组）

### add-movement-list-pdf-preview

**动机**

维护与查询列表需在不打开详情抽屉的情况下，快速预览与详情一致的 PDF 内容并支持下载。

**变更要点**

- 操作列「详情」右侧增加 **Preview PDF** 按钮

### add-movement-maintenance

**动机**

学籍异动侧边栏「学籍异动维护」（`sr-movement-maintenance`）仍为建设中页。审批通过的异动申请需要在教务端 **统一实施、编制异动编号、补录 CGPA/预计毕业时间等维护字段**，并与四 Tab 申请、审批模块共用同一批 mock 数据。图示1–3 要求宽表列表 + 实施/改编号/Export/Delete + 行内 Edit | Details | Approval log。

### add-movement-maintenance-archive-number

**动机**

异动维护页需为已通过审批的记录编制 **文号**（`exportArchiveNumber`），用于 PDF/附件导出文件名前缀。此前未填文号时系统会随机生成归档号，与产品要求不符。

**变更要点**

- 维护列表新增 **文号** 列（**学号列前一列**），未填显示 `NA`

### refine-movement-maintenance-pdf-action-label

**动机**

异动维护列表行操作列 PDF 按钮当前使用残缺 i18n key `movementExport.`，界面无法正确显示文案。产品要求维护页该按钮显示 **「导出 PDF」**，与查询页「预览 PDF」区分。

**变更要点**

- `MovementMaintenanceView` 行操作 PDF 按钮改用 `movementExport.exportPdf`（中文「导出 PDF」/ 英文「Export PDF」）

### refine-movement-maintenance-query-list-columns-search

**动机**

两页主表需统一列顺序与搜索字段，生效日期文案统一，导出与主表一致。

**变更要点**

- 主表前缀列：序号…生效日期；其余原列接后

## 合并来源

- `add-movement-list-pdf-preview`
- `add-movement-maintenance`
- `add-movement-maintenance-archive-number`
- `refine-movement-maintenance-pdf-action-label`
- `refine-movement-maintenance-query-list-columns-search`

## 能力标识

- `student-records-movement-maintenance`：学籍管理-异动维护（合并需求包）

## 影响范围

- 对应模块菜单下的列表/表单/抽屉/导出与演示数据
- i18n（中/英）与导航配置
- 本包以文档沉淀为主；代码已在各次 apply 中落地
