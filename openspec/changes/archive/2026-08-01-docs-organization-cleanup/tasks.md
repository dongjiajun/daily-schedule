# Tasks: 文档组织清理与 CLAUDE.md 精简

<!--
  纯文档变更，无代码/数据库/API 影响。
  按"删除 → 迁移 → 合并 → 精简 → 更新 → 验证"编排。
-->

## 1. 变更前引用核查
- [x] 1.1 grep 全仓库确认 `memory/` 无外部引用（已确认：仅 feedback-process.md 自引用）
- [x] 1.2 grep 确认 `frontend/README.md` 无外部引用（README.md 文档表除外）
- [x] 1.3 确认 `docs/vision-roadmap-draft.md`、`docs/execution-plan.md` 无 CI/脚本引用
  - 额外发现：`docs/architecture.md:217` 引用 vision-roadmap-draft、`packages/shared/src/eventBus.ts:4` 注释引用 vision-roadmap-draft —— 已在 §3/§5 处理

## 2. 删除冗余文件
- [x] 2.1 删除 `frontend/README.md`
- [x] 2.2 删除 `memory/feedback-process.md` + `memory/v1.1-improvements.md`，移除空目录 `memory/`
- [x] 2.3 删除 `docs/vision-roadmap-draft.md`

## 3. 迁移一次性报告
- [x] 3.1 移动 `docs/phase1-verification-report.md` → `openspec/changes/archive/2026-07-27-phase1-stability-verification/`
- [x] 3.2 确认归档目录无同名文件冲突

## 4. 合并规划文档
- [x] 4.1 新建 `docs/planning/` 目录
- [x] 4.2 以 `docs/execution-plan.md` 为主体，将 `vision-roadmap-draft.md` 的愿景章节（产品定位转变、四大战略方向）并入开头
- [x] 4.3 头部状态标记更新：`状态: 📋 Phase 2 规划中（Phase 0-1 已完成）` + 版本说明（v4.0/v4.5/v5.0 为内部规划代号，与契约版本 v3.x 独立演进）
- [x] 4.4 更新过时数字：CI 门禁四道 → 五层（含 E2E）；测试数 185/15 → 257/166/25
- [x] 4.5 删除合并后残留的重复章节（目录结构、模块清单仅保留一份）
- [x] 4.6 移除原"关联文档: docs/vision-roadmap-draft.md"引用

## 5. 精简 CLAUDE.md
- [x] 5.1 删除"关键路径"段
- [x] 5.2 常用命令段：删"首次设置"（保留一行指向 README 快速开始）；压缩 shared 子路径说明；后端/前端命令合并
- [x] 5.3 契约驱动 API 管道段：保留 3 条关键约定（Controller 必须实现 / src/api 生成管理 / 自定义逻辑位置），删除流程细节
- [x] 5.4 架构段：前端目录树压缩；状态管理/模块通信/持久层改为一行指针（→ docs/architecture.md）
- [x] 5.5 压缩"本地环境"段（保留 MySQL 服务名/账号一行即可）
- [x] 5.6 文档检查段落追加兜底句："不走 OpenSpec 流程的小改动（热修/文档勘误）同样适用上述清单，提交前逐项核对"
- [x] 5.7 逐段核对五条铁律保留：OpenSpec 流程 / unwrap / authInterceptor / 版本号同步 / 文档检查清单
- [x] 5.8 验证行数 ≤ 200（目标 ~160）— 实际 176 行

## 6. 更新 README.md
- [x] 6.1 文档索引表：移除 `frontend/README.md`、`docs/execution-plan.md`（改为 `docs/planning/execution-plan.md`）、`docs/vision-roadmap-draft.md` 条目
- [x] 6.2 同步更新 `docs/architecture.md` 设计文档引用（vision-roadmap-draft → planning/execution-plan；specs 数量 46 → 50）

## 7. 全量验证
- [x] 7.1 grep 确认无悬空引用（`memory/`、`frontend/README.md`、`vision-roadmap-draft.md`、`docs/execution-plan.md` 旧路径）— 剩余两处为有意保留的历史来源说明 + 已修复的 eventBus.ts 注释
- [x] 7.2 通读精简后 CLAUDE.md，确认五条铁律 + 文档检查清单完整
- [x] 7.3 通读合并后 `docs/planning/execution-plan.md`，确认章节完整、数字准确
- [x] 7.4 `openspec validate docs-organization-cleanup` 通过
- [x] 7.5 确认无代码/测试/API 文件被改动（git status 应仅含文档文件 + eventBus.ts 注释引用修复）
