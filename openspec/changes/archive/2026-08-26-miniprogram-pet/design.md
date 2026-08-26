# Design: miniprogram-pet

## Context
- 后端宠物 API 已全量交付（PetController + openapi v3.4+）：`GET/POST/PUT /pets/me`、`POST /pets/me/interact`（FEED/PLAY）、`DELETE /pets/me/accessory`、`POST /pets/me/rewards`、`GET /shop/items`、`POST /shop/purchase`——**本次零后端变更**。
- `@daily-schedule/shared/pet` roam engine 为纯函数（roaming.ts + cellPhysics.ts），miniprogram-foundation 已验证小程序可编译复用（首页 `computeNextTarget` 演示）。
- 小程序已有稳定模式（miniprogram-todo 交付）：`lib/api.ts` apiRequest（Bearer 注入 / ≥400 抛后端 message / 401 抛 UnauthorizedError）、`lib/auth.ts` wechatLogin 静默重登、页面舵手模式（区分钟状态与 loading）、变更成功 = 本地同步 + refetch 对账。
- 小程序 TabBar 现状：首页/日历/任务/我的（4 项，纯文字无图标）；微信 tabBar 上限 5 项。
- 页面级约束：Taro webpack 需 `import './index.scss'`（否则无 wxss → 404）；NutUI 组件 css 含 `var()` 嵌套 calc 不被 wxss 支持（todo 实测）；组件名以类型导出为准（`Textarea`）。

## Goals / Non-Goals

**Goals:**
- 小程序 TabBar 新增「宠物」入口（第 5 项，任务/我的之间），宠物页可创建/查看/互动/游走
- lib/pet.ts 客户端封装（校验 + 错误透传 + 404 业务态映射），不重复错误处理逻辑
- 游走动画复用 shared/pet roam engine 纯函数（wandering 模式），零引擎改动
- 沟通完整测试覆盖（vitest 新增 pet.test.ts，对齐 io 规则）

**Non-Goals:**
- 商店/配饰/进化/行为奖励（M2.4 pet-shop / pet-evolution 主线，Web 端先行）
- 日程框格内物理互动（cellPhysics，依赖日历事件数据 + Web 端已实现，小程序留待后续）
- 粒子特效/动作动画层（eat/idle/情绪眨眼——Web 端 SvgAvatar 专属）
- 触摸格内互动（user-interaction zone）：小程序 MVP 用按钮互动
- 修改首页骨架 demo（foundation 验证痕迹保留，后续变更再收敛）
- 后端任何变更（DDD/DB/契约全部零影响）

## Decisions

### Decision 1: 宠物入口 = TabBar 第 5 项（任务/我的之间）
- **选择**: 新增 `pages/pet/index` 页面，app.config.ts tabBar list 插到「任务」与「我的」之间（首页/日历/任务/宠物/我的），不设 iconPath（与现有 4 项纯文字一致）。
- **理由**: 延续 calendar/todo 的「每能力 = TabBar 入口」模式，用户习惯已建立；微信 tabBar 上限 5 项恰好容纳；"我的"保持最右惯例。
- **备选方案**: ① 首页内嵌宠物模块——需重构 foundation 骨架 demo 页，范围膨胀且首页职责混合；② 非 tab 页面从首页点击进入——多一跳藏入口，不贴合宠物"常驻陪伴"定位。

### Decision 2: 游走动画 = View 绝对定位 + CSS transition（DOM 驱动，非 canvas）
- **选择**: 游走区为相对定位容器（定高 px），宠物 View 以 inline style 绝对定位（left/top，px），状态更新驱动位移，wxss `transition: left .8s linear, top .8s linear` 平滑移动。游走循环：进入页面后按 `randomWanderInterval`/`randomMoveDuration` 节奏 setTimeout 链（取目标 → 移动 → 到达停留 → 下一跳），卸载/隐藏清理。
- **理由**: shared/pet 引擎输出即为坐标目标（纯函数），DOM 驱动可直接映射；移动频率低（0.5-1.5s 一跳），setData 负载可忽略；canvas 需自绘形象与动画循环，复杂度成本不成比例。
- **备选方案**: ① canvas 绘制——动画能力最强但需整体自绘（形象/帧循环/碰撞），MVP 收益不抵成本；② WeChat WXS/wxs 动画 API——绑定成本高，社区成熟度低。

### Decision 3: 宠物形象 = emoji 字符渲染（物种映射 + 颜色圈底）+ 互动弹跳动画
- **选择**: 物种中文标签映射 emoji（ORANGE_CAT → 🐱 / SHIBA_INU → 🐕），外圈底色 class 区分；互动成功时切换 `--bounce` class（scale 弹跳动画）+ 浮动数值反馈层。
- **理由**: 小程序 image 不支持 svg（Web 端 SvgAvatar 不可直接复用）；emoji 零资源零引入，微信字体渲染稳定；弹跳为 CSS class 切换无需 canvas。
- **备选方案**: ① 静态 PNG 资源——需新增资产与多物种/多状态雪碧，MVP 不值得；② SvgAvatar 移植小程序——svg → image 链路无解，需 canvas 重画，超范围。

### Decision 4: lib/pet.ts 数据契约 = 404 → null 业务态映射
- **选择**: `fetchMyPet()` 对 404 特判返回 `null`（无宠物是业务态非错误），其余 ≥400 抛后端 message、401 抛 UnauthorizedError；页面三态派生（`pet === null ? 创建引导 : pet ? 展示 : 加载/错误`）。
- **理由**: 与 Web 端 useMyPet 的 404 语义（"请先创建宠物"不重试）对齐；避免页面各处判 `error.status === 404`；todo 的"错误透传 + 业务态区分"模式自然延伸。
- **备选方案**: 抛带 404 标记的 Error 由页面特判——错误语义与业务态混用，页面分支更多。

