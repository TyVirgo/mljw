## Context

学生加退课/重修申请入口在 `StudentAddDropView.vue`：弹窗为扁平两列表单（学年学期、类型、选课、说明、退费抵免、附件），详情由 `AddDropApplicationDetailBody` 展示。学籍异动申请（如 `DefermentFormModal.vue`）已形成稳定范式：顶部 Notes、`section-bar` 灰条分节、`form-grid` 两列、声明黄框勾选。校方 PDF《Online COURSE ADD_DROP_RETAKE APPLICATION FORM》规定 Add/Drop/Retake 分别填写 I+II+V / I+III+V / I+IV+V，且每节一门课。

约束：Vue 3 原型 + mock/localStorage；文案走 i18n；不接真实后端。

## Goals / Non-Goals

**Goals:**

- 申请弹窗与详情按 PDF 分节展示，样式对齐异动申请。
- 按申请类型条件渲染 II / III / IV；I 与 V 始终出现。
- 关键字段可演示提交与详情回看；选课回填课号/组/时段/教师等只读信息。

**Non-Goals:**

- 不复刻 Microsoft Forms 的「是否继续填下一节」串联问卷。
- 不改审批流、窗口期、白名单、账单逻辑。
- 不取消 AddDrop 联合类型。

## Decisions

### 1. 一页多分节，不用步骤向导

- **选择**：与异动一致的纵向滚动 + `section-bar`。
- **备选**：Stepper（Add→填→下一步）——与学籍心智不一致，否决。

### 2. 类型驱动显隐，而非 PDF Yes/No 链

| 类型 | 可见节 |
|------|--------|
| Add | I, II, V |
| Drop | I, III, V |
| Retake | I, IV, V |
| AddDrop | I, III, II, V |

切换类型时清空被隐藏节的业务字段，保留 I（联系电话等）与学年学期。

### 3. 组件拆分

建议结构（可按实现微调）：

```
StudentAddDropView（弹窗壳 + 提交）
  └─ AddDropApplicationForm（或内联）
       ├─ Notes callout（图示1四条）
       ├─ Section I 学生信息
       ├─ Section II / III / IV（v-if）
       └─ Section V 声明（对齐 MovementDeclarationSection 视觉）
```

详情：`AddDropApplicationDetailBody` 按相同分节灰条只读展示；审批详情同步。

样式：局部复用 `movement-form.css` 的 section-bar / form-grid / declaration，或复制等价 scoped 规则，避免硬绑学籍组件 props。

### 4. 字段映射（一期必做）

| 节 | 字段策略 |
|----|----------|
| I | 学号/姓名只读（当前学生）；联系电话可填*；学年学期、申请类型可放 I 顶或 Notes 下公共区 |
| II | 选课器选加课*；回填课号课名组、Day/Time/Venue、Lecturer；加课类型下拉*；附件可选 |
| III | 选课器选退课*；回填课信息；退课原因*；退费抵免*；附件（超期必填规则保留） |
| IV | 曾修课号课名*、成绩*、曾修学期*、重修类型*；本学期重修课选课*并回填时段/教师 |
| V | 声明文案 + 勾选*；未勾选不可提交 |

demo 下拉选项可用静态枚举（Add/Retake Type、成绩、学期）。

### 5. Payload 扩展

在现有申请对象上扩展可选字段（如 `contactPhone`、`addType`、`dropReason`、`retake*`、`declarationAgreed`、回填快照 `scheduleText`/`lecturers` 等），旧 demo 记录缺字段时详情显示「—」，不破坏列表。

### 影响文件（预期）

- `src/views/courseRegistration/student/StudentAddDropView.vue`
- `src/components/courseRegistration/AddDropApplicationDetailBody.vue`（及审批详情 body 若分离）
- `src/data/courseRegistration/*addDrop*`（提交/校验/demo）
- `src/i18n/locales/zh.js`、`en.js`
- 可选新建：`AddDropApplicationFormSections.vue`、`addDropFormOptions.js`

## Risks / Trade-offs

- **[弹窗变长]** → 保持 modal-body 可滚动；分节标题便于定位。
- **[字段与旧 demo 不一致]** → 兼容缺省；必要时刷新种子数据。
- **[样式与选课页混用异动 CSS]** → 优先抽共享 class 或复制最小规则，避免牵动学籍。
- **[AddDrop 与 PDF 不完全同构]** → 明确为本地扩展，Notes 中可一句说明联合加退填 III+II。

## Migration Plan

纯前端原型：部署即生效；回滚为还原本变更文件。无需数据迁移脚本；localStorage 旧单可只读降级展示。

## Open Questions

- 学年学期/申请类型放在 Section I 内还是分节之上的「公共头」——实现时优先放公共头（先选型再出节），与异动「先选学生再填节」类似。
- Course Add/Retake Type 的正式枚举待业务确认；一期用 demo 占位选项即可。
