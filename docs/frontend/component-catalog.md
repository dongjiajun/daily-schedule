# 前端组件清单

## 组件树

```
ErrorBoundary（最外层错误捕获）
└── QueryClientProvider (React Query)
    └── BrowserRouter
        └── useRoutes (动态路由，从 moduleRegistry.getRoutes() 装配)
            └── /* → AuthGuard（未认证内联渲染 LoginPage）
                └── AppShell
                    ├── Sidebar（通用 Shell）
                    │   ├── Logo + 应用标题
                    │   ├── ModuleNav（从 moduleRegistry.getAll() 动态渲染）
                    │   ├── ActiveModuleSidebar（当前活跃模块的 sidebarComponent）
                    │   └── 用户信息 + 登出
                    ├── ShortcutsDialog（键盘快捷键帮助）
                    └── <Outlet> → CalendarSidebar（日历模块专属侧边栏）
                        ├── 新建日程按钮（N）
                        ├── 搜索框（/ 聚焦）
                        ├── 分类筛选列表（再点取消筛选）
                        ├── 标签筛选 chips
                        ├── WeekStats（今日/本周/完成率）
                        ├── 设置 / 导出 ICS / 快捷键 / 指南
                        └── ManagePanel（分类 · 标签 · 偏好设置 · 主题配色）
    └── OnboardingOverlay → OnboardingGuide（引导教程，App 层）
    └── Toaster（sonner Toast 通知）
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage (calendar 模块) | 主日历页面（AuthGuard 保护，未认证内联渲染 LoginPage） |
| `/todo` | TodoPage (todo 模块) | 任务看板页面（看板+列表双视图） |
| 未来 | pet/habits 等 | 各模块通过 `moduleRegistry.register()` 声明路由 |

## 目录结构

```
frontend/src/
├── core/                    # 稳定基础设施
│   ├── components/
│   │   ├── ui/              # shadcn/ui 基础组件（9 个，<!-- DOCS-CHECK: ui-components=9 -->）
│   │   └── layout/          # 通用布局组件
│   │       └── TabbedDialog.tsx   # 通用标签对话框容器
│   ├── hooks/               # 跨模块共享 hooks
│   │   ├── useTheme.ts
│   │   ├── useNotification.ts
│   │   └── useSseNotifications.ts
│   ├── lib/                 # 核心工具库
│   │   ├── authInterceptor.ts
│   │   ├── eventBus.ts      # EventBus 单例
│   │   ├── moduleRegistry.ts
│   │   ├── unwrap.ts
│   │   └── utils.ts
│   ├── store/               # 跨模块 Zustand stores
│   │   ├── authStore.ts
│   │   └── settingsStore.ts
│   └── styles/
│       ├── themes.css       # 5 套主题定义（<!-- DOCS-CHECK: theme-sets=5 -->）
│       └── holiday-themes.css # 18 套节日主题（<!-- DOCS-CHECK: holiday-themes=18 -->）
│
├── modules/                 # 可插拔功能模块
│   └── calendar/
│       ├── index.ts         # ModuleDefinition 导出
│       ├── routes.tsx        # 静态路由定义
│       ├── components/
│       │   ├── HomePage.tsx
│       │   ├── CalendarView.tsx
│       │   ├── calendar.css
│       │   ├── EventForm.tsx
│       │   ├── EventModal.tsx
│       │   ├── CalendarSidebar.tsx   # 日历专属侧边栏
│       │   └── ManagePanel.tsx        # 管理面板（分类/标签/偏好）
│       ├── hooks/
│       │   ├── useEvents.ts
│       │   ├── useCategories.ts
│       │   ├── useTags.ts
│       │   └── useKeyboardShortcuts.ts
│       ├── store/
│       │   └── calendarStore.ts
│       └── lib/
│           └── ics.ts
│   └── pet/                  # 宠物模块
│       ├── components/       # RoamingPet/PetAvatar/SvgAvatar/PetBubble/
│       │                     #   PetStatus/PetSelection/ParticleBurst/
│       │                     #   SidebarPet/PetPage
│       ├── hooks/usePet.ts
│       ├── lib/zoneRegistry.ts   # 兴趣区注册表（user-interaction/pet-spot/calendar-cell）
│       ├── lib/statusColor.ts    # 状态三段色共享函数
│       └── store/petStore.ts     # 含浮动数值反馈（feedbackTrigger）+ 动作维度（action）
│                                 #   + persist 持久化（v3.5.1：位置/朝向/休息态/稳定情绪白名单）
│   └── todo/                 # 任务看板模块
│       ├── components/       # TodoPage/TaskToolbar/BoardView/TaskColumn/
│       │                     #   TaskCard/ListView/TaskRow/TaskForm
│       ├── hooks/useTasks.ts
│       ├── lib/taskEvents.ts # 任务事件定义（task:completed/created）
│       └── store/todoStore.ts
│
├── components/layout/        # 应用 Shell 布局组件
│   ├── AppShell.tsx
│   ├── Sidebar.tsx           # 通用 Sidebar Shell
│   ├── ShortcutsDialog.tsx
│   ├── ErrorBoundary.tsx
│   └── OnboardingGuide.tsx
│
├── pages/
│   └── LoginPage.tsx
├── api/                      # 自动生成（hey-api）
└── lib/
    └── colors.ts             # 颜色常量 re-export（兼容层）
