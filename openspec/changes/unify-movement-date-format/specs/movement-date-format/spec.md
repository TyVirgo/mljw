## 新增需求

### 需求：异动全链路日期展示为 dd.Mmm.YYYY
系统应在学籍异动全链路中，将日历日期字段统一以 dd.Mmm.YYYY 格式展示（日补零、英文三字母月份缩写、四位年份，如 `29.Sep.2025`），覆盖列表列、只读表单与详情字段、审批视图、维护与查询表格、导出文件及审批日志条目。

#### 场景：申请列表申请日期
- 当用户查看四 Tab 异动申请列表的申请日期列时，则每条日期以 dd.Mmm.YYYY 展示。

#### 场景：表单与详情只读日期
- 当用户在异动表单或详情弹框中查看申请日期、签证到期、lastDateOfAttendance 等只读日期字段时，则值以 dd.Mmm.YYYY 展示。

#### 场景：审批列表申请日期
- 当用户查看异动审批列表的 Application Date 列时，则以与对应异动申请列表相同的格式化规则展示 dd.Mmm.YYYY。

#### 场景：维护与查询异动日期
- 当用户查看维护或查询列表的 movementDate 列时，则日期以 dd.Mmm.YYYY 展示。

#### 场景：审批日志日期列
- 当用户为任意异动记录打开 Approval log 时，则每条日志 dateTime 以 dd.Mmm.YYYY 展示且无时间部分，包括以 DD.MM.YYYY HH:mm 存储的旧 seed 值。

#### 场景：导出日期列
- 当用户导出含日期字段的异动申请、审批、维护或查询结果至 xlsx 时，则导出单元格值与屏幕展示一致，使用 dd.Mmm.YYYY。

#### 场景：申请学年学期不在范围内
- 当用户查看 Application Academic Session（`applicationSession`）字段或列时，则这些值仍使用 YYYY/MM 学年学期格式，且不以 dd.Mmm.YYYY 格式化。

### 需求：共享异动日期格式化器
系统应在共享 helper 中集中异动日期展示格式化，供异动申请 data 模块、审批队列 formatter、维护日期展示、导出 formatter 及审批日志 UI 使用。

#### 场景：单一 formatter 入口
- 当任意异动模块需要向用户展示日历日期时，则模块使用共享 `formatMovementDate` helper，而非各自 ad hoc formatter。

#### 场景：ISO 存储兼容
- 当异动记录以 ISO 日期字符串或 ISO datetime 存储日期时，则 `formatMovementDate` 产出 dd.Mmm.YYYY 用于展示，且存储值保持 ISO 兼容。

#### 场景：引擎日志存储使用 ISO
- 当审批引擎追加新审批日志条目时，则存储的 dateTime 值通过 `formatMovementDateIso` 使用 YYYY-MM-DD，供周期比较。

### 需求：生效学期列展示为 YYYY/MM
系统应在审批、维护、查询列表及导出中，将 Effective Session（`effectiveSession`）列以学年学期格式 YYYY/MM（如 `2025/09`）展示，且列内各异动类型格式一致。

#### 场景：转专业与休学生期值
- 当用户查看源字段使用 YYYY/MM（如 `startSemester`、`defermentPeriod`）的转专业或休学记录的 Effective Session 列时，则值以 YYYY/MM 原样展示。

#### 场景：退学从就读最后日期派生学期
- 当用户查看 effective 值由 `lastDateOfAttendance`（存储为 YYYY-MM-DD，如 `2025-09-20`）派生的退学记录 Effective Session 列时，则列展示 `2025/09` 而非 dd.Mmm.YYYY。

#### 场景：导出生效学期列
- 当用户导出含 Effective Session 列的审批、维护或查询结果时，则导出单元格值与屏幕列表格式化一致，使用 YYYY/MM。

#### 场景：异动日期列使用 dd.Mmm.YYYY
- 当用户查看同一退学记录的 Movement Date 列时，则该列以 dd.Mmm.YYYY 展示日历日，且不转换为 YYYY/MM。

### 需求：学年学期字段仅使用 YYYY/02、YYYY/04 或 YYYY/09
系统应将 Intake、Application Academic Session 与 Effective Session 视为学年学期值（非日历日期），展示与导出统一 normalize 为 YYYY/MM，其中 MM 为 02、04 或 09 之一。

#### 场景：列表列展示合法学期码
- 当用户查看审批、维护或查询列表的 Intake、Application Academic Session 或 Effective Session 时，则每个值为 YYYY/02、YYYY/04 或 YYYY/09，或空时显示 `—`。

#### 场景：申请学年学期不回退日历日
- 当异动记录无 applicationSession 但有 dateOfApplication 时，则 Application Academic Session 列不展示日历日期。

#### 场景：从就读最后日期派生的生效学期映射到学期码
- 当 Effective Session 由存储为 YYYY-MM-DD 的 lastDateOfAttendance 派生时，则展示值映射为 YYYY/02、YYYY/04 或 YYYY/09，而非 YYYY/08 等日历月。

#### 场景：学期时间顺序
- 当异动记录上 intake、applicationSession 与 effectiveSession 均存在时，则 intake 不晚于 applicationSession，且 applicationSession 不晚于 effectiveSession。

#### 场景：表单提交校验学期顺序
- 当教职工或学生提交学期字段违反时间顺序的异动申请时，则提交校验失败并显示字段级错误。
