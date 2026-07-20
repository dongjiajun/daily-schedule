# Tasks: Version Sync Automation

## 1. 脚本开发

- [x] 1.1 创建 `scripts/sync-version.sh`：从 openapi.yaml 提取版本号 → 同步到 pom.xml + package.json
- [x] 1.2 脚本可执行：`chmod +x scripts/sync-version.sh`
- [x] 1.3 验证：手动修改 openapi.yaml 版本号 → 运行脚本 → 确认 pom.xml 和 package.json 同步

## 2. CI 集成

- [x] 2.1 更新 `.github/workflows/ci.yml`：新增版本一致性校验 step
- [x] 2.2 验证：CI 在版本不一致时 fail

## 3. 文档

- [x] 3.1 更新 `CLAUDE.md`：添加版本同步脚本说明
- [x] 3.2 更新 `docs/execution-plan.md`：M0.4 版本同步部分标记完成