```

### 微信小程序（apps/miniprogram/，v5.0 Phase 2 新增）

```
apps/miniprogram/
├── config/                   # Taro 编译配置
│   ├── index.ts              # webpack5 / designWidth 750 / outputRoot dist
│   └── prod.ts               # 生产环境覆盖
├── src/
│   ├── app.ts                # 入口（useLaunch）
│   ├── app.config.ts         # pages + tabBar（首页/日历/任务/宠物/我的 五 tab）
│   ├── app.scss
│   ├── lib/
│   │   ├── config.ts         # API_BASE_URL 单一来源（TODO(domain)：真机发布改 https 合法域名）
│   │   ├── auth.ts           # wechat-auth 登录库：Taro.login → /auth/wechat-login → Storage 持久化（STORAGE_KEYS/parseLoginResponse）
│   │   ├── api.ts            # 业务请求封装：Bearer 注入 + ≥400 抛后端 message + 401 清态抛 UnauthorizedError
│   │   ├── events.ts         # 日程数据层：fetchMonthEvents（size=100）+ EventSummary 校验 + 日期分组
│   │   ├── tasks.ts          # 任务数据层：fetchTasks/createTask/moveTask/deleteTask + TaskSummary 校验 + 状态三组分组（组内 sortOrder 升序）
│   │   ├── pet.ts            # 宠物数据层：fetchMyPet/createPet/interactWithPet + PetProfile 校验 + 状态换算纯函数（404→null 业务态）
│   │   └── calendar-date.ts  # 日历日期纯函数：42 格月网格/查询范围/日期键（字符串切片，不 new Date 后端日期串）
│   ├── components/
│   │   ├── calendar/         # MonthGrid（月网格+事件色点≤3+「+n」）/ EventDayList（选中日事件列表，只读）
│   │   ├── todo/             # TaskList（三组恒定分组+空态）/ TaskItem（状态标识+优先级+截止日期+标签+删除端子项）/ TaskFormPopup（新建弹层）
│   │   └── pet/              # PetAvatar（emoji 形象+颜色圈底+弹跳动画）/ PetStatus（等级+心情/饥饿条+经验/金币）/ PetInteractBar（喂食/玩耍+置忙）/ PetCreateForm（物种二选一+命名+提交）
│   ├── __tests__/            # vitest 纯逻辑测试（shared 跨端复用 + 登录响应解析 + 日历日期/数据层/请求封装 + 任务数据层 + 宠物数据层）
│   └── pages/
│       ├── index/            # 首页：登录态骨架（已登录用户名/登录中/失败重试）+ NutUI Button 验证 + shared 引擎复用演示
│       ├── calendar/         # 日历月视图（miniprogram-calendar）：切月导航 + 42 格网格 + 选中日事件列表 + 401 静默重登
│       ├── todo/             # 任务列表（miniprogram-todo）：三组分组 + ActionSheet 状态移动 + 新建弹层 + 删除确认 + 401 静默重登
│       ├── pet/              # 宠物互动（miniprogram-pet）：游走动效 + 状态面板 + 喂食/玩耍 + 创建引导 + 401 静默重登
│       └── profile/          # 我的（占位，后续变更交付）
├── types/global.d.ts         # 全局类型（scss 模块声明、TARO_ENV）
├── babel.config.cjs          # Taro babel 预设（React + TS）
├── vitest.config.ts          # vitest 配置（Taro runtime ENABLE_* 编译期常量对齐）
├── project.config.json       # appid: 真实 appid（微信开发者工具导入），miniprogramRoot: dist/
└── eslint.config.js          # flat config（js + tseslint + react-hooks）
```

- **技术栈**: Taro 4.2 + React 18 + NutUI 4.0.0-beta.5（锁版本）+ TypeScript；React 18 为 Taro/NutUI peer 共同支持面
- **NutUI 按需引入**（组件级，勿用 barrel 入口以免全量样式）: `import Button from '@nutui/nutui-react-taro/dist/es/packages/button'` + `import '.../button/style/css'`（scss 入口依赖主题变量，用编译后 CSS）
- **shared 复用**: `@daily-schedule/shared/holiday`（节日引擎）+ `/pet`（游走引擎）直接 import，构建产物验证通过 + vitest 回归（4 用例）
- **微信登录（wechat-auth）**: 页面自动静默登录（本地会话恢复优先，失败展示提示 + 重试按钮）；后端需 `WECHAT_APP_ID`/`WECHAT_APP_SECRET` 环境变量；开发者工具调试需勾选「不校验合法域名」（API 指向 localhost:8080）
- **日历月视图（miniprogram-calendar）**: 复用后端 `GET /events`（无新端点）；查询范围为月网格首格 00:00 ~ 末格次日 00:00（重叠查询语义）；401 自动静默重登重拉；无刷新预续签（留待后续变更）；事件点击无详情（只读）
- **任务列表（miniprogram-todo）**: 复用后端 `/tasks` 四端点（list/create/move/delete，无新端点）；恒定三组（待办/进行中/已完成，空组保留）；变更成功 = 本地同步（服务端确认值）+ refetch 对账（非乐观猜测）；状态移动走 `Taro.showActionSheet` 原生三选（当前态/取消无副作用）；删除走 `Taro.showModal` 原生确认（无撤销 toast）；新建弹层为自绘遮罩+底部卡片（Taro 原生 Input/TextArea + 优先级自绘 chips + `Picker mode='date'` 截止日期，可选可清除）——**刻意不用 NutUI Popup/Input/Textarea/ActionSheet/DatePicker**（其预编译 css 含 `calc(...*var(--nut-scale-f, 1))`，微信 wxss 不支持 var()，开发者工具编译红错——miniprogram-todo 实测）；`dueDate` 为 `YYYY-MM-DD` 字符串比较（过期红/今天高亮，不 new Date）；401 自动静默重登重拉
- **宠物互动（miniprogram-pet）**: 复用后端 `/pets/me` 三端点（GET/POST/POST interact，无新端点）；404 = 无宠物业务态 → 创建引导（非错误态）；游走动效复用 `@daily-schedule/shared/pet` roam engine——`createDefaultConfig(视口宽, 游走区高)` + `computeNextTarget`(wandering) 目标驱动，View 绝对定位 px + `transition: left/top` 平滑移动，setTimeout 链节奏（`randomMoveDuration`+`randomWanderInterval`），页面隐藏/卸载双路清理；宠物形象为 emoji 🐱/🐕 + 颜色圈底（**微信 image 不支持 svg，Web 端 SvgAvatar 不可复用**，design Decision 3）；互动成功 = InteractionResult 本地同步（newMood/newHunger 等服务端确认值）+ refetch 对账 + 弹跳动画 + 浮动数值反馈，请求互斥防连点；创建表单为物种二选一 chips + 命名 Input（自绘，不引入 NutUI——var() 坑同上）；坐标全程 px（引擎 px 语义，rpx 仅静态样式）；401 自动静默重登重拉
- **构建与验证**: `pnpm run build` → `dist/`（导入微信开发者工具）；`pnpm run verify` = lint + test + build
- **小程序工程坑位备忘**（miniprogram-todo 实测，再犯概率高）：① NutUI 组件预编译 css 含 `calc(...*var(--nut-scale-f, 1))`，微信 wxss 不支持 var()——引入新 NutUI 组件后必须复查 `grep -c 'var(' dist/pages/**/*.wxss`，否则工具编译红错；② 无 scss import 的页面（`import './index.scss'`）webpack 不产出页面 wxss → 微信 webview 404 报「WXSS 文件加载失败」——每个页面都要有页面样式文件；③ Taro 组件导出名以 `@tarojs/components` 类型为准（如 `Textarea` 而非 `TextArea`），错名运行时为 undefined 组件（弹层崩溃），tsc/build 均不拦截——新组件引入后回归验证弹层/页面渲染路径

## 状态管理

| 工具 | 用途 | 存储内容 |
|------|------|----------|
| Zustand (`authStore`) | 认证状态 | accessToken、refreshToken、expiresAt、user；localStorage `auth.v3`；logout 调用 `/auth/logout` |
| Zustand (`calendarStore`) | 日历 UI 状态 | 当前日期、视图、弹窗状态、分类/标签筛选、搜索词、管理弹窗、快捷键帮助、移动端侧栏 |
| Zustand (`settingsStore`) | 用户偏好（persist） | 默认视图、默认提醒、快速新建时长、是否显示已完成、主题预设（5 套）+ 主题标签/颜色映射；localStorage `settings.v1` |
| React Query | 服务端数据 | 事件列表(按范围+筛选缓存)、分类列表、标签列表 |

## 组件清单

### 核心容器（Core Components）

- **ErrorBoundary** (`components/layout/ErrorBoundary.tsx`) — React 错误边界，支持静默模式
- **TabbedDialog** (`core/components/layout/TabbedDialog.tsx`) — 通用标签对话框容器，支持受控/非受控模式，供各模块复用

### 特效组件 (core/components/effects/)

- **EffectLayer** (`core/components/effects/EffectLayer.tsx`) — 特效渲染容器，根据当前节日 `effectType` 激活对应特效（6 种：烟花/雪花/花瓣/灯笼/落叶/爱心）；`effectType` 由共享包 `getThemeForHoliday()` 解析（唯一真相源）；自动检测移动端降级和 `prefers-reduced-motion`
- **SnowfallEffect** (`core/components/effects/SnowfallEffect.tsx`) — 纯 CSS 雪花飘落，零 JS 开销
- **PetalFallEffect** (`core/components/effects/PetalFallEffect.tsx`) — 纯 CSS 花瓣飘落
- **FireworkEffect** (`core/components/effects/FireworkEffect.tsx`) — tsParticles 烟花粒子
- **LanternFallEffect** (`core/components/effects/LanternFallEffect.tsx`) — tsParticles 灯笼/孔明灯飘升
- **LeafFallEffect** (`core/components/effects/LeafFallEffect.tsx`) — 纯 CSS 落叶飘落（🍂🍁🌿🍃，感恩节/圣帕特里克节/清明节/世界环境日）
- **HeartFallEffect** (`core/components/effects/HeartFallEffect.tsx`) — 纯 CSS 爱心飘落（💖💕❤️💘，情人节）

### 日历模块 (`modules/calendar/`)

- **HomePage** — 日历主页面，组合 CalendarView + EventModal
- **CalendarView** — react-big-calendar + `withDragAndDrop`，支持月/周/日/议程视图、拖拽改期/拉伸时长、已完成置灰删除线、悬停一键完成
- **EventModal** — 创建/编辑弹窗，含标记完成/恢复计划、删除确认、已完成徽标
- **EventForm** — 事件表单；新建时智能默认（下一个整/半点 + 偏好时长 + 偏好提醒）
- **CalendarSidebar** — 日历模块专属侧边栏：新建按钮、搜索、分类/标签筛选、周统计、操作按钮、ManagePanel
- **ManagePanel** — 管理面板，使用 TabbedDialog 提供分类/标签/偏好设置三个标签页

### 任务看板模块 (`modules/todo/`)

- **TodoPage** — 任务主页面，组合 TaskToolbar + BoardView/ListView
- **BoardView** — 三列看板（TODO | IN_PROGRESS | DONE），HTML5 Drag & Drop 跨列移动（同列拖拽保持原位不甩尾），响应式列宽（`flex-1`）
- **TaskColumn** — 单列容器：lucide 图标标题 + 数量 Badge + 卡片列表 + 内联快速创建 + drop 区域高亮，CSS 变量主题色
- **TaskCard** — 任务卡片：lucide 图标（截止日期/逾期）+ 优先级 Badge（纯文本色块）+ 标签 chips + 拖拽手柄 + shadcn/ui Select 状态切换（触摸设备可用）+ shadcn/ui Button 编辑/删除（常驻可见；删除走 sonner 撤销 toast）
- **ListView** — 列表视图：shadcn/ui Button 排序控件（默认/优先级/截止日期/创建时间）+ 任务行
- **TaskRow** — 列表行：shadcn/ui Select 状态切换 + lucide 图标 + shadcn/ui Button 编辑/删除（删除走 sonner 撤销 toast）
- **TaskForm** — shadcn/ui Dialog 创建/编辑弹窗（含 backdrop-blur + 入场动画）：标题/描述/优先级/截止日期
- **TaskToolbar** — 顶部工具栏：shadcn/ui Button 看板/列表视图切换（lucide Columns2/List 图标）+ 新建任务按钮（Plus 图标），CSS 变量主题色

### 宠物模块 (`modules/pet/`)

- **RoamingPet** (`modules/pet/components/RoamingPet.tsx`) — v2 游走宠物：以独立角色精灵在页面自由漫步，`pointer-events:none` 穿透，点击摸头/双击玩耍（jump 动作），hover 状态浮窗（含"互动"按钮打开 PetMenu 与"回窝"按钮）；朝向翻转（scaleX）仅作用于宠物身体，气泡/hover 浮窗文字保持正读；鼠标停留/点击/输入触发兴趣区域（Zone）吸引；渲染浮动数值反馈（FloatingText）；**action 接线**：移动→walk、进窝→sleep（蜷缩+Zzz）、双击→jump、移动结束 `onAnimationComplete` 回 idle/sleep；**空闲小动作调度器**：8-18s 随机选 stretch/yawn/scratch/look 播放一次（守卫：仅平静 idle 且非休息非格内非行走）；**昼夜节律**（`determineMode` 输出 period：night/morning/afternoon/daytime）：夜间（≥23）立即走向小窝进窝睡觉（不等 2 分钟）、早晨（7-9）睡眠中唤醒 + "早上好"气泡（每日一次）、午后（12-14）低概率小憩 rest 90s 原地打盹、深夜未睡低概率打哈欠提示（10min 冷却）；**格内物理状态机**（rAF 帧循环，替换旧左右横移）：进格→落向最近底边吸附点（重力落地+落定弹跳）→沿四边连续绕行（14 吸附点含四角转角，每段移动都在边上不斜穿），接近目标加速滑入+精确吸附落定，到达点概率分流（40% 跳跃/30% 短暂停留/30% 直接续走），完成度决定风格（快=绕圈+跳跃+happy / 慢=绕四边+idle_variant），绕 2 圈自然退出（45s 兜底防卡死）或离开格子强制退出恢复游走；贴左/右壁时形象横过来（rotate ±90° + 0.15s 过渡）
- **ZoneRegistry** (`modules/pet/lib/zoneRegistry.ts`) — 区域注册表：Zone 生命周期管理（注册/更新/移除/decay 自动衰减），类型化区域（user-interaction/pet-spot/calendar-cell）供区域感知机制消费
- **PetAvatar** (`modules/pet/components/PetAvatar.tsx`) — 宠物形象渲染器：SVG 插画（SvgAvatar）+ 地面阴影椭圆（jump 时缩小变淡）；从 petStore 读 emotionState + action 双维；v3.5 起经 `useEquippedAccessoryName` 解析当前配饰并传入 SvgAvatar
- **SvgAvatar** (`modules/pet/components/SvgAvatar.tsx`) — SVG 插画引擎：根据 species + emotionState + action 选择对应插画（橘猫/柴犬 × 8 种情绪 × 11 种动作）；`data-action` 属性驱动 CSS 动画层（呼吸/眨眼/步伐/蜷缩/Zzz/跳跃/进食咀嚼/伸懒腰/打哈欠/挠耳/张望）；**情绪切换眨眼过渡**：emotion 变化先闭眼（data-blink 驱动 50ms 一次性动画）再换表情参数睁开，消除换脸感；**装扮层（v3.5）**：`accessory` prop 相对容器包裹——皮肤类对基础插画应用 CSS filter，其余经 `AccessoryOverlay` 同 viewBox 叠放
- **AccessoryOverlay** (`modules/pet/components/AccessoryOverlay.tsx`) — 配饰叠加层（v3.5 新增）：帽子（巫师帽/新年帽/火鸡帽/绿帽子）/角（麋鹿角）/耳（兔耳朵）/发饰（樱花）/背包（粽子）五类 SVG 叠放；皮肤类返回 null（filter 由 SvgAvatar 应用）；未知名称静默回退
- **accessoryRenderMap** (`modules/pet/lib/accessoryRenderMap.ts`) — 配饰名称 → 渲染方式单一映射（v3.5 新增）：11 个名称与 `themeMapping.petAccessory`/数据库种子对齐；皮肤 filter 参数（年兽=红调/玉兔=白亮/印度象=灰调）
- **PetBubble** (`modules/pet/components/PetBubble.tsx`) — 宠物对话气泡，毛玻璃主题风格
- **PetStatus** (`modules/pet/components/PetStatus.tsx`) — 宠物状态展示：心情/饱食度进度条（三段色 statusColor：≥60 绿 / 30-59 黄 / <30 红）+ 代币/等级
- **PetSelection** (`modules/pet/components/PetSelection.tsx`) — 宠物创建选择 Dialog：物种选择 + 命名
- **ParticleBurst** (`modules/pet/components/ParticleBurst.tsx`) — 粒子爆发特效：hearts/stars/coins/sparkles/food，从指定坐标发射+扩散+淡出
- **FloatingText** (`modules/pet/components/FloatingText.tsx`) — 浮动数值反馈：互动/购买结果（+N 心情/饱腹/经验/金币）从宠物位置向上飘散+淡出，good 绿 / bad 红
- **PetMenu** (`modules/pet/components/PetMenu.tsx`) — 互动菜单 Popover：玩耍（免费）/ 喂食 / 商店 tab（食物列表复用 FoodActionList）；金币不足禁用+tooltip；成功 → 浮动数值 + 粒子 + toast
- **FoodActionList** (`modules/pet/components/FoodActionList.tsx`) — 食物/商品操作列表（PetMenu 与 PetPage 共享）：mode=feed 走 `interact FEED`、mode=shop 走 `purchase`；v3.5 起按类型分流——FOOD 即时消费（成功触发 `setAction('eat', 1500)` 低头咀嚼反馈），ACCESSORY 显示「装备」按钮 + 已装备标记（成功触发 happy 情绪 + toast「已装备」）
- **SidebarPet** (`modules/pet/components/SidebarPet.tsx`) — 侧边栏迷你宠物：40-50px 精灵 + 心情/饱食度指示点（三段色 statusColor），点击跳转 /pet；挂载时注册 `pet-spot` Zone（id `pet-home-spot`）作为宠物小窝，scroll/resize 事件驱动 rect 更新，卸载注销；v3.5 起迷你精灵同样渲染配饰装扮
- **PetPage** (`modules/pet/components/PetPage.tsx`) — /pet 完整宠物面板：大头像 + PetStatus + 互动按钮（PetMenu）+ 喂食区 + 商店区 + 宠物信息卡；v3.5 起新增「当前配饰」区（配饰名称 + 「取下」按钮，走 `useUnequip`）
- **petEventBridge** (`modules/pet/lib/petEventBridge.ts`) — 事件桥接（v3.4 扩展）：监听 calendar（event:completed/created/cancelled）、todo（task:completed/created）、habit（habit:checked）、focus（focus:completed）、user（user:dailyCheckin）五类事件；任务/日程完成时 invalidate 宠物查询缓存（即时刷新后端发放的专注币）；habit/focus/checkin 事件调用奖励 API（幂等）→ granted=true 时刷新宠物数据 + 金币粒子 + 「+N 专注币」气泡，失败静默

- **游走引擎** (`packages/shared/src/pet/roaming.ts`) — 纯逻辑游走算法：随机漫步（含逃逸机制，防边缘排斥困角）/Zone 区域吸引/边界避让/休息点选择，Web 与小程序共享

### SVG 宠物资产 (`modules/pet/assets/svg/`)

- **OrangeCat** — 橘猫：8 种情绪状态的表情/姿态变化（idle/happy/sad/hungry/sleepy/excited/surprised/idle_variant，与 `EmotionState` 类型一致）
- **ShibaInu** — 柴犬：同上 8 种情绪

### 认证模块

- **LoginPage** (`pages/LoginPage.tsx`) — 登录/注册表单，渐变背景 + Framer Motion 入场动画
- **AuthGuard** (`App.tsx`) — 路由守卫，未认证时内联渲染 LoginPage
- **authInterceptor** (`core/lib/authInterceptor.ts`) — Bearer 注入 + access token 过期前 30s 单飞自动续签 + 401 强制登出

### 布局模块

- **AppShell** (`components/layout/AppShell.tsx`) — 侧边栏 + 内容区；`md` 以下侧栏变为抽屉（浮动按钮唤起）
- **Sidebar** (`components/layout/Sidebar.tsx`) — 通用 Shell：模块导航 + 活跃模块侧边栏内容 + 用户信息/登出
- **ShortcutsDialog** (`components/layout/ShortcutsDialog.tsx`) — 快捷键速查（? 唤起）
- **ErrorBoundary** (`components/layout/ErrorBoundary.tsx`) — React 错误边界，fallback UI + 重载按钮
- **OnboardingGuide** (`components/layout/OnboardingGuide.tsx`) — 3 步引导教程，可通过侧边栏重新打开

### UI 基础（shadcn/ui, `core/components/ui/`）

9 个基础组件：Button, Input, Textarea, Label, Dialog, Switch, Select, Popover, Tabs

## 自定义 Hooks

| Hook | 位置 | 说明 |
|------|------|------|
| useEvents | modules/calendar/hooks/ | 事件查询（分类/标签/关键词过滤）+ CRUD + useToggleEventStatus 一键完成 |
| useCategories | modules/calendar/hooks/ | 分类 CRUD（React Query） |
| useTags | modules/calendar/hooks/ | 标签 CRUD（React Query） |
| useKeyboardShortcuts | modules/calendar/hooks/ | 全局快捷键：N/T/←→/1-4//?/Esc |
| useNotification | core/hooks/ | 浏览器 Notification API |
| useSseNotifications | core/hooks/ | SSE 实时通知订阅 |
| useTheme | core/hooks/ | 读取 settingsStore.theme → 设置 `document.documentElement.dataset.theme` |

## 模块注册中心

- **ModuleRegistry** (`core/lib/moduleRegistry.ts`) — 管理插件式架构中所有模块的生命周期
- **EventBus** (`core/lib/eventBus.ts`) — 类型安全的同步事件总线（单例，从 `@daily-schedule/shared` 导入 EventBus 类）
- **queryClient** (`core/lib/queryClient.ts`) — React Query 客户端单例（v3.4 新增）：供非组件上下文（petEventBridge 事件桥接）安全 invalidate 查询缓存，App.tsx 的 QueryClientProvider 引用同一实例
- 模块间不允许直接 import store/组件，仅通过事件总线通信

## 工具库

| 文件 | 说明 |
|------|------|
| modules/calendar/lib/ics.ts | iCalendar (.ics) 导出：当前视图日程一键导出，可导入系统日历 |
| lib/colors.ts | PRESET_COLORS 共享常量（9 个色板预设值） |
| core/styles/themes.css | 主题 Token 定义：5 套预设 × 27 个 CSS 自定义属性 |
| core/styles/holiday-themes.css | 节日主题：18 套节日配色（`[data-theme="holiday-<id>"]`），由 holidayEngine 在 auto 模式激活 |
| core/lib/unwrap.ts | hey-api 响应错误统一抛出（带后端 message），修复"失败也弹成功"的问题 |

## 自动生成代码

| 文件 | 来源 | 说明 |
|------|------|------|
| api/sdk.gen.ts | specs/openapi.yaml | 类型安全 API 客户端（含 `subscribeNotifications` SSE 方法） |
| api/types.gen.ts | specs/openapi.yaml | 请求/响应 TypeScript 类型，含 `EventStatus`、`ReminderEvent` |
| api/client.gen.ts | @hey-api/openapi-ts | fetch 客户端实例（baseUrl `/api/v1`） |
| api/core/ | @hey-api/openapi-ts | 序列化/SSE 等运行时支撑代码 |

执行 `npm run generate:api`（在 `frontend/` 下）从 `../specs/openapi.yaml` 重新生成。配置见 `frontend/openapi-ts.config.ts`。
注意：`core/lib/authInterceptor.ts` 与 `core/lib/unwrap.ts` 为手工维护文件，重新生成后如被清除需从 git 恢复。
