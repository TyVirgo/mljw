# 基础数据-培养方案与年级专业 规格（合并）

## 说明

以下为各历史 delta spec 原文按来源拼接并做术语中文化处理。整理正式需求文档时，应按场景重写为「用户故事 / 验收标准」，消除重复与过时条目。

## 来源 `add-programme-intake-planned-enrollment` / 能力 `programme-intake`

## MODIFIED Requirements

### Requirement: 专业批次新增与编辑含计划招生人数
专业批次新增弹窗 必须在 Intake 字段下方提供必填数字输入「计划招生人数」。编辑弹窗 必须同步展示并可修改该字段。保存时 必须将 `plannedEnrollment` 写入批次记录。校验 必须要求已填写且为数字；必须NOT 强制上下限等额外填写规则（原型）。演示数据 必须为存量记录提供默认计划招生人数。

## 来源 `add-school-elective-category` / 能力 `school-elective-category`

## ADDED Requirements

### Requirement: 院系信息校选类别
院系信息新增与编辑表单 必须提供必填「校选类别」下拉，选项为文科、理科、商科。主表 必须展示该字段。院系保存时 必须校验已选择校选类别。

### Requirement: 专业版本校选类别
专业版本新增/编辑（培养方案信息步骤）必须提供必填「校选类别」下拉，选项为文科、理科、商科。专业列主表 必须展示该字段。保存步骤 1 时 必须校验已选择校选类别。

### Requirement: 不联动
专业版本选择院系时 必须NOT 自动带出或覆盖校选类别；院系与专业版本的校选类别 必须各自独立维护。

## 来源 `refine-enrollment-cascade-programme-intake` / 能力 `student-profile`

## 修改需求

### 需求：学生Profile Enrollment 级联专业批次选择
系统应在 Enrollment Tab 将 **专业层次 → 学院 → 专业** 作为前三个必填下拉，选项来自活跃专业批次（ enriched 专业目录层次）。每级选择过滤下一级；变更上级时清空下级及派生字段。第三级选项为活跃专业批次；同一学院与层次下若同一专业名存在多个活跃批次，标签应包含入学批次以区分。

#### 场景：级联顺序与必填
- 当用户在新建或编辑模式的 Enrollment Tab 填写学籍信息时，则前三个字段依次为专业层次、学院、专业，均为必填下拉
- 且 Local、China、International 三类学生共用相同级联逻辑

#### 场景：选择专业批次后派生只读字段
- 当用户选定专业（专业批次）时，则系统自动填充专业代码、学制、学期、入学批次与学年
- 且上述派生字段以置灰只读控件展示，用户不可编辑

#### 场景：派生字段数据来源
- 当系统解析所选专业批次时，则专业代码、学制、入学批次分别来自批次 programmeCode、years、intake
- 且学年来自批次 startingSemester；学期为 startingSemester 的月份部分

#### 场景：其余 Enrollment 字段
- 当用户查看 Enrollment Tab 时，则状态、学习模式、招生人员、资助等字段保持非必填
- 且有默认首项的下拉字段默认选中第一个选项

#### 场景：编辑回显
- 当用户编辑含已存 Enrollment 的学籍时，则级联下拉与派生字段回显已存值
- 且若存在匹配的活跃或非活跃批次记录，专业下拉应选中对应批次

## 移除需求

### 需求：学生Profile Enrollment 主数据下拉（§16 专业名称优先、Intake/Session 独立）
**原因**：由级联专业批次选择取代；intake、学年、学期改为批次派生只读。
**迁移说明**：参见本变更「学生Profile Enrollment 级联专业批次选择」。

#### 场景：Intake 与 Academic Session 保持独立
- **已移除** — intake 与 academic session 随专业批次自动带出

#### 场景：专业名称驱动派生 Enrollment 字段（学院/层次只读派生）
- **已移除** — 学院与专业层次改为用户级联选择

## 来源 `refine-programme-intake-published-version` / 能力 `programme-intake`

## 新增需求

### 需求：专业批次新增弹框展示已发布专业版本
系统应在「新增专业批次」弹框的专业选择表格中，于 School 列之后增加「版本」列。对每一行 catalogue 数据，系统应按 `programmeCode` 解析已发布专业版本（`isCurrent`）。若存在已发布版本，单元格应显示「版本详情」链接并打开专业版本详情弹框；若无已发布版本，单元格应显示破折号占位符。

#### 场景：选择学院后显示版本列
- 当用户打开「新增专业批次」并选择学院时，则专业表格包含「版本」列头；且每一行专业显示「版本详情」链接或破折号

#### 场景：从新增弹框打开版本详情
- 当用户点击某行「版本详情」且该行专业存在已发布版本时，则系统在新增弹框之上以 layered 方式打开 `ProgrammeVersionDetailModal`；且弹框展示该专业已发布版本的内容

#### 场景：新增行无已发布版本
- 当 catalogue 中某专业不存在 `isCurrent` 为 true 的版本时，则「版本」列显示破折号；且用户仍可选择该专业创建批次

### 需求：专业批次编辑弹框展示已发布专业版本
系统应在「编辑专业批次」弹框的摘要表格中增加「版本」列，采用与新增弹框相同的已发布版本解析逻辑与「版本详情」链接行为。

#### 场景：编辑弹框版本详情
- 当用户打开某条已关联已发布专业版本的专业批次记录的编辑弹框时，则摘要表「版本」单元格显示「版本详情」链接；且点击后打开 layered 版本详情弹框

## 来源 `refine-programme-intake-published-version` / 能力 `programme-version`

## 新增需求

### 需求：培养方案版本嵌套表发布开关
系统应在培养方案版本列表页的嵌套版本表中提供「版本发布」列。每一版本行应包含绑定 `isCurrent` 的 `YnSwitch`。当用户为某版本打开发布开关时，系统应将该版本设为该专业唯一的已发布版本，并清除同专业其他版本的 `isCurrent` 状态。

#### 场景：互斥发布单一版本
- 当用户为版本 B 打开「版本发布」开关，且同专业版本 A 此前已发布时，则版本 B 的 `isCurrent` 变为 true；且版本 A 的 `isCurrent` 变为 false

#### 场景：取消发布版本
- 当用户关闭当前已发布版本的「版本发布」开关时，则该版本 `isCurrent` 变为 false；且该专业在再次打开其他版本的发布开关前可能没有任何已发布版本

### 需求：下游模块使用的已发布版本 helper
系统应提供 `getProgrammePublishedVersion(programme)`，返回 `isCurrent` 为 true 的版本，若无则返回 null；并提供 `findProgrammeByCode(code)` 按专业代码查找。专业批次弹框应使用这些 helper 展示版本详情链接。

#### 场景：无已发布版本时 helper 返回 null
- 当对不存在 `isCurrent` 版本的专业调用 `getProgrammePublishedVersion` 时，则函数返回 null
