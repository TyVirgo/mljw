## Why

加退重修申请表单、详情与审批弹窗的课程明细表缺少或截断「课程类型」列，且审批表「名额」表头被 ellipsis 裁切，与选课 picker / 产品图示不一致。

## What Changes

- 申请表单退课/加课/重修明细表增加「课程类型」列（课程注册类型，非申请类型）
- 详情退课/加课/重修表展示完整课程类型；缺字段时回落课程目录
- 审批弹窗在课程名称后增加「课程类型」列；与申请类型列分离命名
- 审批「名额」及类型类表头取消 ellipsis 裁切；学分条标签避免竖向裁切
- 审批弹窗「操作」列（通过/不通过/驳回）加宽且 overflow 可见，表 `min-width` 抬升，保证表头与内容不被裁切（可横向滚动）

## Capabilities

### New Capabilities

- `adddrop-course-type-columns`: 加退重修明细表课程类型列与表头完整展示

## Impact

- `AddDropApplicationFormSections`、`AddDropApplicationDetailBody`、`AddDropApprovalModal`、`AddDropTermCreditStrip`
