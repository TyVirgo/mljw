## 新增需求

### 需求：异动申请壳层托管四个嵌入视图
系统应在单一父壳层组件内嵌入现有 `ProgrammeTransferView`、`DefermentView`、`ResumptionView`、`WithdrawalView`，不重复业务逻辑。

#### 场景：单一壳层组件
- **当** 应用渲染学籍异动申请
- **则** 专用壳层组件管理 Tab 状态，且每次仅渲染一个嵌入异动视图

#### 场景：无重复数据模块
- **当** 壳层嵌入异动视图
- **则** 各 Tab 复用现有数据层文件（`programmeTransfers.js`、`deferments.js`、`resumptions.js`、`withdrawals.js`），不 fork 新 mock 存储

### 需求：异动申请 Tab 键
系统应为四种异动类型使用稳定的内部 Tab 键。

#### 场景：Tab 键映射
- **当** 壳层初始化 Tab
- **则** Tab 键为 `programme-transfer`、`deferment`、`resumption`、`withdrawal`，分别映射到对应嵌入视图

### 需求：异动申请布局适配管理壳层
系统应在学生档案主内容区内布局异动申请壳层，不破坏页面滚动或分页。

#### 场景：内容区满高
- **当** 用户在学籍异动申请内查看任一 Tab
- **则** 嵌入异动列表填满可用主内容高度，与独立页面时相近

#### 场景：可选嵌入布局模式
- **当** 异动视图以嵌入布局模式渲染
- **则** 调整外层内边距与高度计算，避免双重边距或嵌套滚动冲突
