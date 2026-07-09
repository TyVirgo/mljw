## 新增需求

### 需求：学籍表单国籍优先布局
系统应将新建/编辑抽屉与详情抽屉组织为两个带标签的分区：**国籍信息**（Nationality Information）与 **信息填写**（Information Entry）。

#### 场景：新建表单先展示国籍区
- 当用户打开新建学籍抽屉时，则在选择国籍前，抽屉仅显示步骤 **1** **国籍信息** 分区

#### 场景：表单分区步骤序号
- 当用户查看新建或编辑抽屉时，则 **国籍信息** 分区标题显示醒目的步骤序号 **1**，**信息填写** 分区标题显示步骤序号 **2**

#### 场景：新建未选国籍时隐藏信息填写区
- 当用户打开新建抽屉且尚未选择国籍时，则整个 **信息填写** 分区（含标题、Tab 与字段）均不显示

#### 场景：选择国籍后显示信息填写区
- 当用户在新建时选择国籍后，则 **信息填写** 分区变为可见，包含七个 Tab 及按类别适配的可编辑字段

#### 场景：选择国籍后 Tab 展示字段
- 当用户在新建时选择国籍后，则信息填写各 Tab 按推导出的 Student Category 展示对应字段

#### 场景：国籍可搜索下拉
- 当用户在新建或编辑模式下操作「国籍」字段时，则系统提供全球国籍值的可搜索下拉，Malaysia 与 China 置顶，其余国籍按字母序排列

#### 场景：由国籍推导学生类别
- 当用户选择国籍时，则系统按规则 Malaysia → Local、China → China、其他任何国籍 → International 自动设置 Student Category，并在 **国籍信息** 分区以只读方式展示

#### 场景：不可手动选择学生类别
- 当用户在新建或编辑抽屉中查看表单时，则系统不显示 Student Category 单选按钮或其他手动类别选择器

#### 场景：保存时国籍必填
- 当用户未选择国籍就点击「保存」时，则系统阻止保存、保持「保存」按钮可点击，并在步骤 1 的「国籍」字段显示「请选择国籍」等校验提示

#### 场景：保存前切换国籍更新类别字段
- 当用户在保存前变更国籍且推导出的 Student Category 发生变化时，则系统提示确认、清空类别不兼容字段，并更新可见字段以匹配新类别

#### 场景：同类别内切换国籍无需确认
- 当用户在保存前变更国籍但推导出的 Student Category 不变时，则系统直接更新国籍值，无需确认且不清空类别专属字段

#### 场景：Basic Info Tab 不重复国籍
- 当用户在新建或编辑模式下查看 Basic Info Tab 时，则 Tab 内不显示「国籍」输入，因其仅在 **国籍信息** 分区出现

#### 场景：编辑改国籍需确认
- 当用户变更国籍导致推导出的 Student Category 变化时，则系统在应用变更并清空类别不兼容字段前提示确认

#### 场景：详情抽屉布局一致
- 当用户打开某学籍记录的「详情」时，则只读抽屉使用步骤序号 **1** 与 **2**，采用相同的 **国籍信息** 与 **信息填写** 分区结构，以只读方式展示国籍与推导出的类别

### 需求：学籍国籍到类别的映射
系统应使用学籍表单与异动模块共用的单一映射函数，由国籍推导 Student Category。

#### 场景：Malaysia 映射为 Local
- 当国籍为 Malaysia 时，则 Student Category 为 Local

#### 场景：China 映射为 China
- 当国籍为 China 时，则 Student Category 为 China

#### 场景：其他国籍映射为 International
- 当国籍为 Malaysia 或 China 以外的任何值时，则 Student Category 为 International

## 修改需求

### 需求：学籍新建与编辑表单
系统应提供「新建学籍」抽屉用于创建与编辑学籍记录，包含 **国籍信息** 分区、含七个 Tab 的 **信息填写** 分区，以及按所选国籍推导的类别适配字段。

#### 场景：打开新建表单
- 当用户在学籍列表页点击「新增」时，则系统打开空的注册抽屉，标题为新建学籍，**国籍信息** 分区含空的可搜索国籍下拉，选择国籍前不显示推导出的 Student Category

#### 场景：注册 Tab 展示
- 当注册抽屉已打开且已选择国籍时，则系统显示步骤 **2** **信息填写**，含 Basic Info、Enrollment、Contact、Education、Family、Accommodation 与 Others 七个 Tab

#### 场景：打开编辑表单
- 当用户点击表格行的「编辑」时，则系统打开预填该生国籍、推导 Student Category 及其余全部数据的编辑抽屉

#### 场景：保存新学籍
- 当用户填写必填字段（含国籍）并在新学籍上点击「保存」时，则系统校验输入、以推导的 Student Category 将学生加入列表、关闭抽屉并在表格中显示新行

#### 场景：保存编辑学籍
- 当用户在编辑模式下修改字段并点击「保存」时，则系统校验输入、更新现有记录（含国籍与推导 Student Category），并在表格中反映变更

#### 场景：重复学号被拒绝
- 当用户保存的 Student ID 已在其他记录中存在时，则系统阻止保存并显示校验错误

#### 场景：取消关闭抽屉
- 当用户在注册抽屉中点击「取消」时，则抽屉关闭且不保存未保存的变更

#### 场景：Local 类 Basic Info 字段
- 当用户选择 Malaysia 使 Student Category 为 Local 时，则 Basic Info Tab 显示 IC No. 与 State of Birth，不显示护照专属或 China 专属身份字段

#### 场景：China 类 Basic Info 字段
- 当用户选择 China 使 Student Category 为 China 时，则 Basic Info Tab 显示 Passport No.、Passport Expiry、Place of Birth、Candidate No.、Political Outlook 与 Identity No. (China ID)，不显示 IC No. 或 State of Birth

#### 场景：International 类 Basic Info 字段
- 当用户选择 Malaysia 或 China 以外的国籍使 Student Category 为 International 时，则 Basic Info Tab 显示 Passport No.、Passport Expiry 与 Place of Birth，不显示 IC No.、State of Birth 或 China 专属身份字段

#### 场景：保存时按类别校验
- 当用户保存 Local 学生但未填写 IC No. 时，则系统阻止保存并在 Basic Info 显示校验错误

#### 场景：China 或 International 无 IC No. 可保存
- 当用户保存 China 或 International 学生时未填 IC No. 但已完成其他必填共享字段时，则若其他必填字段有效则允许保存

## 移除需求

### 需求：新建表单手动选择学生类别
**原因**：Student Category 现由国籍推导；手动 radio 选择已由自动映射替代。
**迁移**：用户先选择国籍；系统自动设置 Local、China 或 International。
