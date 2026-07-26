# 日程管理系统 — 愿景与路线图草案

> **状态**: 草案 (Draft)
> **创建日期**: 2026-07-20
> **来源**: 探索模式深度分析输出

---

## 一、产品定位转变

### 从 → 到

| 维度 | 当前 (v3.1) | 目标 |
|------|------------|------|
| 产品类型 | 单一日程管理工具 | 多模块个人管理中心 |
| 驱动力 | 理性驱动（"应该管理日程"） | 情感驱动 + 理性支撑（"宠物陪我一起成长"） |
| 用户心智 | 用完即走的工具 | 每天想回来看看的伙伴 |
| 架构 | 单体前端，日历为中心 | 插件式平台，模块可插拔 |
| 平台 | 仅 Web | Web + 微信小程序 |
| 受众 | 中文用户 | 全球用户（覆盖国际节日） |
| 差异化 | 暂无 | **宠物养成系统** — 核心差异化卖点 |

---

## 二、四大战略方向

### 方向 1: 插件式模块化平台 ⭐ 架构基石

**目标**: 彻底重构为插件式平台，支持功能剧烈变动而不臃肿。

**核心原则**:
- **隔离优于复用** — 模块间不直接依赖，通过事件总线通信
- **显式优于隐式** — 每个模块显式声明路由、store、初始化逻辑
- **渐进优于大爆炸** — 逐步将现有日历逻辑迁移到模块架构
- **约定优于配置** — 目录结构约定、命名约定、导出约定

**模块定义规范**:
```typescript
interface ModuleDefinition {
  id: string                    // 唯一标识
  name: string                  // 显示名称
  description: string           // 描述
  icon: React.ComponentType     // 图标
  order: number                 // 侧边栏排序权重
  routes: RouteObject[]         // 路由定义 (lazy loaded)
  stores?: Record<string, StateCreator>  // 模块级 Zustand stores
  onInit?: () => void | Promise<void>
  onDestroy?: () => void
  petActions?: PetActionDefinition[]     // 模块行为→宠物反应映射
}
```

**目录结构**:
```
frontend/src/
├── core/                # 共享核心（精简、稳定）
│   ├── components/ui/   # shadcn/ui 基础组件
│   ├── store/           # authStore, settingsStore, navigationStore
│   ├── hooks/           # useTheme, useAuth
│   ├── lib/             # unwrap, authInterceptor, eventBus, moduleRegistry
│   ├── api/             # 共享 API 客户端
│   └── styles/          # themes.css, holiday-themes.css
│
├── modules/             # 功能模块（可插拔）
│   ├── calendar/        # 日程管理（现有逻辑迁移）
│   ├── pet/             # 宠物系统（核心差异化）
│   ├── todo/            # 任务看板（首个新业务模块）
│   ├── habits/          # 习惯追踪
│   ├── notes/           # 笔记日记
│   ├── pomodoro/        # 专注计时
│   └── goals/           # 目标管理
│
├── App.tsx              # 精简：Provider + 模块路由组装
└── main.tsx
```

**后端模块化**（DDD Bounded Context）:
```
backend/src/main/java/.../
├── core/                # 共享内核 (auth, user, tag, category, notification)
├── calendar/            # 日程 BC (现有四层)
├── pet/                 # 宠物 BC
├── todo/                # 任务 BC
├── habit/               # 习惯 BC
├── note/                # 笔记 BC
└── pomodoro/            # 专注 BC
```

**事件总线**（模块间松耦合的关键基础设施）:
```typescript
type SystemEvent =
  | { type: 'event:completed'; payload: { eventId: string; title: string } }
  | { type: 'event:created'; payload: { eventId: string; title: string } }
  | { type: 'event:cancelled'; payload: { eventId: string; title: string } }
  | { type: 'task:completed'; payload: { taskId: string; title: string } }
  | { type: 'task:created'; payload: { taskId: string } }
  | { type: 'habit:checked'; payload: { habitId: string } }
  | { type: 'habit:streak'; payload: { habitId: string; days: number } }
  | { type: 'focus:completed'; payload: { duration: number } }
  | { type: 'user:login'; payload: { consecutive: number } }
  | { type: 'user:dailyCheckin'; payload: { timestamp: number } }
```

### 方向 2: 宠物养成系统 🐾 核心差异化卖点

**定位**: 不是付费养成，而是围绕应用生态提供养成资源。宠物是所有模块的"体验层"，始终可见、始终交互、始终陪伴。

