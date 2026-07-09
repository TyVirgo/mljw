## 新增需求

### 需求：休学期限起止日期

系统应在休学申请表单中于 Deferment Period 正下方展示只读的 Deferment Start Date 和 Deferment End Date 字段（dd/MM/YYYY），适用于管理员和学生申请人模式。

#### 场景：根据所选期限派生日期
- **当** 用户选择的 Deferment Period 匹配基础数据中的学期记录
- **则** Start Date 和 End Date 从该记录的 `startDate` 和 `endDate` 填充
- **且** 两个字段保持只读

#### 场景：清除期限时清空日期
- **当** 用户清除 Deferment Period
- **则** Start Date 和 End Date 被清空

#### 场景：保存时持久化日期
- **当** 用户保存或提交休学申请
- **则** `defermentStartDate` 和 `defermentEndDate` 存储于申请记录

### 需求：休学详情展示期限日期

系统应在休学详情及统一异动详情视图中展示休学起止日期。

#### 场景：详情只读展示
- **当** 用户打开休学申请详情
- **则** Deferment Start Date 和 Deferment End Date 显示于 Deferment Period 下方

### 需求：状态日志休学日期备注

休学实施至学生档案时，系统应追加一条状态日志，其备注包含申请中的休学日期范围。

#### 场景：备注包含序数日期范围
- **当** 休学维护实施已批准申请
- **则** 新增 Deferment 状态日志的 `remarkLines` 包含一行 `{N}th Deferment: {startDate}-{endDate}`，使用存储的申请日期
- **且** 备注不包含复学信息
