# Tasks: 主 specs 结构格式修复

<!--
  纯 OpenSpec 元文档修复，需求内容零改动。
  按"修复 A 类（补 Purpose）→ 修复 B 类（补 Scenario）→ 全量验证 → 归档"编排。
-->

## 1. 修复缺 `## Purpose` 的 spec（11 个）
<!-- 每个文件：头部 `## ADDED Requirements`（或简介+Requirements）→ `## Purpose`（一句话，从简介/标题提炼）+ `## Requirements`，需求内容原样保留 -->
- [ ] 1.1 `theme-system`（无简介，从需求反推：5 套主题 + 语义 Token 的配色体系）
- [ ] 1.2 `version-sync`（简介已有：自动化版本同步 — 以 openapi.yaml 为唯一真相源）
- [ ] 1.3 `precommit-verify`（无简介，从需求反推：提交前一键验证脚本 + CLAUDE.md 记录验证流程）
- [ ] 1.4 `frontend-unit-test-coverage`（简介已有：为缺少测试的前端源文件编写 vitest 单元测试）
- [ ] 1.5 `phase1-e2e-verification`（简介已有：Playwright E2E 验证 Phase 1 Go/No-Go 条件）
- [ ] 1.6 `playwright-e2e-infrastructure`（简介已有：引入 Playwright E2E 框架并集成 CI）
- [ ] 1.7 `lottie-animation-engine`（简介已有：Lottie 动画运行时集成）
- [ ] 1.8 `pet-roaming-system`（简介已有：宠物游走引擎）
- [ ] 1.9 `pet-emotion-state-machine`（简介已有：宠物情绪状态机）
- [ ] 1.10 `pet-interaction-particle`（简介已有：互动粒子爆发系统）
- [ ] 1.11 `pet-sidebar-presence`（简介已有：侧边栏底部迷你宠物）

## 2. 修复缺 Scenario 的 spec（1 个）
- [ ] 2.1 `lunar-holidays` — "非农历节日日期空返回"需求补 `#### Scenario:` 块，WHEN/THEN 内容原样移入

## 3. 全量验证
- [ ] 3.1 `openspec validate --specs` 全部通过（50/50）
- [ ] 3.2 git diff 逐文件核对：仅头部结构变化 + 新增 Scenario 包装，需求内容零改动
- [ ] 3.3 确认无代码/测试/API 文件被改动

## 4. 文档同步
- [ ] 4.1 无 docs/ 参考文档受影响（spec 为 OpenSpec 元文档）
- [ ] 4.2 归档后运行 `openspec validate --specs` 确认防护需求生效且全绿