**宠物作为"体验层"**:
```
宠物体验层 (始终可见、始终交互、始终陪伴)
    │
    ├─ 日程 ──┐
    ├─ 任务 ──┼── 所有模块行为产生"养成资源"
    ├─ 习惯 ──┤
    ├─ 笔记 ──┤
    ├─ 专注 ──┘
    │
    └─ 宠物状态反哺各模块体验 (提醒、鼓励、陪伴、反馈)
```

**生态内养成资源**:

| 行为 | 资源产出 | 设计意图 |
|------|---------|---------|
| 完成日程 | +专注币 +经验 | 正向激励执行力 |
| 连续打卡 N 天 | +稀有道具碎片 | 鼓励持续使用 |
| 完成习惯打卡 | +食物 +心情 | 健康生活联动 |
| 番茄钟专注 | +专注币（倍率） | 深度工作奖励 |
| 写笔记 | +装饰素材 | 知识沉淀奖励 |
| 管理分类/标签 | +少量经验 | 组织能力奖励 |
| 登录签到 | +每日礼包 | 日活留存 |
| 达成目标里程碑 | +限定皮肤 | 长期目标激励 |

**反哺机制**:
- 长时间不登录 → 宠物无精打采 → 情感驱动打开
- 日程逾期 → 宠物失落 → 用户更重视
- 完成重要目标 → 宠物进化发光 → 成就感拉满
- 深夜使用 → 宠物打哈欠 → 提示休息

**关键整合点**:

| 场景 | 宠物行为 | 触发条件 |
|------|---------|---------|
| 日程提醒 | 弹出 + 语音气泡提醒 | 日程开始前 N 分钟 |
| 日程冲突 | 焦急踱步，头顶冒汗 | 两个日程时间重叠 |
| 完成任务 | 开心跳跃 + 撒花 | 标记为 COMPLETED |
| 取消/逾期 | 失落低头 | 取消或过期未完成 |
| 每日首次登录 | 热情迎接 + 签到奖励 | 每天首次打开 |
| 连续打卡 | 进化发光 | 连续 N 天完成所有日程 |
| 空闲时间 | 闲逛/睡觉 | 无日程空白时段 |
| 深夜 | 打哈欠 + "该休息了" | 超过 23:00 |

**宠物多样性**:
| 宠物 | 获取方式 | 特点 |
|------|---------|------|
| 🐱 橘猫 | 免费初始选择 | 活泼好动，擅长提醒 |
| 🐶 柴犬 | 免费初始选择 | 忠诚稳重，擅长鼓励 |
| 🐰 垂耳兔 | 连续打卡 7 天 | 温柔可爱，擅长安抚 |
| 🐼 小熊猫 | 500 专注币兑换 | 稀有，擅长卖萌 |
| 🐉 小龙 | 累计完成 100 个日程 | 传说中的，擅长激励 |
| 节日限定 | 节日期间活动获取 | 春节·年兽 / 中秋·玉兔 / 圣诞·驯鹿... |

**成长路径**: 蛋 🥚 (初始) → 幼崽 🐣 (3天) → 成年 🐱 (10天) → 传说 ✨ (30天)
**进化条件**: 连续打卡天数、累计完成日程数、累计专注时长、使用功能多样性

**技术选型**: Lottie / Rive 动画（支持交互式角色状态机: idle → happy → sad）

**数据模型**:
```
Pet {
  id, userId, species, name, level (1-50), experience,
  mood (0-100), hunger (0-100), coins, accessories[],
  currentSkin, position, lastFedAt, lastLoginAt, createdAt, evolvedAt
}
```

**数据库表**: `pets`, `pet_accessories`, `pet_interactions`
**API 端点**: `GET/POST /api/pets/me`, `POST /api/pets/me/feed`, `POST /api/pets/me/play`, `GET/POST /api/pets/shop`

### 方向 3: 国际节日主题系统 🎨

**定位**: 全球化应用，覆盖国际节日，不只针对中国用户。

**当前状态**: 5 套静态主题（default/warm/nature/dark/lavender），通过 `data-theme` + 27 个 CSS 变量切换，无时间感知。

**目标**: 节日感知 + 主题自动切换 + 特效系统 + 用户可配置。

**节日数据四层架构**:

| 层级 | 内容 | 实现方式 |
|------|------|---------|
| Layer 1: 固定公历节日 | 元旦、情人节、圣帕特里克节、愚人节、地球日、万圣节、圣诞节... | 静态日期映射表 |
| Layer 2: 浮动公历节日 | 感恩节(11月第4周四)、母亲节(5月第2周日)、复活节(春分满月后周日)、斋月... | 规则计算函数 |
| Layer 3: 农历节日 | 春节、元宵、端午、中秋、七夕、重阳、清明... | `lunar-typescript` 库 |
| Layer 4: 地区性节日 | 排灯节(印度)、亡灵节(墨西哥)、樱花季(日本)... | locale 过滤 + 扩展数据 |

