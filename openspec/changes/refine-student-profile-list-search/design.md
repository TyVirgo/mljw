# 设计
## 字段映射

| UI 标签 | 数据 |
|--------|------|
| Student Type | `studentCategory`（Local / China / International） |
| Nationality | `basicInfo.nationality` |
| Status（列表/筛选） | Status Log 按 `dateEffective` 最新一条的 `status`；无日志时回退 `enrollment.status` |
| Outstanding Fee | `basicInfo.outstandingFee`（Y/N） |
| Phone（仅模糊搜索） | `contact.mobilePhone` |
| NRIC（模糊搜索） | `basicInfo.icNo` |

## 搜索布局

```
Row 1: [Keyword 宽输入] Programme▼ Intake▼ Status▼  [Search][Reset][More]
Row 2 (collapsed): Student Type▼ Nationality▼ Registration Time▼ ...
                   Programme Level▼ Programme Structure▼ ...
                   Expected Completion Batch▼ Expected Graduation Batch▼ Outstanding Fee▼
                   Student Pass Expiry From–To
```

`keyword` 对五字段 OR 匹配；其余下拉 AND 组合。

## 表格列顺序

搜索区出现的字段均须在主表展示（详情已在 Enrollment / Contact / Basic Info Tab）。

Checkbox | No* | Student ID* | Name* | Chinese Name | IC No. | Mobile Phone | Status | Intake | Programme Code | Nationality | Student Type | Programme | Programme Level | Programme Structure | Registration Time | Expected Completion Batch | Expected Graduation Batch | Outstanding Fee | Pass Expiry | Gender | Actions*

- IC No.：Local 显示 `icNo`，China/International 显示 `—`
- Mobile Phone：来自 `contact.mobilePhone`

\* 冻结列（Checkbox/No/ID/Name 左 sticky；Actions 右 sticky）

## Programme Level 展示

- 存储层可保留 catalogue `L6-Bachelor` 等或 `Undergraduate`；UI 与筛选统一经 `normalizeConsentProgrammeLevel` 映射为 Foundation / Undergraduate / Postgraduate
- 列表列、搜索下拉、导出均展示归一化后的标签（i18n：`consentForm.programmeLevel.*`）
- 筛选比较使用归一化值，避免 L 码与 Undergraduate 无法匹配

## 最新 Status 算法

```javascript
sort statusLogs by dateEffective desc, then id desc → first.status
fallback: enrollment.status
```

## 不改动

- Basic Info 保留 Application No
- Phone 仍在 Contact Tab，不在 Basic Info 搬迁
