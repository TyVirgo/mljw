# 基础数据-培养方案与年级专业

> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。

## 背景与动机

将「基础数据-培养方案与年级专业」相关的零散提案合并为一份连贯需求说明，便于按菜单编写正式需求文档，并减少 openspec/changes 目录噪音。

## 能力范围（按逻辑分组）

### add-programme-intake-planned-enrollment

**动机**

专业批次新增/编辑需要记录「计划招生人数」，便于后续招生与容量相关原型扩展；当前表单仅有 Intake 与起始学年学期。

**变更要点**

- 新增弹窗：Intake 下方增加必填数字输入「计划招生人数」

### add-school-elective-category

**动机**

院系与专业版本需要标识校选类别（文/理/商），供后续校选课与 GE 需求等场景使用；当前表单与主表均无此字段。

**变更要点**

- 院系信息：新增必填「校选类别」（文科 / 理科 / 商科）；新增/编辑表单与主表展示

### refine-enrollment-cascade-programme-intake

**动机**

学籍注册 Enrollment Tab 当前以「专业」为首个下拉，学院与专业层次为只读派生；入学批次、学年、学期可独立编辑。业务要求改为与培养方案及专业批次主数据对齐：先按 **专业层次 → 学院 → 专业** 逐级筛选，选定专业批次后自动带出编码、学制、学期、入学批次与学年，并以置灰只读与可编辑字段区分。

**变更要点**

- Enrollment Tab 重构级联顺序：专业层次（必填下拉）→ 学院（必填下拉）→ 专业（必填下拉，选项为活跃专业批次）

### refine-programme-intake-published-version

**动机**

专业批次（Programme Intake）新增/编辑弹框在选专业创建批次时，用户无法看到该专业当前使用的是哪个 **已发布版本**；同时培养方案版本列表缺少直观的 **版本发布** 开关，无法标记 `isCurrent` 发布版本供下游（专业批次、学籍 Enrollment 联动）引用。产品要求在新增/编辑专业批次时，于专业列表 School 列后增加 **版本** 列，并可打开版本详情确认内容。

## 合并来源

- `add-programme-intake-planned-enrollment`
- `add-school-elective-category`
- `refine-enrollment-cascade-programme-intake`
- `refine-programme-intake-published-version`

## 能力标识

- `basic-data-programme`：基础数据-培养方案与年级专业（合并需求包）

## 影响范围

- 对应模块菜单下的列表/表单/抽屉/导出与演示数据
- i18n（中/英）与导航配置
- 本包以文档沉淀为主；代码已在各次 apply 中落地
