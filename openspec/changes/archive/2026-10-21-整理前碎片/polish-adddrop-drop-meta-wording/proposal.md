## Why

退课选择说明「退课合计 / 原来合计 / 还剩合计」语序与用词不够顺口，需改为「退课前 → 退课 → 还剩」叙述。

## What Changes

- 文案改为：「已选择 {count} 门课程，退课前学分合计{original}分，退课学分合计{credits}分，还剩学分合计{remain}分」（英文等价）。
- 数值口径不变（original=基线学期总，credits=勾选合计，remain=original−credits）。

## Non-goals

- 不改学分条投影与勾选计算逻辑。

## Capabilities

### New Capabilities

- `adddrop-drop-meta-wording`: 退课选择说明语序

### Modified Capabilities

- （无）

## Impact

- i18n zh/en `coursePickerSelectedDropCredits`