**节日 → 主题 + 特效映射**:

| 节日 | 主题色系 | 特效 | 宠物装扮 |
|------|---------|------|---------|
| 春节 🧧 | 红+金 | 烟花+灯笼 | 年兽皮肤 |
| 圣诞节 🎄 | 红+绿+白 | 雪花+铃铛 | 麋鹿角 |
| 万圣节 🎃 | 橙+紫+黑 | 蝙蝠+南瓜灯 | 巫师帽 |
| 情人节 💝 | 粉+玫瑰金 | 爱心飘落 | ❤️项圈 |
| 感恩节 🦃 | 暖橙+棕 | 枫叶飘落 | 火鸡帽 |
| 中秋 🥮 | 暖金+深蓝 | 月轮+桂花 | 玉兔皮肤 |
| 端午 🐉 | 竹绿+水蓝 | 龙舟划动 | 粽子背包 |
| 复活节 🥚 | 粉彩+黄 | 彩蛋+兔子 | 兔耳朵 |
| 元旦 🎊 | 银+金 | 彩带+气球 | 新年帽 |
| 圣帕特里克 ☘️ | 绿+白 | 三叶草飘落 | 绿帽子 |
| 樱花季 🌸 | 粉+白 | 花瓣飘落 | 樱花发饰 |
| 排灯节 🪔 | 金+红+橙 | 灯火+烟花 | 印度象皮肤 |

**特效架构**:
- 简单效果（雪花、花瓣飘落）→ CSS 动画
- 复杂效果（烟花、粒子爆炸）→ Canvas + tsParticles
- 全局氛围（光晕、色调）→ CSS filter/overlay
- 特效强度分级: off / low / full（性能考虑）

**Settings 扩展**:
```
theme: ThemePreset | 'auto'
holidayThemeEnabled: boolean
autoDarkMode: boolean
effectIntensity: 'off' | 'low' | 'full'
```

### 方向 4: 跨平台 — 微信小程序 📱

**定位**: 微信小程序是非 Web 平台的唯一选择。桌面端不重要。

**技术选型**: Taro 4.x + React
- 与 Web 端共享 packages/shared/（类型、API 客户端、工具函数、store 接口、宠物养成逻辑）
- NutUI 组件库（Taro 生态）
- 微信小程序专用: 微信登录、订阅消息、WXML 渲染

**Monorepo 结构**:
```
daily-schedule/
├── packages/
│   ├── shared/         # 共享包（TypeScript 类型、API 端点、工具函数、宠物规则、i18n）
│   ├── web/            # 当前 React 前端（Vite）
│   └── miniprogram/    # Taro 微信小程序
├── backend/            # 共享后端（所有前端）
└── docs/
```

**小程序特有适配**:
- **认证**: wx.login() → code → 后端换 openid → 绑定/创建用户 → 签发 JWT
- **通知**: wx.requestSubscribeMessage() 替代 SSE
- **宠物**: lottie-miniprogram 渲染，Canvas 层级限制
- **主题**: 编译时注入或运行时替换（CSS 变量在小程序中支持有限）

**代码共享边界**:
```
packages/shared/（Taro + Web 共享）
  ✅ 类型定义、API 端点声明、日期/时间工具（含农历+国际节日）
  ✅ 数据验证、业务规则常量、Zustand store 接口
  ✅ 宠物养成逻辑（经验计算、进化规则、资源产出）
  ✅ 国际化字符串

各自实现
  ❌ UI 组件（Web: React + Tailwind, 小程序: Taro + NutUI）
  ❌ 路由（Web: React Router, 小程序: Taro Router）
  ❌ 样式（Web: CSS 变量 + Tailwind, 小程序: SCSS）
  ❌ 平台特定 API
```

---

## 三、模块蓝图

### 全部可扩展模块

