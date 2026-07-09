## 修改需求

### 需求：未开发的异动与培养方案页面
系统应对尚未开发的菜单项展示应用内「建设中」页面。

#### 场景：未开发的异动子菜单
- 当用户选择 Status Change Maintenance、Status Change Inquiry 或 Status Change Statistics 时，则系统展示带返回 Student Basic Information 操作的建设中页面。

#### 场景：异动类别已开发
- 当用户在侧边栏选择 Change Category 时，则系统展示异动类别配置列表页，而非建设中页面。

#### 场景：知情同意书已开发
- 当用户在侧边栏选择 Informed Consent Form 时，则系统展示同意书配置列表页，而非建设中页面。

#### 场景：未开发的培养方案子菜单
- 当用户选择 Personal Curriculum Plan 时，则系统展示带返回 Student Basic Information 操作的建设中页面。

## 新增需求

### 需求：知情同意书注册为已开发页面
系统应将 `sr-consent-form` 注册为与 Student Basic Information、Change Category、Status Change Application、Status Change Approval 并列的已开发学籍页面。

#### 场景：侧边栏导航
- 当用户在 Student Status Change 下选择 Informed Consent Form 时，则侧边栏高亮 Informed Consent Form，且主内容区渲染 `ConsentFormView`。

#### 场景：面包屑
- 当用户位于 Informed Consent Form 页面时，则面包屑展示 Student Status Change 分组标签与 Informed Consent Form 页面标签。
