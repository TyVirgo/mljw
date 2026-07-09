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
