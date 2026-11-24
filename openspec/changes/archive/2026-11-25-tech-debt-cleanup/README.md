# tech-debt-cleanup

集中清理全栈技术债：后端配置/测试基线对齐与 409/SSE/Cookie 契约收敛、前端 `core/` 与模块边界解耦及 `bg-white`/`bg-black` 语义化迁移、微信小程序定时器清理与 CI 接入、Docker 根上下文重构与文档同步。

## 归档记录（2026-11-25）

- **verify 结论**：`spec-driven-custom` 五工件完整，tasks 34/34 全部完成、`test-plan.md` 20/20 场景全部翻绿（0 🔴）、8/8 delta 需求已落地并核对，**0 CRITICAL**。保留 3 项非阻塞观测：① 本机未安装 Docker CLI，Docker/Nginx 改动经静态规则核对（待有 Docker 环境时构建运行验证）；② `PetPage.tsx` 改用 `bg-surface` 后需本地按需运行 `pnpm run test:visual -- --update-snapshots` 刷新 `@visual` 截图基线；③ `.github/workflows/ci.yml` 新增阻断性 `miniprogram` job，需在推送后通过 GitHub Actions 验证运行状态。
- **门禁结果**：`cd backend && mvn test`（45 类 352 用例全绿）、`pnpm run verify`（Turborepo 10/10 任务：`@daily-schedule/shared` 117 + `frontend` 289 + `@daily-schedule/miniprogram` 86）、`node scripts/ui-check.mjs --self-test && pnpm run ui:check`、以及归档后复跑的 `pnpm exec openspec validate --specs --strict --no-interactive`（72/72）、`pnpm exec openspec validate --archived --no-interactive`（79/79）、`pnpm run openspec:check`（10 项全绿）、`pnpm run docs:check` 与 `./scripts/sync-version.sh --check`（3.5.1）全部通过；并完成本地前后端（`:8080` + `:5173`）浏览器实测巡检（`/`、`/todo`、`/pet` 浅色/深色模式无控制台或接口报错）。
- **delta 同步**：8 个已有主 spec 各合入 1 条 ADDED 需求（`api-error-handling`、`authentication`、`ci-actions-maintenance`、`core-directory`、`design-token-contract`、`miniprogram-pet`、`module-registry`、`reminder-scheduler`），主 spec 保持 72 份，delta 头 0 残留。
