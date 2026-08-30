# Tasks: tasks 模板 smoke test 示例占位符改进
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

<!--
  纯模板文案修改，双源同步（templates/tasks.md + schema.yaml）。
-->

## 1. 修改 templates/tasks.md
- [x] 1.1 §9.4 四个注释示例框改为"注释替换指令 + 可读示例项"结构（示例移出注释，注释明确"删除示例行"）
- [x] 1.2 注释补充"无 UI 影响的变更（纯后端/纯文档）删除全部示例行后直接勾选"的兜底规则

## 2. 同步修改 schema.yaml
- [x] 2.1 schema.yaml 内嵌 tasks 模板的 §9.4 段落同步为相同内容
- [x] 2.2 diff 对比两处 §9.4 文本一致

## 3. 全量验证
- [x] 3.1 `openspec validate task-template-smoke-guide` 通过
- [x] 3.2 `/opsx:ff` 生成一个临时变更检查 §9.4 渲染效果（示例可读、指令明确），验证后删除临时变更
- [x] 3.3 确认无代码/测试/API 文件被改动
