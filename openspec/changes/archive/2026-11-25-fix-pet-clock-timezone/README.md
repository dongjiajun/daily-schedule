# fix-pet-clock-timezone

统一宠物领域/应用层时间戳与衰减时钟（`Asia/Shanghai` 注入 `Clock`）并消除 UTC 环境下 `PetDomainServiceTest` 8 小时时区偏差（修复远端 CI `45444014361` 后端单测失败）。

## 归档记录（2026-11-25）

- **verify 结论**：lite + `skip_specs: true`，无 delta specs —— Spec Coverage / Requirement Implementation Mapping / Scenario Coverage 与本 schema 未定义的 Design Adherence 均 **Not applicable**；Applicable 的 Task Completion（14/14）与 Code Pattern Consistency 通过，**0 CRITICAL**、**0 WARNING**。
- **门禁结果**：`cd backend && mvn -B -ntp test "-DargLine=-Duser.timezone=UTC"`（45 类 354 用例，0 失败）与本机默认时区 `mvn -B -ntp test`（45 类 354 用例，0 失败）双向验证通过；前端/小程序/E2E 无改动未重跑（由此前全量与远端 CI `45444014361` 验证）；归档后复跑 `openspec validate --archived`（80/80）、`pnpm run openspec:check`（10 项全绿）、`pnpm run docs:check` 与 `./scripts/sync-version.sh --check`（`3.5.1`）全部通过。
- **specs**：`skip_specs: true`，无 spec 同步，主 spec 树（72 份）与 `specs-count` 不变。
