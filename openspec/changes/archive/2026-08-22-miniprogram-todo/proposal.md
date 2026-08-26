# Proposal: 小程序任务列表（miniprogram-todo）

## Why
Phase 2 主链（M2.1-2.2）第四个能力。日历月视图已交付（只读消费 `GET /events`），Web 端任务看板已成熟（三列看板 + 列表 + 拖拽 + 状态闭环），但小程序侧尚无任务入口——用户无法在手机上快速记录待办、查看分组列表、勾选完成。本变更用现有 `GET/POST/PATCH/DELETE /api/v1/tasks` 五端点（API 契约零变更）补齐核心动作：列表 + 状态移动 + 新建 + 删除。

## What Changes
- **TabBar 增加「任务」入口**（第 4 个 tab，`pages/todo/index`），与「首页/日历/我的」并存
- **任务列表页 `pages/todo/`**：按状态三段分组（待办 TODO / 进行中 IN_PROGRESS / 已完成 DONE），组内按 `sortOrder` 升序；项展示 title、priority（中文标签 + 色点）、dueDate、tags（色点 + 名称）、description（截断）；DONE 项弱化样式
- **状态移动**：点击任务项状态标识 → ActionSheet 选择新状态 → `PATCH /tasks/{id}/move`（TODO/IN_PROGRESS/DONE 循环切换的能力语义保留给选择器）
- **新建任务**：页面按钮 → 弹层表单（title 必填、priority 选择器、dueDate 选择器、description 选填）→ `POST /tasks`
- **删除任务**：任务项提供删除操作（确认弹窗兜底，替代 Web 端"撤销"toast）→ `DELETE /tasks/{id}`
- **复用**：Bearer 注入 / ≥400 message 上抛 / 401 清态静默重登全部复用 `lib/api.ts`（miniprogram-calendar 已交付），本变更只新增 `lib/tasks.ts`（任务 API + 校验 + 分组纯函数）
- **范围边界（不做）**：任务编辑（PUT 字段级修改）、看板拖拽、标签筛选/筛选栏、宠物联动（Web 端完成事件联动不在本变更）
- 无 BREAKING；后端零变更，API 契约零变更，不涉及版本号升级

## Capabilities

### New Capabilities
- `miniprogram-todo`: 小程序任务列表——TabBar「任务」入口 + 三段分组列表 + 状态移动 + 新建/删除，复用现有 `/tasks` 端点（列表/创建/移动/删除），Bearer 链路与 401 静默重登复用 `lib/api.ts`；日期处理复用 `calendar-date.ts` 字符串切片模式（iOS JSC 兼容）

### Modified Capabilities

## API Contract Impact
无。复用现有端点（`GET /api/v1/tasks`、`POST /api/v1/tasks`、`PATCH /api/v1/tasks/{id}/move`、`DELETE /api/v1/tasks/{id}`），`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无后端变更——API / 应用 / 领域 / 基础设施四层均不动。

## Database Impact
无。无需新 Flyway 迁移。

## Impact
- **小程序前端**（全部新增）：`pages/todo/`（index.tsx + index.config.ts + index.scss）、`components/todo/`（分组列表/任务项/新建表单弹层）、`lib/tasks.ts`、`__tests__/tasks.test.ts`、`app.config.ts`（TabBar 配置）
- **文档**：`docs/frontend/component-catalog.md`（小程序目录树 + 任务页条目）、`docs/architecture.md`（小程序测试文件/用例数）、`CLAUDE.md`（核心能力 + 测试覆盖计数）、`README.md`（小程序功能段）、`docs/planning/phase2-execution-plan.md`（归档时 `phase2-changes` 3→4）
- **无影响**：后端、`specs/openapi.yaml`、版本号（v3.5.1 不动）、Web 前端、宠物模块
