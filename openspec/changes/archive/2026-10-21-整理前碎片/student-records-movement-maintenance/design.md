# 学籍管理-异动维护 — 设计要点（合并）

## 文档用途

汇总历史 design 中与本菜单相关的决策与约束，供写需求文档时对照。冲突处以较新变更及当前代码为准。

## 来源：add-movement-list-pdf-preview

# 设计
## PDF 内容范围

与 `MovementApplicationDetailDrawer` 导出根节点一致：

```
MovementDetailContent
+ ProgrammeTransferOfficeUseSection（仅 programme-transfer 且 Approved）
+ MovementApprovalLogTable
```

## 生成流程

```
点击 Preview PDF
    → Modal 打开，离屏渲染 export root
    → html2canvas + jsPDF → blob URL
    → iframe 预览
    → Download 触发 blob 下载（buildMovementFormPdfFilename 命名）
```

## UI

```
操作列：[详情] [Preview PDF]

Modal：
┌─ PDF Preview ─────────────────────┐
│ subtitle: applicationId · name    │
│ ┌───────────────────────────────┐ │
│ │ iframe (pdf blob)             │ │
│ └───────────────────────────────┘ │
│              [Download PDF] [Close]│
└───────────────────────────────────┘
```

## 来源：add-movement-maintenance

## 背景说明

`add-movement-approval-app` 已实现四 Tab 合并审批队列（`movementApprovalQueue.js` + `MovementApprovalView`），store 中已有 `implemented` 占位（Approved → Pending）。`sr-movement-maintenance` 菜单占位但未实现。

产品图示1–3 要求：**Approved 异动申请的教务实施宽表**，搜索/分页对齐审批页，扩展列偏转专业，尾部维护字段 + 三个下钻。

## 目标 / 非目标

**目标：**

- 合并四 Tab **Approved** 记录为单一维护列表（图示1–3）
- 搜索、分页、宽表横向滚动
- 实施 / 修改异动编号 / Export / Delete
- Edit（维护字段）、Details（复用 ReviewView）、Approval log（复用 LogModal）
- 扩展 store 维护字段 + 6 条 mock 种子
- 学生Type 列用 Local / Chinese / International（中文 UI「中国」）

**非目标：**

- 后端 API、真实学籍写入
- 异动查询/统计
- 非 Approved 状态进入维护列表
- 重新审批已实施记录

## 设计决策

### 1. 队列层 — `movementMaintenanceQueue.js`

```javascript
// 模式同 movementApprovalQueue.js
export function mergeMovementMaintenanceQueue(t) {
  // 四 Tab store → filter status === 'Approved'
  // normalizeMaintenanceItem(sourceKey, item, t)
}

export function filterMaintenanceBySearch(items, search) {
  // academicSession, movementReason, status, studentId, studentName
}
```

`normalizeMaintenanceItem` 在 queue 项上附加：

| 字段 | 来源 |
|------|------|
| queueKey | `${sourceKey}:${id}` |
| movementDate | `item.movementDate` 或 `submittedAt` |
| passportIc | `nricPassport` 等 |
| studentType | `inferStudentCategory(item)` → 展示映射 Chinese |
| intake | `currentIntake` / type-specific |
| currentSchool / currentProgrammeCode | enrollment 或 record 字段 |
| newSchool / newProgrammeCode / newProgrammeName | PT: adminNewProgramme 解析；其它「—」 |
| englishName | `fullName` |
| cgpa / expectedGraduationTime / movementNumber / remark | 维护字段 |

### 2. Store 扩展字段（四 Tab 共用 shape 子集）

```javascript
{
  movementNumber: '',      // 异动编号
  cgpa: '',
  expectedGraduationTime: '',
  maintenanceRemark: '',     // 列表 Remark（区别于申请 detailedReason）
  movementDate: '',        // 异动日期 ISO 或 display string
  implemented: 'Pending' | 'Implemented' | '—',
}
```

写回：`updateMaintenanceFields(sourceKey, id, patch)` → `upsertInStore`

批量实施：`implementMaintenanceRecords(rows[])` → 设 `implemented: 'Implemented'`

### 3. UI 结构

```
MovementMaintenanceView.vue
  ├── .search-bar（5 条件，同审批）
  ├── .toolbar（实施 · 修改异动编号 · Export · Delete）
  ├── .table-wrap（超宽 table，sticky Actions 列）
  └── modals:
        MovementMaintenanceEditModal.vue
        MovementMaintenanceNumberModal.vue
        MovementApprovalReviewView.vue      // Details
        ApprovalLogModal.vue
        ConfirmDialog.vue
        ExportModal.vue（可选，或 alert mock）
```

列表布局参考 `MovementApprovalView.vue`；搜索复用 `list-page-search.css`。

### 4. Edit vs Details

| 操作 | 组件

## 来源：add-movement-maintenance-archive-number

## 字段

复用 store 字段 `exportArchiveNumber`，与 `buildMovementFormPdfFilename` / `buildMovementAttachmentExportFilename` 一致。

## 列表布局

```
状态 | 审批环节 | 实施 | 文号 | 学号 | 姓名 | … | 操作（修改文号 | 详情 | 导出 PDF）
```

文号列位于 **学号列前一列**（实施状态之后）。

## PDF 命名

```
resolveMovementExportArchiveNumber(item):
  status !== Approved → 'NA'
  exportArchiveNumber 有值且非 'NA' → 使用该值
  否则 → 'NA'

文件名：{文号}. {学号} {姓名} - {表单类型}.pdf
```

## 校验

`^[A-Za-z0-9]{1,100}$`，保存前校验，失败提示 `movementMaintenance.archiveNumberInvalid`。

## 弹窗

`MovementArchiveNumberModal` 单行编辑，展示学号·姓名副标题，Cancel / Save。

## 来源：refine-movement-maintenance-pdf-action-label

## 决策

维护与查询列表 PDF 按钮文案分化：

| 页面 | i18n key | 中文 | 行为 |
|------|----------|------|------|
| 异动维护 | `movementExport.exportPdf` | 导出 PDF | 打开 PDF 预览弹窗 |
| 异动查询 | `movementExport.previewPdf` | 预览 PDF | 打开 PDF 预览弹窗 |

两者共用 `MovementDetailPdfPreviewModal`，仅入口标签不同。

## 修复

将 `t('movementExport.')` 修正为 `t('movementExport.exportPdf')`。

## 来源：refine-movement-maintenance-query-list-columns-search

# 设计
## 列顺序

固定：状态、审批阶段、是否实施、学号、姓名、国籍、异动类别、生效学期、生效日期  
尾部：护照/IC、国籍类别(studentType)、Intake、申请学年学期、异动原因

## 搜索

studentId、studentName、movementType、effectiveSession、effectiveDate、status、implemented、nationality、studentCategory

## 搜索区布局（对齐 StudentProfileView）

```
┌─ 主行 ─────────────────────────────────────────────┐
│ 学号 | 姓名 | 异动类别 | 生效学期     [查询][重置][更多] │
└────────────────────────────────────────────────────┘
┌─ 展开行（默认收起）───────────────────────────────┐
│ 生效日期 | 审批状态 | 是否实施 | 国籍 | 国籍类别      │
└────────────────────────────────────────────────────┘
```

- 使用 `list-page-search.css` 统一布局
- 查询/重置按钮带 SVG 图标；文本输入支持 Enter 触发查询
- `searchForm` / `appliedSearch` 分离，仅点击查询或 Enter 时应用筛选

## 导出

`movementMaintenanceExportColumnMeta` 与主表 key 顺序一致；查询 optional 列仍接在后。
