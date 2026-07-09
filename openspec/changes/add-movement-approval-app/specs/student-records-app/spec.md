## 修改需求

### 需求：学籍侧边栏包含已开发的异动审批入口
系统应将学籍异动审批与 Student Basic Information、学籍异动申请一并视为已开发页面。

#### 场景：已开发页面集合
- **当**学籍应用加载
- **则**`studentRecordsDevelopedPages` 包含 `sr-movement-approval`

#### 场景：审批页面包屑
- **当**用户位于学籍异动审批页
- **则**面包屑展示学籍异动分组与学籍异动审批叶子标签
