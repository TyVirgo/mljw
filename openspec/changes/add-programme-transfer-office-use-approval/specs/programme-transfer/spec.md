## 新增需求

### 需求：转专业申请人对 Office Use 区块不可见

学生转专业申请表单不得展示 Section VII。

### 需求：审批人在审核时填写 Office Use 字段

审批转专业申请时，UI 应展示可编辑的 Section VII，默认值来自第一志愿专业、开学学期及当天日期。

#### 场景：字段标签与学生申请一致
- **当** 向审批人展示 Section VII
- **则** 专业和学期标签与学生申请表单字段标签一致

### 需求：Office Use 区块与周边详情布局一致

Section VII 应使用与其他转专业详情区块相同的 `section-bar` 和栅格布局。

#### 场景：已批准只读详情
- **当** 批准后以只读方式展示 Section VII
- **则** 字段使用 `detail-grid`（dt/dd）渲染，与 Sections I–VI 保持一致

#### 场景：审批中可编辑详情
- **当** 审批过程中以可编辑方式展示 Section VII
- **则** 字段使用与其他异动表单相同的两列 `form-grid` 和 `form-control` 样式
