# 任务：polish-whitelist-page-ux

## 1. i18n

- [x] 1.1 zh/en：将 BOA 审批 `whitelist` 块改名为 `whitelistBoa`；保留突破限制 `whitelist` 块
- [x] 1.2 更新 `WhitelistView` / `WhitelistFormDrawer` / `WhitelistDetailDrawer` 的 t() 前缀
- [x] 1.3 统一监控/预警「查看补注册」「建议加入补注册」等为白名单文案；邀请未发送文案澄清

## 2. 新增与列表

- [x] 2.1 `SupplementEntryDrawer` 支持 create：选学生、权限、时长、备注；调用 add API
- [x] 2.2 学生选择器（排除已在名单）
- [x] 2.3 `SupplementListView`：新增按钮、来源列、打开 create 抽屉

## 3. 收尾

- [x] 3.1 勾选本 tasks

## 4. 增量：权限父子归类 + 先修豁免选择器

- [x] 4.1 i18n：`perm.supplement` →「允许加退课/重修申请」；先修豁免课号/截止文案同步
- [x] 4.2 `SupplementEntryDrawer`：父项可勾；子项禁用并清空；布局自适应
- [x] 4.3 `supplementListQueue`：`rebuildPermissionsFromForm` 按父项落库；`validUntil` 支持 `YYYY/MM` 学期月末
- [x] 4.4 先修豁免：多选课程选择器 + `AcademicSessionMonthPicker`
- [x] 4.5 提案/spec/tasks 同步

## 5. 增量：表单与选择器 UX 打磨

- [x] 5.1 `WhitelistCoursePickModal`：搜索区同一行 + 默认 20 条/页
- [x] 5.2 `SupplementEntryDrawer`：先修课程与截止学期左右同行；邀请时长仅父项一行默认 48h；通知文案默认勾选
- [x] 5.3 `WhitelistStudentPickModal` 多选 + 标签回显；保存多行（已存在跳过）
- [x] 5.4 i18n / `SUPPLEMENT_INVITE_HOURS=48`；提案/spec/tasks 同步

## 6. 增量：权限文案 / 必填 / 列表 demo

- [x] 6.1 i18n：先修/学分文案；去掉学期 hint 展示
- [x] 6.2 抽屉：去最高学分；先修课程+学期必填红星；标签单行裁切
- [x] 6.3 `WhitelistCoursePickModal`：当前页全选
- [x] 6.4 列表去来源列；`initialSupplementList` 扩至 25 行（含 demo 学生）
- [x] 6.5 提案/spec/tasks 同步

## 7. 增量：通知列与操作

- [x] 7.1 扩选人候选人至可选 ≥10；`addedAt` 统一 DD-Mon-YYYY
- [x] 7.2 列表拆「发送通知次数 / 生效剩余时间」；列名「添加白名单时间」
- [x] 7.3 去演示逾期；发送通知（有效内可多次）+ 逾期「再次开放」；去掉 max 2
- [x] 7.4 i18n + 提案/spec/tasks 同步

## 8. 增量：Callout / 菜单 / demo 全状态 / 抽屉默认

- [x] 8.1 去掉 capacityHint；时长文案；抽屉三子项默认全开
- [x] 8.2 隐藏模块说明菜单；监控移到白名单上一格
- [x] 8.3 demo 覆盖未发 / 有效 / 逾期等状态
- [x] 8.4 提案/spec/tasks 同步

## 9. 增量：通知弹框 + 缴费列名 + 演示学生

- [x] 9.1 `XMUM2309001` 改为有效白名单；逾期样例换其他学生
- [x] 9.2 发送通知 / 再次开放复用 `MonitorRemindModal` + 草稿文案
- [x] 9.3 缴费名单学分列文案；提案/spec/tasks 同步

## 10. 增量：先修语义 / 弹框列 / 新增备注必填

- [x] 10.1 i18n：占位「请选择课程豁免先修课」；hint/校验对齐目标课语义；备注必填文案
- [x] 10.2 `WhitelistCoursePickModal`：教学班行展示课+分组+学分+教师+时间地点；按课勾选
- [x] 10.3 `SupplementEntryDrawer`：新增备注必填红星；学生红星统一；标签可示课程+分组
- [x] 10.4 勾选本 tasks
