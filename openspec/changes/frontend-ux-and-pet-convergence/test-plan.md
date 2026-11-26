# Test Plan: frontend-ux-and-pet-convergence

| Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes |
|-------------|----------|--------------------|----------------------|---------------|----------------|
| 无宠物时展示选择界面 | 首次登录弹出选择 | `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx` | `RoamingPet > 等待 Onboarding 结束后才自动弹出 PetSelection` | 🟢 | 模式 A：串行编排弹窗触发时机 |
| 无宠物时展示选择界面 | 选择物种并命名 | `frontend/src/modules/pet/components/__tests__/PetSelection.test.tsx` | `PetSelection > 输入名称后可提交` | 🟢 | 模式 A：物种选择与命名提交 |
| 无宠物时展示选择界面 | 名称非法 | `frontend/src/modules/pet/components/__tests__/PetSelection.test.tsx` | `PetSelection > 空名称时确认按钮 disabled` | 🟢 | 模式 A：非法名称禁用校验 |
| 无宠物时展示选择界面 | 已有宠物时不弹出 | `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx` | `RoamingPet > 等待 Onboarding 结束后才自动弹出 PetSelection，且已有宠物或关闭免打扰时不弹` | 🟢 | 模式 A：已有宠物免弹窗守卫 |
| 无宠物时展示选择界面 | 主动关闭后本会话免打扰且停止 404 轮询 | `frontend/src/modules/pet/components/__tests__/PetSelection.test.tsx` & `usePet.test.ts` | `PetSelection > 主动关闭弹窗设置 selectionDismissed=true` / `useMyPet 在 error 态停止 30s 轮询` | 🟢 | 模式 A：关闭免打扰 + 停止轮询 |
| SVG 视图框单次缩放无双重放大 | 大尺寸与小尺寸精确渲染且配饰对齐 | `frontend/src/modules/pet/components/__tests__/SvgAvatar.test.tsx` | `SvgAvatar > size=200 与 size=40 无 transform scale 二次缩放` | 🟢 | 模式 A：200px/40px 尺寸与叠加对齐 |
| SVG 视图框单次缩放无双重放大 | 非默认尺寸无溢出或缩水 | `frontend/src/modules/pet/components/__tests__/SvgAvatar.test.tsx` & `PetPage.test.tsx` | `SvgAvatar > renders at custom size` / `PetPage > 渲染 200px 主头像` | 🟢 | 模式 A：非默认尺寸边界验证 |
| 侧栏与专页避让及回窝去分身 | 漫步避让侧栏且回窝停靠不遮字无双猫 | `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx` & `SidebarPet.test.tsx` | `RoamingPet > 注册 data-pet-avoid 为 hard 避让区` / `SidebarPet > 休息中显示小窝休眠占位` | 🟢 | 模式 A：避让注册与回窝去重 |
| 侧栏与专页避让及回窝去分身 | 进入宠物专页隐藏游走浮层离开后恢复 | `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx` | `RoamingPet > /pet 路由下隐藏游走精灵并保留选择弹窗` | 🟢 | 模式 A：路由级去分身守卫 |
| 宠物专页原语收口与分区去重改名 | 专页分区去重展示喂食装扮与直接玩耍 | `frontend/src/modules/pet/components/__tests__/FoodActionList.test.tsx` & `PetPage.test.tsx` | `FoodActionList > feed 模式过滤 ACCESSORY` / `PetPage > 渲染 200px 主头像、去重喂食/装扮区、汉化物种与直接玩耍按钮` | 🟢 | 模式 A：分区过滤与原语组件 |
| 宠物专页原语收口与分区去重改名 | 内联改名成功与非法名称拦截 | `frontend/src/modules/pet/components/__tests__/PetPage.test.tsx` | `PetPage > 内联改名支持提交合法名称并拦截空白名称` | 🟢 | 模式 A：改名正常与空白异常边界 |
| 全站通知常驻与分层键盘快捷键及无障碍引导 | 跨模块切页保持 SSE 连接与分层快捷键响应 | `frontend/src/components/layout/__tests__/AppShell.test.tsx` & `useGlobalShortcuts.test.tsx` & `useTodoKeyboardShortcuts.test.tsx` | `AppShell > 挂载 SSE 订阅` / `useGlobalShortcuts` / `useTodoKeyboardShortcuts` | 🟢 | 模式 A：全局 SSE + 分层快捷键 |
| 全站通知常驻与分层键盘快捷键及无障碍引导 | 输入框聚焦或弹窗打开时屏蔽快捷键且引导支持 Esc 关闭 | `frontend/src/components/layout/__tests__/OnboardingGuide.test.tsx` & `useTodoKeyboardShortcuts.test.tsx` | `OnboardingGuide > 以 Radix Dialog 渲染并支持 Escape 关闭` / `useTodoKeyboardShortcuts > 输入框聚焦或存在 dialog 时屏蔽` | 🟢 | 模式 A：屏蔽守卫与无障碍关闭 |
