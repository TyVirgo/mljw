## Context

`FeeRosterView` 工具栏现有导出 + 导入（打开 `FeeRosterPaidImportModal`）。

## Goals / Non-Goals

**Goals:** 页面不再展示导入按钮与弹窗挂载。

**Non-Goals:** 删除 `FeeRosterPaidImportModal` / Excel 工具文件。

## Decisions

1. 从 `FeeRosterView` 移除导入按钮、`paidImportVisible`、`onImported`、弹窗组件引用。

## Risks / Trade-offs

- [弹窗文件成死代码] → 可接受；需恢复时再挂回
