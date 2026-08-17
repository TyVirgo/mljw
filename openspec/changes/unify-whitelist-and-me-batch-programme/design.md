# 设计：unify-whitelist-and-me-batch-programme

## Context

- 现菜单「补注册」`cr-supplement` + `supplementListQueue`（canAdd/Drop/Retake、整行 24h×2 邀请）。
- 旧 `WhitelistView` / `whitelistQueue` 仍有类型（学分溢出、先修例外等），但未挂侧栏。
- 加退窗外闸门已部分读补注册名单（`getAddDropAccess` 等）。
- 批次表单有 `type`（GE/ME/…），无 ME 级必选 `programme`。
- 前序 `refine-freshman-adddrop-supplement-timetable` 已定：白名单/补注册只开门、24h 起算点等；本包在命名与模型上升级，并吸收 8.6 会议口径。

## Goals / Non-Goals

**Goals**：白名单统一菜单与权限模型；分权限时效；窗外正常申请；先修破例仅加课申请；加课不破容量；ME 批次必选专业。

**Non-Goals**：见 proposal。

## Decisions

### 1. 菜单与页面合并

```
侧栏：补注册 → 白名单（同一 page id 可保留 cr-supplement 以免大改路由，
      或改为 cr-whitelist；推荐改 id 为 cr-whitelist，旧 id 别名兼容一期）

页面：以补注册列表为壳，扩展权限列 / 分权限时效 / 类型筛选；
      回收旧 Whitelist 类型语义进权限勾选，避免两套列表。
```

文案：中英「白名单 / Whitelist」；权限标签保留「补注册」作为权限名。

### 2. 权限模型（多选）

| 权限 key（建议） | 含义 |
|------------------|------|
| `supplement`（补注册） | 窗外可交加退/重修申请（需再配具体 A/D/R） |
| `canAdd` | 允许加课申请 |
| `canDrop` | 允许退课申请 |
| `canRetake` | 允许重修申请 |
| `bypassPrerequisite` | 加课申请免先修（建议可绑 `courseCodes[]`） |
| `bypassCreditMin` / `bypassCreditMax` | 可选：突破学分下限/上限 |

规则：

- 「补注册」通常与 `canAdd`（或 D/R）同开；仅勾补注册无 A/D/R 时，原型可提示须至少选一种申请类型。
- 学生闸门：窗外 + 白名单有效 + 对应申请类型权限 → 允许打开表单并提交该类型。

### 3. 分权限时效

```
permissions: [
  {
    key: 'supplement',
    validHours: 24,          // 默认 24；可改
    inviteSentAt, deadlineAt,
    inviteAttempt,
    status: idle|active|expired
  },
  {
    key: 'bypassPrerequisite',
    validHours: null,        // null + validUntil = 学期末
    validUntil: '2026-01-31T17:00:00',
    ...
  }
]
```

- **默认**：每个权限 `validHours = 24`。
- **特殊**：可改小时数，或改为「截至某日/学期末」（`validUntil`）。
- **发送邀请**：对「需邀请才激活」的权限（默认 `supplement` 及申请类）写入 `inviteSentAt`，按该权限 `validHours`/`validUntil` 算截止；再次开放增加 attempt。
- **先修豁免**：默认可演示为 24h，demo 另备一条「至学期末」样例证明可配。

整行不再只有一个全局 deadline；列表可展示「最近到期权限」摘要。

### 4. 边界：交表 vs 审批 vs 容量

```
白名单有效
    → 允许提交申请（交表）
         → 审批（AC/流程）
              → 容量：申请选组时 enrolled < capacity，否则不可选/不可过
              → 缴费：超毕业学分/重修等仍走缴费名单（若适用）
```

加课申请选课/选组：**禁止**因白名单而突破 `section.capacity`（或课程总容量）。与「管理员后台强行加课」区分；本包学生申请路径一律守容量。

### 5. 先修路径

```
在线选课（GE/ME 轮次）
  → 始终校验先修（白名单不静默关闭）
  → 选不了 → 学生联系教务
       → 教务加白名单（bypassPrerequisite ± 指定课 + canAdd）
       → 学生走加退课「加课申请」（窗外则还需 supplement）
       → 申请侧跳过该课先修；容量仍校验
```

### 6. ME 批次专业字段

```
type === 'GE'  → 不展示 / 不校验 programme
type === 'ME'  → 必填 programme（专业代码，选项来自既有专业字典）
Mandatory      → 本期：与 GE 相同不强制专业（若产品后改再开）
```

保存后列表列「专业」仅 ME 显示；学生选 ME 批次时可用该字段辅助过滤（原型：与现有 scope 并存，ME 批次 programme 为权威锚点）。

### 7. 与前序变更关系

- 不回退 refine 包已完成的新生闸门、课表预览等。
- 将「补注册」称呼在用户可见处改为白名单权限语义；监控「建议加入补注册」→「建议加入白名单」。
- 分权限时效替代「整行单一 24h」时，迁移：旧行 `deadlineAt` 映射到 `supplement`（及已开的 A/D/R）权限。

## Risks / Trade-offs

- 分权限时效 UI 比整行复杂 → 表单用权限表格：勾选 | 小时/截止 | 状态 | 邀请。
- page id 变更影响书签 → 做别名或保留 id 只改 label。
- 先修绑课号 vs 全局豁免 → 默认支持可选课号列表；空=本学期加课申请均免先修（需二次确认文案警告）。

## Migration

1. `supplementListQueue` 行 → 增加 `permissions[]`；旧 `canAdd` 等升为权限项；旧整行 invite 字段拷到 `supplement` 权限。
2. 菜单 label 改白名单；英文 Whitelist。
3. ME demo 批次补 `programme`（如 SWE/COS）。

## 影响文件（预期）

| 区域 | 文件 |
|------|------|
| 菜单/i18n | `courseRegistrationMenu.js`、zh/en |
| 白名单数据 | `supplementListQueue.js` 或合并 `whitelistQueue.js` |
| 白名单页 | `SupplementListView.vue`（改名/改文案）及抽屉 |
| 学生闸门 | `addDropApprovalQueue.js`（getAddDropAccess）、`StudentAddDropView.vue` |
| 先修 | 加课申请选课校验；在线选课保持 `evaluateCourseEligibility` |
| 容量 | 加课选 section 时校验 enrolled/capacity |
| 批次 | `RegistrationBatchFormDrawer.vue`、`registrationBatches.js` |
| 监控 | 建议加入文案 |
