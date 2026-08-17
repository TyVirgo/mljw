# 变更：polish-student-r1-volunteer-slots

## Why

老生第一轮需分离「入池」与「锁序」；选课情况应用共表头 + 次序列呈现，调序用拖拽而非行内箭头。「我的选课」应为结果台，只展示已确认志愿与教务名单 release，不应承载确认操作。

## What Changes

- **在线选课 · 第一轮（老生）**：不限槽数；「提交志愿」末尾入待分配；排队中与待分配分表（排队无志愿次序列）；志愿表首列次序；工具条「确认志愿」在前、「调整志愿顺序」在后（拖拽调序）；排队操作「取消排队」在前
- **我的选课**：去掉确认志愿与「继续选课」；仅展示已确认志愿与名单 release
- **第二/三轮**：平铺选课情况表，无志愿次序列
- 去掉分卡外壳与行内 ↑↓

## Non-goals

- 不新开菜单页
- 不重做管理端加权抽签算法
- 不做知情同意、学期级加退窗、开课同步

## Capabilities

### Modified Capabilities

- `course-registration`：R1 逐次入池、拖拽调序、抽屉确认锁序、我的选课只读公示

## Impact

- `StudentRegistrationCartDrawer.vue`、`StudentMyResultView.vue`、`StudentRegisterView.vue`
- `studentVolunteerSheet.js`、`studentRegistrationContext.js`、i18n、OpenSpec 本 change
