# 设计
## 字段值

| 存储值 | 展示 | 过滤行为 |
|--------|------|----------|
| `All` | 全部 | teacher / student 均可见 |
| `Teacher` | 老师 | 仅 teacher 端 |
| `Student` | 学生 | 仅 student 端 |

新增原因默认 `All`；缺省/旧数据 normalize 为 `All`。
