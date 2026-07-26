# Design: Phase 1 稳定性验证 (M1.6)

## Context

Phase 1 M1.1-M1.5 全部实现并归档，现有 257 后端用例 + 96 前端用例全部通过，CI 门禁通过。M1.6 不产生新代码，其本质是一次系统性的 **Go/No-Go 审查**——确认 Phase 1 五个验收条件是否全部达成。

当前状态：
- 宠物可见 ✅（RoamingPet + SidebarPet + SvgAvatar 正常工作）
- 响应日程 ✅（petEventBridge 单元测试通过，ModuleRegistry.onInit 已修复）
- Phase 0 零回归 ✅（日历全功能未退化，自动化测试全绿）
- 节日主题自切 ⚠️（自动检测逻辑存在于 `holidayEngine` 和 `settingsStore`，但未端到端验证）
- 看板全功能 ⚠️（组件和测试存在，但未系统性冒烟）

## Goals / Non-Goals

**Goals:**
- 执行 Go/No-Go 五项验收条件的系统性验证
- 发现并修复验证过程中暴露的任何缺陷（如有）
- 产出验证报告，作为 Phase 1 完成的证据

**Non-Goals:**
- 不新增功能（功能已由 M1.1-M1.5 交付）
- 不重构代码（除非发现 P0 级缺陷）
- 不改动 API 契约
- 不改动数据库 schema

## Decisions

### Decision 1: 验证方法 — 自动化 + 手动冒烟 组合

- **选择**: 自动化测试（mvn test + pnpm run test）覆盖回归门禁；手动冒烟覆盖 UI 交互和端到端场景
- **理由**: 当前无 E2E 测试框架（Playwright/Cypress），节日主题和拖拽交互的视觉验证必须人工执行
- **备选方案**: 引入 Playwright E2E 测试 — 成本过高（需维护浏览器测试基础设施），P1/P2 阶段考虑

### Decision 2: 缺陷分级策略

- **选择**: P0（阻断 Go/No-Go）> P1（在 M1.6 内修复）> P2（记录到 Phase 2 backlog）
- **理由**: 稳定性里程碑的目标不是零缺陷，而是判断 Phase 1 整体质量是否达到 v4.5 标准
- **P0 标准**: 核心流程不可用（日历打不开、宠物不显示、看板崩溃）、数据丢失、安全漏洞

### Decision 3: 节日验证以当前日期为主

- **选择**: 无需等待特定节日日期，通过查看 `holidayEngine` 的检测逻辑和 `EffectLayer` 的条件渲染来验证，若当前日期无节日则验证"非节日时无特效"的正确行为
- **理由**: 节日引擎的单元测试（在 shared 包中）已覆盖日期计算逻辑；端到端验证重点在"主题是否响应节日引擎输出"

## Verification Design

### 验证维度 1: 自动化回归（自动化）

**验证步骤**:
1. 运行 `cd backend && mvn test` — 确认 257 用例全绿
2. 运行 `cd frontend && pnpm run test` — 确认 96 用例全绿
3. 运行 `cd frontend && pnpm run lint` — 确认零 ESLint 错误
4. 运行 `cd frontend && pnpm run build` — 确认 TypeScript 检查 + Vite 构建通过
5. 运行 `turbo run build` — 确认 Monorepo 依赖链正确（shared → frontend）

**通过标准**: 所有命令 exit 0，零测试失败，零 lint 错误

### 验证维度 2: 宠物联动端到端（手动冒烟）

**验证步骤**:
1. 启动应用（dev profile），登录
2. 创建新日程 → 观察宠物是否触发 `event:created` 反应（happy + bubble）
3. 完成日程（COMPLETED）→ 观察粒子爆发效果（stars）+ 情绪变化（happy→excited 3连击）
4. 取消日程（CANCELLED）→ 观察 sad + 连击重置
5. 在任务看板创建任务 → 移动到 DONE → 观察 `task:completed` 触发宠物反应
6. 点击宠物 → 观察 hearts 粒子
7. 检查侧边栏迷你宠物是否显示（SidebarPet）

