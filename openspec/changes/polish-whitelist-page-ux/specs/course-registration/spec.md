# 能力规格：course-registration（delta）

本 delta 归属变更 `polish-whitelist-page-ux`。

## ADDED Requirements

### Requirement: 白名单页用户可见文案可解析

系统 SHALL 为侧栏白名单页提供可解析的 `courseRegistration.whitelist` 文案（含 doorHint、inviteHint、capacityHint、permissions、perm.*、formHint 等），不得因同名对象覆盖而回退为键名。

#### Scenario: 列表与抽屉显示中文/英文

- **WHEN** 用户打开白名单页或编辑抽屉
- **THEN** Callout、列头、权限标签与表单标签显示本地化文案而非 i18n key

---

### Requirement: 白名单支持本页新增与监控写入

系统 SHALL 允许教务在白名单页新增学生（勾选权限并配置有效时长），并与监控「加入白名单」写入同一名单队列；来源可区分手工与监控。

#### Scenario: 本页新增

- **WHEN** 教务点击新增、选择学生、勾选至少一种申请类权限并保存
- **THEN** 名单增加一行，`source` 为手工，列表可见权限摘要

#### Scenario: 监控加入

- **WHEN** 教务从选课监控将学生加入白名单
- **THEN** 写入同一队列且来源为监控，不覆盖已存在学号
