## MODIFIED Requirements

### Requirement: 异动类别处理选课选项
系统 MUST 在编辑四条预置异动类别行（`PT001`、`DEF001`、`WDR001`、`RES001`）任一行时，展示含两个可独立勾选的复选框的可选选课处理区：删除原课程名单（已获得成绩的不删）、预置新专业批次名单。两个复选框 MUST 相互独立，不得相互禁用、清除或产生依赖。该区域 MUST 不限于 `PT001`。系统 MUST NOT 展示「已获得成绩课程不预置到新专业批次名单」选项，也 MUST NOT 在类别配置中读写 `excludeGradedFromPreset`。

#### Scenario: 四类均可见两项选课处理选项
- **WHEN** 用户点击 `PT001`、`DEF001`、`WDR001` 或 `RES001` 的编辑
- **THEN** 表单在自动实施与是否允许学生申请下方展示两个选课处理复选框
- **AND** 四类使用相同标签与布局
- **AND** 不展示第三项「已获得成绩课程不预置…」

#### Scenario: 选课处理复选框相互独立
- **WHEN** 用户在任一类别的行上切换任一选课处理复选框
- **THEN** 另一个复选框仍启用并保留当前勾选状态

#### Scenario: 选课处理标签与首项对齐
- **WHEN** 用户编辑任一类别的行且选课处理区可见
- **THEN** 选课处理标签与第一个复选框同行，垂直居中对齐
- **AND** 第二个复选框与第一个复选框左缘对齐
- **AND** 标签与复选框标签字号与弹框其他字段一致（13px）

#### Scenario: 非转专业默认值
- **WHEN** 用户在种子数据后首次打开 `DEF001`、`WDR001` 或 `RES001` 的编辑
- **THEN** 两个选课处理复选框默认未勾选

#### Scenario: 选课选项为可选 mock 配置
- **WHEN** 用户以任意两个复选框组合保存任一类别的行
- **THEN** 值持久化于该类别行
- **AND** 本阶段不调用真实选课 API
- **AND** 持久化数据中不含 `excludeGradedFromPreset`

## REMOVED Requirements

### Requirement: 排除已获成绩预置选项
**Reason**：产品决定不再提供「已获得成绩课程不预置到新专业批次名单」配置项。  
**Migration**：从 Edit 弹框、种子数据、normalize、空表单、保存映射与 i18n 中删除 `excludeGradedFromPreset`；加载时忽略历史 localStorage 中的该键。