| 优先级 | 模块 | 核心功能 | 用户价值 | 实现成本 |
|--------|------|---------|---------|---------|
| 🔴 已有 | 日程管理 | 日历视图、事件CRUD、拖拽改期、状态流转、提醒、ICS导出 | 核心 | — |
| 🟡 P1 | 任务看板 | 看板/列表视图、优先级、子任务、截止日期、筛选 | ⭐⭐⭐⭐⭐ | 低 |
| 🟡 P1 | 习惯追踪 | 每日打卡、连续记录、GitHub热力图、统计分析 | ⭐⭐⭐⭐⭐ | 中 |
| 🟡 P1 | 宠物系统 | 养成、互动、装扮、进化、事件总线联动 | ⭐⭐⭐⭐⭐ (差异化) | 中高 |
| 🟢 P2 | 专注计时 | 番茄钟、白噪音、专注统计、关联日程 | ⭐⭐⭐⭐ | 低 |
| 🟢 P2 | 笔记日记 | 富文本/Markdown编辑、关联日程、全文搜索 | ⭐⭐⭐ | 中 |
| 🟢 P2 | 目标管理 | OKR目标、里程碑、进度追踪、关联任务 | ⭐⭐⭐⭐ | 中 |
| 🔵 P3 | 财务记录 | 收支记录、预算设定、周期账单、订阅管理 | ⭐⭐⭐ | 高 |
| 🔵 P3 | 数据看板 | 时间分析、效率报告、习惯分析、生活总览 | ⭐⭐⭐ | 高 |
| 🔵 P3 | 知识库 | Wiki文档、项目关联、全文搜索、导出 | ⭐⭐ | 高 |

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

## 四、分阶段路线图

### Phase 0: 架构重构 (v4.0) — 4-6 周
**主题**: 基础不牢，地动山摇

- 插件式平台架构（core/ + modules/ 分离）
- 模块注册中心 + 事件总线
- 将现有日历逻辑迁移为 modules/calendar/
- Monorepo 化（packages/shared + web + miniprogram）
- PWA 支持（manifest + service worker）

**风险**: 回归测试量大，需确保日历功能零退化

### Phase 1: 情感核心 (v4.5) — 6-8 周
**主题**: 产品"人格"形成

- 宠物系统 v1（选择、基础养成、事件总线联动）
- 国际节日引擎（四层节日数据）
- 节假日主题自动切换 + 特效层
- 任务看板模块（第一个新业务模块）

### Phase 2: 多端 + 深度 (v5.0) — 10-14 周
**主题**: 全平台覆盖 + 功能深度

- 微信小程序（Taro + 共享核心）
- 微信登录 + 订阅消息
- 习惯追踪 + 专注计时模块
- 宠物系统 v2（进化、装扮商店、节日限定）

### Phase 3+: 生态扩展 (v5.x+)
- 笔记 + 目标管理 + 财务 + 数据看板模块
- 宠物社区（好友宠物访问）
- 第三方模块 API（开放平台）
- 多语言 i18n

---

## 五、关键架构决策

### 决策 1: 宠物系统与模块架构的张力

```
问题: 宠物需要"全知全能"感知所有模块，但模块架构要求"松耦合隔离"
方案: 宠物系统不直接依赖任何模块，只监听事件总线
      模块不"知道"宠物，只发出事件
      事件总线是唯一的解耦层
```

### 决策 2: 事件总线是模块间唯一通信方式

- 模块间不直接 import 彼此的 store 或组件
- 所有跨模块行为通过类型安全的事件总线完成
- 事件类型定义在 core/lib/eventBus.ts 中集中管理
- 每个事件有明确的发出方和可能的消费方

### 决策 3: Monorepo 共享 vs 独立

- packages/shared/ 只共享"纯逻辑"（类型、工具函数、业务规则）
- UI 组件、路由、样式各自实现
- 宠物养成规则在 shared 中定义（跨平台一致性）

### 决策 4: 小程序非 Web 简化版

- 小程序不是"完整移植"，而是"核心场景适配"
- 优先实现: 日程查看、任务管理、宠物互动、习惯打卡
- 延后/不做: 复杂的管理功能、拖拽编辑

---

## 六、待明确问题

1. **宠物动画引擎** ✅ 已决策：SVG 程序化插画（SvgAvatar），放弃 Rive/Lottie（兼容性考量）
2. **小程序宠物渲染** ⏳ 延后到 Phase 2 决策
3. **节日特效性能预算** ✅ 已决策：CSS（雪花/花瓣）+ tsParticles（烟花/灯笼），移动端自动降级 + `prefers-reduced-motion` 检测
4. **Monorepo 工具** ✅ 已决策：pnpm workspace + Turborepo
5. **后端模块化** ✅ 已决策：模块化单体（modular monolith），DDD Bounded Context
6. **i18n 方案** ⏳ 延后到 Phase 3+ 决策

---

## 附录: 现有系统关键指标

- **后端**: Spring Boot 3.4 + Java 21, 59 个源文件, DDD 四层
- **前端**: React 19 + TypeScript, 61 个源文件, Zustand + React Query
- **数据库**: MySQL 8.0, 10+ 张表, 6 次 Flyway 迁移
- **API**: 25+ 个端点, OpenAPI 契约驱动
- **测试**: 37 个后端测试类 (257 用例) + 43 个前端测试文件 (166 用例) + 8 条 Playwright E2E 用例
- **当前版本**: v3.3.0 (2026-07-25)
