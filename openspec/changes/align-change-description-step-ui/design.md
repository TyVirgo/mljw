## 背景说明

`ChangeDescriptionStep.vue` 已在 `add-course-change-application` 变更中实现，功能上支持 MAIN/OTHER COMPONENTS 的 major/minor 标注，但视觉与信息架构与原型不符：

```
当前实现                          原型要求
─────────────────────────────────────────────────────────
┌──────────────┬────────────┐    ┌──────────┬─────────────┬─────────────┐
│ 组件名       │  N    Y    │    │ 组件名   │ Major (N/Y) │ Minor (N/Y) │
│ 单行 hint    │ Major Minor│    │          │ • bullet 1  │ • bullet 1  │
└──────────────┴────────────┘    │          │ • bullet 2  │ • bullet 2  │
                                   └──────────┴─────────────┴─────────────┘
```

数据层 `changeDescriptionComponents` 目前只有 `key / label / hint` 单字段，无法承载原型中每列独立的判定标准列表。

## 目标 / 非目标

**目标：**

- 三列表格布局严格对齐原型（表头 + 行分隔线 + 组件名列浅灰背景）
- 每行 Major / Minor 列各自展示 bullet criteria 文案（来自原型）
- Pill Toggle Switch 互斥选择（Y = 选中该列，N = 未选中）
- 分区标题左侧蓝色竖条（`border-left: 3px solid #2563eb`）
- 只读模式展示相同表格结构，高亮已选列
- 数据模型 `changeDescription` 不变（仍为 `{ [key]: 'major' | 'minor' }`）

**非目标：**

- 不改变 Step 2–4 向导逻辑
- 不新增变更组件项
- 不实现按 major/minor 自动路由审批路径
- 不修改列表页或其他模块

## 设计决策

### 1. 数据结构扩展 — `changeDescriptionComponents`

```javascript
{
  key: 'courseName',
  label: 'Course Name',
  majorCriteria: [
    'Change course name to reflect the change in course content.',
  ],
  minorCriteria: [
    'Improve the grammar of the course name.',
    'No change.',
  ],
}
```

- 移除 `hint` 字段，改用 `majorCriteria` / `minorCriteria` 字符串数组
- 文案以原型英文为 key，走 `tr()` i18n
- 10 个组件完整 criteria 见 spec delta

### 2. 组件拆分 — `ChangeLevelToggle.vue`

抽取可复用 pill toggle 子组件：

```
┌─────────────────────────┐
│  [N]────○  或  [Y]────●  │  ← 44×24px pill, active=#2563eb
└─────────────────────────┘
```

Props: `active: Boolean`, `disabled: Boolean`（readonly 时）
Emit: `toggle`

每行渲染两个 toggle（major / minor），点击 active=false 的列时 emit 切换；点击已 active 列无操作（保持互斥选中）。

### 3. 表格布局 — CSS Grid

```html
<div class="change-table">
  <div class="table-header">...</div>   <!-- 3 cols: 1fr 1fr 1fr -->
  <div class="table-row">...</div>
</div>
```

- `grid-template-columns: minmax(180px, 1fr) 1fr 1fr`
- 表头：Major Changes / Minor / No Changes 居中
- 组件名列：`background: #fafafa`
- 行间：`border-bottom: 1px solid #e5e7eb`
- criteria bullets：`font-size: 12px; color: #6b7280; list-style: disc; padding-left: 16px`

### 4. 只读模式

- 隐藏 toggle，在选中列顶部显示蓝色 badge「Y」，未选中列显示灰色「N」
- 或保留 toggle 外观但 `pointer-events: none` + 仅 active 列高亮（与原型 detail 态一致）

**决策**：保留 toggle 视觉、禁用交互，active 列蓝色 — 与编辑态一致，减少两套样式。

### 5. i18n 策略

- criteria 文案 key 格式：`changeDesc.<key>.major.0`, `changeDesc.<key>.minor.0` 等
- 或在 data 层直接用英文句子作为 tr key（与项目现有 `tr('Course Name')` 模式一致）
- **选择**：英文句子作 key（与现有 `changeDescriptionComponents` label 一致），中文写入 `zh-flat.js`

## 风险与应对

| 风险 | 缓解 |
|------|------|
| criteria 文案较长导致行高不一致 | 三列 `align-items: start`; 组件名列垂直居中 |
| 移动端窄屏三列挤压 | 本系统为桌面教务后台，暂不做响应式折叠 |
| 与 add-course-change-application tasks 3.2 重复 | 本变更 supersede 该 task 的 styling 部分 |

## 迁移说明

纯 UI 重构，无数据迁移。已存 mock 数据的 `changeDescription` 字段兼容。

## 待定问题

（无 — 原型 criteria 文案已完整）
