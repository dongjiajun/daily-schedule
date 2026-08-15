# 技术债与延后清单（Backlog）

> **创建**: 2026-08-15（打磨期收官后，从已删除的 TEMP-phase2-polish-plan.md 落盘）
> **来源**: 2026-08-13 四线深度调查（backend-structure / backend-observability / frontend-ux / pet-deep-dive）+ 打磨期 8 变更归档时的遗留记录
> **用途**: 防丢失。未来开工时从这里取任务 → 转成 OpenSpec 变更（`/opsx:new`）。已处理的条目删除，新发现的追加。
> **优先级约定**: P1 高危/高感知，P2 常规债，P3 低垂果实或可选优化

---

## 线1 后端模块组织

| # | 优先级 | 问题 | 位置 |
|---|--------|------|------|
| O5 | P2 | 抽 JwtPort/CurrentUserPort——应用层注入 infrastructure.security 依赖 | `AuthApplicationService.java:8,36`、`PetApplicationService.java:9`、`TodoApplicationService.java:5` |
| O6 | P2 | 授权模式统一——controller 传 userId 与 service 内取 CurrentUser 两套并存 | `EventController` vs `PetController` 风格差异 |
| O7 | P2 | partial update 样板 4 处重复 | `Event.java:57-69`、`TodoApplicationService.java:56-73`、`CategoryApplicationService.java:51-58`、`TagApplicationService.java:50-57` |
| O10 | P2 | AuthController 双写 Set-Cookie 头（手写那份缺 Secure，与 Cookie 对象语义漂移源） | `AuthController.java:89-91,102-103` |
| O11 | P3 | `TaskDomainService.assignSortOrderForMove` 死代码；moveTask 排序双轨 | `TaskDomainService.java:25-29` |
| O13 | P3 | `PetDomainService` @Component + @Value 注入衰减配置，违背纯 POJO 声明 | `PetDomainService.java:9-18` |
| P14-P19 | P3 | misc：内嵌 record、异常内嵌类、魔法数组、select-then-update 非原子、跨包常量、方言 SQL | 详见线1调查报告 |
| — | P2 | 测试盲区：domain/category + domain/tag 零测试 | `src/test/java/.../domain/` |

## 线2 可观测性

| # | 优先级 | 问题 |
|---|--------|------|
| D | P3（按需） | Prometheus + Grafana 指标可视化——单机够用不上，多实例或需指标大盘时再上 |

## 线3 前端 UX

| # | 优先级 | 问题 | 位置 |
|---|--------|------|------|
| P7 | P2 | OnboardingGuide 硬编码颜色（无视 5+18 主题）+ 裸 motion.div 无 role=dialog/焦点陷阱/Esc | `OnboardingGuide.tsx` |
| P8 | P2 | TodoPage 加载/错误态裸文本，与日历骨架不一致，错误态缺重试按钮 | `TodoPage.tsx:16-30` |
| P9 | P2 | 移动端抽屉侧边栏无 a11y | `AppShell.tsx:32-53` |
| P10 | P2 | 色板按钮无 aria-label/aria-pressed/focus-visible | `EventForm.tsx:234-247`、`ManagePanel.tsx:54-71` |
| P13 | P2 | 事件编辑居中 modal 打断上下文 → 右侧 Sheet 抽屉（需新 shadcn sheet 组件） | `EventModal.tsx` |
| P14 | P2 | 无撤销（拖拽改期/删除任务）→ sonner action undo | 日历 + 看板 |
| P15 | P3 | TaskForm 混用裸原生表单元素，与 EventForm shadcn 风格不一致 | `TaskForm.tsx` |
| P16 | P3 | ui 目录缺 dropdown-menu/tooltip/badge/card/sheet/alert-dialog/skeleton 组件 | `components/ui/` |
| 美化 | P3 | 统一骨架屏、任务移列 popLayout 动画、日历拖拽 ghost 定制（`.rbc-addons-dnd-*`）、事件完成微反馈、主题切换平滑过渡、宠物 emoji→lucide | `RoamingPet.tsx:794,803`、`PetMenu.tsx:68,73` |

## 线4 宠物系统

| # | 优先级 | 问题 | 备注 |
|---|--------|------|------|
| #10 | 高 | 多宠物同屏——`pets.user_id UNIQUE` 需改一对多迁移 | **并入 M2.4** |
| #11 | M2.4 | 宠物详情页 | 并入 M2.4 |
| #12 | M2.4 | 进化阶段 | 并入 M2.4，依赖 #2 分层（已完成 ✓） |
| #9 | 中高 | 互动深度 | |
| #4 | 中 | 随机个性参数 | |
| #7 | 中 | 移动端适配 | |
| #8 | 中 | 音效系统 | |
| #5 | 记录 | 情绪与数值脱节（hungry 表情无触发源，死代码入口） | 暂不修 |
| #6 | 低 | 格内 rAF 每帧 setPosition 触发 React 渲染 → useMotionValue 直写 | |

## 变更遗留（打磨期归档时记录）

| 来源变更 | 遗留 |
|---------|------|
| fix-todo-tags | ① TaskForm 无标签选择 UI → 未来 `task-tag-picker` 变更；② 更新接口 tagIds=[] 无法表达"清空全部标签"（DTO 限制，需 openapi-generator `containerDefaultToNull` 或专用清空语义） |
| pet-economy-loop | ① 逾期惩罚未做（需 sweep 调度器）；② 删除 DONE 任务后撤销（新 taskId）可再领奖——已知局限，M2.4 调参时处理 |
| backend-observability | docker-compose healthcheck 配置已写入，本机 Docker 不可用未实测——首次部署时确认镜像含 curl，否则改 bash /dev/tcp 方案 |

## 已知 Bug（待修复）

| 问题 | 备注 |
|------|------|
| 镜像气泡 bug | 宠物气泡在 facing=left 时可能出现镜像文字（bubble 组件 transform 继承问题） |

---

## 消费方式

1. 从表里选一项 → `/opsx:new <kebab-case-name>` 走标准 OpenSpec 流程
2. 完成后从本文件删除对应行，并视需要在归档时更新本文件
3. 本文件不参与 docs-check 计数器；是任务源而非进度跟踪（进度跟踪用 phase2-execution-plan.md）
