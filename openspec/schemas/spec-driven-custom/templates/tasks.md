# Tasks: <!-- 变更名称 -->

<!-- 按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度 -->

## 1. 数据库迁移
<!-- 如有新 Flyway 脚本 -->
- [ ] 1.1 编写 V<!-- 版本号 -->__<!-- 描述 -->.sql
- [ ] 1.2 更新 docs/database/schema.md（如需要）

## 2. 领域层 (domain/)
- [ ] 2.1 <!-- Entity / Enum / Repository 接口 / DomainService -->

## 3. 基础设施层 (infrastructure/)
- [ ] 3.1 <!-- persistence: PO + Mapper + RepositoryImpl -->
- [ ] 3.2 <!-- security / notification / scheduled / config（按需） -->
- [ ] 3.3 <!-- 编写 infrastructure 层单元测试 -->

## 4. 应用层 (application/)
- [ ] 4.1 <!-- ApplicationService 用例编排 -->
- [ ] 4.2 <!-- 编写应用层单元测试 -->

## 5. API 层 (api/)
- [ ] 5.1 <!-- Controller 实现 generated 接口 -->
- [ ] 5.2 <!-- Assembler DTO↔Domain 转换 -->
- [ ] 5.3 <!-- 编写 API 层单元测试 -->

## 6. 契约同步
- [ ] 6.1 更新 specs/openapi.yaml
- [ ] 6.2 更新 specs/CHANGELOG.md
- [ ] 6.3 同步版本号: pom.xml + package.json + openapi.yaml
- [ ] 6.4 重新生成后端接口 (mvn compile)
- [ ] 6.5 重新生成前端 SDK (npm run generate:api)

## 7. 前端 (frontend/src/)
- [ ] 7.1 <!-- Zustand store / React Query hooks（如需要） -->
- [ ] 7.2 <!-- 组件开发 (components/) -->
- [ ] 7.3 <!-- 页面集成 (pages/) -->
- [ ] 7.4 <!-- 样式与动画 -->

## 8. 文档与收尾
- [ ] 8.1 更新 CLAUDE.md / docs/architecture.md（如有架构变动）
- [ ] 8.2 更新 docs/frontend/component-catalog.md（如有新组件）
- [ ] 8.3 全量测试: mvn test && npm run build
