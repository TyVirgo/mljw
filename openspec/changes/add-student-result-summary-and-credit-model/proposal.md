# 变更：add-student-result-summary-and-credit-model

## Why

学生需要在「选课后」一眼看到本学期已选/志愿、批次轮次与规则说明（对齐老 XMUM 选课情况汇总），现有「选课历史」只有跨学期确认归档，能力错位。同时学分口径需与培养方案对齐：专业学期总负荷、GE/ME 学期局部与毕业总和、本学期 GE 文/商/理拆分——此前顶栏将「毕业文商理」当作主闸，易与学期局部混淆。

## What Changes

- **方案 A**：在现有学生页 `选课历史`（`StudentMyResultView`）扩展双 Tab  
  - Tab「本学期选课情况」：灰条（批次/轮次/阶段/规则摘要）+ 已选/志愿表 + 三层学分进度；可展示等待公示/未中引导占位（B1/B2 轻量）  
  - Tab「历史记录」：保留现有确认课表（学年学期、来源、操作人等）  
- 菜单文案可改为「我的选课」（或保留「选课历史」并靠 Tab 名区分，实现时按 i18n 统一）  
- **学分三层模型**（数据 + 学生端展示，在线选课顶栏与汇总灰条对齐）：  
  1. 专业学期总负荷 `[min, max]`＝本学期必修 + GE + ME  
  2. GE/ME：学期局部要求；各学期局部之和＝该类型毕业总要求；选课可少不可超局部  
  3. 本学期 GE：文 + 商 + 理＝GE 局部；各类可少不可超  
- 在线选课顶栏：文商理改为**本学期**配额优先；毕业累计降为次要（tip/展开，可选）

## Non-goals

- 不新开独立菜单  
- 不把在线选课主区改成「上已选 + 下可选勾选」操作台（选课仍在 `crs-register`）  
- 不做完整公示倒计时产品化、加权抽签深化、知情同意、学期级加退窗、缴费、开课同步  
- 不在本包改管理端批次配置 UI（学分来源用 demo/context；管理一览另包）

## Capabilities

### Modified Capabilities

- `course-registration`：学生选课结果/历史页双 Tab 汇总；学分三层口径与展示

## Impact

- `StudentMyResultView.vue`（主）
- `studentRegistrationContext.js` / store / monitor demo 进度字段
- `StudentRegisterView.vue` 顶栏进度语义对齐（本学期文商理）
- `menu.js`、`zh.js` / `en.js`、流程指引相关文案（若有）
- 可选轻量复用「本轮选课情况」数据源（篮/已提交记录）
