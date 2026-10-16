## 1. 隐藏缴费名单菜单

- [x] 1.1 从 `courseRegistrationMenu.js` 过程组 children 移除 `cr-fee-roster`（developedPages 保留）

## 2. 导出缴费数据与字段

- [x] 2.1 新增审批缴费导出行字段定义与 format 函数（课级：学号/姓名/申请单号/账单/课程/学分/缴费状态/金额可选）
- [x] 2.2 基于历史筛选行 + `getApplicationBillDetail` 展开课行列表的收集函数

## 3. 审批页 UI

- [x] 3.1 历史 Tab 工具栏增加「导出缴费」+ ExportModal（与申请导出并存）
- [x] 3.2 无课行时 alert 无数据；有数据则下载 xlsx
- [x] 3.3 i18n 中英文按钮与缴费状态文案

## 4. 验收

- [x] 4.1 侧栏无缴费名单；历史可导出已缴/未缴课行；原导出仍可用

## 5. 按申请合并 + SST/总费用（增量）

- [x] 5.1 collect 写入整单 SST、总费用；字段与 format 补齐
- [x] 5.2 导出支持按申请号合并身份/账单/SST/总费用单元格
- [x] 5.3 提案/design/spec 同步；验收多课同行合并
