## 1. UI 与文案

- [x] 1.1 `MovementParentConsentSection` 改为只读：去掉增删，字段不可编辑，空态文案引导去档案
- [x] 1.2 休学/退学 FormModal 的 SECTION III 标题旁加 tip（共用 i18n）

## 2. 校验确认

- [x] 2.1 确认无监护人时提交（教师/学生）均被 `validateParentContacts` 拦截；必要时优化错误文案

## 3. 冒烟

- [x] 3.1 有监护人：只读展示、无增删；无监护人：禁止提交；标题 tip 可见
