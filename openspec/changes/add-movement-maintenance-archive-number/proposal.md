## 背景与动机

异动维护页需为已通过审批的记录编制 **文号**（`exportArchiveNumber`），用于 PDF/附件导出文件名前缀。此前未填文号时系统会随机生成归档号，与产品要求不符。

## 变更内容

- 维护列表新增 **文号** 列（**学号列前一列**），未填显示 `NA`
- 行操作最左侧新增 **修改文号** 按钮，弹窗输入文号（1–100 字符，仅英文字母与数字）
- 取消 `stableRandomArchiveNumber` 自动随机；未填文号时 PDF/附件文件名前缀为 `NA.`
- 已填文号写入 store `exportArchiveNumber`，导出 PDF 使用该值拼接文件名

## 能力范围

### 修改的能力

- `movement-maintenance`：文号列、修改文号行操作与弹窗
- `movement-application-details`：PDF/附件文件名归档前缀规则（仅手动文号，无随机）

## 影响范围

- `MovementMaintenanceView.vue`、`MovementArchiveNumberModal.vue`
- `movementMaintenanceQueue.js`、`movementMaintenanceFields.js`
- `movementExportNames.js`、`movementArchiveNumber.js`
- i18n

## 非目标

- 查询页不加文号列/按钮
- 不改 `movementNumber`（异动编号）字段
