# Design: 项目结构清理 v3.1

## Context

项目 v3.1 经过多个迭代（主题系统、预提交验证、文档同步、spec 回填），积累了:
- 脚手架残留文件（Vite 模板 README、react.svg、vite.svg、icons.svg）
- 过时设计文档（multi-user-auth.md 标注 v3.0.0 但早已实现）
- 放错位置的配置（maven-settings.xml 在 resources 下）
- 前端 import 风格不统一（`../../` 与 `@/` 混用）
- 前端零测试覆盖（CI 只做 lint + build）
- 后端部分 Controller/Repository/Assembler 缺少直接测试

本变更不做任何功能逻辑修改，仅做清理、统一和补齐。

## Goals / Non-Goals

**Goals:**
- 删除所有冗余文件和过时文档
- 统一前端 import 为 `@/` 别名
- 建立前端测试基础设施（vitest + @testing-library）
- 补齐后端关键模块的单元测试
- 新增项目根 README.md

**Non-Goals:**
- 不改动任何业务逻辑
- 不改动 API 契约（specs/openapi.yaml）
- 不改动数据库结构
- 不重构组件结构
- 不引入新的 lint 规则

## Decisions

### Decision 1: 前端测试框架选 vitest

- **选择**: vitest + @testing-library/react + jsdom
- **理由**: 与 Vite 原生集成（共用 vite.config.ts 配置），兼容 TypeScript 6 + React 19，API 与 Jest 高度相似，社区主流选择
- **备选方案**: 
  - Jest: 需要额外 babel/jest.config 配置，与 Vite 的 ESM 生态磨合成本高
  - Playwright component testing: 过重，适合 E2E 但不适合纯单元测试

### Decision 2: 统一 import 使用 `@/` 别名

- **选择**: 全部非包名 import 使用 `@/` 路径别名
- **理由**: tsconfig 和 vite.config 已配置，部分文件已使用，统一风格减少心智负担
- **备选方案**: 全部回退到相对路径——与 TypeScript 路径别名配置矛盾，深层嵌套时路径冗长

### Decision 3: 删除而非归档过时文档

- **选择**: 直接删除 `docs/design/multi-user-auth.md`
- **理由**: 内容已被 `openspec/specs/multi-user-isolation/spec.md` 和 `openspec/specs/authentication/spec.md` 完全覆盖，保留会造成混淆。OpenSpec archive 中有完整历史。
- **备选方案**: 移动到 `docs/design/archive/`——无价值，变更历史已在 git + OpenSpec archive 中

## DDD Layer Design

本变更为纯清理，不涉及 DDD 分层变更。后端仅补充测试，不修改任何生产代码。

### 后端测试补充

测试模式遵循现有测试约定:
- **Controller 测试**: `@SpringBootTest` + `@AutoConfigureMockMvc(addFilters = false)` + `@MockitoBean` 服务/CurrentUserService
- **Assembler 测试**: 纯单元测试，无 Spring 上下文
- **Repository 测试**: `@MybatisPlusTest`，参考 `EventRepositoryImplTest` 模式

### 前端 (frontend/src/)

- **import 路径重构**: 8 个文件，将 `../../` 替换为 `@/`
- **测试基础设施**: 新增 `vitest.config.ts`、`src/test/setup.ts`、`__tests__/` 目录
- **资源清理**: 删除 `react.svg`、`vite.svg`、`icons.svg`
- **文档更新**: 替换 `frontend/README.md`

## API Design

无 API 变更。

## Database Design

无数据库变更。

## Risks / Trade-offs

- [import 重构出错导致编译失败] → 每改一个文件后 `npm run build` 验证，TypeScript 编译期即可捕获错误
- [vitest 版本兼容性] → 锁定 vitest ^3.0.0，与 Vite 8 + React 19 已验证兼容
- [新增后端测试破坏现有测试] → 逐一运行确保 134 用例全通过
- [hero.png 被 LoginPage 引用但有争议] → 经全代码 grep 确认 LoginPage 未引用 hero.png，可安全删除；但鉴于原分析中不确定，此任务改为仅删除 react.svg + vite.svg + icons.svg，hero.png 保留

## Migration Plan

1. 删除操作（零风险）: 删除过时文档、资源文件、maven-settings.xml
2. 文档创建（零风险）: 新增 README.md，替换 frontend/README.md
3. import 重构（低风险）: 逐文件替换，每次验证编译
4. 测试基础设施（低风险）: 安装依赖 → 写配置 → 写测试 → 验证通过
5. 后端测试补充（低风险）: 按已有模式编写 → 逐个运行

回滚策略: 所有变更均可通过 `git revert` 一次性回滚。

## Open Questions

- 无。
