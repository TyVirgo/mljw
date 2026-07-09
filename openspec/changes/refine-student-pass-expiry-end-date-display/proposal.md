# Student Pass Expiry Date 仅展示截止日期

## 背景
列表、基本信息与异动申请中 Student Pass Expiry Date 当前展示 `start - end` 时间段；产品要求仅展示最后截止日期（dd/mm/yyyy），与表单占位一致。搜索区仍用日期区间过滤。

## 变更内容
- 展示：Student Profile 列表列、基本信息 Tab、异动申请 Section I / 详情 — 仅 `studentPassExpiryEndDate`
- 搜索：Student Profile 搜索区 From/To 区间过滤不变（按 end date 匹配）
- 导出：Excel 该列改为截止日期
- 兼容：存量 snapshot 若存 `start - end` 字符串，展示时取 end 段

## 影响
- `students.js` — `formatStudentPassExpiryEndDate`、`resolveStudentPassExpiryEndDisplay`
- `movementVisaExpiry.js`、BasicInfoTab、StudentProfileView、exportStudentProfileExcel
- `refine-movement-application-default-tab-and-visa-expiry` spec 场景更新
