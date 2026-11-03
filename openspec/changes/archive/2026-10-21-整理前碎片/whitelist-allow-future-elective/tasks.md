## 1. 数据与权限

- [x] 1.1 `WHITELIST_PERMISSION_KEYS` + `createPermission` / legacy sync 支持 `allowFutureElective`（geCredits/meCredits/meCategoryKeys）
- [x] 1.2 `hasWhitelistAllowFutureElective` + 读取配置 helper

## 2. 表单

- [x] 2.1 `SupplementEntryDrawer`：勾选展开 GE/ME 学分与 ME 类别；校验；保存写入
- [x] 2.2 i18n zh/en（权限名、字段、校验、formHint）

## 3. 加课池

- [x] 3.1 seed 增加 futureSession GE/ME；`getEligibleAddCoursesForStudent` 按权限过滤
- [x] 3.2 加课 tip 有权限时说明未来学期选修额度

## 4. 收尾

- [x] 4.1 勾选本 tasks
