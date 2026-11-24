# Tasks: fix-pet-clock-timezone

<!--
  LITE 工作流（spec-driven-custom-lite）：1/2/3 固定分组（实施 → 文档同步 → 全量验证），
  文档同步保持在验证之前；第 3 组后的 Workflow follow-up 为纯 bullet，不是 checkbox 任务。
-->

## 1. 实施
- [x] 1.1 `PetDomainService` 新增 `public LocalDateTime now()` 返回 `LocalDateTime.now(clock)`，`decay()` 改用 `now()`
- [x] 1.2 `Pet` 新增重载 `applyInteraction(InteractionResult, LocalDateTime)`，无参版委托 `LocalDateTime.now(ZoneId.of("Asia/Shanghai"))`
- [x] 1.3 `PetApplicationService` 的 `create()`、`interact()`、`purchase()`、`grantReward()` 改用 `domainService.now()` 写入 `lastInteractedAt`
- [x] 1.4 更新 `PetDomainServiceTest` 使用固定 `Clock` 并新增 `decay_defaultConstructor_usesShanghaiClock`；`PetApplicationServiceTest` 新增 `createAndInteract_useDomainClock_noPhantomDecayUnderAnyTimezone`

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及前端组件/目录（现有描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型结构（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 未触及 API 端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 同步更新后端测试总用例数（`352` → `354`，测试类数 `45` 不变）
- [x] 2.5 `README.md` — 未触及版本/命令/功能清单（现有描述已核对仍准确）
- [x] 2.6 运行 `pnpm run docs:check` + `./scripts/sync-version.sh --check` — 文档与版本一致性检查通过
- [x] 2.7 运行 `pnpm run openspec:check` — OpenSpec 一致性检查通过

## 3. 全量验证
- [x] 3.1 `cd backend && mvn -B -ntp test "-DargLine=-Duser.timezone=UTC"` — 模拟 CI UTC 环境后端全量测试通过（45 类 354 用例）
- [x] 3.2 `cd backend && mvn -B -ntp test` — 本机默认时区后端全量测试通过（45 类 354 用例）
- [x] 3.3 E2E — 仅涉及后端 Java 宠物时钟与单测，无前端/UI 改动，跳过 E2E

## Workflow follow-up
- `/opsx:verify` — 真实源码变更（`backend/`），归档前核对完整性、正确性与一致性（0 CRITICAL）
- `/opsx:archive` — 待用户确认后归档并提交推送，观察远端 CI `Backend` 转绿
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `pnpm run docs:check`
