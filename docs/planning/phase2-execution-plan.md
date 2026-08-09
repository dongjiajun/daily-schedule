# Phase 2 执行规划（代号 v5.0）

> **状态**: 🟡 执行中（规划已拆解，任务逐项开工）
> **关联**: 宏观路线图见 `docs/planning/execution-plan.md`；本文件是 Phase 2 的**执行级清单**——每项任务 = 一个 OpenSpec 变更，任务名与该变更归档目录名（去日期前缀）一一对应。
> **防呆**: 本文件进度由 `scripts/docs-check.mjs` 的 `phase2-changes` counter 验证（见文末同步规则）。

---

## 一、演进顺序与依赖分析

```
Week 1 ────────────────────────────────────────────── Week 16
│ M2.1-2.2 微信小程序（主链，零 slack）─────────────→│
│              │                                     │
│              └─ Week 5 起并入 M2.3 习惯+专注（并行支线）→│
│                                     │              │
│                              Week 8 起 M2.4 宠物 v2 →│
│                                          │         │
│                                     Week 12 M2.5 稳定性 → GO/NO-GO
```

**为什么小程序是第一步**（执行计划关键路径：Phase 0 → M1.1 → M1.2 → Phase 2 Mini-Program）：小程序是零 slack 主链，周期最长（8 周）、外部风险最高（微信平台/登录/订阅消息），最先启动。习惯+专注是 Week 5 起并入的并行支线，不占用主链时间。

**依赖关系（决定顺序的底层逻辑）**：

| 里程碑 | 前序依赖 | 依赖原因 |
|------|---------|---------|
| M2.1-2.2 小程序 | Phase 0/1 基建（已就绪） | 无新依赖，最先动 |
| M2.3 习惯+专注 | 无（与小程序并行） | Web 端新模块，与小程序代码无交集 |
| M2.4 宠物 v2 | **M2.3 的资源产出** | 进化/装扮商店消耗专注币/食物/心情——资源供给机制部分由习惯+专注实现（方向 2 蓝图） |
| M2.5 稳定性 | 前三者全部 | Go/No-Go 汇总验收 |

**两条线的汇合点**：小程序的 `miniprogram-habit` 依赖 M2.3 的后端 API——这正是 M2.3 从 Week 5 并入的原因（小程序前端基建 4 周后，习惯后端恰好供给）。

## 二、里程碑任务清单

> 任务行格式：`- [ ] <kebab-name> — <描述>`（未完成）/ `- [x] <kebab-name> — <描述>`（已完成）。完成一项变更并归档后，同步更新该行与文末 marker（见同步规则）。

### M2.1-2.2 微信小程序（主链，Week 1-8）

- [ ] miniprogram-foundation — Taro 4.x + NutUI 脚手架、pnpm workspace 接入、shared 包复用验证
- [ ] wechat-auth — Flyway V7 user.openid + wx.login code→JWT
- [ ] miniprogram-calendar — 日历月视图只读
- [ ] miniprogram-todo — 任务列表
- [ ] miniprogram-pet — 宠物互动
- [ ] subscribe-message — 订阅消息替代 SSE
- [ ] miniprogram-habit — 习惯打卡（依赖 M2.3 后端 API）

### M2.3 习惯+专注（并行支线，Week 5-10）

- [ ] habit-crud-backend — habit 表 + CRUD API（领域/应用/API 全链路）
- [ ] habit-crud-frontend — 习惯列表 + 每日打卡交互
- [ ] habit-stats — 热力图 + 连续记录 + 统计分析
- [ ] focus-pomodoro — 番茄钟 + 白噪音 + 关联日程 + 统计
- [ ] habit-pet-bridge — 习惯完成 → 宠物食物/心情资源产出（方向 2 蓝图联动）

### M2.4 宠物 v2（Week 8-12，依赖 M2.3 资源经济闭环）

- [ ] pet-evolution — 进化状态机：蛋 → 幼崽 → 成年 → 传说
- [ ] pet-shop — 装扮商店 + 节日限定服装
- [ ] pet-detail-page — 宠物详细页面

### M2.5 稳定性（Week 12-16）

- [ ] phase2-stability-verification — Go/No-Go：小程序可用 + 习惯专注全功能 + 宠物进化可行 + Phase 0/1 零回归

## 三、进度同步规则（docs-check 防呆）

- `scripts/docs-check.mjs` 的 `phase2-changes` counter 现场重算：**文末 marker 声明值**必须等于**"任务清单中已归档的任务数"**（任务名匹配 `openspec/changes/archive/` 目录名去 `YYYY-MM-DD-` 前缀）。
- **每完成一个变更并归档**，同步两步：
  1. 该任务行 `[ ]` → `[x]`
  2. 文末 marker 数字 +1
- 两步漏任一步，`pnpm run docs:check` 非零退出（CI version-check job 会拦截）。

## 四、完成与移除条件

- 全部 16 项任务 `[x]` 且 marker 声明 = 16 → **移除本文件**（`docs-check` 对该 marker 的检查随文档消失自然跳过，不留残留约束）
- 移除后更新 `docs/planning/execution-plan.md` 的 Phase 2 状态为已完成

<!-- DOCS-CHECK: phase2-changes=0 -->
