# 设计
## 国籍选项

`WORLD_NATIONALITIES` 删除 `Taiwan`；`getNationalityOptionsForSelect()` 自动生效。

## Mock 学生替换

| 字段 | 原值 | 新值 |
|------|------|------|
| nationality | Taiwan | Singapore |
| placeOfBirth | Taipei | Singapore |
| permanentAddress | …Taipei…Taiwan | 88 Orchard Road, Singapore 238874 |
| institutionName | Taipei International School | Singapore International School |
| institutionLocation | Taipei, Taiwan | Singapore |
| sourceOfRecruit | Education Agent TW | Education Agent SG |
| family phone/email/income/address | +886 / .tw / TWD | +65 / .sg / SGD |

学生类别保持 `International`（Singapore 非 Malaysia/China）。
