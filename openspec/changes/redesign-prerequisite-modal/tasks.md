## 1. Modal 壳层与布局

- [ ] 1.1 重写 `CoursePrerequisiteModal.vue` 面板：标题 **Add**，`max-width: 1000px`，flex 列布局（header / body / footer）
- [ ] 1.2 样式：标题 16px、× 关闭；底栏 **Discard** + **Confirm**，按钮圆角 8px，对齐原型
- [ ] 1.3 遮罩、×、Discard 均 `emit('close')`，不持久化选择

## 2. 搜索区

- [ ] 2.1 新增搜索行：Course Name、Course Code、Offering（下拉，来自 `getOfferingOptions(initialDepartments)`）
- [ ] 2.2 实现 draft 与 applied 搜索状态；**Search** 应用筛选并重置页码为 1；**Reset** 清空两者
- [ ] 2.3 布局：一行三字段 + 右侧 Search/Reset；标签左对齐、紧凑间距（对齐列表页搜索样式）
- [ ] 2.4 客户端筛选：name/code 部分匹配；offering 精确匹配；排除 `excludeCode`

## 3. 数据表格

- [ ] 3.1 渲染列：checkbox、No.、Course code、Course Name、Offering、Credit Value、Course Classification
- [ ] 3.2 Offering 列使用 `getOfferingLabel`；Classification 使用 `tr(course.courseClassification)`；缺失值显示 `--`
- [ ] 3.3 多选 `checkedCodes`；表头全选/半选仅作用于**当前页**
- [ ] 3.4 跨页选择保留；空态 `common.noData`
- [ ] 3.5 表格 body 在 Modal 内可滚动；窄屏时表格横向滚动

## 4. 分页

- [ ] 4.1 表格下方集成 `TablePagination`（`total = filtered.length`，默认 pageSize 10）
- [ ] 4.2 对筛选结果分页后再渲染；No. 按页偏移计算

## 5. Confirm 与集成

- [ ] 5.1 Confirm 时 `emit('checkedCodes.join(', ')')` 后关闭
- [ ] 5.2 打开时：从 `selectedCodes` 恢复选中，重置搜索字段
- [ ] 5.3 规范化来自 `courses` 与 application 载荷的课程行（确保 code/name/offering/credit/classification 可用）
- [ ] 5.4 冒烟：Course Information 向导 Choose 流程；Course Application 向导 Choose 流程

## 6. i18n

- [ ] 6.1 在 `zh-flat.js` / locales 补充 `Discard` → 放弃（或按产品用取消）及 `Add` 标题 key（若缺失）
- [ ] 6.2 复用现有 key：Search、Reset、Course Name、Course Code、Offering、Credit Value、Course Classification、Confirm

## 7. 验证

- [ ] 7.1 视觉对照原型：宽 Modal、三字段搜索、七列表格、分页条、Discard/Confirm
- [ ] 7.2 运行 `npm run build`
