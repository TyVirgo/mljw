# 基础数据-教师与评教设置

> 本变更包由同菜单下多个历史 OpenSpec 变更合并而成，供后续整理需求文档使用。实现状态以原型代码为准；本包作为需求沉淀，不重复驱动增量开发。

## 背景与动机

将「基础数据-教师与评教设置」相关的零散提案合并为一份连贯需求说明，便于按菜单编写正式需求文档，并减少 openspec/changes 目录噪音。

## 能力范围（按逻辑分组）

### add-evaluation-settings

**动机**

Lecturer Info → **Evaluation Settings**（评估设置）菜单目前为占位页，无法配置教师教学评估的触发规则。该页面是标记「需评估教师」（Requires Evaluation）的业务来源之一，需尽快提供与静态原型一致的全局规则与类型变更规则配置能力，以支撑 Lecturer Information 列表中的评估筛选与标签展示。

**变更要点**

- 新增 **Evaluation Settings** 配置页：无搜索区，单页表单式布局（参考中英文静态设计图）

### add-lecturer-information

**动机**

Lecturer Info → Lecturer Information 菜单目前指向「建设中」占位页，无法管理教职工基本信息。该模块是 Basic Data 的核心功能之一，需要尽快提供与原型一致的列表、检索、增删改查及详情展示能力，以支撑教务系统对教师资源的统一管理。

**变更要点**

- 新增 **Lecturer Information** 主页面：列表展示、分页、批量选择、搜索/重置、More 展开高级筛选

## 合并来源

- `add-evaluation-settings`
- `add-lecturer-information`

## 能力标识

- `basic-data-lecturer`：基础数据-教师与评教设置（合并需求包）

## 影响范围

- 对应模块菜单下的列表/表单/抽屉/导出与演示数据
- i18n（中/英）与导航配置
- 本包以文档沉淀为主；代码已在各次 apply 中落地
