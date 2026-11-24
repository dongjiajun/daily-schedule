# Test Plan: tech-debt-cleanup

| Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes |
|-------------|----------|--------------------|----------------------|---------------|----------------|
| 分类与标签重名映射 409 | 创建或更新重名分类返回 409 | `backend/src/test/java/com/dailyschedule/application/category/CategoryApplicationServiceTest.java` & `CategoryControllerTest.java` | `create_duplicateName_shouldThrow` / `update_duplicateName_shouldThrow` / `createCategory_duplicateName_shouldReturn409` | 🟢 | 模式 A：应用层 + Controller MockMvc 409 契约验证 |
| 分类与标签重名映射 409 | 创建或更新重名标签返回 409 | `backend/src/test/java/com/dailyschedule/application/tag/TagApplicationServiceTest.java` & `TagControllerTest.java` | `create_duplicateName_shouldThrow` / `update_duplicateName_shouldThrow` / `createTag_duplicateName_shouldReturn409` | 🟢 | 模式 A：应用层 + Controller MockMvc 409 契约验证 |
| 分类与标签重名映射 409 | 空白名称仍返回 400 | `backend/src/test/java/com/dailyschedule/application/category/CategoryApplicationServiceTest.java` & `TagApplicationServiceTest.java` | `create_blankName_shouldThrow` | 🟢 | 模式 A：边界校验回归 |
| SSE Cookie 单一头与安全标志可配置 | 登录与续签下发单条 Set-Cookie 头 | `backend/src/test/java/com/dailyschedule/api/controller/AuthControllerTest.java` | `login_shouldReturn200` / `register_shouldReturn201` / `refreshToken_shouldReturn200` | 🟢 | 模式 A：断言 Set-Cookie 头数量为 1 且含属性 |
| SSE Cookie 单一头与安全标志可配置 | 登出下发单条失效 Cookie 头 | `backend/src/test/java/com/dailyschedule/api/controller/AuthControllerTest.java` | `logout_shouldReturn204` | 🟢 | 模式 A：断言 Max-Age=0 单条 Set-Cookie |
| SSE Cookie 单一头与安全标志可配置 | 微信登录不下发 SSE Cookie | `backend/src/test/java/com/dailyschedule/api/controller/AuthControllerTest.java` | `wechatLogin_shouldReturn200` | 🟢 | 模式 A：断言不含 Set-Cookie 头 |
| SSE 连接握手与定时心跳 | 注册连接立即发送握手事件 | `backend/src/test/java/com/dailyschedule/infrastructure/notification/SseEmitterManagerTest.java` | `register_sendsConnectEvent` | 🟢 | 模式 A：SseEmitter 注册握手验证 |
| SSE 连接握手与定时心跳 | 定时心跳向所有活跃连接推送保活事件 | `backend/src/test/java/com/dailyschedule/infrastructure/notification/SseEmitterManagerTest.java` | `sendHeartbeat_broadcastsToAllActiveEmitters` | 🟢 | 模式 A：多用户心跳推送 + 线程池 size>=3 (`ScheduleConfigTest`) |
| SSE 连接握手与定时心跳 | 心跳或推送遇 IOException 时清理失效连接 | `backend/src/test/java/com/dailyschedule/infrastructure/notification/SseEmitterManagerTest.java` | `sendHeartbeat_failedEmitter_isRemoved` / `sendToUser_failedEmitter_isRemoved` | 🟢 | 模式 A：断连异常清理与空用户桶回收 |
| Shell 状态与区域注册表归属 core | shellStore 统一管理全局壳层状态 | `frontend/src/core/store/__tests__/shellStore.test.ts` | `shellStore > openOnboarding/closeOnboarding/setShowShortcuts/setSidebarOpen` | 🟢 | 模式 A：Store 单元测试 |
| Shell 状态与区域注册表归属 core | zoneRegistry 位于 core 供多模块读写 | `frontend/src/core/lib/__tests__/zoneRegistry.test.ts` | `zoneRegistry` 全部用例 | 🟢 | 模式 A：核心注册表单元测试 |
| Shell 状态与区域注册表归属 core | CalendarView 类型由 core 导出且不反向依赖模块 | `frontend/src/core/lib/__tests__/moduleBoundary.test.ts` & `frontend` tsc build | `moduleBoundary > core 不导入 modules` + `pnpm --filter frontend run build` | 🟢 | 模式 A：静态边界单测 + TS 编译 |
| Shell 扩展槽位与模块边界隔离 | Shell 通过扩展槽位渲染模块浮层与侧栏底部组件 | `frontend/src/core/lib/__tests__/moduleRegistry.test.ts` & `AppShell.test.tsx` & `Sidebar.test.tsx` | `getGlobalOverlays` / `getSidebarFooters` + Shell 渲染测试 | 🟢 | 模式 A：注册中心与 Shell 渲染测试 |
| Shell 扩展槽位与模块边界隔离 | 静态模块边界守卫检测零越界引用 | `frontend/src/core/lib/__tests__/moduleBoundary.test.ts` | `moduleBoundary > 无核心反向依赖与跨模块直连` | 🟢 | 模式 A：Vitest 静态 AST/正则导入检查 |
| 业务组件禁止残留 bg-white 与 bg-black 硬编码背景 | 业务组件迁移至语义背景 token 后门禁通过 | `node scripts/ui-check.mjs` | `pnpm run ui:check` | 🟢 | 模式 B：等价机械验证（理由：UI 样式静态门禁脚本检查全仓库 TSX） |
| 业务组件禁止残留 bg-white 与 bg-black 硬编码背景 | 源码出现 bg-white 或 bg-black 时门禁拦截 | `node scripts/ui-check.mjs --self-test` | `ui-check self-test`（`scanRawColors` bg-white/bg-black 正负例） | 🟢 | 模式 B：等价机械验证（理由：门禁脚本内联自检矩阵） |
| 宠物页导航栏配置与交互定时器清理 | 宠物页配置独立导航栏标题 | `apps/miniprogram/src/__tests__/pet-page-config.test.ts` | `pages/pet/index.config.ts 声明 navigationBarTitleText = 宠物` | 🟢 | 模式 A：小程序页面配置断言 |
| 宠物页导航栏配置与交互定时器清理 | 页面隐藏或卸载清理全部定时器 | `apps/miniprogram` verify (`lint` + `tsc` + `test` + `build`) & `apps/miniprogram/src/pages/pet/index.tsx` | `pnpm --filter @daily-schedule/miniprogram run verify` + 静态清理函数检查 | 🟢 | 模式 B：等价机械验证（理由：小程序无 Taro 渲染测试基建，需结合真机/开发者工具验证） |
| CI 覆盖微信小程序验证 | CI 配置包含阻断性小程序验证任务 | `.github/workflows/ci.yml` 检查 | 检查 `miniprogram` job 调用 `shared build` 与 `miniprogram verify` 且无 `continue-on-error` | 🟢 | 模式 B：等价机械验证（理由：GitHub Actions 工作流 YAML 无本地执行器） |
| CI 覆盖微信小程序验证 | 小程序包验证失败阻断流程 | `pnpm --filter @daily-schedule/miniprogram run verify` | `pnpm --filter @daily-schedule/miniprogram run verify` | 🟢 | 模式 B：等价机械验证（理由：本地执行与 CI 等价的 verify 命令验证退出码） |
