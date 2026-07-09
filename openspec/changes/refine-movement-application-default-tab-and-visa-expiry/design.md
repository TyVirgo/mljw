# 设计
## 默认 Tab

```javascript
const activeTab = ref('programme-transfer')
```

管理端 `applicantMode=teacher` 与学生端 `student` 共用壳层，一处修改即可。

## Student Visa Expiry Date

```javascript
resolveMovementVisaExpiryFromStudent(student)
  category = studentCategory || studentType || resolveCategoryFromNationality(nationality)
  if !isChinaOrInternationalCategory(category) → '—'
  else → formatStudentPassExpiryPeriod(basicInfo) || '—'

displayMovementVisaExpiry(storedValue, category) // 详情只读
```

| Student Category | 展示 |
|------------------|------|
| China | 日期范围或 `—` |
| International | 日期范围或 `—` |
| Local | `—` |

字段名：`visaExpiryDate`（与转专业现有模型一致）。  
标签：`movementCommon.fields.visaExpiry` = `Student Visa Expiry Date`。

## 不改动

- 学籍 Basic Info Tab 现有 China/International 规则
- 培养方案 catalogue L 码存储
