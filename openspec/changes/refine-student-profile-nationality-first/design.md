## 背景说明

学籍 **Student Profile** 新建/编辑抽屉（`StudentProfileFormDrawer.vue`）当前在顶栏提供 Student Category radio（Local / China / International），Basic Info Tab 内国籍为普通文本框。各类别字段显隐已实现在 `BasicInfoTab.vue` 等 Tab 组件中，通过 `form.studentCategory` 驱动。

异动模块 `movementApprovalEngine.inferStudentCategory()` 已有国籍→类别推断：`China` → China，`非 Malaysia` → International，否则 Local。学籍表单尚未复用该逻辑。

## 目标 / 非目标

**目标：**

- 国籍优先：用户先选国籍，系统自动带出学生类别（只读）
- 抽屉分区：**国籍信息** + **信息填写**（七 Tab）
- 新建未选国籍时，信息填写区各 Tab 字段为空
- 可搜索国籍下拉，Malaysia / China 置顶，全球国籍列表
- 编辑改国籍导致类别变化时，确认并清理互斥字段
- 详情 Drawer 布局与表单一致

**非目标：**

- Excel 导入列与 nationality/category 一致性校验（后续迭代）
- 后端 codeSet API
- 异动申请表单 UI 改造

## 设计决策

### 1. 国籍 → 类别映射（单一来源）

在 `src/data/students.js` 新增并导出：

```javascript
export function resolveCategoryFromNationality(nationality) {
  if (!nationality) return ''
  if (nationality === 'Malaysia') return 'Local'
  if (nationality === 'China') return 'China'
  return 'International'
}
```

`movementApprovalEngine.inferStudentCategory()` 改为调用此函数（保留 `studentCategory` 显式值优先）。

**理由**：避免学籍与异动两套规则分叉。

### 2. 布局结构

```
StudentProfileFormDrawer
├── drawer-header（标题）
├── drawer-body
│   ├── section: 国籍信息 (.nationality-section)
│   │   ├── SearchableSelect → form.basicInfo.nationality
│   │   └── 只读 Student Category 标签 ← form.studentCategory
│   └── section: 信息填写 (.entry-section)
│       ├── tab-bar（7 tabs，始终可切换）
│       └── tab-content
│           └── v-if="nationalitySelected" → Tab 组件
│           └── v-else → 空态占位
└── drawer-footer
```

**移除**：顶栏 category radio（`.category-row`）。

**详情 Drawer**（`StudentProfileDetailDrawer.vue`）：同样两段式；国籍与类别只读展示。

### 3. 可搜索国籍下拉

新建 `src/components/common/SearchableSelect.vue`：

- Props: `modelValue`, `options`, `placeholder`, `disabled`
- 输入框过滤 options（case-insensitive substring）
- 点击选项写入 value；键盘 Enter 选首项；点击外部关闭
- 样式对齐现有 `select` / form-control

新建 `src/data/nationalityOptions.js`：

- 导出 `nationalityOptions` 数组（ISO 英文国名，~195 项）
- 导出 `getNationalityOptionsForSelect()`：`['Malaysia', 'China', ...restSortedAlphabetically]`
- Malaysia、China 固定前两位，其余不含重复

国籍值存于 `form.basicInfo.nationality`（与现有 mock 一致）。

### 4. 国籍变更与字段清理

在 `StudentProfileFormDrawer` 中 `watch` nationality：

1. 计算 `newCategory = resolveCategoryFromNationality(nationality)`
2. 若 `newCategory !== form.studentCategory` 且已有旧 category（编辑模式或二次修改）：
   - `window.confirm`（i18n 文案）询问是否继续
   - 确认 → 调用 `clearCategorySpecificFields(form, oldCategory)` 清空互斥 basicInfo 字段，写入新 category
   - 取消 → 回滚 nationality 至上一值
3. 若新建首次选择 → 直接写入 category，无需确认

`clearCategorySpecificFields` 放在 `students.js`：

- Local 清空：icNo, stateOfBirth
- China/International 清空：passportNo, passportExpiry, placeOfBirth, candidateNo, politicalOutlook, identityNoChina（按旧 category 分支）

### 5. 新建默认与空态

- `createEmptyStudent()`：`studentCategory: ''`（不再默认 `'Local'`）
- `nationalitySelected` computed：`!!form.basicInfo.nationality?.trim()`
- Tab 组件接收 prop `nationalitySelected`；为 false 时不渲染 `.form-grid`（显示占位 `studentProfile.form.selectNationalityFirst`）
- Save 校验：`validateStudentForm` 增加 nationality 必填；category 由 nationality 推导，无 nationality 时阻止保存

### 6. Basic Info Tab 调整

- 移除 Nationality 字段行
- 可选：子标题分组「身份信息 / 个人资料」提升可读性（字段顺序：类别专属证件 → 通用个人信息 → 照片）

### 7. i18n

新增 keys（`studentProfile.form.*`）：

- `nationalitySectionTitle`：国籍信息
- `entrySectionTitle`：信息填写
- `selectNationalityFirst`：请先选择国籍
- `nationalityChangeConfirm`：修改国籍将变更学生类别并清空不兼容字段，是否继续？

## 风险与应对

| 风险 | 缓解 |
|------|------|
| 全球国籍列表过长，下拉性能 | 客户端 filter，首屏只渲染过滤结果（上限如 50 条） |
| 编辑改国籍误清数据 | confirm 对话框 + 仅清互斥字段 |
| 导入 Excel 仍含 Student Category 列，可能与 nationality 不一致 | 非目标本期；文档注明后续可加校验 |
| SearchableSelect 无障碍 | 首版保证 click/keyboard 基本可用；aria 可后续补 |

## 迁移说明

1. 实现数据函数与 SearchableSelect、nationalityOptions
2. 改 FormDrawer / DetailDrawer 布局
3. 改 Tab 空态 gate 与 BasicInfoTab
4. 对齐 inferStudentCategory
5. 手动验证：新建三国籍路径、编辑改国籍、详情只读

无数据库迁移；localStorage 既有记录 nationality + studentCategory 已存，打开编辑正常显示。

## 待决问题

（无 — explore 阶段已确认映射规则与空态行为）
