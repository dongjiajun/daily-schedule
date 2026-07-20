# Tasks: Event Bus + Module Registry

## 1. Shared 包 — Event Bus 类型与实现

- [x] 1.1 创建 `packages/shared/src/eventBus.ts` — SystemEvent 联合类型 + EventBus 类
- [x] 1.2 更新 `packages/shared/src/types/index.ts` — 导出 SystemEvent 类型
- [x] 1.3 更新 `packages/shared/src/index.ts` — 导出 EventBus 类 + SystemEvent
- [x] 1.4 `cd packages/shared && pnpm run build` 验证编译通过 + 9 tests passed

## 2. Frontend Core 目录骨架

- [x] 2.1 创建 `frontend/src/core/lib/` 目录
- [x] 2.2 创建 `frontend/src/core/lib/eventBus.ts` — EventBus 单例实例

## 3. Module Registry

- [x] 3.1 创建 `frontend/src/core/lib/moduleRegistry.ts` — ModuleDefinition + ModuleRegistry 类
- [x] 3.2 创建 `frontend/src/core/lib/moduleRegistry.ts` — 单例实例导出

## 4. 单元测试

- [x] 4.1 编写 EventBus 单元测试（`packages/shared/src/__tests__/eventBus.test.ts`）
- [x] 4.2 编写 ModuleRegistry 单元测试（`frontend/src/core/lib/__tests__/moduleRegistry.test.ts`）

## 5. 全量验证

- [x] 5.1 `turbo run build` 全量构建通过
- [x] 5.2 `cd frontend && pnpm run verify`（lint + build + test）全部通过（25 tests）
- [x] 5.3 `cd backend && mvn test` 不受影响（185 tests）

## 6. 文档同步

- [x] 6.1 新增 shared EventBus → 更新 `docs/architecture.md`（事件总线架构说明）
- [x] 6.2 新增 core/ 目录 → 更新 `CLAUDE.md`（core/ 目录说明）
- [x] 6.3 无新 API 端点 → 跳过 `docs/api/overview.md`
- [x] 6.4 无新实体/表 → 跳过 `docs/database/schema.md`