### Decision 5: 互动反馈 = InteractionResult 即时本地同步 + refetch 对账
- **选择**: 互动成功后用 `newMood`/`newHunger`/`newExperience`/`newCoins` 即时更新本地状态（含带符号变化浮动数值），随后 refetch 对账；互动请求互斥（进行中按钮置忙）。
- **理由**: 沿用 todo 的"本地同步 + refetch 对账"模式（非乐观猜测，值来自服务端确认响应）；InteractionResult 本身就是服务端确认值，直接同步无"假变化"风险；防重复提交避免连点重复喂食。
- **备选方案**: 仅 refetch——反馈延迟，浮动数值的"+10 心情"手感损失；纯乐观更新——有假变化风险。

### Decision 6: 视口尺寸与坐标单位
- **选择**: 游走容器高度固定（约 320-420px 视口比例），宽度取 `Taro.getWindowInfo().windowWidth`（px）；`createDefaultConfig(containerW, containerH)` 以 px 构建配置；游走坐标全程 px（inline style），rpx 仅用于非动态样式。
- **理由**: shared/pet config 为 px 语义（Web 端视口 px）；动态坐标用 rpx 需每次换算（1rpx = 视口宽/750），徒增复杂度；`getWindowInfo` 为微信新 API，退化路径 `getSystemInfoSync()`（Taro 兼容层内部处理，但显式判空兜底）。
- **备选方案**: 全程 rpx——与引擎 px 输出冲突，每跳需换算；用 getSystemInfoSync 弃用 API——无退化收益。

## DDD Layer Design
无（后端零变更）。占位说明：本变更仅触及小程序前端与文档。

### 领域层 (domain/)
无变更。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (apps/miniprogram/src/)
```
pages/pet/index.tsx         # 页面舵手：数据加载三态 / 游走循环宿主 / 互动编排 / 401 静默重登
pages/pet/index.scss        # mp-pet-* 样式（游走区/状态面板/弹跳动画/反馈动画）
components/pet/PetAvatar.tsx    # 宠物形象（emoji + 颜色圈底）+ 弹跳动画 class
components/pet/PetStatus.tsx    # 状态面板：等级/经验条/心情条/饥饿条/金币
components/pet/PetInteractBar.tsx # 喂食/玩耍按钮 + 播放中置忙
components/pet/PetCreateForm.tsx # 无宠物创建表单（物种二选一 chips + 命名 + 提交）
lib/pet.ts                  # 类型 + parsePetProfile 校验 + fetchMyPet/createPet/interactWithPet + 换算纯函数
__tests__/pet.test.ts       # vitest：校验/封装/换算（对齐 lib/tasks.test.ts 模式）
```
- 页面数据流：`pet`/`error`/`reloadKey` 派生 loading（`pet === null && error === null && !loaded` 形态对齐 todo 的"永真派生"，规避 set-state-in-effect）；createPet/互动成功 → 同步 + refetch。
- 游走循环放页面（useEffect + setTimeout 链），不封进组件（避免组件卸载时循环悬空）；onHide 清理 + onShow 恢复。
- 401 处理：调用层抛 UnauthorizedError → 页面 catch → `clearAuth()` + `wechatLogin()` 重登 → 重拉（照搬 todo 页模式）。

## API Design
零变更，复用现有端点：
- `GET /pets/me` → 200 PetProfile / 404 无宠物 / 401
- `POST /pets/me` → 201 PetProfile（body `CreatePetRequest {species: ORANGE_CAT|SHIBA_INU, name ≤30}`）/ 400 / 409 已有宠物 / 401
- `POST /pets/me/interact` → 200 InteractionResult（body `InteractRequest {type: FEED|PLAY}`；FEED 不传 itemId/quantity，走默认最便宜食物）/ 400 / 404 / 401
- 不需要新生成 SDK（小程序 lib 手动封装，不经 @hey-api 生成器）。

## Database Design
无。

## Risks / Trade-offs
- [微信 wxss transition 在 left/top 上的兼容与性能（小程序非 CSS GPU 全加速）] → 移动频率低（秒级一跳）+ 坐标步长大（整段移动），transition 有限时长（0.8s）内完成，实测开发者工具与真机验证；若真机抖动，降级为逐帧 interval 插值（区间内 setInterval 更新坐标）。
- [Taro.getWindowInfo 在低版本微信 client 缺失] → 显式判空退化 `Taro.getSystemInfoSync()`，取不到时以默认 375×667 兜底（与 foundation 演示一致）。
- [tabBar 5 项在窄屏拥挤] → 纯文字 tab（无图标）间距原生处理，5 项为官方上限，无约束风险；留存在 smoke 阶段人工确认。
- [游走循环与页面隐藏/卸载竞态（setTimeout 泄漏）] → 单例 timer id 变量 + onHide/onUnload 双路清理；每次跳数前 isActive 守卫（照搬 todo 的 cancelled 模式）。
- [emoji 形象在个别机型字体缺失] → 微信内置字体覆盖常见 emoji（🐱/🐕 为基础 emoji），smoke 验证；兜底为颜色圈底 + 物种文字标签不依赖 emoji 语义。

## Migration Plan
- 部署：无后端变更；小程序代码随 `turbo run verify` + Taro 构建上线（微信开发者工具编译后上传）。
- 回滚：本次为纯新增页面 + tabBar 配置，回滚 = 回退 app.config.ts 与 pages/pet 目录（上一版小程序包恢复）。
- 数据：无迁移。

## Open Questions
- 无（emoji 形象与游走动画手感的最终确认留给 smoke 阶段；若用户期望更高表现力（canvas 雪碧），作为后续变更专门设计）。
