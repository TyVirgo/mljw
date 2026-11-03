## 为何

选课结果「添加特殊学生」代选弹窗附件为浏览器原生单文件控件，与学生退课申请的多附件展示/样式不一致。

## 变更说明

- 代选弹窗附件对齐退课：软按钮、多选、列表预览/删除/清空，最多 5 个；仍为选填，保留现有文案口径
- 结果行改为 `adminAddAttachments[]`；旧 `adminAddAttachment` 标记弃用并兼容读写
- 学生详情抽屉与导出按多附件展示/拼接

## 非目标

- 不上传真实二进制到服务端（demo 仍仅 name/size）
- 不改退课附件逻辑本身

## 能力

### 新增能力

- `admin-add-multi-attachments`：代选多附件上传与展示

## 影响

- `AdminAddCourseForStudentModal.vue`
- `registrationResult.js`
- `ResultStudentDetailDrawer.vue`
- 导出字段拼接
- i18n（最多 N 个）
