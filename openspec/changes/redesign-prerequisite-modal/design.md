## 背景说明

`CoursePrerequisiteModal` 被 Course Information 与 Course Application 的 Step 1 共用。当前实现为窄弹窗（640px）、实时 filter、三列简易列表，不符合最新原型。

原型 **Add** 弹窗特征：

```
┌────────────────────────────────────────────────────────────────────────── Add ─┐
│ Course Name: [____]  Course Code: [____]  Offering: [▼____]  [Search][Reset] │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ No. │ Course code │ Course Name │ Offering │ Credit Value │ 课程性质      │
│ ☑ │  1  │ PHY101      │ ...         │ SOAIR... │ 2            │ 必修课        │
│ ☑ │  2  │ PHY102      │ ...         │ SOAIR... │ 2            │ 选修课        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Total 6 records          [Home][<][1][>][End]  10 records/page  Jump to [1]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                    [Discard]  [Confirm]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

项目已有 `CourseInformationView` 列表检索 + `TablePagination` 模式，可复用交互范式（draft search vs applied search）。

## 目标 / 非目标

**目标：**

- UI 与原型一致：宽弹窗、三字段检索 + Search/Reset、七列表格、分页、Discard/Confirm
- 保留现有集成契约：`selectedCodes` 字符串 ↔ 多选 courseCode 数组
- Offering 列展示院系英文名（`getOfferingLabel`）；Course Classification 列展示 `tr(courseClassification)`
- 排除 `excludeCode`（当前正在创建/编辑的课程）

**非目标：**

- 修改向导 Step 1 先修课只读输入框 + Choose 按钮布局
- 服务端分页或远程 Search
- 弹窗内排序列头

## 设计决策

### 1. 弹窗尺寸与结构

| 属性 | 值 |
|------|-----|
| `max-width` | `1000px`（可微调，需明显大于现 640px） |
| `max-height` | `calc(100vh - 48px)`，body 内表格区 `flex:1; min-height:0` |
| 标题 | `tr('Add')` |
| 关闭 X | 保留右上角 ×，行为同 Discard |

**理由**：原型表格列多（Offering 名称长），需宽屏；与 `ExportModal` 等大弹窗一致。

### 2. 检索区布局

```javascript
// draft（输入中） vs applied（点击 Search 后生效）
searchDraft = { courseName, courseCode, offering }
searchApplied = { ... }
```

- **第一行 grid**：3 列字段 + 右侧 Search / Reset（与 `CourseInformationView` search-row 类似，标签左对齐、冒号对齐）
- **Search**：`searchApplied = { ...searchDraft }`，`currentPage = 1`
- **Reset**：清空 draft & applied，恢复全量
- 打开弹窗时：恢复 `checkedCodes` 来自 `selectedCodes`，**清空检索**（与列表页 Reset 一致）

过滤逻辑（client-side）：

```javascript
available = courses.filter(c => c.courseCode !== excludeCode)
filtered = available.filter(match applied courseName, courseCode, offering)
paginated = slice(filtered, (page-1)*pageSize, page*pageSize)
```

### 3. 表格与选择

| 列 | 数据源 |
|----|--------|
| Checkbox | `checkedCodes: string[]` |
| No. | 当前页序号 `(page-1)*pageSize + index + 1` |
| Course code | `course.courseCode` |
| Course Name | `course.courseName` |
| Offering | `getOfferingLabel(course.offering, initialDepartments)` |
| Credit Value | `course.credit` |
| Course Classification | `tr(course.courseClassification)` |

- **表头全选**：仅针对**当前页**可见行（与 Course Information 列表一致）；跨页已选保留在 `checkedCodes`
- **半选态**：当前页部分选中时 header checkbox indeterminate
- 空态：`common.noData`

### 4. 分页

复用 `TablePagination`：

- 默认 `pageSize = 10`，options `[10, 20, 50]`
- `total = filteredCourses.length`
- 切换 pageSize 时清空页内选择状态可选（与列表页一致：切换 pageSize 时 `selectedIds` 清空 — 此处**保留** checkedCodes 跨页，仅重置 currentPage）

### 5. 底栏按钮

| 按钮 | 样式 | 行为 |
|------|------|------|
| Discard | `btn-default` | `emit('close')`，不提交 |
| Confirm | `btn-primary` | `emit('confirm', checkedCodes.join(', '))` |

**理由**：原型明确 Discard / Confirm；与 `ConfirmDialog` 主按钮风格一致（圆角 8px）。

### 6. 组件 API（不变）

```vue
<CoursePrerequisiteModal
  :visible="prerequisiteModalVisible"
  :courses="allCourses | allApplications"
  :selected-codes="form.prerequisite"
  :exclude-code="form.courseCode"
  @close="..."
  @confirm="..."
/>
```

### 7. 依赖与数据

- `initialDepartments` from `departments.js` 供 Offering 下拉与 label
- `courseClassificationOptions` 不需要单独下拉（表格只展示）；检索区无 Course Classification 字段（与原型一致）
- Application 向导传入的 `allApplications` 需映射为含 `courseCode`, `courseName`, `offering`, `credit`, `courseClassification` 的对象；若缺字段显示 `--`

## 风险与应对

| 风险 | 缓解 |
|------|------|
| Application 列表项字段与 Course 不完全一致 | 在 modal 内 normalize row shape；缺 offering 显示 `--` |
| 跨页多选 + 全选语义混淆 | 表头全选仅当前页；文档与 spec 明确 |
| 宽弹窗小屏溢出 | `max-width: min(1000px, 100vw - 48px)` + 表格 `overflow-x: auto` |

## 迁移说明

1. 重写 `CoursePrerequisiteModal.vue`
2. 补充 i18n
3. 手动验证 Course Info / Course Application 向导 Choose → Confirm 回写
4. 无数据迁移

## 待定问题

- 原型标题为 **Add**；若业务要求保留「Pre-requisite / co-requisite」，产品可再确认 — **首版按原型用 Add**
