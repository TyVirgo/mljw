## 背景与动机

知情同意书模块在 Phase 2.1（§11）将版本历史改为 Save 驱动的只读审计日志，附件与学期均在新增/编辑弹窗维护，与产品期望的「组合维度 + 版本快照」模型不符。产品需要按 **异动类别 × Student Type × 学历层次** 维护配置行，在 **版本快照** 中按 **生效学年学期** 管理学生/家长同意书附件，且列表 Edit 仅改名称与批注。

**2026-06 补充（Phase 2.2）**：生效学年学期与是否应用均归属版本快照维护；Create 仅建配置行，不在新增时选学期；新增版本时可选择是否立即应用（默认否）。

## 变更内容

### 新增弹窗（Create）

- 字段 **5 项**：知情同意书名称、适用异动类别、Student Type、学历层次、批注（**不含** 生效学年学期）
- 布局：**2 行 × 2 列**（名称 / 异动类别 / Student Type / 学历层次）+ 批注（可占满一行或置于第二行右列）
- **移除** 学生/家长知情同意书上传区
- Save 时 **仅创建配置行**，`versions[]` 初始为空；用户进入版本快照后再新增版本

### 编辑弹窗（Edit）

- **仅允许修改** 知情同意书名称、批注
- Save **不追加** 版本快照

### 版本快照（原「历史版本」）

- 列表操作：**编辑 | 版本快照**（**移除 View**）
- 「**新增版本**」按钮位于 **表格上方左侧**（非 header 右上角）
- 表格列：生效学年学期、变更人、附件（文件名 + 预览小眼睛）、更新时间、**应用**（`YnSwitch` 互斥开关，非 checkbox）
- 「新增版本」子弹窗：生效学年学期（必选）、学生同意书（必传）、家长同意书（可选）、**是否立即应用**（开关，**默认关闭**）
- Save 新增版本：若「立即应用」开启则 `isApplied=true` 且其余版本 false；否则 `isApplied=false`（**不再**因「尚无已应用版本」而自动应用）
- 快照表内 Apply 列开关仍可事后切换，全局互斥

### 列表与 Mock

- 主列表 **去掉 View 按钮** 及查看弹窗入口
- Mock 种子 **12 条配置行备注各不相同**，便于列表展示

### 数据层

- `createConsentForm`：不再接受 `effectiveAcademicSession`，不创建首版 snapshot
- `addConsentFormVersion(configId, payload)`：接受 `applyImmediately`（默认 `false`）
- 校验：同学期不可重复；新增版本必须上传学生同意书
- `resolveConsentTemplate` 仍读全局已应用版本

### i18n

- `versionSnapshot.applyImmediately`：是否立即应用
- 保留 `versionSnapshot.*` 其余文案

## 能力范围

### 修改的能力

- `consent-form-config`：Create 五字段无学期、版本仅在快照创建、新增版本可选立即应用、列表无 View、快照 UX 细化

## 影响范围

- **修改**
  - `ConsentFormFormModal.vue` — Create 去掉学年学期，5 字段布局
  - `ConsentFormVersionFormModal.vue` — 增加「是否立即应用」开关
  - `ConsentFormVersionHistoryModal.vue` — 新增版本按钮位置、YnSwitch 应用列
  - `ConsentFormView.vue` — 移除 View；操作列 Edit | 版本快照
  - `consentForms.js` — create/addVersion 语义调整
  - `i18n` 文案
- **不再使用（可保留文件）**
  - `ConsentFormViewModal.vue` — 列表无 View 入口

## 非目标（本变更不做）

- 恢复按申请 `applicationSession` 四维 lookup
- 版本快照内 Edit/Delete 已有版本
- 真实后端 API
- 主列表展示生效学年学期列
