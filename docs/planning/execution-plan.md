# 宏观执行计划（含产品愿景）

> **状态**: 📋 Phase 2 规划中（Phase 0-1 已完成）
> **版本说明**: v4.0/v4.5/v5.0 为**内部规划代号**，与实际契约版本号（v3.x，specs/openapi.yaml ↔ pom.xml ↔ package.json 三处同步）独立演进。当前实际版本: **v3.5.0**（2026-08-15）。
> **来源**: 合并自原 `execution-plan.md` + `vision-roadmap-draft.md`（2026-08-01，docs-organization-cleanup）

---

## 一、产品定位与愿景

将日程管理系统从单一日历工具（v3.1）转型为以**宠物养成为核心差异化**、**插件式模块架构为技术基础**的个人管理中心，覆盖 Web + 微信小程序。

### 产品定位转变

| 维度 | 当前 (v3.5.0) | 目标 |
|------|------------|------|
| 产品类型 | 单一日程管理工具 | 多模块个人管理中心 |
| 驱动力 | 理性驱动（"应该管理日程"） | 情感驱动 + 理性支撑（"宠物陪我一起成长"） |
| 用户心智 | 用完即走的工具 | 每天想回来看看的伙伴 |
| 架构 | 单体前端，日历为中心 | 插件式平台，模块可插拔 |
| 平台 | 仅 Web | Web + 微信小程序 |
| 受众 | 中文用户 | 全球用户（覆盖国际节日） |
| 差异化 | 宠物养成（已建立） | **宠物养成 + 生态深度** |

### 四大战略方向

| 方向 | 核心内容 | 状态 |
|------|---------|------|
| 1. 插件式模块化平台 | core/ + modules/ 分离、ModuleRegistry + EventBus、动态路由、TabbedDialog | ✅ 已实现（Phase 0） |
| 2. 宠物养成系统 🐾 | 体验层宠物：始终可见/交互/陪伴；所有模块行为产出养成资源，宠物状态反哺体验 | 🟡 已实现 v2（橘猫/柴犬游走、情绪状态机、粒子特效、日程/任务联动）；**未实现**: 更多宠物、进化、装扮商店、节日限定皮肤 |
| 3. 国际节日主题系统 | 四层节日数据（固定公历/浮动公历/农历/地区性）、节日主题自动切换、特效系统 | ✅ 已实现（Phase 1） |
| 4. 跨平台微信小程序 | Taro 4.x + NutUI，与 Web 共享 packages/shared/，微信登录 + 订阅消息替代 SSE | ⏳ Phase 2 |

**方向 2 详细蓝图（宠物养成）**:

宠物是所有模块的"体验层"，模块行为 → 养成资源：

| 行为 | 资源产出 | 设计意图 |
|------|---------|---------|
| 完成日程 | +专注币 +经验 | 正向激励执行力 |
| 连续打卡 N 天 | +稀有道具碎片 | 鼓励持续使用 |
| 完成习惯打卡 | +食物 +心情 | 健康生活联动 |
| 番茄钟专注 | +专注币（倍率） | 深度工作奖励 |
| 写笔记 | +装饰素材 | 知识沉淀奖励 |
| 登录签到 | +每日礼包 | 日活留存 |
| 达成目标里程碑 | +限定皮肤 | 长期目标激励 |

**反哺机制**: 长时间不登录 → 宠物无精打采（情感驱动打开）；日程逾期 → 宠物失落；完成重要目标 → 进化发光；深夜使用 → 打哈欠提示休息。

**宠物多样性**（规划）: 🐱 橘猫（免费初始）· 🐶 柴犬（免费初始）· 🐰 垂耳兔（连续打卡 7 天）· 🐼 小熊猫（500 专注币）· 🐉 小龙（累计完成 100 日程）· 节日限定（春节·年兽 / 中秋·玉兔 / 圣诞·驯鹿…）

**成长路径**: 蛋 🥚 → 幼崽 🐣（3天）→ 成年 🐱（10天）→ 传说 ✨（30天）

**方向 4 详细蓝图（微信小程序）**:

- 技术选型: Taro 4.x + React + NutUI；与 Web 共享 `packages/shared/`（类型、工具函数、宠物规则、i18n）
- 认证: `wx.login()` → code → 后端换 openid → 签发 JWT（Flyway V7: `user.openid`）
- 通知: `wx.requestSubscribeMessage()` 替代 SSE
- 宠物: lottie-miniprogram 渲染；主题: 编译时注入 / 运行时替换（小程序 CSS 变量支持有限）
- **小程序非 Web 简化版**: 优先实现日程查看、任务管理、宠物互动、习惯打卡；不做复杂管理/拖拽编辑

