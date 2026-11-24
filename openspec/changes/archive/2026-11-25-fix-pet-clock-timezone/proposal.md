# Proposal: fix-pet-clock-timezone

## Why
远端 CI run `45444014361` 在 `Backend` 单测阶段失败：`PetDomainService.decay()` 使用 `Asia/Shanghai` 时区时钟（UTC+8），而 `PetDomainServiceTest` 中的旧测试仍以 JVM 默认时区（GitHub Actions `ubuntu-latest` 为 UTC）的 `LocalDateTime.now()` 构造 `lastInteractedAt`，导致 8 小时偏差（`99→91`、`98→90`、`96→64`、`80→72`）。同时，`PetApplicationService.create()` 与 `Pet.applyInteraction()` 仍直接调用 `LocalDateTime.now()`，在 UTC 容器环境中创建或互动宠物后会引发同源 8 小时误衰减。

## What Changes
- **工作流选择**：采用 `spec-driven-custom-lite` + `skip_specs: true`，因为本次为单模块后端时区热修，不改变既定 API 契约或业务规格语义（统一按 `Asia/Shanghai` 时区时钟运行）。
- **`PetDomainService`**：暴露 `now()` 方法返回 `LocalDateTime.now(clock)`，`decay()` 统一调用 `now()`。
- **`Pet` 实体**：新增重载 `applyInteraction(InteractionResult result, LocalDateTime interactedAt)`，无参版本显式以 `LocalDateTime.now(ZoneId.of("Asia/Shanghai"))` 委托。
- **`PetApplicationService`**：`create()`、`interact()`、`purchase()`、`grantReward()` 统一经 `domainService.now()` 写入 `lastInteractedAt`。
- **单元测试 & 回归用例**：`PetDomainServiceTest` 注入固定 `Clock` 消除环境时区依赖，并补充 `decay_defaultConstructor_usesShanghaiClock`；`PetApplicationServiceTest` 补充 `createAndInteract_useDomainClock_noPhantomDecayUnderAnyTimezone` 回归测试。

## Capabilities

### New Capabilities
（无——`skip_specs: true`，热修统一对齐既有 `Asia/Shanghai` 时区行为）

### Modified Capabilities
（无——`skip_specs: true`，无规格级需求增改或删除）

## API Contract Impact
无影响——不修改 `specs/openapi.yaml`，版本号维持 `3.5.1`。

## DDD Layer Impact
- **领域层 (`domain/pet/`)**：`PetDomainService`（新增 `now()`）、`Pet`（新增带 `interactedAt` 重载，默认使用 `Asia/Shanghai`）。
- **应用层 (`application/pet/`)**：`PetApplicationService` 创建与互动路径改为通过 `domainService.now()` 传入时钟时间。

## Database Impact
无需新增 Flyway 迁移，表结构与列定义不变。

## Impact
- **后端源码**：`backend/src/main/java/com/dailyschedule/domain/pet/{PetDomainService,Pet}.java`、`backend/src/main/java/com/dailyschedule/application/pet/PetApplicationService.java`。
- **后端单测**：`backend/src/test/java/com/dailyschedule/domain/pet/PetDomainServiceTest.java`、`backend/src/test/java/com/dailyschedule/application/pet/PetApplicationServiceTest.java`。
- **文档**：`AGENTS.md` 与 `docs/architecture.md` 同步更新后端单测用例总数（`352` → `354`，测试类数仍为 `45`）。
