# 选课管理-学生加退课 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-adddrop-course-picker

## Context

`StudentAddDropView` 课程用 `<select>`；`CourseLibraryImportModal` 提供可复用的搜索表格弹窗，但为多选导入语义。

## Decisions

1. **新组件** `AddDropCoursePickerModal`：布局仿导入弹窗；`courses` 由父组件传入（即现有 `courseOptions`）  
2. **单选**：首列 radio；点行选中；确认 emit `courseId`  
3. **表单触发**：只读 input 显示「代码 — 名称」+「选择」按钮  
4. **列**  
   - 加课/重修：代码、名称、学分、类型、名额状态（有余量/已满）  
   - 退课：代码、名称、学分、教学分组、时间  
5. **标题**：`选择课程`；副标题可带申请类型文案  

## Risks

- [Risk] 与申请弹窗双重 modal 叠层 → Mitigation：picker `z-index` 高于申请弹窗  

## Open Questions

（无）

## 来源：polish-adddrop-label-intake-desc

## Decisions

1. 列表列与表单区块共用菜单口径「加退课/重修申请」。
2. `YYYY/MM` 选项按字符串/年月倒序；`getIntakeOptions` 改为 desc，范围批次随之更新。
3. 不调整「全部」「请选择」占位项顺序（仍在选项列表数据之前由 UI 渲染）。