---

## 二、技术决策

### 启动前锁定决策（Phase 0）

| # | 决策 | 推荐方案 | 理由 |
|---|------|---------|------|
| D1 | Monorepo | **Turborepo** | 构建缓存 + 任务编排，比 Nx 简单 |
| D2 | 宠物动画 | **SVG 程序化插画（SvgAvatar）** | Rive/Lottie 兼容性风险，已实际落地 |
| D3 | 事件总线 | **同步派发 + 联合类型** | 状态一致性 |
| D4 | 后端模块化 | **模块化单体** | 单团队，包级别 BC 已存在 |
| D5 | 节日库 | **lunar-typescript + 自建数据** | 轻量可维护 |
| D6 | PWA | **vite-plugin-pwa** | Vite 标准方案 |

### 关键架构决策

1. **宠物与模块架构的张力**: 宠物系统不直接依赖任何模块，只监听事件总线；模块不"知道"宠物，只发出事件 — 事件总线是唯一解耦层
2. **事件总线是模块间唯一通信方式**: 模块间不直接 import 彼此的 store/组件，事件类型定义在 `core/lib/eventBus.ts`（共享包 SystemEvent 联合类型）
3. **Monorepo 共享边界**: `packages/shared/` 只共享纯逻辑（类型、工具函数、业务规则、宠物规则）；UI、路由、样式各自实现
4. **小程序非 Web 简化版**: 核心场景适配，不做完整移植

---

## 三、关键约束（不可违反）

1. 所有变更走 **OpenSpec 流程**（proposal → design → spec → tasks → apply → verify → archive）
2. `specs/openapi.yaml` 是 API 唯一真相源
3. Controller **必须实现**生成的接口（编译期强约束）
4. DDD 四层依赖方向: **API → 应用 → 领域 ← 基础设施**
5. 所有业务查询强制 `user_id` 过滤
6. CI 五道门禁: 后端 test + 前端 lint/test/build（含 SDK freshness）+ E2E
7. 每次变更后同步更新文档
8. 版本号同步: `openapi.yaml` ↔ `pom.xml` ↔ `package.json`（规划代号 v4.x 与此独立）

---

## 四、分阶段路线图

| Phase | 主题 | 时长 | 人周 | 目标版本（代号） |
|-------|------|------|------|---------|
| Phase 0 | 架构重构 | 8 周 | 16 | v4.0 ✅ 完成 |
| Phase 1 | 情感核心 | 10 周 | 20-30 | v4.5 ✅ 完成 |
| Phase 2 | 多端 + 深度 | 16 周 | 32-48 | v5.0 规划中 |
| Phase 3+ | 生态扩展 | 16-24 周 | 32-72 | v5.x+ 规划中 |

### Phase 0: 架构重构 ✅（已落地）

Monorepo（Turborepo + shared 包）、模块注册中心 + 事件总线、`core/` 目录重构、日历模块提取（modules/calendar）、PWA + 版本同步。实际归档变更: `monorepo-foundation`、`event-bus-module-registry`、`core-directory-restructure`、`calendar-module-extraction`、`pwa-support`、`version-sync-automation`、`cleanup-project-structure-v31` 等。

### Phase 1: 情感核心 ✅（已落地，验收 GO）

- **M1.1 宠物后端**（pets/pet_accessories/pet_interactions 表，GET/POST /pets/me、/feed、/play、/shop）
- **M1.2 宠物前端 v1**（PetAvatar、PetBubble、事件总线联动）
- **M1.3 国际节日引擎**（四层节日数据，lunar-typescript）
- **M1.4 节日主题 + 特效**（18 套节日主题 `holiday-themes.css`；4 种特效组件：雪花/花瓣（纯 CSS）+ 烟花/灯笼（tsParticles）；`leaf`/`heart` 仅存在于 EffectType 类型定义，无实现组件）
- **M1.5 任务看板模块**（tasks/task_tags 表、Kanban CRUD + 拖拽 + 宠物联动）
- **M1.6 稳定性** — Go/No-Go: **GO**（详见归档 `2026-07-27-phase1-stability-verification`）
- 超出计划的实际变更: `fix-module-routing-and-ui`、`pet-v2-roaming-animation`（游走动画 + SVG 插画 + 粒子）、`polish-task-board-ui`（看板 UI 统一）

### Phase 2: 多端 + 深度 (代号 v5.0) — 16 周

**主题**: "无处不在，深度更强"

> 📋 **执行级清单**: 里程碑拆解、任务顺序与进度跟踪见 `docs/planning/phase2-execution-plan.md`（docs-check 防呆联动，全部完成后移除）。

