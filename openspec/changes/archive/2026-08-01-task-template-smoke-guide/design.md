# Design: tasks 模板 smoke test 示例占位符改进

## Context

`templates/tasks.md` §9.4 当前写法：

```markdown
- [ ] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景：
  <!-- 列出本次变更影响的关键用户流程，逐项验证 -->
  - [ ] <!-- 如：登录 → 创建日程 → 日历视图显示 -->
  - [ ] <!-- 如：点击宠物 → 互动菜单弹出 → 喂食成功 -->
  - [ ] <!-- 如：切换日/周/月视图 → 日程正确显示 -->
  - [ ] <!-- 如有 mock 边界风险（Canvas/WASM/SDK），必须在此验证 -->
```

问题：注释示例与 checkbox 混排，AI 生成 tasks 时容易原样保留四个空白框。模板注释是"给 AI 看的指令"，但生成后留在 tasks.md 里成为"给用户看的空白框"。

**关键约束：**
- 模板改进必须同时落地两处：`templates/tasks.md`（生成时读取）+ `schema.yaml` 内嵌模板（artifact 指令引用）
- 不改动已归档 change 的 tasks.md
- 示例内容保留价值（引导 AI 写出具体场景），仅调整呈现方式

## Goals / Non-Goals

**Goals:**
- §9.4 的示例框明确标注为"可替换占位"，替换指令显式化
- AI 生成 tasks 时能理解应删除示例、写入本次变更的真实验证流程
- templates/tasks.md 与 schema.yaml 两处模板保持一致

**Non-Goals:**
- 不删除 smoke test 阶段（9.4 仍保留，防 mock 边界场景漏验证）
- 不改变 §9.1-9.3 自动化验证项
- 不重构模板整体结构

## Decisions

### Decision 1: 占位符呈现方式

- **选择**: 示例项从"纯注释框"改为"注释 + 明示替换指令 + 示例项"三层结构：

```markdown
- [ ] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景
  <!-- 删除下方示例行，逐项替换为本次变更实际影响的用户流程；
       无 UI 影响的变更（如纯后端/纯文档）删除全部示例行后直接勾选 9.4 -->
  - [ ] 登录 → 创建日程 → 日历视图显示
  - [ ] 点击宠物 → 互动菜单弹出 → 喂食成功
  - [ ] 切换日/周/月视图 → 日程正确显示
  - [ ] 如有 mock 边界风险（Canvas/WASM/SDK），必须在此验证
```

- **理由**: ① 示例移出注释后，即使 AI 未替换也**可读**（不再是无信息的空框）；② 注释明确"删除示例行"，AI 有明确执行指令；③ 补充"无 UI 影响可全删"的兜底规则，避免纯后端/纯文档变更硬凑 smoke 场景
- **备选方案**: 保留注释形式仅加提示语 — 否决，空框问题依旧；删除全部示例 — 否决，示例引导 AI 写出具体场景的价值仍在

### Decision 2: 双源模板同步

- **选择**: 修改同时落地 `templates/tasks.md` 与 `schema.yaml` 内嵌部分（两者内容一致）
- **理由**: schema.yaml 的 artifacts.tasks 段落引用了模板格式（生成指令时内联）；此前 E2E 门禁（7.5-7.7）即双处同步修改，本次遵循同一模式
- **备选方案**: 只改 templates/tasks.md — 否决，两处不一致会导致 `/opsx:ff` 与 `/opsx:continue` 生成不同结果

## DDD Layer Design
无影响。

## API Design
无变更。

## Database Design
无变更。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 示例项从注释移出后，AI 误以为无需替换 | 注释保留明确替换指令（"删除下方示例行"） |
| schema.yaml 与 templates 不一致 | apply 后 diff 对比两处 §9.4 文本一致 |
| 已归档 tasks 与模板不一致 | 不回溯修改历史 tasks；模板只影响未来生成 |

## Migration Plan

纯模板文案修改，无部署步骤。提交信息: `chore: tasks 模板 smoke test 示例占位符改进 + 归档`

## Open Questions

无。
