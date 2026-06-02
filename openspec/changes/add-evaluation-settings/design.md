## Context

项目为 Vue 3 + Vite 单页应用。Lecturer Info 下已有 **Lecturer Information**（列表 + CRUD，`requiresEvaluation` 字段与筛选开关已实现），**Evaluation Settings** 菜单项与 i18n 已存在但未注册到 `developedPages`。

静态设计（图 1）为**单页配置表单**，非列表页：顶部蓝色信息条 + 两个配置区块 + 底部 Save。Category 下拉选项与 `lecturers.js` 中 `categoryOptions` 一致（Full-time Lecturer、China Seconded Lecturer、Student Teaching Assistant、Part-time Lecturer）。

## Goals / Non-Goals

**Goals:**

- UI 与中英文原型对齐：字段、布局、按钮文案、Toggle 位置
- 支持 New Lecturer 全局开关与多条 Category Change 规则（from / to / delete / enabled）
- Save 持久化配置；可选轻量 mock 演示效果（不过度实现规则引擎）
- 完整 i18n（`tr()` / labelKey），与 University Info 等配置页一致

**Non-Goals:**

- 搜索、分页、导出
- 后端 API、人事系统实时事件订阅
- Senate Unit Members Management 菜单
- 规则变更历史/审计日志
- 在 Evaluation Settings 页直接展示教师列表

## Decisions

### 1. 页面结构 — 对齐 University Info 配置页

```
EvaluationSettingsView.vue
├── page-card
│   ├── info-banner（全局提示）
│   ├── section: New Lecturer（标题 + 描述 + 右侧 Toggle）
│   ├── section: Change in Lecturer Category
│   │   └── rule-row × N（from select + to select + 文案 + Delete + Toggle）
│   ├── btn + Create
│   └── footer: Save（右对齐）
```

**理由**：与现有 Basic Data 配置页（白卡片、section 分隔）一致，无 table/search 模板。

### 2. 数据模型

```javascript
// evaluationSettings.js
{
  newLecturerEvaluationEnabled: boolean,  // 全局新入职评估开关
  categoryChangeRules: [
    {
      id: string,
      fromCategory: string,   // categoryOptions 之一或 ''
      toCategory: string,
      enabled: boolean,
    },
  ],
}
```

默认 mock（对齐原型）：

| from | to | enabled |
|------|-----|---------|
| Part-time Lecturer | Full-time Lecturer | true |
| Student Teaching Assistant | Full-time Lecturer | true |

持久化：`localStorage` key `evaluation-settings-v1`；load 时 merge 默认值。

### 3. Toggle 组件

原型为**蓝色 ON/OFF 滑块**（非 Y/N 字母）。优先复用 `YnSwitch` 的视觉尺寸，或新增轻量 `EnableSwitch.vue`（纯蓝底滑块、无 Y/N）以贴近设计图。

New Lecturer 与每条 category rule 各一个 Toggle，右对齐于行尾。

### 4. 规则行交互

- **+ Create**：`push` 新规则 `{ id, fromCategory: '', toCategory: '', enabled: true }`
- **Delete**：点击后弹出 `ConfirmDialog` 二次确认，确认后移除该行；允许规则列表为空
- **Save 校验**（轻量）：
  - enabled 的规则须 from ≠ to 且两者均已选择
  - 不允许重复 (from, to) 组合

### 5. 规则应用（mock，轻量演示）

**产品确认**：首版以**页面呈现效果**为主，不实现复杂规则引擎。

保存时可选调用轻量 `applyEvaluationRules(lecturers, settings)`，仅做简单演示：

1. **新入职**（产品定义）：**有入职时间**（`dateOfJoining` 有值）**且没有任何授课记录**  
   - mock 字段：`hasTeachingRecord: false`（或等价布尔字段）；**不**仅用 `Currently Teaching: No` 代替「无授课记录」
   - 当 `newLecturerEvaluationEnabled` 为 true 时，满足上述条件的 lecturer 可标为 `requiresEvaluation: true`
2. **类型变更**：对 mock 中已有 `previousCategory` 且匹配 enabled 规则 from→to 的教师，标为 `requiresEvaluation: true`
3. 其余教师保持原 mock 值或不变；**不要求**全量精确重算

**替代方案**：完整 HR 事件驱动规则引擎 — 留作后端对接阶段。

### 6. 文案与 i18n

| EN | ZH |
|----|-----|
| Evaluation Settings | 评估设置 |
| New lecturer or lecturer category change triggers… | 新入职教师或教师类型变更会触发教师评估需求。 |
| New Lecturer | 新入职教师 |
| New lecturers without any teaching experience… | 新入职且无教学经验的教师，需进行教师评估。 |
| Change in Lecturer Category | 教师类型变更 |
| Category change from {from} to {to} requires teacher evaluation… | 教师由 {from} 变更为 {to} ，需进行评估。 |
| Delete | 删除 |
| + Create | + 新增 |
| Save | 保存 |

规则行中间文案用插值模板 + `tr()`。

### 7. 注册

- `menu.js` → `developedPages.add('evaluation-settings')`
- `App.vue` → `EvaluationSettingsView` 分支

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 无真实「类型变更事件」 | mock 用 `previousCategory` 字段演示；后端对接后由 HR 事件驱动 |
| 规则引擎简化 | 首版以 UI + 配置持久化为主；列表标记仅轻量演示 |
| Toggle 样式与原型细微差异 | 实现时对照设计图微调 CSS |

## Migration Plan

纯前端新增。部署后验证菜单 Evaluation Settings 可访问、Save 持久化、Delete 二次确认正常。

## Resolved

1. **新入职判定**：有入职时间（`dateOfJoining`）且没有任何授课记录（mock：`hasTeachingRecord === false`）。
2. **规则复杂度**：首版不过度实现逻辑，以页面呈现效果为主。
3. **Delete 规则**：必须使用 `ConfirmDialog` 二次确认。
