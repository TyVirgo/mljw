# 选课管理-缴费名单 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-fee-roster-maintenance

## Decisions

1. Tab：未缴费 / 已缴费。
2. 是否欠学费：tip「来自学籍模块…」；Y/N 胶囊。
3. 选课学年学期：未缴费主表列 + 搜索；导出 Sheet1 含该列。
4. **未缴费同步**：按钮「同步」替代 Excel「导入扩名单」；点击先确认，再写入超学分学生（来源：选课监控演示池）；`entrySource: 'sync'`；页面内成功/失败提示。
5. **未缴费新增**：只选学生；学年学期静默取活跃批次/选项首项；搜索 3×2（含入学批次）；`entrySource: 'manual'`。
6. **已缴费导入**：学号回写，从未缴费移入已缴费（语义不同，保留）。
7. 列表聚合：`enrolledCredits > creditMin` **或** `entrySource` 为 `manual`/`import`/`sync` 均展示。
8. 工具条布局：左按钮组、右统计；未缴费顺序：新增 / 同步 / 导出。
9. 选课数量 = 有课程代码的副表行数。

## File Impact

```
src/views/courseRegistration/FeeRosterView.vue
src/data/courseRegistration/feeRosterQueue.js
src/components/courseRegistration/FeeRosterUnpaidAddModal.vue
src/components/courseRegistration/FeeRosterPaidImportModal.vue
src/i18n/locales/zh.js / en.js
```

## 来源：align-fee-source-drop-attachment

## Decisions

1. 课程来源取值：`preselect` | `main` | `supplement` | `admin`；文案复用批次轮次与 `courseSourceAdmin`；兼容旧值 `student`→按第二轮展示。
2. 退课附件选填；仅 `Drop` 显示；提交时有文件名则写入 `attachments: [{ name }]`。
3. 申请窗口关闭：页头 tip + 点击「发起申请」提示「不在申请时间范围内」且不打开表单；提交路径继续拦截。

## 来源：polish-fee-roster-import-paid-tab

## Decisions

1. 导入按钮仅已缴费 Tab；未缴费仅导出。
2. 模板表头：学号、学生姓名、入学批次、选课学年学期、课程缴费状态；示例行 + 弹窗说明「示例模板，请替换为实际数据」。
3. 导入仍按学号匹配未缴费并移入已缴费；课程缴费状态列作对照，不强制校验枚举。
4. `menu.crFeeRoster` 改为「缴费名单管理」/ Fee Roster Management。
