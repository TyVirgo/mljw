## Context

选课结果页已支持管理员「添加特殊学生」：`AdminAddCourseForStudentModal` → 选课 / `AdminAddStudentPickModal` 选人；学生维列表已有 `courseSource` 列与 `feeCourseSourceLabel`，但搜索与筛选未接；学期配置已有 `crossReleaseAt`，结果页第三轮工具栏未展示。

## Goals / Non-Goals

**Goals:**

- 选学生：表头全选当前筛选结果（可跨页）
- 学生维：课程来源下拉筛选
- 代选表单：原因必填、附件可选并写入 demo 数据
- 第三轮课程维工具栏：只读展示互释标签 + 生效时刻

**Non-Goals:**

- 不新增配置侧「描述」字段
- 不改互释容量算法
- 不在结果表新增原因/附件列

## Decisions

1. **全选范围 = 当前筛选后的全部学生（跨页）**  
   比「仅本页」更贴合「一键全部」；实现上对 `filteredRows`（或等价列表）统一勾选/清空。

2. **课程来源枚举复用现有值**  
   `preselect | main | supplement | admin`，展示用 `feeCourseSourceLabel`；`filterStudentResults` 增加 `courseSource` 精确匹配。

3. **原因/附件挂在代选主弹窗**  
   确定时校验原因非空；附件 demo 存 `{ name, size? }` 元数据，随 `addAdminStudentRegistrations` 写入行字段（如 `adminAddReason` / `adminAddAttachment`）。

4. **互释展示数据源**  
   `resolveEffectiveCrossReleaseAt(当前批次)`；文案标签用 `courseRegistration.schedule.crossReleaseAt`；仅 `activeTab==='round' && selectedRound==='supplement'` 时出现在导出按钮旁（对齐 R1 `toolbar-status` 样式）。未配置显示 `—`。

## Risks / Trade-offs

- [全选跨页误勾大量学生] → 确定前仍可取消；重置/重查可清空勾选（保持现有查询重置行为）
- [附件仅元数据无真实上传] → demo 约定，界面可选文件但不持久化二进制
- [单位覆盖互释时刻与列表批次不一致] → 与容量逻辑同源 `resolveEffectiveCrossReleaseAt`，按选中批次解析

## 影响文件

- `src/components/courseRegistration/AdminAddStudentPickModal.vue`
- `src/components/courseRegistration/AdminAddCourseForStudentModal.vue`
- `src/views/courseRegistration/RegistrationResultView.vue`
- `src/data/courseRegistration/registrationResult.js`
- `src/i18n/locales/zh.js`、`en.js`
