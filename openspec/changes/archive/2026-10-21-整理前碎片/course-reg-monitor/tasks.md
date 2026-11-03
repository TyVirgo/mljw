## 增量（2026-09）

- [x] 操作列 / 详情 footer 统一「加入白名单」，去掉「建议加入白名单」
- [x] 建议列白名单文案去掉「建议」前缀
- [x] 详情补充「毕业学分要求」GE/ME（总分 + 类别），沿用现有进度条
- [x] 详情「本学期学分要求」与毕业同排版：GE/ME 各总分 + 类别（含 GE 文商理 AI）
- [x] 详情标题改为「本学期课表」；去掉「操作历史」区块
- [x] 本学期/毕业分层预警 + 主表 GE/ME、毕业缺口列 + 提醒可编辑弹框
- [x] 提醒弹框按钮与详情一致；表头不换行；去掉建议操作列与详情问题清单；本学期 GE/ME 分列
- [x] 主表去掉状态/预警类型/毕业缺口；学分改为毕业学分（已选/要求）并换口径；GE/ME 表头加（已选/要求）
- [x] 统计卡对齐毕业学分口径（去低于最低/超上限）；Intake→入学批次；加入白名单一律确认

## 增量（2026-07）

- [x] Intake 展示统一 `formatIntakeBatch`（YYYY/MM）
- [x] 问题清单补齐 `creditAboveMax` 文案；详情去掉「模拟在线选课提交」

## 历史来源任务摘要

### merge-academic-alert-into-monitor

```
## 1. 数据与筛选

- [x] 1.1 监控行派生 alert 元数据；filter 支持 problemsOnly/severity/alertType；stats 含 high/medium

## 2. 监控页 UI

- [x] 2.1 单表增加问题/严重度/建议列；筛选与统计卡联动；补注册入口

## 3. 菜单与导览

- [x] 3.1 去掉 cr-alert 菜单/挂载/brief；流程导览更新
```

### polish-round-status-list-ux

```
## 1. 实现

- [x] 1.1 `myRegistrationList` 排除 cancelled
- [x] 1.2 去掉批量退课与多选列
```
