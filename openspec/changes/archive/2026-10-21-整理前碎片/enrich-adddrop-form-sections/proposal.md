## Why

学生加退课/重修申请表单目前字段偏简、扁平排布，与校方《Online COURSE ADD_DROP_RETAKE APPLICATION FORM》要求的 Section I–V 结构差距大，且三类申请共用同一套字段，容易误填。需按 PDF Notes 按类型展示对应章节，并沿用学籍异动申请的多 Section 灰条表单样式，提升原型可演示性与后续对接一致性。

## What Changes

- 发起申请弹窗改为「Notes + 多分节（灰条 section-bar）+ 声明」结构，视觉与交互对齐学籍异动申请（一页滚动，非步骤向导）。
- 按申请类型条件渲染章节：
  - **Add** → Section I + II + V
  - **Drop** → Section I + III + V
  - **Retake** → Section I + IV + V
  - **AddDrop**（本地扩展）→ Section I + III + II + V
- 补齐各节关键字段（联系电话、课号/组/时段地点/教师、加课/重修类型、退课原因、曾修课成绩与学期、声明勾选等）；课信息优先由选课器回填为只读。
- 保留并归位现有本地字段：退费抵免、附件（挂在 Drop/相关节）；申请说明与 PDF 退课原因等对齐。
- 学生端详情抽屉与管理端详情同步按 I–V 灰条分区展示已填内容。
- 中英文 i18n 补齐分节标题、Notes、字段与声明文案。

### Non-goals

- 不整页复刻 Microsoft Forms 逐步问卷链（主类型 +「是否退课」已覆盖加退/重修退）。
- 不改造审批流、账单规则或后端接口契约（原型 mock 即可）。
- 不新增审批节点或改变加退课窗口/白名单准入逻辑。
- 不强制取消现有 **AddDrop** / **RetakeDrop** 联合类型（由主类型 +「是否退课」推导，不单独作 Tab）。

## 增量（2026-09）：主类型三选一 + 是否退课

- 列表去掉类型 Tab；公共列混合展示全部申请。
- 表单主类型仅 **加课 / 退课 / 重修**；加课或重修后确认是否同时退课（是 → 展开退课节 → `AddDrop` / `RetakeDrop`）。
- 同一申请禁止加课与重修并存。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `course-registration`：学生加退课/重修申请表单与详情改为 PDF 分节结构，并按申请类型显隐 II/III/IV；声明 Section V 为提交前置条件；列表去 Tab、公共列。

## Impact

- 视图：`StudentAddDropView.vue` 申请弹窗主体重构
- 组件：可抽取加退分节表单子组件；详情 `AddDropApplicationDetailBody` / 审批详情同步分区
- 数据：`studentAddDrop`（或等价）申请 payload / demo 种子字段扩展
- 样式：复用或对齐 `movement-form.css` 的 `section-bar` / `form-grid` / 声明黄框模式
- i18n：`zh.js` / `en.js` 中 `courseRegistration.student`（及详情相关键）
