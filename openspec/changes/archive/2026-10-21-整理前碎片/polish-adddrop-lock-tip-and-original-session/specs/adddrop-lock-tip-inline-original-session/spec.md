## ADDED Requirements

### Requirement: 换组锁 tip 紧跟句号

换组锁「是否可选」文案后的「？」MUST 紧接句号之后展示，MUST NOT 单独换到下一行。

#### Scenario: tip 贴在句末

- **WHEN** 学生查看被换组锁禁用的必修分组行
- **THEN** 「？」出现在锁文案句号同一视觉行末（允许整句在列宽内折行，但 tip 不独立成行）

### Requirement: 拟退并入课原上课学期有值

由本单拟退并入加课池的必修课，「原上课学期」MUST 显示具体学期（拟退/课表/当前申请学期之一），MUST NOT 为「—」。

#### Scenario: MATH101 拟退后加课列表

- **WHEN** 学生拟退 MATH101 后打开加课必修列表
- **THEN** 该课「原上课学期」为非空学期串（如 2026/09）
