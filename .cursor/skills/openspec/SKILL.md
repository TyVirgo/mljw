---
name: openspec
description: >-
  OpenSpec 规格驱动开发总入口（propose / apply / explore / archive / sync）。
  Use when the user mentions OpenSpec、opsx、规格驱动、变更提案、实现 tasks、归档变更、
  openspec/ 目录，或输入 /opsx-propose、/opsx-apply 等斜杠命令。
---

# OpenSpec 工作流

本项目已安装 `@fission-ai/openspec`，规格目录为 `openspec/`。

## 对话框用法

- **@openspec** — 在 Cursor 输入框 @ 引用本 skill，然后描述要做的变更
- **斜杠命令** — `/opsx-propose`、`/opsx-apply`、`/opsx-explore`、`/opsx-archive`、`/opsx-sync`
- **CLI** — `npm run openspec -- list`（或 `npm run opsx -- list`）

## 按意图选择子 skill

执行前先 **Read** 对应子 skill 的 `SKILL.md`，再按其中步骤操作：

| 用户意图 | 子 skill 路径 |
|----------|----------------|
| 新建变更、写 proposal/design/tasks/spec | `.cursor/skills/openspec-propose/SKILL.md` |
| 按 tasks.md 实现代码 | `.cursor/skills/openspec-apply-change/SKILL.md` |
| 探索需求、讨论方案（不一定写代码） | `.cursor/skills/openspec-explore/SKILL.md` |
| 功能完成、归档 change | `.cursor/skills/openspec-archive-change/SKILL.md` |
| 将 delta spec 合并到 `openspec/specs/` | `.cursor/skills/openspec-sync-specs/SKILL.md` |

## 项目约定

实现前阅读 `openspec/config.yaml` 中的技术栈与目录约定。

常用 CLI：

```bash
npm run openspec -- list
npm run openspec -- change status <change-name>
npm run openspec -- view
```
