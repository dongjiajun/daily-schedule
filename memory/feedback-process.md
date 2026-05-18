---
name: feedback-process
description: 每次修改完成后必须检查 docs/memory/spec 是否需要同步更新
metadata:
  type: feedback
---

每次修改完成后，自动检查并更新：

1. **docs/** — architecture.md、api/overview.md、database/schema.md、uml/README.md 等是否因代码变更而过时
2. **memory/** — 如果有新的修复记录、架构决策、运行状态变化，更新 memory 文件并同步到用户 auto-memory 目录
3. **specs/** — openapi.yaml 是否需要版本号或接口变更，CHANGELOG.md 是否需要追加条目

**Why**: 之前多次出现代码已改但文档未同步的情况（UML 缺 User 实体、架构图用旧方法名、测试数 38→81 未更新、memory 写"测试不可用"实际已全过）

**How to apply**: 在 git commit 之前，快速扫描 docs/、memory/、specs/ 目录，确认与当前代码状态一致。不需要改的内容跳过，有差异的更新后随代码一同提交。
