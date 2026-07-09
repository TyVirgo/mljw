## 新增需求

### 需求：终审通过时自动实施
系统应在异动申请达到最终 `Approved` 状态时读取异动类别 `autoImplement` 标志，并据此设置初始 `implemented` 值。

#### 场景：手动实施类别
- **当** 终审完成且解析后的类别配置 `autoImplement` 为 false
- **则** 申请记录的 `implemented` 字段为 `Pending`

#### 场景：自动实施类别
- **当** 终审完成且解析后的类别配置 `autoImplement` 为 true
- **则** 申请记录的 `implemented` 字段为 `Implemented`
- **且** 维护中无需手动实施操作

#### 场景：不可取消实施
- **当** 某记录已为 `Implemented`（手动或自动）
- **则** 系统不提供将其恢复为 `Pending` 的操作

### 需求：实施时应用学生档案更新
系统应在异动记录实施时，按类别的 `modifyStudentStatus` 与 `modifyStudentType` 标志应用 mock 学生档案更新。

#### 场景：实施时修改学籍状态
- **当** 实施运行且解析后类别的 `modifyStudentStatus` 为 true
- **则** 系统更新 mock 存储中关联学生档案的状态

#### 场景：实施时修改学生类型
- **当** 实施运行且解析后类别的 `modifyStudentType` 为 true
- **则** 系统更新 mock 存储中关联学生档案的学生类别

#### 场景：标志关闭时跳过档案更新
- **当** 实施运行且两个修改标志均为 false
- **则** mock 学生档案记录不变

## 修改需求

### 需求：终审通过时自动实施
系统应在终审通过读取 `autoImplement` 时，仅按异动来源键（每个类别代码一行）解析类别配置。

#### 场景：自动实施与申请学生类别无关
- **当** 休学申请终审完成，无论申请人为 `Local`、`China` 还是 `International`
- **则** 系统使用唯一的 `DEF001` 配置行判断 `autoImplement`

### 需求：异动原因展示使用类别原因
系统应使用申请存储的 `reasonId`，从类别配置原因列表解析休学、退学、转专业的异动原因标签。

#### 场景：按 reasonId 展示原因
- **当** 审批、查询或维护行展示休学、退学或转专业的异动原因
- **则** 展示文本与对应类别行上 `reasonId` 的 `reasonName` 一致