**通过标准**: 事件→粒子→情绪 链路完整，无明显延迟或丢失

### 验证维度 3: 节日主题自切（手动冒烟）

**验证步骤**:
1. 检查当前日期对应的节日（通过 `holidayEngine.getActiveThemes()` 逻辑）
2. 确认 `settingsStore` 中 `theme` 设为 `'auto'` 时是否启用了节日主题
3. 观察 `EffectLayer` 是否渲染对应特效组件（如当前无节日，确认特效层不渲染任何内容）
4. 切换 `effectIntensity` 设置（off/low/full），确认特效响应
5. 开启 `prefers-reduced-motion`（浏览器 DevTools），确认特效降级

**通过标准**: 节日引擎正确返回当前节日状态；主题和特效按配置正确渲染或降级

### 验证维度 4: 看板全功能（手动冒烟）

**验证步骤**:
1. 导航到 `/todo`（任务看板页面）
2. 创建任务 — 验证默认状态 TODO、默认优先级 MEDIUM
3. 编辑任务 — 修改标题、描述、优先级、截止日期
4. 拖拽任务从 TODO → IN_PROGRESS → DONE（三列间移动）
5. 在同列内拖拽调整排序
6. 切换到列表视图 — 验证信息展示完整
7. 在列表视图中切换任务状态
8. 按标签筛选任务
9. 删除任务 — 确认级联删除 task_tags
10. 验证逾期日期标红显示（dueDate < today 且 status ≠ DONE）

**通过标准**: 所有 CRUD 操作正常，拖拽排序持久化，无 UI 闪烁或状态丢失

### 验证维度 5: 边界条件与容错（手动冒烟）

**验证步骤**:
1. 空数据状态 — 无日程/无任务/无宠物时的空白页展示
2. 超长标题（200 字符）—— 不溢出 UI
3. 快速连续操作（连续创建 5 个日程）—— 无状态不一致
4. 网络断开后恢复 — UI 不崩溃
5. 刷新页面 — 数据不丢失，状态恢复正确

**通过标准**: 无白屏、无未捕获异常、数据一致

## DDD Layer Design

不适用。本变更不修改任何后端代码。

## API Design

不适用。不修改 `specs/openapi.yaml`。

## Database Design

不适用。不新增 Flyway 迁移。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 手动冒烟遗漏场景 | 按 checklist 逐项执行，记录结果 |
| 发现 P0 缺陷需修复 | 在 M1.6 内修复后重新验证，修复超过 2 个 P0 则 Go → No-Go |
| 节日引擎在某日期有 bug | 不等待特定日期，查代码逻辑 + 单元测试覆盖 |
| 浏览器差异 | 至少验证 Chrome（主力），Edge/Firefox 快速冒烟 |

## Go/No-Go 判定标准

| 条件 | 判定方式 | 阈值 |
|------|---------|------|
| 自动化回归 | `mvn test` + `pnpm run test` | 100% 通过 |
| 宠物联动 | 手动冒烟 checklist | 6/7 场景通过 |
| 节日主题自切 | 手动冒烟 checklist | 全部通过 |
| 看板全功能 | 手动冒烟 checklist | 9/10 场景通过 |
| Phase 0 零回归 | 日历手动冒烟（创建/编辑/删除/拖拽/筛选/ICS/SSE） | 全部通过 |

**Go**: 五项条件全部达到阈值 → 标记 Phase 1 完成
**No-Go**: 任一条件未达标 → 修复后重新验证，不允许带着已知缺陷进入 Phase 2

## Open Questions

- 是否需要产出正式的验证报告文档（`docs/phase1-verification-report.md`）？（建议产出，作为 Phase 1 完成的证据）
- 如果发现 P1 级缺陷（非阻断但影响体验），是修复还是记录到 Phase 2？