- **M2.1-2.2 微信小程序**（Week 1-8）: `packages/miniprogram/`（Taro 4.x + NutUI）、微信登录 + Flyway V7 user.openid、核心场景（日历月视图只读/任务列表/宠物互动/习惯打卡）、订阅消息替代 SSE
- **M2.3 习惯 + 专注**（Week 5-10，并行）: 习惯（每日打卡 + 热力图 + 连续记录 + 统计分析）、专注（番茄钟 + 白噪音 + 关联日程 + 统计）
- **M2.4 宠物 v2**（Week 8-12）: 进化（蛋 → 幼崽 → 成年 → 传说）、装扮商店 + 节日限定服装、宠物详细页面
- **M2.5 稳定性**（Week 12-16）: Go/No-Go — 小程序可用 + 习惯专注全功能 + 宠物进化可行 + Phase 0/1 零回归

### Phase 3+: 生态扩展 (v5.x+)

笔记 → 目标管理 → 财务 → 数据看板 → 宠物社区（好友宠物访问）→ 第三方模块 API → i18n。每模块 4-8 周，遵循相同 DDD + 模块注册模式。

### 关键路径（零 slack）

```
Phase 0 Module Registry → M1.1 Pet Backend → M1.2 Pet Frontend → Phase 2 Mini-Program
```

### 并行化机会

- Phase 2: M2.1+M2.2（小程序）∥ M2.3（习惯+专注）

---

## 五、模块蓝图

### 全部可扩展模块

| 优先级 | 模块 | 核心功能 | 实现成本 | 状态 |
|--------|------|---------|---------|------|
| 🔴 已有 | 日程管理 | 日历视图、CRUD、拖拽、状态流转、提醒、ICS 导出 | — | ✅ |
| 🟡 P1 | 任务看板 | 看板/列表视图、优先级、拖拽 | 低 | ✅ |
| 🟡 P1 | 宠物系统 | 养成、互动、事件联动 | 中高 | 🟡 v2 已实现，进化/装扮待做 |
| 🟡 P1 | 习惯追踪 | 每日打卡、热力图、统计分析 | 中 | ⏳ Phase 2 |
| 🟢 P2 | 专注计时 | 番茄钟、白噪音、统计、关联日程 | 低 | ⏳ Phase 2 |
| 🟢 P2 | 笔记日记 | Markdown 编辑、关联日程、全文搜索 | 中 | ⏳ Phase 3 |
| 🟢 P2 | 目标管理 | OKR、里程碑、关联任务 | 中 | ⏳ Phase 3 |
| 🔵 P3 | 财务记录 | 收支、预算、周期账单 | 高 | ⏳ 未规划 |
| 🔵 P3 | 数据看板 | 时间分析、效率报告 | 高 | ⏳ 未规划 |
| 🔵 P3 | 知识库 | Wiki、全文搜索、导出 | 高 | ⏳ 未规划 |

### 跨模块联动设计

| 源模块 | 目标模块 | 联动方式 | 示例 |
|--------|---------|---------|------|
| 日程 | 任务 | 从日程创建任务 | "会议 → 会后待办" |
| 日程 | 笔记 | 关联笔记 | "会议纪要" |
| 日程 | 专注 | 日程触发专注 | "会议期间自动专注" |
| 任务 | 日程 | 时间块 | "为任务预留时间块" |
| 习惯 | 日程 | 习惯日历显示 | "每日冥想显示在日历" |
| 专注 | 日程 | 专注记录 | "本周专注趋势" |
| 目标 | 任务 | 目标拆解 | "OKR → 子任务" |
| 目标 | 习惯 | 习惯对齐 | "学英语 → 每日背单词" |

---

## 六、待明确问题

1. **小程序宠物渲染** ⏳ 延后到 Phase 2 决策（lottie-miniprogram vs 其他）
2. **i18n 方案** ⏳ 延后到 Phase 3+ 决策
3. ~~宠物动画引擎~~ ✅ 已决策: SVG 程序化插画（SvgAvatar），放弃 Rive/Lottie
4. ~~节日特效性能预算~~ ✅ 已决策: CSS（雪花/花瓣）+ tsParticles（烟花/灯笼），移动端自动降级 + `prefers-reduced-motion`
5. ~~Monorepo 工具~~ ✅ 已决策: pnpm workspace + Turborepo
6. ~~后端模块化~~ ✅ 已决策: 模块化单体（modular monolith），DDD Bounded Context

---

## 七、验证命令

```bash
cd backend && mvn test                  # 后端全量
cd frontend && pnpm run verify           # lint + tsc + build + vitest
cd frontend && npm run test:e2e          # Playwright E2E
turbo run build                          # Monorepo 全量
```
