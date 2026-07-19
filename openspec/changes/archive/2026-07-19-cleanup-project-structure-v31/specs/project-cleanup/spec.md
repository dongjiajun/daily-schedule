# 项目结构清理

## ADDED Requirements

### Requirement: 前端测试基础设施

前端项目 MUST 具备单元测试能力，包括 vitest 测试框架、React 组件测试库和 CI 集成。

#### Scenario: 运行前端测试套件
- **WHEN** 执行 `npm run test`
- **THEN** vitest 运行所有测试文件并输出通过/失败摘要

#### Scenario: CI 门禁包含前端测试
- **WHEN** GitHub Actions 触发前端 job
- **THEN** lint → test → build 三步按序执行，任一步失败则 job 失败

#### Scenario: 验证脚本包含测试步骤
- **WHEN** 执行 `npm run verify`
- **THEN** 依次执行 lint、test、build，全部通过才算成功

### Requirement: 前端 import 路径统一

所有前端源文件中的项目内 import MUST 使用 `@/` 路径别名，不得使用相对路径（`../` 或 `../../`）。

#### Scenario: 组件导入 hooks
- **WHEN** 组件文件需要导入 hooks
- **THEN** 使用 `@/hooks/useEvents` 而非 `../../hooks/useEvents`

#### Scenario: 组件导入 store
- **WHEN** 组件文件需要导入 Zustand store
- **THEN** 使用 `@/store/calendarStore` 而非 `../../store/calendarStore`

#### Scenario: 组件导入 lib 工具
- **WHEN** 组件文件需要导入 lib 工具函数
- **THEN** 使用 `@/lib/utils` 而非 `../../lib/utils`

#### Scenario: 页面导入组件
- **WHEN** 页面文件需要导入组件
- **THEN** 使用 `@/components/calendar/CalendarView` 而非 `../components/calendar/CalendarView`

### Requirement: 项目入口文档

项目根目录 MUST 包含 README.md，为人类开发者提供项目概览、快速开始指南和文档索引。

#### Scenario: 新开发者查看项目
- **WHEN** 开发者首次访问项目仓库
- **THEN** 看到项目简介、功能列表、技术栈和快速开始步骤

### Requirement: 清理冗余文件

项目 MUST 不包含以下冗余文件：Vite 模板残留资源（react.svg、vite.svg）、未引用的图标文件（icons.svg）、过时设计文档（multi-user-auth.md）、放错位置的 Maven 配置（maven-settings.xml）。

#### Scenario: 构建不依赖已删除的资源
- **WHEN** 执行 `npm run build`
- **THEN** 构建成功，无资源引用错误

#### Scenario: Maven 构建不依赖已删除的配置
- **WHEN** 执行 `mvn test`
- **THEN** 构建和测试全部通过

### Requirement: 后端测试覆盖补充

后端 MUST 为所有 Controller、Repository 实现和 Assembler 提供单元测试覆盖。

#### Scenario: 运行全部后端测试
- **WHEN** 执行 `mvn test`
- **THEN** 所有已有 134 用例 + 新增测试用例全部通过

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 运行前端测试套件 | - | - | ➕ |
| CI 门禁包含前端测试 | ci.yml | frontend job | ➕ |
| 前端 import 路径统一 | tsc -b | 编译检查 | ➕ |
| 构建不依赖已删除资源 | vite build | 构建检查 | ➕ |
| 运行全部后端测试 | mvn test | 全部测试 | ➕ |
