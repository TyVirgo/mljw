# 学生基本信息详情增加「导出学籍卡」按钮

## 背景
学籍管理人员查看学生详情时，需要导出生学籍卡。本期仅补充入口按钮，不实现导出逻辑。

## 变更内容
- `StudentProfileDetailDrawer` footer 左侧增加「导出学籍卡」按钮（`btn-outline`）
- 按钮无点击行为、无提示文案、无 disabled 状态
- 列表页导出、编辑抽屉不变

## 影响
- `StudentProfileDetailDrawer.vue`
- `src/i18n/locales/zh.js`、`en.js`
