# Tasks: 项目结构清理 v3.1

<!-- 按执行顺序编排：删除 → 创建 → 重构 → 测试 → 文档同步 -->

## 1. 文件清理（删除操作）

- [x] 1.1 删除过时设计文档 `docs/design/multi-user-auth.md`（内容已被 openspec specs 覆盖）
- [x] 1.2 删除未使用资源 `frontend/src/assets/react.svg`（Vite 模板残留）
- [x] 1.3 删除未使用资源 `frontend/src/assets/vite.svg`（Vite 模板残留）
- [x] 1.4 删除未引用文件 `frontend/public/icons.svg`（全代码搜索无引用）
- [x] 1.5 删除放错位置的 `backend/src/main/resources/maven-settings.xml`（不应打包进 JAR）

## 2. 文档创建

- [x] 2.1 替换 `frontend/README.md` 为项目专属前端文档（当前为 Vite 脚手架模板）
- [x] 2.2 新增项目根目录 `README.md`（人类开发者入口文档，含功能列表、快速开始、技术栈）

## 3. 前端 import 统一

- [x] 3.1 替换 `AppShell.tsx` 中的相对路径为 `@/` 别名（1 处）
- [x] 3.2 替换 `ShortcutsDialog.tsx` 中的相对路径为 `@/` 别名（1 处）
- [x] 3.3 替换 `EventModal.tsx` 中的相对路径为 `@/` 别名（4 处）
- [x] 3.4 替换 `EventForm.tsx` 中的相对路径为 `@/` 别名（3 处）
- [x] 3.5 替换 `CalendarView.tsx` 中的相对路径为 `@/` 别名（5 处）
- [x] 3.6 替换 `ManageDialog.tsx` 中的相对路径为 `@/` 别名（5 处）
- [x] 3.7 替换 `Sidebar.tsx` 中的相对路径为 `@/` 别名（7 处）
- [x] 3.8 替换 `HomePage.tsx` 中的相对路径为 `@/` 别名（4 处）
- [x] 3.9 验证: `npm run lint && npm run build` 通过

## 4. 前端测试基础设施

- [x] 4.1 安装测试依赖: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [x] 4.2 创建 `vitest.config.ts`（继承 vite 配置，启用 jsdom 环境）
- [x] 4.3 创建 `src/test/setup.ts`（导入 @testing-library/jest-dom 匹配器）
- [x] 4.4 在 `package.json` 添加 `test` 和 `test:watch` 脚本，更新 `verify` 脚本包含 test
- [x] 4.5 编写 `src/lib/__tests__/unwrap.test.ts`（SDK 错误处理测试）
- [x] 4.6 编写 `src/lib/__tests__/utils.test.ts`（cn() 工具函数测试）
- [x] 4.7 编写 `src/store/__tests__/authStore.test.ts`（token 管理/localStorage 持久化测试）
- [x] 4.8 编写 `src/hooks/__tests__/useEvents.test.ts`（React Query hook 测试）
- [x] 4.9 更新 `.github/workflows/ci.yml` 前端 job 增加 `npm test` 步骤
- [x] 4.10 验证: `npm run verify` 全部通过

## 5. 后端测试覆盖补充

- [x] 5.1 编写 `TagControllerTest.java`（参考 `CategoryControllerTest` 模式）
- [x] 5.2 编写 `SseControllerTest.java`
- [x] 5.3 编写 `AuthControllerTest.java`
- [x] 5.4 编写 `TagAssemblerTest.java`（参考 `EventAssemblerTest` 模式）
- [x] 5.5 编写 `CategoryAssemblerTest.java`
- [x] 5.6 编写 `UserAssemblerTest.java`
- [x] 5.7 编写 `CategoryRepositoryImplTest.java`（参考 `EventRepositoryImplTest` 模式）
- [x] 5.8 编写 `TagRepositoryImplTest.java`
- [x] 5.9 编写 `UserRepositoryImplTest.java`
- [x] 5.10 验证: `mvn test` 全部通过（185 tests, 0 failures）

## 6. 文档同步（必须检查）

- [x] 6.1 是否有新前端组件？→ 否，无需更新 `docs/frontend/component-catalog.md`
- [x] 6.2 是否有新实体/表/字段？→ 否，无需更新 `docs/database/schema.md` + `docs/uml/README.md`
- [x] 6.3 是否有新 API 端点？→ 否，无需更新 `docs/api/overview.md`
- [x] 6.4 是否有架构/模块变动？→ 否，但需更新 `CLAUDE.md` 中的测试覆盖数字和验证步骤
- [x] 6.5 更新 `CLAUDE.md`: 测试覆盖数字（26 类 185 后端 + 4 类 15 前端）、前端验证步骤（含 test）、CI 四层门禁
- [x] 6.6 全量验证: `cd frontend && npm run verify` + `cd backend && mvn test` ✅
