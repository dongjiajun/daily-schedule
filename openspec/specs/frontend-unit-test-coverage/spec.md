# Frontend Unit Test Coverage

为当前缺少测试的前端源文件编写 vitest 单元测试，覆盖关键路径和重要功能。

## Purpose

前端 vitest 单元测试覆盖：为缺少测试的前端源码文件补齐单元测试，覆盖关键业务路径与重要功能（store/hooks/组件渲染），并维护测试规模声明与代码一致。

## Requirements

### Requirement: eventBus 单元测试
系统 SHALL 为 `core/lib/eventBus.ts` 提供完整的单元测试覆盖。

#### Scenario: 注册监听并触发事件
- **WHEN** 调用 `eventBus.on('event:completed', handler)` 注册监听
- **THEN** 调用 `eventBus.emit({ type: 'event:completed', payload: {...} })` 后 handler 被调用

#### Scenario: 注销监听后不再触发
- **WHEN** 调用 `off()` 注销监听
- **THEN** 再次 emit 该事件时 handler 不被调用

#### Scenario: removeAll 清除所有监听
- **WHEN** 注册多个事件监听后调用 `removeAll()`
- **THEN** 所有 handler 均不再被触发

---

### Requirement: authInterceptor 单元测试
系统 SHALL 为 `core/lib/authInterceptor.ts` 提供单元测试。

#### Scenario: 请求注入 Bearer token
- **WHEN** authStore 中存在有效 accessToken
- **THEN** 发出的请求头包含 `Authorization: Bearer <token>`

#### Scenario: token 过期前 30 秒自动续签
- **WHEN** accessToken 剩余有效期 < 30 秒
- **THEN** 自动调用 `/auth/refresh` 获取新 token

#### Scenario: 401 响应强制登出
- **WHEN** 收到 401 响应
- **THEN** 调用 authStore.logout() 并跳转到登录页

---

### Requirement: calendarStore 单元测试
系统 SHALL 为 `modules/calendar/store/calendarStore.ts` 提供 Zustand store 单元测试。

#### Scenario: 初始化默认状态
- **WHEN** store 初始化
- **THEN** view 为 'month'，selectedDate 为当天，所有弹窗关闭

#### Scenario: 切换视图
- **WHEN** 调用 `setView('week')`
- **THEN** store 中 view 变为 'week'

#### Scenario: 打开/关闭新建日程弹窗
- **WHEN** 调用 `openCreateModal(date)`
- **THEN** showCreateModal 为 true，selectedDate 更新
- **WHEN** 调用 `closeCreateModal()`
- **THEN** showCreateModal 为 false

#### Scenario: 标签筛选
- **WHEN** 调用 `setFilterTag(tagId)`
- **THEN** filterTagId 设为对应值；再次调用 setFilterTag(null) 清除筛选

---

### Requirement: useCategories / useTags Hook 测试
系统 SHALL 为 `modules/calendar/hooks/useCategories.ts` 和 `useTags.ts` 提供 Hook 测试。

#### Scenario: useCategories 查询分类列表
- **WHEN** 渲染 useCategories hook
- **THEN** 返回 data 为分类列表数组

#### Scenario: useCategories 创建分类
- **WHEN** 调用 createCategory mutation
- **THEN** 成功后列表刷新

#### Scenario: useTags 标签 CRUD
- **WHEN** 渲染 useTags hook 并执行 create/update/delete
- **THEN** 操作成功且缓存更新

---

### Requirement: LoginPage 组件测试
系统 SHALL 为 `pages/LoginPage.tsx` 提供组件渲染测试。

#### Scenario: 登录表单渲染
- **WHEN** 渲染 LoginPage
- **THEN** 显示用户名/邮箱输入框、密码输入框、登录按钮、切换到注册的链接

#### Scenario: 切换到注册表单
- **WHEN** 点击"注册"链接
- **THEN** 显示用户名、邮箱、密码、确认密码字段

#### Scenario: 提交后显示错误
- **WHEN** 提交无效凭据
- **THEN** 显示错误提示信息

---

### Requirement: EventForm / EventModal 组件测试
系统 SHALL 为 `modules/calendar/components/EventForm.tsx` 和 `EventModal.tsx` 提供组件测试。

#### Scenario: EventForm 渲染必填字段
- **WHEN** 渲染 EventForm
- **THEN** 显示标题、开始时间、结束时间输入框

#### Scenario: EventModal 打开/关闭
- **WHEN** 打开 EventModal
- **THEN** 弹窗可见，包含 EventForm
- **WHEN** 点击取消或关闭按钮
- **THEN** onClose 回调被调用

---

### Requirement: App.tsx AuthGuard 测试
系统 SHALL 为 `App.tsx` 的 AuthGuard 逻辑提供测试。

#### Scenario: 未认证时显示登录页
- **WHEN** authStore.isAuthenticated 为 false
- **THEN** AuthGuard 渲染 LoginPage

#### Scenario: 已认证时显示应用
- **WHEN** authStore.isAuthenticated 为 true
- **THEN** AuthGuard 渲染 AppShell
